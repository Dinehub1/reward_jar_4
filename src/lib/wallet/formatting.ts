import { formatCurrency, formatDate } from '@/lib/format'

export type BusinessLike = { currency_code?: string | null; locale?: string | null }

export function resolveCurrency(business?: BusinessLike): string {
  return business?.currency_code || 'INR'
}

export function resolveLocale(business?: BusinessLike): string {
  return business?.locale || 'en-IN'
}

export function formatCurrencyForBusiness(amount: number, business?: BusinessLike): string {
  return formatCurrency(amount, resolveCurrency(business), resolveLocale(business))
}

export function formatDateForBusiness(dateInput: string | number | Date, business?: BusinessLike): string {
  return formatDate(dateInput, resolveLocale(business))
}

