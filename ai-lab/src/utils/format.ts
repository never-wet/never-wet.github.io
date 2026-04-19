export const formatMetric = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : '—'

export const formatPercent = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—'

export const formatTimestamp = (value?: string) => {
  if (!value) {
    return 'Not saved yet'
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
