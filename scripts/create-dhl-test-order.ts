/**
 * Insert a paid USA test order with a complete DHL destination.
 * Run: pnpm exec tsx --env-file=.env.local scripts/create-dhl-test-order.ts
 */
import { createDhlTestOrder } from '../lib/db/create-dhl-test-order'
import { prisma } from '../lib/prisma'

async function main() {
  const order = await createDhlTestOrder()
  console.log('Created DHL test order')
  console.log(`  ${order.orderNumber}`)
  console.log(`  ${order.productName}`)
  console.log('  350 5th Avenue, New York, 10001, US')
  console.log(`  http://localhost:3000/admin/orders/${order.id}`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
