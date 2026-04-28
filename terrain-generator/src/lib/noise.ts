export interface NoiseContext {
  perlin: (x: number, y: number) => number;
  simplex: (x: number, y: number) => number;
}

export interface FractalOptions {
  octaves: number;
  persistence: number;
  lacunarity: number;
}

const perlinGradients = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
] as const;

const simplexGradients = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.707, 0.707],
  [-0.707, 0.707],
  [0.707, -0.707],
  [-0.707, -0.707]
] as const;

export function seedToNumber(seed: string): number {
  let hash = 2166136261;
  const value = seed.trim() || "terrain";
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPermutation(seed: string): Uint8Array {
  const random = mulberry32(seedToNumber(seed));
  const source = new Uint8Array(256);
  const permutation = new Uint8Array(512);

  for (let index = 0; index < 256; index += 1) {
    source[index] = index;
  }

  for (let index = 255; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = source[index];
    source[index] = source[swapIndex];
    source[swapIndex] = temp;
  }

  for (let index = 0; index < 512; index += 1) {
    permutation[index] = source[index & 255];
  }

  return permutation;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function fastFloor(value: number): number {
  return value > 0 ? Math.floor(value) : Math.floor(value) - (Number.isInteger(value) ? 0 : 0);
}

function perlinGrad(hash: number, x: number, y: number): number {
  const gradient = perlinGradients[hash & 7];
  return gradient[0] * x + gradient[1] * y;
}

function simplexCorner(perm: Uint8Array, ii: number, jj: number, x: number, y: number): number {
  let t = 0.5 - x * x - y * y;
  if (t < 0) return 0;
  const gradient = simplexGradients[perm[ii + perm[jj]] % simplexGradients.length];
  t *= t;
  return t * t * (gradient[0] * x + gradient[1] * y);
}

export function createNoiseContext(seed: string): NoiseContext {
  const perm = buildPermutation(seed);

  const perlin = (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];

    const x1 = lerp(perlinGrad(aa, xf, yf), perlinGrad(ba, xf - 1, yf), u);
    const x2 = lerp(perlinGrad(ab, xf, yf - 1), perlinGrad(bb, xf - 1, yf - 1), u);

    return Math.max(-1, Math.min(1, lerp(x1, x2, v) * 0.98));
  };

  const simplex = (xin: number, yin: number) => {
    const f2 = 0.5 * (Math.sqrt(3) - 1);
    const g2 = (3 - Math.sqrt(3)) / 6;
    const s = (xin + yin) * f2;
    const i = fastFloor(xin + s);
    const j = fastFloor(yin + s);
    const t = (i + j) * g2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + g2;
    const y1 = y0 - j1 + g2;
    const x2 = x0 - 1 + 2 * g2;
    const y2 = y0 - 1 + 2 * g2;
    const ii = i & 255;
    const jj = j & 255;

    const n0 = simplexCorner(perm, ii, jj, x0, y0);
    const n1 = simplexCorner(perm, ii + i1, jj + j1, x1, y1);
    const n2 = simplexCorner(perm, ii + 1, jj + 1, x2, y2);

    return Math.max(-1, Math.min(1, 70 * (n0 + n1 + n2)));
  };

  return { perlin, simplex };
}

export function sampleBaseNoise(context: NoiseContext, algorithm: "perlin" | "simplex", x: number, y: number) {
  return algorithm === "perlin" ? context.perlin(x, y) : context.simplex(x, y);
}

export function fractalBrownianMotion(
  sampler: (x: number, y: number) => number,
  x: number,
  y: number,
  options: FractalOptions
) {
  let frequency = 1;
  let amplitude = 1;
  let total = 0;
  let amplitudeSum = 0;

  for (let octave = 0; octave < options.octaves; octave += 1) {
    total += sampler(x * frequency, y * frequency) * amplitude;
    amplitudeSum += amplitude;
    amplitude *= options.persistence;
    frequency *= options.lacunarity;
  }

  return amplitudeSum === 0 ? 0 : total / amplitudeSum;
}

export function ridgedNoise(
  sampler: (x: number, y: number) => number,
  x: number,
  y: number,
  options: FractalOptions
) {
  let frequency = 1;
  let amplitude = 0.62;
  let total = 0;
  let amplitudeSum = 0;
  let previous = 1;

  for (let octave = 0; octave < options.octaves; octave += 1) {
    const signal = 1 - Math.abs(sampler(x * frequency, y * frequency));
    const shaped = signal * signal * previous;
    total += shaped * amplitude;
    amplitudeSum += amplitude;
    previous = Math.max(0.15, Math.min(1, shaped * 1.55));
    amplitude *= options.persistence;
    frequency *= options.lacunarity;
  }

  return amplitudeSum === 0 ? 0 : total / amplitudeSum;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
