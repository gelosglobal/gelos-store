export type DentistPartner = {
  id: string
  name: string
  title: string
  clinic: string
  address: string
  postalBox: string
  phone: string
  mobile: string
  emails: string[]
  website: string
}

export const dentistPartners: DentistPartner[] = [
  {
    id: 'marks-dental-clinic',
    name: 'Dr. Mark Nartey',
    title: 'Specialist Dental Surgeon',
    clinic: "Mark's Dental Clinic",
    address: '1st floor, Valco Trust Hse, Ridge',
    postalBox: 'Box AN 19698, Accra-North',
    phone: '0302 963905 / 050 2734606',
    mobile: '0537390626',
    emails: ['info@marksdental-clinic.com', 'marks_dental@yahoo.com'],
    website: 'www.marksdental-clinic.com',
  },
]

export function getDentistById(id: string): DentistPartner | undefined {
  return dentistPartners.find((d) => d.id === id)
}
