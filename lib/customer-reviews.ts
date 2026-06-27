export type CustomerReview = {
  id: string
  name: string
  role: string
  handle: string
  quote: string
  /** When omitted, the review card shows initials instead of a photo. */
  avatar?: string
  rating: number
}

export const customerReviews: CustomerReview[] = [
  {
    id: 'ama-k',
    name: 'Ama K.',
    role: 'Customer',
    handle: 'Accra',
    quote:
      'The whitening toothpaste actually made a difference in two weeks. Fresh breath that lasts through my workday.',
    avatar: '/gelos/reviews/ama-k.jpg',
    rating: 5,
  },
  {
    id: 'kwesi-m',
    name: 'Kwesi M.',
    role: 'Customer',
    handle: 'Dansoman',
    quote: 'I really enjoyed their flavoured toothpastes.',
    avatar: '/gelos/kwesi.jpeg',
    rating: 5,
  },
  {
    id: 'efua-a',
    name: 'Efua A.',
    role: 'Customer',
    handle: 'Kumasi',
    quote:
      'My kids finally enjoy brushing. The electric toothbrush is gentle, and the flavors are a hit at home.',
    rating: 5,
  },
  {
    id: 'Isabella',
    name: 'Isabella M.',
    role: 'Customer',
    handle: 'Trassaco',
    quote:
      'I recommend Gelos in every oral-care routine post. The products look premium and deliver visible results.',
    avatar: '/gelos/reviews/nana-s.jpg',
    rating: 5,
  },
  {
    id: 'david-o',
    name: 'David O.',
    role: 'Customer',
    handle: 'Tema',
    quote:
      'The bundle kits are great value. One order covered toothpaste, floss, and mouthwash for the whole family.',
    avatar: '/gelos/nanas.jpeg',
    rating: 4,
  },
  {
    id: 'yaa-b',
    name: 'Yaa B.',
    role: 'Customer',
    handle: 'Adenta',
    quote: 'Their collection is easy to recommend for daily care and whitening.',
    rating: 5,
  },
]
