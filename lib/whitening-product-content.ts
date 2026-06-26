import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { getProductSlug } from '@/lib/product-utils'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'

const whiteningHighlights: ProductPdpContent['highlights'] = [
  { label: 'Shade correction', emoji: '💜' },
  { label: 'Visible results', emoji: '✨' },
  { label: 'At-home ritual', emoji: '🏠' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'How does Gelos whitening work?',
    content:
      'Our whitening range is designed to fit different goals — from quick shade correction to LED-assisted brightening. Pick the treatment that matches your routine and follow the directions on pack.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive teeth?',
    content:
      'if you have sensitivity, start with shorter sessions and space treatments apart. Stop use if discomfort persists and speak with your dentist. The device also features red light therapy, which helps soothe teeth and gums and can support comfort during treatment, making it especially beneficial for users with sensitivity.',
  },
  {
    id: 'faq-results',
    title: 'When will I see results?',
    content:
      'Many customers notice a fresher, brighter look after consistent use. Results vary by starting shade, diet, and how closely you follow the routine.',
  },
]

const v34KitBenefits = [
  'Helps reduce the appearance of surface stains',
  'Improves overall tooth brightness',
  'Enhances daily oral care routine',
  'Easy at-home whitening support',
  'Works across different whitening preferences',
]

const v34UsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'V34 Serum',
    body: 'Apply a small amount and brush gently.',
  },
  {
    title: 'Foam cleanser',
    body: 'Swish in your mouth for a few seconds, then spit out — no brushing required.',
  },
  {
    title: 'Whitening powder',
    body: 'Dip your toothbrush lightly into the powder and brush gently.',
  },
  {
    title: 'Routine',
    body: 'Use 1–2 times daily depending on your preference and smile goals.',
  },
]

const v34Faq: ProductPdpContent['faq'] = [
  {
    id: 'faq-kit',
    title: 'What is in the Gelos V34 Teeth Whitening Kit?',
    content:
      'Three complementary products: V34 Whitening Serum, V34 Foaming Whitening Cleanser, and V34 Whitening Powder — designed to help reduce the appearance of stains and enhance brightness from home.',
  },
  {
    id: 'faq-serum',
    title: 'How does the V34 Serum work?',
    content:
      'The serum helps neutralize yellow tones on teeth, enhances brightness, and supports the appearance of a whiter smile — perfect for daily or occasional use.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive teeth?',
    content:
      'If you have sensitivity, start with once-daily use and gentler application. Stop use if discomfort persists and speak with your dentist.',
  },
  {
    id: 'faq-results',
    title: 'When will I see results?',
    content:
      'Many customers notice a fresher, brighter look after consistent use. Results vary by starting shade, diet, and how closely you follow the routine.',
  },
]

const v34Content: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '3-STEP KIT',
  headline: 'Gelos V34 Teeth Whitening Kit',
  intro:
    'The Gelos V34 Teeth Whitening Kit is a premium cosmetic whitening range designed to help reduce the appearance of stains and enhance the brightness of your smile for a cleaner, whiter look. The kit includes three powerful products — serum, foaming cleanser, and whitening powder — so you can tailor your routine to how you like to whiten.',
  bullets: v34KitBenefits,
  highlights: [
    { label: '3-step system', emoji: '💜' },
    { label: 'Brighter smile', emoji: '✨' },
    { label: 'At-home kit', emoji: '🏠' },
  ],
  usageSteps: v34UsageSteps,
  usageStepsTitle: 'How to use your V34 kit',
  usageStepsIntro:
    'Follow the steps below for each product in the kit. Use 1–2 times daily depending on preference.',
  detailsAccordion: [
    {
      id: 'serum',
      title: 'V34 Whitening Serum',
      content:
        'Helps neutralize yellow tones on teeth · Enhances brightness instantly · Helps improve the appearance of a whiter smile · Perfect for daily or occasional use',
    },
    {
      id: 'foam',
      title: 'V34 Foaming Whitening Cleanser',
      content:
        'Deep-cleansing foaming formula · Helps lift surface stains · Used by swishing in the mouth (no brushing required) · Leaves mouth feeling fresh and clean',
    },
    {
      id: 'powder',
      title: 'V34 Whitening Powder',
      content:
        'Gentle polishing action for stain removal · Helps restore natural brightness of teeth · Can be used with regular brushing · Supports a smoother, cleaner tooth surface',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One Gelos V34 Teeth Whitening Kit with V34 Whitening Serum, V34 Foaming Whitening Cleanser, and V34 Whitening Powder. See pack for full contents and directions.',
    },
  ],
  faq: v34Faq,
}

const ledKitUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Prep',
    body: 'Brush and dry your teeth thoroughly before treatment.',
  },
  {
    title: 'Apply gel',
    body: 'Twist the whitening gel pen and apply a thin, even layer across the front surface of your teeth.',
  },
  {
    title: 'Activate LED',
    body: 'Insert the LED whitening light into your mouth and switch it on.',
  },
  {
    title: 'Treat',
    body: 'Leave the LED light in place for 10–15 minutes, or as directed in the user manual.',
  },
  {
    title: 'Rinse',
    body: 'Remove the device and rinse your mouth thoroughly with water.',
  },
  {
    title: 'Clean & store',
    body: 'Clean the mouthpiece after each use and store it in the protective travel case.',
  },
]

const ledKitFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-how-it-works',
    title: 'How does the Gelos LED whitening kit work?',
    content:
      'The kit combines whitening gel with an LED light accelerator. The gel helps reduce the appearance of surface stains while the LED session is designed to enhance the whitening process — all from the comfort of home.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive teeth?',
    content:
      'If you have sensitivity, start with shorter sessions and space treatments apart. Stop use if discomfort persists and speak with your dentist.',
  },
  {
    id: 'faq-results',
    title: 'When will I see results?',
    content:
      'Many customers notice a brighter look after consistent use as directed. Results vary by starting shade, diet, and how closely you follow the routine. Use the included shade guide to track your progress.',
  },
]

const ledDeviceContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'LED KIT',
  headline: 'Smile brighter from home',
  intro:
    'Achieve a brighter, more confident smile from the comfort of your home with the Gelos Teeth Whitening LED Kit. Designed to help reduce the appearance of surface stains caused by coffee, tea, wine, and everyday foods, this easy-to-use whitening system combines a whitening gel with an LED light accelerator to help you achieve noticeable results safely and conveniently.',
  bullets: [
    'Helps whiten and brighten teeth',
    'Helps reduce the appearance of common surface stains',
    'Easy and convenient at-home treatment',
    'LED technology helps enhance the whitening process',
    'Comfortable and simple to use',
    'Portable travel case for whitening on the go',
    'Helps boost confidence with a brighter smile',
    'Suitable for use as part of your regular oral care routine',
  ],
  highlights: [
    { label: 'Whiten & brighten', emoji: '✨' },
    { label: 'LED accelerated', emoji: '💡' },
    { label: 'Travel-ready kit', emoji: '🧳' },
  ],
  usageSteps: ledKitUsageSteps,
  usageStepsTitle: 'How to use your Gelos LED whitening kit',
  usageStepsIntro:
    'Follow these six simple steps for each at-home session. Smile brighter with Gelos.',
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes the Gelos LED kit different?',
      content:
        'Everything you need in one complete kit — LED light, gel pens, charging cable, travel case, and shade guide — so you can whiten on your schedule without salon appointments.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        '1 LED Whitening Light · 4 Whitening Gel Pens · 1 USB Charging Cable · 1 Protective Travel Case · 1 Shade Guide (to track whitening progress) · 1 User Manual',
    },
    {
      id: 'best-results',
      title: 'For best results',
      content:
        'Use consistently as directed. Avoid staining foods and drinks such as coffee, tea, red wine, and cola immediately after treatment. Maintain good oral hygiene by brushing, flossing, and using mouthwash daily.',
    },
    {
      id: 'how-often',
      title: 'How often should I use it?',
      content:
        'Follow the schedule in your user manual. Consistency matters more than intensity — regular sessions as directed help you track progress with the shade guide and maintain a brighter smile over time.',
    },
  ],
  faq: ledKitFaq,
}

const stripsBenefits = [
  'Helps reduce the appearance of surface stains',
  'Supports a brighter, whiter-looking smile',
  'Simple, quick, and mess-free application',
  'Convenient whitening routine at home',
  'Helps enhance overall smile appearance',
]

const stripsUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Peel',
    body: 'Peel strips from the backing film.',
  },
  {
    title: 'Apply',
    body: 'Apply to clean, dry teeth.',
  },
  {
    title: 'Wait',
    body: 'Leave on for the recommended time per session.',
  },
  {
    title: 'Remove',
    body: 'Remove and discard after use.',
  },
  {
    title: 'Avoid',
    body: 'Avoid eating or drinking during application.',
  },
  {
    title: 'Routine',
    body: 'Use 1 application per day or as directed — 7 total applications per pack.',
  },
]

const stripsFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is the PAP+ formula?',
    content:
      'Gelos PAP+ Teeth Whitening Strips use a PAP+ whitening formula designed to help reduce the appearance of stains and support a brighter-looking smile — in an easy peel-and-apply format.',
  },
  {
    id: 'faq-how-many',
    title: 'How many applications are in the pack?',
    content:
      '14 strips for 7 full applications (upper and lower per session). Use one application per day or as directed on pack.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive teeth?',
    content:
      'If you have sensitivity, follow pack directions and space treatments as needed. Stop use if discomfort persists and speak with your dentist.',
  },
  {
    id: 'faq-results',
    title: 'When will I see results?',
    content:
      'Many customers notice a fresher, brighter look after consistent use as directed. Results vary by starting shade, diet, and how closely you follow the routine.',
  },
]

const stripsContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'PAP+',
  headline: 'Gelos PAP+ Teeth Whitening Strips',
  intro:
    'The Gelos PAP+ Teeth Whitening Strips are a convenient at-home whitening solution designed to help reduce the appearance of stains and enhance a brighter-looking smile. Powered by a PAP+ formula, they offer an easy, mess-free way to support tooth whitening in your daily routine.',
  bullets: stripsBenefits,
  highlights: [
    { label: 'PAP+ formula', emoji: '✨' },
    { label: '7 applications', emoji: '📅' },
    { label: 'Mess-free', emoji: '🏠' },
  ],
  usageSteps: stripsUsageSteps,
  usageStepsTitle: 'How to use your whitening strips',
  usageStepsIntro:
    'Use 1 application per day or as directed — 7 total applications per pack.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'PAP+ whitening formula · 14 strips (7 full applications) · Easy peel-and-apply design · Fits comfortably on teeth · Designed for at-home use',
    },
    {
      id: 'different',
      title: 'What makes Gelos PAP+ strips different?',
      content:
        'A mess-free at-home whitening option — peel, apply, and let the PAP+ formula work while you go about your day.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        '14 Gelos PAP+ Teeth Whitening Strips (7 full applications). See packaging for full directions and recommended wear time.',
    },
  ],
  faq: stripsFaq,
}

const nhproBenefits = [
  'Supports overall enamel care',
  'Helps improve the appearance of tooth smoothness',
  'Enhances daily oral hygiene routine',
  'Easy and targeted application',
]

const nhproUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Apply',
    body: 'Apply two pumps to a soft-bristle toothbrush.',
  },
  {
    title: 'Brush',
    body: 'Gently brush the front and back of all teeth for 2 minutes.',
  },
  {
    title: 'Expel',
    body: 'Expel after use. Do not swallow.',
  },
  {
    title: 'No rinse',
    body: 'Refrain from rinsing your mouth with water after use.',
  },
]

const nhproFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is NH Pro Inamel Care Serum?',
    content:
      'A specialized oral care serum designed to support enamel care and help maintain a cleaner, healthier-looking smile as part of your daily routine.',
  },
  {
    id: 'faq-brush',
    title: 'What kind of toothbrush should I use?',
    content:
      'Use a soft-bristle toothbrush and brush gently for two minutes across all tooth surfaces.',
  },
  {
    id: 'faq-rinse',
    title: 'Should I rinse after use?',
    content:
      'No. After brushing, expel the serum and refrain from rinsing with water so the formula can work on the tooth surface.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive teeth?',
    content:
      'The gentle formula is designed for daily use. If discomfort persists, pause use and speak with your dentist.',
  },
]

const nhproEnamelCareContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'ENAMEL CARE',
  headline: 'NH Pro Inamel Care Serum (Enamel Care)',
  intro:
    'The NH Pro Inamel Care Serum is a specialized oral care formula designed to support enamel care and maintain a cleaner, healthier-looking smile as part of your daily routine.',
  bullets: nhproBenefits,
  highlights: [
    { label: 'Enamel care', emoji: '🛡️' },
    { label: 'Daily routine', emoji: '✨' },
    { label: 'Gentle formula', emoji: '🪥' },
  ],
  usageSteps: nhproUsageSteps,
  usageStepsTitle: 'How to use your NH Pro serum',
  usageStepsIntro:
    'Use as part of your daily oral care routine for best results.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Enamel care support formula · Designed for daily oral care routine · Gentle use with soft-bristle toothbrush · Helps maintain a cleaner, smoother tooth surface',
    },
    {
      id: 'different',
      title: 'What makes NH Pro Inamel Care different?',
      content:
        'A targeted serum formula focused on enamel care — easy to apply with your toothbrush as a daily step toward a smoother, healthier-looking smile.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One NH Pro Inamel Care Serum with pump applicator. See packaging for full contents and directions.',
    },
  ],
  faq: nhproFaq,
}

const ha5Benefits = [
  'Helps keep gums hydrated and comfortable',
  'Supports overall gum health appearance',
  'Helps reduce dryness in the mouth',
  'Enhances daily oral care routine',
  'Promotes a fresher, healthier oral environment',
]

const ha5UsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Apply',
    body: 'Apply two pumps to the tongue.',
  },
  {
    title: 'Spread',
    body: 'Gently spread over the gums.',
  },
  {
    title: 'Leave',
    body: 'Leave for 2 minutes.',
  },
  {
    title: 'Expel',
    body: 'Expel after use. Do not swallow.',
  },
  {
    title: 'Wait',
    body: 'Avoid rinsing your mouth or consuming food and drink for 30 minutes after use.',
  },
]

const ha5Faq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is Gelos HA5 Hyaluronic Serum?',
    content:
      'An advanced oral care gel with hyaluronic acid — a substance naturally found in the body that helps retain moisture and support tissue hydration for gum comfort.',
  },
  {
    id: 'faq-daily',
    title: 'How often should I use it?',
    content:
      'Use daily as part of your gum care routine. Apply two pumps, spread over gums, leave for 2 minutes, then expel.',
  },
  {
    id: 'faq-rinse',
    title: 'Can I eat or drink right after use?',
    content:
      'Wait 30 minutes after use before rinsing, eating, or drinking so the serum can work on the gum tissue.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive gums?',
    content:
      'The gentle formula is designed for daily gum care support. If irritation persists, pause use and speak with your dentist.',
  },
]

const ha5HyaluronicSerumContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'HA5 SERUM',
  headline: 'Gelos HA5 Hyaluronic Serum',
  intro:
    'The Gelos HA5 Hyaluronic Serum is an advanced oral care gel designed to support gum hydration and overall oral comfort. It contains hyaluronic acid, a substance naturally found in the body that helps retain moisture and support tissue hydration.',
  bullets: ha5Benefits,
  highlights: [
    { label: 'Hyaluronic acid', emoji: '💧' },
    { label: 'Gum hydration', emoji: '🦷' },
    { label: 'Daily care', emoji: '✨' },
  ],
  usageSteps: ha5UsageSteps,
  usageStepsTitle: 'How to use your HA5 serum',
  usageStepsIntro:
    'Use daily as part of your oral care routine for best results.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Contains Hyaluronic Acid (naturally found in the body) · Helps support moisture retention in gums · Gentle, easy-to-use oral serum · Designed for daily gum care support',
    },
    {
      id: 'different',
      title: 'What makes Gelos HA5 different?',
      content:
        'A targeted hyaluronic acid gel focused on gum hydration and comfort — easy to apply daily for a fresher, healthier-feeling oral environment.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One Gelos HA5 Hyaluronic Serum with pump applicator. See packaging for full contents and directions.',
    },
  ],
  faq: ha5Faq,
}

const charcoalBenefits = [
  'Helps reduce the appearance of stains on teeth',
  'Supports a brighter-looking smile',
  'Gently polishes tooth surfaces',
  'Helps improve overall oral cleanliness',
  'Natural-looking whitening support option',
]

const charcoalUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Dip',
    body: 'Dip a clean, wet toothbrush lightly into the powder.',
  },
  {
    title: 'Brush',
    body: 'Brush gently for 1–2 minutes.',
  },
  {
    title: 'Focus',
    body: 'Focus on stained areas if needed.',
  },
  {
    title: 'Rinse',
    body: 'Rinse your mouth thoroughly after use.',
  },
  {
    title: 'Routine',
    body: 'Use 2–3 times per week or as needed.',
  },
]

const charcoalFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is Gelos Activated Charcoal Powder?',
    content:
      'A natural oral care powder designed to help lift surface stains and improve the appearance of a brighter, cleaner smile by gently polishing teeth and absorbing impurities that contribute to discoloration.',
  },
  {
    id: 'faq-how-often',
    title: 'How often should I use it?',
    content:
      'Use 2–3 times per week or as needed. Brush gently and avoid overuse if your teeth feel sensitive.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive teeth?',
    content:
      'If you have sensitivity, use less frequently and brush gently. Stop use if discomfort persists and speak with your dentist.',
  },
]

const activatedCharcoalPowderContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'CHARCOAL',
  headline: 'Gelos Activated Charcoal Powder',
  intro:
    'The Gelos Activated Charcoal Powder is a natural oral care product designed to help lift surface stains and improve the appearance of a brighter, cleaner smile. It works by gently polishing the teeth and helping absorb impurities that contribute to discoloration.',
  bullets: charcoalBenefits,
  highlights: [
    { label: 'Stain lift', emoji: '✨' },
    { label: 'Gentle polish', emoji: '🪥' },
    { label: 'Natural care', emoji: '🌿' },
  ],
  usageSteps: charcoalUsageSteps,
  usageStepsTitle: 'How to use your charcoal powder',
  usageStepsIntro:
    'Use 2–3 times per week or as needed. Brush gently for 1–2 minutes, then rinse thoroughly.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Activated charcoal formula · Fine powder texture for gentle polishing · Helps remove surface stains · Can be used alongside regular brushing · Suitable for occasional or routine use',
    },
    {
      id: 'different',
      title: 'How it works',
      content:
        'Activated charcoal helps absorb impurities while the fine powder texture gently polishes tooth surfaces to help lift the look of surface stains.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One jar of Gelos Activated Charcoal Powder. See packaging for full contents and directions.',
    },
  ],
  faq: charcoalFaq,
}

const turmericBenefits = [
  'Helps reduce the appearance of surface stains',
  'Supports a brighter, cleaner smile',
  'Gently polishes teeth without harsh ingredients',
  'Helps improve overall oral hygiene routine',
  'Natural alternative for whitening support',
]

const turmericUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Dip',
    body: 'Dip a wet toothbrush lightly into the powder.',
  },
  {
    title: 'Brush',
    body: 'Brush gently for 1–2 minutes.',
  },
  {
    title: 'Focus',
    body: 'Focus on stained areas if needed.',
  },
  {
    title: 'Rinse',
    body: 'Rinse your mouth thoroughly after use.',
  },
  {
    title: 'Routine',
    body: 'Use 2–3 times per week or as needed.',
  },
]

const turmericFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is Gelos Turmeric Teeth Whitening Powder?',
    content:
      'A natural oral care formula with turmeric designed to gently polish teeth and help reduce the appearance of surface stains for a cleaner, brighter-looking smile.',
  },
  {
    id: 'faq-how-often',
    title: 'How often should I use it?',
    content:
      'Use 2–3 times per week or as needed. Brush gently and avoid overuse if your teeth feel sensitive.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive teeth?',
    content:
      'If you have sensitivity, use less frequently and brush gently. Stop use if discomfort persists and speak with your dentist.',
  },
]

const turmericWhiteningPowderContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'TURMERIC',
  headline: 'Gelos Turmeric Teeth Whitening Powder',
  intro:
    'The Gelos Turmeric Teeth Whitening Powder is a natural oral care formula designed to help support a cleaner, brighter-looking smile using the traditional benefits of turmeric. It gently polishes the teeth while helping reduce the appearance of surface stains for improved oral freshness.',
  bullets: turmericBenefits,
  highlights: [
    { label: 'Natural turmeric', emoji: '🌿' },
    { label: 'Gentle polish', emoji: '🪥' },
    { label: 'Brighter smile', emoji: '✨' },
  ],
  usageSteps: turmericUsageSteps,
  usageStepsTitle: 'How to use your turmeric powder',
  usageStepsIntro:
    'Use 2–3 times per week or as needed. Brush gently for 1–2 minutes, then rinse thoroughly.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Natural turmeric-based formula · Fine powder for gentle tooth polishing · Helps support stain removal · Can be used with regular brushing · Suitable for occasional oral care use',
    },
    {
      id: 'different',
      title: 'How it works',
      content:
        'Turmeric’s traditional oral care benefits meet a fine powder texture that gently polishes tooth surfaces to help lift the look of surface stains.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One jar of Gelos Turmeric Teeth Whitening Powder. See packaging for full contents and directions.',
    },
  ],
  faq: turmericFaq,
}

const pullingOilBenefits = [
  'Helps remove bacteria and impurities from the mouth',
  'Supports fresher breath',
  'Promotes a cleaner oral environment',
  'Helps improve overall oral hygiene routine',
  'Natural cleansing support for oral care',
]

const pullingOilUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Pour',
    body: 'Pour oil into the transparent cup (about 1 tablespoon).',
  },
  {
    title: 'Swish',
    body: 'Swish gently in the mouth for 10–15 minutes.',
  },
  {
    title: 'Spit',
    body: 'Do not swallow. Spit out into a bin — not the sink.',
  },
  {
    title: 'Rinse',
    body: 'Rinse your mouth with water after use.',
  },
  {
    title: 'Routine',
    body: 'Use once daily, preferably in the morning before eating.',
  },
]

const pullingOilFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is oil pulling?',
    content:
      'Oil pulling is a traditional oral care practice of swishing oil in the mouth to help cleanse, support fresher breath, and promote overall oral hygiene.',
  },
  {
    id: 'faq-included',
    title: 'What comes in the pack?',
    content:
      'Gelos Coconut Oil Pulling Oil with a transparent measuring cup, plus a free tongue scraper. See packaging for full contents.',
  },
  {
    id: 'faq-how-long',
    title: 'How long should I swish?',
    content:
      'Swish gently for 10–15 minutes, then spit into a bin and rinse with water. Do not swallow the oil.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive mouths?',
    content:
      'The gentle coconut-based formula is designed for daily use. If irritation occurs, reduce session length and speak with your dentist.',
  },
]

const pullingOilContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'OIL PULLING',
  headline: 'Gelos Coconut Oil Pulling Oil',
  intro:
    'The Gelos Coconut Oil Pulling Oil is a natural oral care solution designed to help cleanse the mouth, support fresher breath, and promote overall oral hygiene through traditional oil pulling practice. Made with coconut-based oil, it gently helps remove impurities while maintaining a clean, fresh mouth feel.',
  bullets: pullingOilBenefits,
  highlights: [
    { label: 'Coconut oil', emoji: '🥥' },
    { label: 'Measuring cup', emoji: '🧪' },
    { label: 'Natural care', emoji: '🌿' },
  ],
  usageSteps: pullingOilUsageSteps,
  usageStepsTitle: 'How to use your pulling oil',
  usageStepsIntro:
    'Use once daily, preferably in the morning before eating.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Coconut-based natural oil formula · Comes with a transparent measuring cup · Designed for traditional oil pulling use · Gentle and easy-to-use oral care routine · Supports daily oral hygiene',
    },
    {
      id: 'different',
      title: 'What makes Gelos pulling oil different?',
      content:
        'A coconut-based oil pulling formula with a measuring cup included — plus a free tongue scraper to complete your oral care routine.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One bottle of Gelos Coconut Oil Pulling Oil (Coconut + Mint), a transparent measuring cup, and a free tongue scraper. See packaging for volume and directions.',
    },
  ],
  faq: pullingOilFaq,
}

const defaultWhiteningContent = (product: Product): ProductPdpContent => ({
  galleryImages: [],
  headline: 'Brighten your smile with Gelos',
  intro: product.description,
  bullets: [
    'Professional-inspired formulas',
    'Designed for at-home use',
    'Part of the full Gelos smile-care line',
  ],
  highlights: whiteningHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why Gelos whitening?',
      content:
        'Gelos whitening products are formulated to slot into your existing routine — from quick correctors to LED-assisted sessions.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One ${product.name}.`,
    },
  ],
  faq: sharedFaq,
})

const contentBySlug: Record<string, ProductPdpContent> = {
  'v34-shade-correction-kit': v34Content,
  'v34-teeth-whitening-kit': v34Content,
  'led-whitening-device': ledDeviceContent,
  'premium-whitening-strips-30-pairs': stripsContent,
  'nhpro-enamel-care': nhproEnamelCareContent,
  'hyaluronic-serum': ha5HyaluronicSerumContent,
  'activated-charcoal-powder': activatedCharcoalPowderContent,
  'tumeric-teeth-whitening-powder': turmericWhiteningPowderContent,
  'pulling-oil-coconut-mint-free-tongue-scraper': pullingOilContent,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getWhiteningProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultWhiteningContent(product)
  return mergeGallery(base)
}

/** Cross-category picks for "People also love" on whitening PDPs */
export const whiteningCommunityFavoriteIds = ['1', '12', '2', '11'] as const
