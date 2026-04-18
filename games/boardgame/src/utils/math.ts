export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pickWeighted<T>(items: T[], randomness: number): T {
  if (items.length === 1 || randomness <= 0) {
    return items[0];
  }

  const spread = Math.max(0, Math.min(0.98, randomness));
  const index = Math.floor(Math.pow(Math.random(), 1 + spread * 4) * items.length);
  return items[Math.min(items.length - 1, index)];
}
