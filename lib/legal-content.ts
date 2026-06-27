export type LegalSection = {
  id: string
  title: string
  paragraphs: string[]
}

export const termsLastUpdated = 'June 2026'

export const termsSections: LegalSection[] = [
  {
    id: 'introduction',
    title: '1. Introduction',
    paragraphs: [
      'Welcome to Gelos Global ("Gelos", "we", "us", or "our"). These Terms and Conditions govern your use of gelosglobal.com and your purchase of products from us.',
      'By accessing our website, creating an account, or placing an order, you agree to these terms. If you do not agree, please do not use our services.',
    ],
  },
  {
    id: 'products',
    title: '2. Products & information',
    paragraphs: [
      'We sell oral care and wellness products designed for everyday use. Product descriptions, images, and prices are provided in good faith and may be updated without notice.',
      'Gelos products are cosmetic and general wellness items — not medicines. They are not intended to diagnose, treat, cure, or prevent any disease. Always read product labels and consult a dental professional for clinical concerns.',
    ],
  },
  {
    id: 'orders',
    title: '3. Orders & acceptance',
    paragraphs: [
      'When you place an order, you offer to purchase the items in your cart at the prices shown. We may accept or decline an order (for example, due to stock, pricing errors, or suspected fraud).',
      'An order is confirmed when you receive an order confirmation email from us. We reserve the right to cancel orders before dispatch and will refund any payment taken if we do so.',
    ],
  },
  {
    id: 'pricing',
    title: '4. Pricing & promotions',
    paragraphs: [
      'Prices are shown in Ghanaian Cedi (GH₵) unless another currency is selected at checkout. Applicable taxes and shipping fees are displayed before you pay.',
      'Promo codes and discounts apply only when valid, entered correctly, and used within any stated limits. We may modify or withdraw promotions at any time.',
    ],
  },
  {
    id: 'payment',
    title: '5. Payment',
    paragraphs: [
      'Online payments are processed securely through Paystack. By paying, you confirm that you are authorised to use the selected payment method.',
      'If a payment fails or is reversed, we may suspend or cancel the related order until payment is successfully completed.',
    ],
  },
  {
    id: 'shipping',
    title: '6. Shipping & delivery',
    paragraphs: [
      'We deliver to addresses within Ghana. Delivery times are estimates and may vary by location, courier capacity, and public holidays.',
      'You are responsible for providing accurate delivery details. Risk of loss passes to you once the order is handed to the courier, except where required otherwise by applicable law.',
      'See our Shipping & Delivery page for current fees and free-shipping thresholds.',
    ],
  },
  {
    id: 'returns',
    title: '7. Returns & refunds',
    paragraphs: [
      'Our returns policy is set out on the Returns page. Opened oral care products generally cannot be returned for hygiene reasons unless they arrived damaged, defective, or incorrect.',
      'Approved refunds are processed to the original payment method where possible. Processing times depend on your bank or mobile money provider.',
    ],
  },
  {
    id: 'accounts',
    title: '8. Accounts & conduct',
    paragraphs: [
      'You must provide accurate information when contacting us or checking out. You agree not to misuse the website, attempt unauthorised access, or use our services for unlawful purposes.',
      'We may suspend access if we reasonably believe these terms have been violated.',
    ],
  },
  {
    id: 'intellectual-property',
    title: '9. Intellectual property',
    paragraphs: [
      'All content on this website — including logos, text, images, and product packaging designs — is owned by Gelos or its licensors and protected by applicable intellectual property laws.',
      'You may not copy, reproduce, or distribute our content without written permission.',
    ],
  },
  {
    id: 'ai-tools',
    title: '10. AI & wellness tools',
    paragraphs: [
      'Features such as the wellness chat and smile scan provide general guidance only. They do not replace professional dental or medical advice, diagnosis, or treatment.',
      'Do not rely solely on AI-generated suggestions for health decisions. See a qualified professional for clinical concerns.',
    ],
  },
  {
    id: 'liability',
    title: '11. Limitation of liability',
    paragraphs: [
      'To the fullest extent permitted by law, Gelos is not liable for indirect, incidental, or consequential losses arising from your use of the website or products.',
      'Our total liability for any claim relating to an order is limited to the amount you paid for that order.',
    ],
  },
  {
    id: 'changes',
    title: '12. Changes to these terms',
    paragraphs: [
      'We may update these terms from time to time. The "Last updated" date at the top of this page will change when we do. Continued use of the website after changes constitutes acceptance of the revised terms.',
    ],
  },
  {
    id: 'contact',
    title: '13. Contact',
    paragraphs: [
      'Questions about these terms? Email hello@gelosglobal.com or use our contact form at gelosglobal.com/contact.',
    ],
  },
]

export const privacyLastUpdated = 'June 2026'

export const privacySections: LegalSection[] = [
  {
    id: 'overview',
    title: '1. Overview',
    paragraphs: [
      'Gelos Global ("Gelos", "we", "us") respects your privacy. This Privacy Policy explains what personal data we collect when you use gelosglobal.com, how we use it, and the choices you have.',
      'By using our website or services, you acknowledge this policy. If you do not agree, please do not use our services.',
    ],
  },
  {
    id: 'data-we-collect',
    title: '2. Information we collect',
    paragraphs: [
      'Contact details — name, email address, phone number, and delivery address when you place an order or contact support.',
      'Order information — products purchased, payment status, order history, and promo codes used.',
      'Communications — messages you send via our contact form, wellness chat, or email support.',
      'Smile scan & smile test — if you use these features, we may store the information you submit (such as your name, photo, or quiz answers) to generate results and improve our services.',
      'Technical data — device type, browser, IP address, and pages visited, collected through standard analytics and cookies.',
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How we use your information',
    paragraphs: [
      'Process and fulfil orders, including payment, shipping, and customer support.',
      'Send order confirmations, delivery updates, and responses to your enquiries.',
      'Operate wellness features such as product recommendations and smile insights.',
      'Improve our website, products, and marketing (including measuring ad performance where enabled).',
      'Prevent fraud, enforce our terms, and comply with legal obligations.',
    ],
  },
  {
    id: 'legal-bases',
    title: '4. Legal bases',
    paragraphs: [
      'We process personal data to perform our contract with you (fulfilling orders), based on our legitimate interests (improving services, security, and marketing where permitted), and where required to comply with law.',
      'Where we rely on consent — for example, optional marketing emails — you may withdraw consent at any time.',
    ],
  },
  {
    id: 'sharing',
    title: '5. Sharing with third parties',
    paragraphs: [
      'Payment processing — Paystack processes card and mobile money payments. We do not store full card details on our servers.',
      'Delivery partners — we share name, phone, and address with couriers to deliver your order.',
      'Service providers — hosting, email, analytics, and customer support tools that help us run the business.',
      'We do not sell your personal data. We may disclose information if required by law or to protect our rights and users.',
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies & analytics',
    paragraphs: [
      'We use cookies and similar technologies to keep the site working, remember preferences, and understand how visitors use our pages.',
      'Marketing pixels (such as Meta Pixel) may be used to measure advertising performance. You can control cookies through your browser settings; disabling cookies may affect some site features.',
    ],
  },
  {
    id: 'retention',
    title: '7. Data retention',
    paragraphs: [
      'We keep order and account-related records for as long as needed to fulfil orders, handle returns, meet legal requirements, and resolve disputes.',
      'Support messages and smile scan data are retained for a reasonable period unless you ask us to delete them and we are not required to keep them by law.',
    ],
  },
  {
    id: 'security',
    title: '8. Security',
    paragraphs: [
      'We use reasonable technical and organisational measures to protect your data. No online transmission is completely secure; please use strong passwords and protect your devices.',
    ],
  },
  {
    id: 'your-rights',
    title: '9. Your rights',
    paragraphs: [
      'Depending on applicable law, you may request access to, correction of, or deletion of your personal data, or object to certain processing.',
      'To exercise these rights, contact hello@gelosglobal.com. We may need to verify your identity before responding.',
    ],
  },
  {
    id: 'children',
    title: '10. Children',
    paragraphs: [
      'Our website is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us and we will delete it promptly.',
    ],
  },
  {
    id: 'international',
    title: '11. International users',
    paragraphs: [
      'Gelos is based in Ghana. If you access the site from outside Ghana, your data may be processed in Ghana or where our service providers operate.',
    ],
  },
  {
    id: 'changes-privacy',
    title: '12. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. The "Last updated" date will reflect the latest version. Material changes may be communicated where appropriate.',
    ],
  },
  {
    id: 'contact-privacy',
    title: '13. Contact',
    paragraphs: [
      'Privacy questions or requests: hello@gelosglobal.com or gelosglobal.com/contact.',
    ],
  },
]
