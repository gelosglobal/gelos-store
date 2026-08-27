const ACCRA_AREAS = [
  'east legon',
  'west legon',
  'north legon',
  'spintex',
  'tesano',
  'cantonments',
  'labone',
  'osu',
  'airport',
  'airport residential',
  'dzorwulu',
  'roman ridge',
  'ridge',
  'achimota',
  'madina',
  'adenta',
  'dome',
  'haatso',
  'kwabenya',
  'dansoman',
  'kaneshie',
  'teshie',
  'nungua',
  'labadi',
  'la',
  'circle',
  'accra central',
  'jamestown',
  'korle bu',
  'kanda',
  'nima',
  'ablekuma',
  'weija',
  'mcCarthy hill',
  'mccarthy hill',
  'east airport',
  'roman ridge',
  'north kaneshie',
  'odorkor',
  'mataheko',
  'mamprobi',
  'alajo',
  'kokomlemle',
  'accra new town',
  '37',
  'thirty seven',
  'kotoka',
  'trade fair',
  'la paz',
  'tesano',
  'ablekuma',
  'gbawe',
  'awoshie',
  'pokuase',
  'amrahia',
  'oyibi',
  'dodowa',
  'kasoa',
]

const KUMASI_AREAS = [
  'adum',
  'asokwa',
  'santasi',
  'ahodwo',
  'bantama',
  'suame',
  'tafo',
  'ayigya',
  'knust',
  'kentinkrono',
  'asoqwa',
  'asafo',
  'nhyiaeso',
]

const TEMA_AREAS = [
  'community 1',
  'community 2',
  'community 3',
  'community 4',
  'community 5',
  'community 6',
  'community 7',
  'community 8',
  'community 9',
  'community 10',
  'community 11',
  'community 12',
  'ashaiman',
  'tema new town',
]

const LAGOS_AREAS = [
  'lekki',
  'ikoyi',
  'victoria island',
  'vi',
  'ikeja',
  'ajah',
  'yaba',
  'surulere',
  'maryland',
  'gbagada',
  'festac',
  'apapa',
  'magodo',
  'ojodu',
  'ogba',
  'alimosho',
  'ikorodu',
  'badagry',
  'epe',
]

function setFor(values: string[]) {
  return new Set(values.map((value) => value.toLowerCase()))
}

const accraAreas = setFor(ACCRA_AREAS)
const kumasiAreas = setFor(KUMASI_AREAS)
const temaAreas = setFor(TEMA_AREAS)
const lagosAreas = setFor(LAGOS_AREAS)

/** Countries where DHL typically needs a postal/ZIP code to rate. */
export const DHL_POSTAL_REQUIRED_COUNTRIES = new Set([
  'US',
  'GB',
  'CA',
  'AU',
  'DE',
  'FR',
  'NL',
])

export function countryRequiresPostalCode(countryCode: string): boolean {
  return DHL_POSTAL_REQUIRED_COUNTRIES.has(countryCode.trim().toUpperCase())
}

function stripCountrySuffix(city: string, countryCode: string) {
  const cleaned = city.replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim()
  const suffixes: Record<string, string[]> = {
    GH: ['ghana', 'gh'],
    NG: ['nigeria', 'ng'],
    US: ['usa', 'united states', 'us'],
    GB: ['uk', 'united kingdom', 'england', 'gb'],
  }
  const extras = suffixes[countryCode] ?? []
  let result = cleaned
  for (const suffix of extras) {
    const pattern = new RegExp(`\\s+${suffix}$`, 'i')
    result = result.replace(pattern, '').trim()
  }
  return result
}

/**
 * Map neighborhoods DHL does not recognize to a service-area city.
 * Street / suburb still goes on address line 1.
 */
export function normalizeDhlCity(
  countryCode: string,
  cityName: string,
): string {
  const country = countryCode.trim().toUpperCase()
  const raw = stripCountrySuffix(cityName, country)
  const key = raw.toLowerCase()

  if (country === 'GH') {
    if (key === 'accra' || accraAreas.has(key) || key.includes('legon') || key.includes('spintex')) {
      return 'Accra'
    }
    if (key === 'kumasi' || kumasiAreas.has(key)) return 'Kumasi'
    if (key === 'tema' || temaAreas.has(key)) return 'Tema'
    if (key.includes('takoradi') || key.includes('sekondi')) return 'Takoradi'
    if (key === 'tamale') return 'Tamale'
    if (key === 'cape coast') return 'Cape Coast'
  }

  if (country === 'NG') {
    if (key === 'lagos' || lagosAreas.has(key) || key.includes('lekki')) return 'Lagos'
    if (key === 'abuja' || key.includes('wuse') || key.includes('garki') || key.includes('maitama')) {
      return 'Abuja'
    }
    if (key.includes('port harcourt') || key === 'ph' || key === 'phc') {
      return 'Port Harcourt'
    }
  }

  return raw
}

export function dhlLocationError(city: string, countryCode: string): string {
  const country = countryCode.toUpperCase()
  if (country === 'GH') {
    return `DHL does not recognize “${city}” as a Ghana city. Use Accra, Kumasi, Tema, Takoradi, Tamale, or Cape Coast — put the suburb in the street address.`
  }
  if (country === 'NG') {
    return `DHL does not recognize “${city}” as a Nigeria city. Use Lagos, Abuja, or Port Harcourt — put the area in the street address.`
  }
  if (countryRequiresPostalCode(country)) {
    return `DHL could not rate “${city}” (${country}). Check the city spelling and postal/ZIP code.`
  }
  return `DHL could not rate “${city}” (${country}). Try the main city name, not a neighborhood.`
}
