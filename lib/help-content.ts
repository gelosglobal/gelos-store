export type HelpTopic = {
  label: string
  href: string
  description: string
}

export const helpTopics: HelpTopic[] = [
  {
    label: 'FAQs',
    href: '/faqs',
    description: 'Quick answers about orders, products, and your account.',
  },
  {
    label: 'Shipping & Delivery',
    href: '/shipping',
    description: 'Delivery areas, timelines, and free shipping.',
  },
  {
    label: 'Returns',
    href: '/returns',
    description: 'How to request a return or exchange.',
  },
  {
    label: 'Payments',
    href: '/payments',
    description: 'Accepted payment methods and checkout security.',
  },
  {
    label: 'Contact Us',
    href: '/contact',
    description: 'Send a message to the Gelos support team.',
  },
]

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export const faqItems: FaqItem[] = [
  {
    id: 'order-tracking',
    question: 'How do I track my order?',
    answer:
      'After your order ships, you will receive an email confirmation with your order number. If you need an update, contact us with your order number and delivery city — our team will reply with the latest status.',
  },
  {
    id: 'delivery-areas',
    question: 'Where does Gelos deliver?',
    answer:
      'We deliver across Ghana. Enter your address at checkout to confirm availability. Delivery times vary by location — Accra and major cities are typically faster than remote areas.',
  },
  {
    id: 'change-order',
    question: 'Can I change or cancel my order?',
    answer:
      'Contact us as soon as possible after placing your order. If it has not been packed yet, we will do our best to update or cancel it. Once an order has shipped, changes may not be possible.',
  },
  {
    id: 'promo-codes',
    question: 'How do promo codes work?',
    answer:
      'Enter your code at checkout in the promo field. Valid codes apply a percentage discount to eligible items before shipping. Only one promo code can be used per order unless stated otherwise.',
  },
  {
    id: 'product-ingredients',
    question: 'Are Gelos products safe for daily use?',
    answer:
      'Gelos products are designed for everyday oral care. Always follow the directions on each product page. If you have sensitivity, allergies, or a medical condition, check with your dentist before starting a new routine.',
  },
  {
    id: 'electric-brushes',
    question: 'Do electric toothbrushes include a warranty?',
    answer:
      'Electric brush details, included accessories, and care instructions are listed on each product page. For warranty or device issues, contact us with your order number and a short description of the problem.',
  },
  {
    id: 'whitening',
    question: 'How long until I see whitening results?',
    answer:
      'Results depend on the product and your starting shade. Strips and LED kits are designed for gradual improvement with consistent use. Follow the usage guide on the product page and avoid overuse if you have sensitivity.',
  },
  {
    id: 'find-store',
    question: 'Can I buy Gelos in a physical store?',
    answer:
      'Yes — Gelos is stocked at select pharmacies and retailers across Ghana. Use our Find a Store page to search for a location near you.',
  },
  {
    id: 'contact-response',
    question: 'How quickly will support reply?',
    answer:
      'We aim to respond within one business day (Mon–Fri, 9am–5pm). Include your order number when writing about an order so we can help faster.',
  },
]

export type HelpContentSection = {
  title: string
  body: string[]
}

export const returnsSections: HelpContentSection[] = [
  {
    title: 'Our promise',
    body: [
      'We want you to love your Gelos products. If something is not right with your order, contact us within 14 days of delivery and we will work with you on the best solution.',
    ],
  },
  {
    title: 'Eligible returns',
    body: [
      'Unopened items in original packaging may qualify for a return or exchange.',
      'Items that arrive damaged, defective, or incorrect are eligible for a replacement or refund once verified.',
      'Opened oral care products (toothpaste, mouthwash, serums, etc.) cannot be returned for hygiene reasons unless they arrived damaged or faulty.',
    ],
  },
  {
    title: 'How to start a return',
    body: [
      'Email us at hello@gelosglobal.com or use the contact form with your order number, the item(s) involved, and photos if the product arrived damaged.',
      'Our team will confirm next steps — which may include a replacement, store credit, or refund depending on the situation.',
      'Please do not send products back without confirmation from our support team.',
    ],
  },
  {
    title: 'Refunds',
    body: [
      'Approved refunds are processed to your original payment method where possible.',
      'Refund timing depends on your bank or mobile money provider — typically within 5–10 business days after approval.',
    ],
  },
]

export const paymentsSections: HelpContentSection[] = [
  {
    title: 'Secure checkout',
    body: [
      'Online payments in Ghana, Nigeria, and other supported regions are processed securely through Paystack. US inhaler orders are processed through Stripe. Your card and mobile money details are encrypted and never stored on Gelos servers.',
    ],
  },
  {
    title: 'Accepted methods',
    body: [
      'Visa and Mastercard debit/credit cards.',
      'Mobile Money (MTN MoMo and other networks supported by Paystack at checkout).',
      'Stripe card checkout (and Apple Pay / Google Pay where available) for USA inhaler orders at /us.',
      'Additional payment options may appear at checkout depending on your device and location.',
    ],
  },
  {
    title: 'Currency',
    body: [
      'Catalog prices are stored in Ghanaian Cedi (GH₵). When you switch region, amounts display in your selected currency using the current conversion rate. USA checkout charges in USD via Stripe.',
    ],
  },
  {
    title: 'Payment issues',
    body: [
      'If a payment fails, check that your card or MoMo wallet has sufficient funds and try again.',
      'If you were charged but did not receive an order confirmation, contact us with the payment reference and we will investigate promptly.',
    ],
  },
]
