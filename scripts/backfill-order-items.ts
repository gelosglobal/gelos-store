import { backfillOrderItemsFromPaystack } from '@/lib/db/backfill-order-items'

async function main() {
  const orderId = process.argv[2]?.trim() || undefined
  console.log(
    orderId
      ? `Backfilling items for order ${orderId}…`
      : 'Backfilling items for all orders with empty carts…',
  )

  const summary = await backfillOrderItemsFromPaystack({ orderId })

  console.log(
    JSON.stringify(
      {
        scanned: summary.scanned,
        recovered: summary.recovered,
        skipped: summary.skipped,
        failed: summary.failed,
      },
      null,
      2,
    ),
  )

  for (const result of summary.results) {
    const details =
      result.status === 'recovered'
        ? `${result.itemCount ?? 0} items`
        : result.reason ?? ''
    console.log(`${result.orderNumber}: ${result.status}${details ? ` — ${details}` : ''}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
