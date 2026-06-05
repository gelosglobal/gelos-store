export type DentistPartner = {
  id: string
  name: string
  title: string
  specialty: string
  location: string
  area: string
  rating: number
  reviews: number
  nextAvailable: string
}

export const dentistPartners: DentistPartner[] = [
  {
    id: 'ama-osei',
    name: 'Dr. Ama Osei',
    title: 'BDS, MSc Cosmetic Dentistry',
    specialty: 'Cosmetic & whitening',
    location: 'Smile Studio Accra',
    area: 'East Legon',
    rating: 4.9,
    reviews: 128,
    nextAvailable: 'Mon & Wed mornings',
  },
  {
    id: 'kwame-asante',
    name: 'Dr. Kwame Asante',
    title: 'BDS, Family Dentistry',
    specialty: 'General & preventive care',
    location: 'Osu Dental Centre',
    area: 'Osu',
    rating: 4.8,
    reviews: 94,
    nextAvailable: 'Tue–Fri afternoons',
  },
]

export function getDentistById(id: string): DentistPartner | undefined {
  return dentistPartners.find((d) => d.id === id)
}
