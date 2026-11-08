const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
export const peso = (centavos) => currency.format(centavos / 100)
export const dateTime = (iso) => new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
export const selectClass = 'mt-1 min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15'
