export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    // Fallback: numeric with grouping, prefixed by currency code
    return `${currency} ${Math.round(amount).toLocaleString()}`
  }
}

export function formatDate(dateInput: string | number | Date, locale = 'en-IN'): string {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
    return new Intl.DateTimeFormat(locale).format(d)
  } catch {
    return new Date(dateInput).toISOString().slice(0, 10)
  }
}

