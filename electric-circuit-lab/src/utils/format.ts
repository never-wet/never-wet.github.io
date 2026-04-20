export const formatNumber = (value: number, digits = 2): string => {
  if (!Number.isFinite(value)) {
    return '0'
  }

  return Number(value).toFixed(digits).replace(/\.00$/, '')
}

export const formatDateTime = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
