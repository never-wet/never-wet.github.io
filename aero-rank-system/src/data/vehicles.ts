export type VehicleId = "porsche" | "ferrari" | "lotus" | "bmw";

export type FlowProfile = {
  split: number;
  attachment: number;
  roofLift: number;
  sideChannel: number;
  wake: number;
  turbulence: number;
  wakeSpread: number;
  speed: number;
  density: number;
};

export type VehicleMetric = {
  label: string;
  value: string;
  strength: number;
};

export type AnalysisLabel = {
  id: string;
  label: string;
  value: string;
  position: [number, number, number];
};

export type VehicleProfile = {
  id: VehicleId;
  rank: string;
  name: string;
  shortName: string;
  classCode: string;
  identity: string;
  tagline: string;
  accent: string;
  accent2: string;
  bodyTint: string;
  modelPath: string;
  modelScale: [number, number, number];
  modelYaw?: number;
  length: number;
  width: number;
  height: number;
  score: number;
  flowStatus: string;
  pressureStatus: string;
  wakeStatus: string;
  metrics: VehicleMetric[];
  aero: VehicleMetric[];
  flow: FlowProfile;
  labels: AnalysisLabel[];
};

export const vehicles: VehicleProfile[] = [
  {
    id: "porsche",
    rank: "01",
    name: "Porsche 911",
    shortName: "911",
    classCode: "PRECISION BALANCE",
    identity: "Balance under pressure.",
    tagline: "Rear mass. Clean attachment. Composed exit wake.",
    accent: "#8fe8ff",
    accent2: "#d8fbff",
    bodyTint: "#cdd7d5",
    modelPath: "./models/porsche_911_gt3.glb",
    modelScale: [1.02, 0.9, 0.96],
    length: 4.8,
    width: 1.9,
    height: 1.24,
    score: 94,
    flowStatus: "ATTACHED",
    pressureStatus: "LOW DRIFT",
    wakeStatus: "TIGHT",
    metrics: [
      { label: "Power", value: "502 HP", strength: 78 },
      { label: "0-100", value: "3.4 S", strength: 82 },
      { label: "Top", value: "318 KM/H", strength: 76 },
      { label: "Stability", value: "94%", strength: 94 }
    ],
    aero: [
      { label: "Flow", value: "92%", strength: 92 },
      { label: "Drag", value: "0.34 CD", strength: 72 },
      { label: "Roof", value: "LOCKED", strength: 90 },
      { label: "Wake", value: "NARROW", strength: 86 }
    ],
    flow: {
      split: 0.72,
      attachment: 1.08,
      roofLift: 0.56,
      sideChannel: 0.48,
      wake: 0.32,
      turbulence: 0.06,
      wakeSpread: 0.48,
      speed: 0.78,
      density: 0.82
    },
    labels: [
      { id: "split", label: "Nose Split", value: "Smooth", position: [-2.54, 0.38, 0.68] },
      { id: "roof", label: "Roof Attach", value: "Stable", position: [-0.1, 1.38, -0.12] },
      { id: "wake", label: "Wake Exit", value: "Tight", position: [2.6, 0.72, 0.82] }
    ]
  },
  {
    id: "ferrari",
    rank: "02",
    name: "Ferrari SF90",
    shortName: "SF90",
    classCode: "VELOCITY AGGRESSION",
    identity: "Velocity shaped by aggression.",
    tagline: "High-speed channels divide hard and exit fast.",
    accent: "#ff315b",
    accent2: "#ff3dce",
    bodyTint: "#c61f32",
    modelPath: "./models/2021_ferrari_sf90_spider.glb",
    modelScale: [1.05, 0.94, 1.02],
    length: 4.95,
    width: 2.02,
    height: 1.12,
    score: 97,
    flowStatus: "SPLIT",
    pressureStatus: "HIGH SPEED",
    wakeStatus: "HOT",
    metrics: [
      { label: "Power", value: "986 HP", strength: 98 },
      { label: "0-100", value: "2.5 S", strength: 99 },
      { label: "Top", value: "340 KM/H", strength: 96 },
      { label: "Stability", value: "91%", strength: 91 }
    ],
    aero: [
      { label: "Flow", value: "95%", strength: 95 },
      { label: "Drag", value: "0.31 CD", strength: 88 },
      { label: "Roof", value: "FAST", strength: 94 },
      { label: "Wake", value: "ACTIVE", strength: 80 }
    ],
    flow: {
      split: 1.18,
      attachment: 0.92,
      roofLift: 0.92,
      sideChannel: 0.96,
      wake: 0.52,
      turbulence: 0.14,
      wakeSpread: 0.68,
      speed: 1,
      density: 1
    },
    labels: [
      { id: "split", label: "Front Channel", value: "Sharp", position: [-2.64, 0.34, 0.76] },
      { id: "side", label: "Side Intake", value: "Fast", position: [-0.48, 0.68, 1.18] },
      { id: "wake", label: "Rear Heat", value: "Active", position: [2.68, 0.64, -0.82] }
    ]
  },
  {
    id: "lotus",
    rank: "03",
    name: "Lotus Emira",
    shortName: "Emira",
    classCode: "LIGHT CONTROL",
    identity: "Lightweight control, refined airflow.",
    tagline: "Compact mass lets clean flow stay close to the shell.",
    accent: "#42ffb1",
    accent2: "#18d8ff",
    bodyTint: "#1d806a",
    modelPath: "./models/lotus_emira_2022__www.vecarz.com.glb",
    modelScale: [0.97, 0.84, 0.96],
    length: 4.55,
    width: 1.92,
    height: 1.18,
    score: 91,
    flowStatus: "CLEAN",
    pressureStatus: "BALANCED",
    wakeStatus: "CONTROLLED",
    metrics: [
      { label: "Power", value: "400 HP", strength: 70 },
      { label: "0-100", value: "4.3 S", strength: 73 },
      { label: "Top", value: "290 KM/H", strength: 68 },
      { label: "Stability", value: "92%", strength: 92 }
    ],
    aero: [
      { label: "Flow", value: "90%", strength: 90 },
      { label: "Drag", value: "0.33 CD", strength: 78 },
      { label: "Roof", value: "EVEN", strength: 86 },
      { label: "Wake", value: "CLEAN", strength: 84 }
    ],
    flow: {
      split: 0.88,
      attachment: 1,
      roofLift: 0.72,
      sideChannel: 0.66,
      wake: 0.42,
      turbulence: 0.08,
      wakeSpread: 0.56,
      speed: 0.86,
      density: 0.9
    },
    labels: [
      { id: "split", label: "Nose Read", value: "Even", position: [-2.46, 0.36, 0.72] },
      { id: "side", label: "Shoulder Flow", value: "Clean", position: [-0.18, 0.78, 1.1] },
      { id: "wake", label: "Diffuser", value: "Calm", position: [2.34, 0.54, 0.82] }
    ]
  },
  {
    id: "bmw",
    rank: "04",
    name: "BMW M3",
    shortName: "M3",
    classCode: "POWER STABILITY",
    identity: "Power stabilized through force.",
    tagline: "Wide sedan pressure creates a heavier wake signature.",
    accent: "#4da3ff",
    accent2: "#f7fbff",
    bodyTint: "#53677f",
    modelPath: "./models/2021_bmw_m3_competition_g80.glb",
    modelScale: [0.98, 0.97, 0.96],
    modelYaw: Math.PI,
    length: 4.62,
    width: 1.86,
    height: 1.34,
    score: 88,
    flowStatus: "FORCED",
    pressureStatus: "DENSE",
    wakeStatus: "WIDE",
    metrics: [
      { label: "Power", value: "503 HP", strength: 80 },
      { label: "0-100", value: "3.8 S", strength: 78 },
      { label: "Top", value: "290 KM/H", strength: 70 },
      { label: "Stability", value: "89%", strength: 89 }
    ],
    aero: [
      { label: "Flow", value: "84%", strength: 84 },
      { label: "Drag", value: "0.36 CD", strength: 64 },
      { label: "Roof", value: "HEAVY", strength: 74 },
      { label: "Wake", value: "WIDE", strength: 62 }
    ],
    flow: {
      split: 0.82,
      attachment: 0.58,
      roofLift: 0.46,
      sideChannel: 0.42,
      wake: 0.88,
      turbulence: 0.26,
      wakeSpread: 1.04,
      speed: 0.72,
      density: 0.94
    },
    labels: [
      { id: "split", label: "Front Load", value: "Dense", position: [-2.44, 0.48, 0.72] },
      { id: "roof", label: "Cabin Flow", value: "Heavy", position: [0.12, 1.52, -0.18] },
      { id: "wake", label: "Wake Spread", value: "Wide", position: [2.42, 0.76, 1.0] }
    ]
  }
];

export const vehicleById = Object.fromEntries(
  vehicles.map((vehicle) => [vehicle.id, vehicle])
) as Record<VehicleId, VehicleProfile>;
