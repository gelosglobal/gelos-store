/**
 * Shopify Admin → Settings → Customer events → Add custom pixel
 *
 * Gelos headless setup:
 * - Browsing events (PageView, ViewContent, AddToCart, InitiateCheckout)
 *   fire on www.gelosglobal.com from the Next.js app.
 * - This pixel only covers Shopify-hosted checkout on checkout.gelosglobal.com.
 *
 * IMPORTANT:
 * - Use the SAME Pixel ID as NEXT_PUBLIC_META_PIXEL_ID
 * - Do NOT subscribe to checkout_started → InitiateCheckout (already fired in React)
 * - Prefer Facebook & Instagram channel data sharing = Enhanced or Maximum
 *   so Purchase also flows via Shopify CAPI
 * - After updating this file, re-paste into Shopify Admin (it does not auto-deploy)
 *
 * Paste everything below the line into the custom pixel code editor.
 * ---------------------------------------------------------------------------
 */

// === PASTE FROM HERE ========================================================

const PIXEL_ID = '1089173742589227' // Gelos Meta Pixel — keep in sync with NEXT_PUBLIC_META_PIXEL_ID

/**
 * Catalog / Pixel content_ids on Gelos are numeric Shopify product IDs
 * (e.g. "8152415830215"), not full GIDs.
 */
function toMetaContentId(value) {
  if (value == null) return null
  const raw = String(value)
  const gidMatch = raw.match(/gid:\/\/shopify\/(?:Product|ProductVariant)\/(\d+)/i)
  if (gidMatch) return gidMatch[1]
  const digits = raw.replace(/\D/g, '')
  return digits || null
}

function checkoutCurrency(checkout) {
  return (
    checkout?.currencyCode ||
    checkout?.totalPrice?.currencyCode ||
    checkout?.subtotalPrice?.currencyCode ||
    'GHS'
  )
}

function checkoutValue(checkout) {
  const amount =
    checkout?.totalPrice?.amount ??
    checkout?.subtotalPrice?.amount
  const n = Number(amount)
  return Number.isFinite(n) ? n : 0
}

function checkoutContentIds(checkout) {
  const items = checkout?.lineItems || []
  const ids = []
  for (const item of items) {
    const productId =
      item?.variant?.product?.id ||
      item?.product?.id ||
      item?.id
    const metaId = toMetaContentId(productId)
    if (metaId) ids.push(metaId)
  }
  return Array.from(new Set(ids))
}

function checkoutNumItems(checkout) {
  const items = checkout?.lineItems || []
  return items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
}

function readCookie(name) {
  try {
    const match = String(document.cookie || '').match(
      new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'),
    )
    return match?.[1] ? decodeURIComponent(match[1]) : undefined
  } catch (err) {
    return undefined
  }
}

function checkoutAttribute(checkout, key) {
  const attrs = checkout?.attributes || checkout?.customAttributes || []
  const want = String(key).toLowerCase()
  for (const attr of attrs) {
    const name = String(attr?.key || attr?.name || '').toLowerCase()
    if (name === want && attr?.value) return String(attr.value)
  }
  return undefined
}

/** Advanced Matching for EMQ: external_id + contact + shipping geo. */
function checkoutAdvancedMatching(checkout) {
  const matching = {}

  const visitorId =
    checkoutAttribute(checkout, 'gelos_visitor_id') || readCookie('gelos_vid')
  if (visitorId) matching.external_id = visitorId

  const email = checkout?.email || checkout?.billingAddress?.email
  if (email) matching.em = String(email).trim().toLowerCase()

  const phone =
    checkout?.phone ||
    checkout?.shippingAddress?.phone ||
    checkout?.billingAddress?.phone
  if (phone) matching.ph = String(phone)

  const addr = checkout?.shippingAddress || checkout?.billingAddress
  if (addr?.city) matching.ct = String(addr.city)
  if (addr?.provinceCode) matching.st = String(addr.provinceCode)
  else if (addr?.province) matching.st = String(addr.province)
  if (addr?.zip) matching.zp = String(addr.zip)
  if (addr?.countryCode) matching.country = String(addr.countryCode).toLowerCase()

  const firstName =
    checkout?.shippingAddress?.firstName ||
    checkout?.billingAddress?.firstName
  const lastName =
    checkout?.shippingAddress?.lastName ||
    checkout?.billingAddress?.lastName
  if (firstName) matching.fn = String(firstName)
  if (lastName) matching.ln = String(lastName)

  return matching
}

function applyAdvancedMatching(checkout) {
  const matching = checkoutAdvancedMatching(checkout)
  if (Object.keys(matching).length === 0) return
  window.fbq('init', PIXEL_ID, matching)
}

function loadFbq(callback) {
  if (typeof window === 'undefined') return
  if (window.fbq) {
    callback()
    return
  }

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  const bootMatching = {}
  const bootVisitor = readCookie('gelos_vid')
  if (bootVisitor) bootMatching.external_id = bootVisitor
  window.fbq('init', PIXEL_ID, bootMatching)
  callback()
}

loadFbq(function () {
  // Checkout-domain PageView only (storefront PageView fires on www).
  window.fbq('track', 'PageView')

  analytics.subscribe('payment_info_submitted', (event) => {
    const checkout = event?.data?.checkout
    if (!checkout) return

    applyAdvancedMatching(checkout)

    window.fbq('track', 'AddPaymentInfo', {
      currency: checkoutCurrency(checkout),
      value: checkoutValue(checkout),
      content_ids: checkoutContentIds(checkout),
      content_type: 'product',
      num_items: checkoutNumItems(checkout),
    })
  })

  analytics.subscribe('checkout_completed', (event) => {
    const checkout = event?.data?.checkout
    if (!checkout) return

    applyAdvancedMatching(checkout)

    const orderId =
      checkout?.order?.id ||
      checkout?.token ||
      checkout?.id ||
      undefined

    const payload = {
      currency: checkoutCurrency(checkout),
      value: checkoutValue(checkout),
      content_ids: checkoutContentIds(checkout),
      content_type: 'product',
      num_items: checkoutNumItems(checkout),
    }

    // eventID helps Meta dedupe if Shopify channel CAPI also sends Purchase.
    if (orderId) {
      window.fbq('track', 'Purchase', payload, {
        eventID: String(toMetaContentId(orderId) || orderId),
      })
    } else {
      window.fbq('track', 'Purchase', payload)
    }
  })
})

// === PASTE END ==============================================================
