'use client'

import { useCallback, useMemo, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type CampaignResponse =
  | {
      ok: true
      mode: 'broadcast'
      dryRun?: boolean
      recipients?: number
      sent?: number
      failed?: number
      failures?: Array<{ email: string; message: string }>
    }
  | { error: string }

export default function AdminEmailPage() {
  const [subject, setSubject] = useState('')
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('Shop Gelos')
  const [ctaHref, setCtaHref] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [showRecipient, setShowRecipient] = useState(false)
  const [sending, setSending] = useState(false)

  const canSend = useMemo(() => {
    return subject.trim().length >= 3 && headline.trim().length >= 3 && body.trim().length >= 3
  }, [subject, headline, body])

  const sendRequest = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/admin/email-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return (await res.json()) as CampaignResponse
    },
    [],
  )

  const handleSendBroadcast = async () => {
    if (!canSend) {
      toast.error('Add a subject, headline, and message first.')
      return
    }

    setSending(true)
    try {
      const data = await sendRequest({
        subject,
        headline,
        body,
        ctaLabel: ctaLabel || undefined,
        ctaHref: ctaHref || undefined,
      })
      if ('error' in data) throw new Error(data.error)

      if (data.mode === 'broadcast') {
        toast.success('Campaign sent', {
          description: `${data.sent ?? 0} sent · ${data.failed ?? 0} failed`,
        })
      } else {
        toast.success('Campaign sent')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const handleSendToOne = async () => {
    if (!canSend) {
      toast.error('Add a subject, headline, and message first.')
      return
    }
    if (!recipientEmail.trim()) {
      toast.error('Enter a customer email address.')
      return
    }

    setSending(true)
    try {
      const data = await sendRequest({
        subject,
        headline,
        body,
        ctaLabel: ctaLabel || undefined,
        ctaHref: ctaHref || undefined,
        recipientEmail,
      })
      if ('error' in data) throw new Error(data.error)
      toast.success('Email sent')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email campaigns"
        description="Send an email to customers who are subscribed."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="h-9 gap-2 bg-neutral-950 hover:bg-neutral-800"
              disabled={!canSend || sending}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to subscribed
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send this campaign to all subscribed customers?</AlertDialogTitle>
              <AlertDialogDescription>
                This will email every customer whose subscription status is <strong>Subscribed</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-neutral-950 text-white hover:bg-neutral-800"
                onClick={handleSendBroadcast}
                disabled={sending || !canSend}
              >
                {sending ? 'Sending…' : 'Send campaign'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminPageHeader>

      <div className="grid gap-6">
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-950">
                Send to one customer
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setShowRecipient((v) => !v)}
                disabled={sending}
              >
                {showRecipient ? 'Hide' : 'Send to one'}
              </Button>
            </div>

            {showRecipient ? (
              <>
                <Label htmlFor="campaign-recipient">Customer email</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="campaign-recipient"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2"
                    onClick={handleSendToOne}
                    disabled={!canSend || sending || !recipientEmail.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  This sends to just one email (does not broadcast).
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-500">
                Use this when you want to message a single customer.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-subject">Subject</Label>
            <Input
              id="campaign-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="New arrivals + a fresh smile routine"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-headline">Headline</Label>
            <Input
              id="campaign-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="This week’s Gelos picks"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-body">Message</Label>
            <Textarea
              id="campaign-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…\n\nTip: Use blank lines to create paragraphs."
              className="min-h-[220px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-cta-label">CTA label</Label>
              <Input
                id="campaign-cta-label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Shop Gelos"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-cta-href">CTA link (optional)</Label>
              <Input
                id="campaign-cta-href"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="https://gelosglobal.com/shop"
                className="h-10"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Recipients are pulled from Customers where <strong>Subscribed</strong> and an email exists.
        </p>
      </div>
    </div>
  )
}

