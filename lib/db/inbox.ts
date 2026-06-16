import type {
  InboxMessage as PrismaInboxMessage,
  InboxThread as PrismaInboxThread,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured, getAdminNotificationEmail, isResendConfigured, getResendFromEmail } from '@/lib/env'
import { getResendClient } from '@/lib/email/resend'
import { buildCustomerSupportReplyEmail } from '@/lib/email/templates/customer-reply'

export type InboxThreadSummary = {
  threadId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  subject: string
  status: 'open' | 'closed'
  lastMessageAt: string
  createdAt: string
}

export type InboxMessage = {
  messageId: string
  threadId: string
  direction: 'in' | 'out'
  body: string
  sentBy: string
  createdAt: string
}

function prismaThreadToSummary(thread: PrismaInboxThread): InboxThreadSummary {
  return {
    threadId: thread.threadId,
    customerName: thread.customerName,
    customerEmail: thread.customerEmail,
    customerPhone: thread.customerPhone,
    subject: thread.subject,
    status: (thread.status === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
    lastMessageAt: thread.lastMessageAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
  }
}

function prismaMessageToMessage(message: PrismaInboxMessage): InboxMessage {
  return {
    messageId: message.messageId,
    threadId: message.threadId,
    direction: (message.direction === 'out' ? 'out' : 'in') as 'in' | 'out',
    body: message.body,
    sentBy: message.sentBy,
    createdAt: message.createdAt.toISOString(),
  }
}

export function generateThreadId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MSG-${suffix}-${rand}`
}

export function generateMessageId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `IMSG-${suffix}-${rand}`
}

export async function createInboundMessage(input: {
  customerName: string
  customerEmail: string
  customerPhone?: string
  subject?: string
  message: string
}) {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const threadId = generateThreadId()
  const now = new Date()

  const thread = await prisma.inboxThread.create({
    data: {
      threadId,
      customerName: input.customerName.trim() || 'Customer',
      customerEmail: input.customerEmail.trim().toLowerCase(),
      customerPhone: input.customerPhone?.trim() ?? '',
      subject: input.subject?.trim() ?? '',
      status: 'open',
      lastMessageAt: now,
    },
  })

  const message = await prisma.inboxMessage.create({
    data: {
      messageId: generateMessageId(),
      threadId,
      direction: 'in',
      body: input.message.trim(),
      sentBy: '',
    },
  })

  // Optional: notify store team by email (uses ADMIN_NOTIFICATION_EMAIL)
  if (isResendConfigured()) {
    const adminEmail = getAdminNotificationEmail()
    const resend = getResendClient()
    if (adminEmail && resend) {
      void resend.emails.send({
        from: getResendFromEmail(),
        to: adminEmail,
        subject: `New customer message${thread.subject ? `: ${thread.subject}` : ''}`,
        html: `
          <p><strong>${thread.customerName}</strong> (${thread.customerEmail}${thread.customerPhone ? `, ${thread.customerPhone}` : ''})</p>
          <p>${thread.subject ? `<strong>Subject:</strong> ${thread.subject}<br />` : ''}<strong>Thread:</strong> ${thread.threadId}</p>
          <pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${threadId}\n\n${message.body}</pre>
        `,
      })
    }
  }

  return {
    thread: prismaThreadToSummary(thread),
    message: prismaMessageToMessage(message),
  }
}

export async function listInboxThreads(): Promise<InboxThreadSummary[]> {
  if (!isDatabaseConfigured()) return []
  const threads = await prisma.inboxThread.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 200,
  })
  return threads.map(prismaThreadToSummary)
}

export async function getInboxThread(threadId: string) {
  if (!isDatabaseConfigured()) return null
  const thread = await prisma.inboxThread.findUnique({
    where: { threadId },
  })
  return thread ? prismaThreadToSummary(thread) : null
}

export async function listThreadMessages(threadId: string): Promise<InboxMessage[]> {
  if (!isDatabaseConfigured()) return []
  const messages = await prisma.inboxMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  })
  return messages.map(prismaMessageToMessage)
}

export async function replyToThread(input: {
  threadId: string
  body: string
  sentBy?: string
}) {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const thread = await prisma.inboxThread.findUnique({
    where: { threadId: input.threadId },
  })
  if (!thread) throw new Error('THREAD_NOT_FOUND')

  const trimmedBody = input.body.trim()
  if (!trimmedBody) throw new Error('EMPTY_MESSAGE')

  const message = await prisma.inboxMessage.create({
    data: {
      messageId: generateMessageId(),
      threadId: thread.threadId,
      direction: 'out',
      body: trimmedBody,
      sentBy: input.sentBy?.trim() ?? 'admin',
    },
  })

  await prisma.inboxThread.update({
    where: { threadId: thread.threadId },
    data: {
      lastMessageAt: new Date(),
      status: 'open',
    },
  })

  // Send email reply to customer
  const resend = getResendClient()
  if (!resend) return { message: prismaMessageToMessage(message), emailed: false as const }

  const { subject, html } = buildCustomerSupportReplyEmail({
    customerName: thread.customerName,
    subject: thread.subject || 'Message from Gelos support',
    message: trimmedBody,
    threadId: thread.threadId,
  })

  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: thread.customerEmail,
    subject,
    html,
    replyTo: getAdminNotificationEmail() ?? undefined,
  })

  if (error) {
    console.error('[email reply]', error)
    return { message: prismaMessageToMessage(message), emailed: false as const }
  }

  return { message: prismaMessageToMessage(message), emailed: true as const }
}

