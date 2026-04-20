export const createId = (prefix: string): string => {
  const seed = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${seed}`
}
