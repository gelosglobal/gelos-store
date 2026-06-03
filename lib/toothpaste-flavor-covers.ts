/** Cover art for toothpaste flavour picker on PDP */
export const toothpasteFlavorCoverByProductId: Record<string, string> = {
  '1': '/gelos/watermelon-toothpaste.png',
  '15': '/gelos/strawberry-toothpaste.png',
  '13': '/gelos/coconut-whip-toothpaste.png',
  '17': '/gelos/grape-bubblegum-toothpaste.png',
  '11': '/gelos/energy-drink-toothpaste.png',
  '14': '/gelos/bananaa.png',
  '16': '/gelos/passion-fruit-toothpaste.png',
  '18': '/gelos/vanilla-toothpaste.png',
  '19': '/gelos/red-velvet-toothpaste.png',
}

/** Featured order for flavour picker */
export const toothpasteFlavorOrder = [
  '1',
  '15',
  '13',
  '17',
  '11',
  '14',
  '16',
  '18',
  '19',
] as const

export function getToothpasteFlavorCover(
  productId: string,
  fallbackImage: string,
): string {
  return toothpasteFlavorCoverByProductId[productId] ?? fallbackImage
}

export function getToothpasteFlavorLabel(name: string): string {
  return name.replace(/ Toothpaste$/i, '').trim()
}
