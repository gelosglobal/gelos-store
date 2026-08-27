'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { OrderDetailView } from '@/components/admin/order-detail-view'
import { usesLiveDhlRates } from '@/lib/market-settings'
import type { AdminOrderDetail } from '@/lib/types/order'

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const orderId = params.id
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [repairingItems, setRepairingItems] = useState(false)
  const [creatingDhlShipment, setCreatingDhlShipment] = useState(false)
  const [refreshingDhlTracking, setRefreshingDhlTracking] = useState(false)
  const [dhlLive, setDhlLive] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderId) return

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder(data.order ?? null)
    } catch {
      toast.error('Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    setLoading(true)
    void loadOrder()
  }, [loadOrder])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/dhl/rates', { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json()) as { env?: string }
        if (!cancelled) setDhlLive(data.env === 'production')
      })
      .catch(() => {
        if (!cancelled) setDhlLive(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const patchOrder = async (body: {
    paymentStatus?: AdminOrderDetail['paymentStatus']
    fulfillmentStatus?: AdminOrderDetail['fulfillmentStatus']
  }) => {
    if (!orderId) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder(data.order ?? null)
      toast.success('Order updated')
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const sendInvoice = async () => {
    if (!orderId) return

    setSendingInvoice(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Invoice sent to customer')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send invoice',
      )
    } finally {
      setSendingInvoice(false)
    }
  }

  const repairItems = async () => {
    if (!orderId) return

    setRepairingItems(true)
    try {
      const res = await fetch('/api/admin/orders/backfill-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = (await res.json()) as {
        error?: string
        recovered?: number
        failed?: number
        results?: { status: string; itemCount?: number; reason?: string }[]
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to restore items')

      const result = data.results?.[0]
      if (result?.status === 'recovered') {
        toast.success(
          `Restored ${result.itemCount ?? 0} item${(result.itemCount ?? 0) === 1 ? '' : 's'} from Paystack`,
        )
        await loadOrder()
        return
      }

      throw new Error(
        result?.reason ??
          (data.failed
            ? 'Could not restore items from Paystack'
            : 'No missing items to restore'),
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to restore items',
      )
    } finally {
      setRepairingItems(false)
    }
  }

  const createDhlShipment = async () => {
    if (!orderId) return

    setCreatingDhlShipment(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dhl/ship`, {
        method: 'POST',
      })
      const data = (await res.json()) as {
        error?: string
        order?: AdminOrderDetail
        trackingNumber?: string
        pickupError?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create DHL shipment')
      if (data.order) setOrder(data.order)
      toast.success(
        data.trackingNumber
          ? `DHL shipment created: ${data.trackingNumber}`
          : 'DHL shipment created',
      )
      if (data.pickupError) {
        toast.error(`Pickup request failed: ${data.pickupError}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create DHL shipment',
      )
    } finally {
      setCreatingDhlShipment(false)
    }
  }

  const refreshDhlTracking = async () => {
    if (!orderId) return

    setRefreshingDhlTracking(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dhl/tracking`, {
        cache: 'no-store',
      })
      const data = (await res.json()) as {
        error?: string
        order?: AdminOrderDetail
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to refresh tracking')
      if (data.order) setOrder(data.order)
      toast.success('Tracking updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to refresh tracking',
      )
    } finally {
      setRefreshingDhlTracking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-sm text-neutral-600">Order not found.</p>
      </div>
    )
  }

  return (
    <OrderDetailView
      order={order}
      updating={updating}
      sendingInvoice={sendingInvoice}
      repairingItems={repairingItems}
      creatingDhlShipment={creatingDhlShipment}
      refreshingDhlTracking={refreshingDhlTracking}
      onSendInvoice={sendInvoice}
      onRepairItems={() => void repairItems()}
      onPaymentStatusChange={(paymentStatus) => patchOrder({ paymentStatus })}
      onFulfillmentStatusChange={(fulfillmentStatus) =>
        patchOrder({ fulfillmentStatus })
      }
      onCreateDhlShipment={
        usesLiveDhlRates(order.locationId) || Boolean(order.dhl)
          ? () => void createDhlShipment()
          : undefined
      }
      onRefreshDhlTracking={
        usesLiveDhlRates(order.locationId) || Boolean(order.dhl)
          ? () => void refreshDhlTracking()
          : undefined
      }
      dhlLive={dhlLive}
    />
  )
}
