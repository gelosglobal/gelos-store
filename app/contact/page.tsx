'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, MessageSquare, Phone, Send, User } from 'lucide-react'
import { toast } from 'sonner'
import { trackContact, trackLead } from '@/lib/meta-pixel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (sending) return

    setSending(true)
    try {
      const res = await fetch('/api/store/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone.trim() || undefined,
          subject: subject.trim() || undefined,
          message,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; threadId?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to send message')

      trackContact()
      trackLead('Contact form')

      toast.success('Message sent', {
        description: data.threadId ? `Reference: ${data.threadId}` : undefined,
      })
      setName('')
      setEmail('')
      setPhone('')
      setSubject('')
      setMessage('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
            Support
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Contact Gelos
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 sm:text-base">
            Send us a message and our team will reply by email. Your message will appear in our admin inbox.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex text-sm font-semibold text-neutral-800 underline-offset-4 hover:underline"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      id="contact-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233…"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject (optional)</Label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order issue, product question, shipping…"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message…"
                    className="min-h-[180px] pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full gap-2 rounded-full bg-neutral-950 hover:bg-neutral-800"
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? 'Sending…' : 'Send message'}
              </Button>

              <p className="text-center text-xs text-neutral-500">
                By sending this message, you agree we may contact you by email.
              </p>
            </form>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-neutral-950">Quick help</h2>
            <p className="mt-2 text-sm text-neutral-600">
              For fastest support, include your order number (if you have one) and your delivery city.
            </p>
            <div className="mt-6 space-y-3 text-sm text-neutral-700">
              <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="font-semibold text-neutral-950">Email</p>
                <p className="mt-1 text-neutral-600">hello@gelosglobal.com</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="font-semibold text-neutral-950">Hours</p>
                <p className="mt-1 text-neutral-600">Mon–Fri · 9am–5pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

