export type CoreGeometry = "octa" | "dodeca" | "torus" | "tetra" | "cube";

export type EntityMetric = {
  label: string;
  value: string;
  strength: number;
};

export type EntityProfile = {
  id: string;
  name: string;
  systemId: string;
  classification: string;
  rank: number;
  trustScore: number;
  valueScore: number;
  volatility: number;
  color: string;
  colorSoft: string;
  secondaryColor: string;
  core: CoreGeometry;
  mass: string;
  signal: string;
  profile: string[];
  statusLabels: string[];
  metrics: EntityMetric[];
  comparison: EntityMetric[];
};

export const entities: EntityProfile[] = [
  {
    id: "axis",
    name: "AXIS-9",
    systemId: "ID-014 / AX9",
    classification: "CONTROL VECTOR",
    rank: 1,
    trustScore: 96,
    valueScore: 91,
    volatility: 8,
    color: "#5ff4ff",
    colorSoft: "#17353a",
    secondaryColor: "#d7fbff",
    core: "octa",
    mass: "LOW",
    signal: "STABLE",
    profile: ["ANCHOR RESPONSE", "HIGH SIGNAL COHERENCE", "LOW MOTIVE DRIFT"],
    statusLabels: ["CONFIRMED", "RANK LOCKED", "LOW RISK"],
    metrics: [
      { label: "COHERENCE", value: "96%", strength: 96 },
      { label: "TRUST", value: "96", strength: 96 },
      { label: "VALUE", value: "91", strength: 91 },
      { label: "DRIFT", value: "08%", strength: 8 }
    ],
    comparison: [
      { label: "CONTROL", value: "+12", strength: 94 },
      { label: "NOISE", value: "-31", strength: 18 },
      { label: "RECOVERY", value: "0.8S", strength: 88 },
      { label: "LOAD", value: "LOW", strength: 24 }
    ]
  },
  {
    id: "mara",
    name: "MARA V",
    systemId: "ID-026 / MRV",
    classification: "SOCIAL ENGINE",
    rank: 2,
    trustScore: 88,
    valueScore: 97,
    volatility: 19,
    color: "#ff4d8d",
    colorSoft: "#431424",
    secondaryColor: "#ffc3d9",
    core: "torus",
    mass: "MED",
    signal: "LUMINOUS",
    profile: ["VALUE AMPLIFIER", "WIDE ATTENTION FIELD", "CONTROLLED CHARM BIAS"],
    statusLabels: ["ACTIVE", "VALUE HIGH", "WATCH DELTA"],
    metrics: [
      { label: "COHERENCE", value: "89%", strength: 89 },
      { label: "TRUST", value: "88", strength: 88 },
      { label: "VALUE", value: "97", strength: 97 },
      { label: "DRIFT", value: "19%", strength: 19 }
    ],
    comparison: [
      { label: "CONTROL", value: "+05", strength: 76 },
      { label: "NOISE", value: "-12", strength: 31 },
      { label: "RECOVERY", value: "1.4S", strength: 72 },
      { label: "LOAD", value: "MED", strength: 52 }
    ]
  },
  {
    id: "ion",
    name: "ION-33",
    systemId: "ID-033 / ION",
    classification: "FIELD CATALYST",
    rank: 3,
    trustScore: 79,
    valueScore: 86,
    volatility: 34,
    color: "#9bff64",
    colorSoft: "#223912",
    secondaryColor: "#e5ffd6",
    core: "tetra",
    mass: "LIGHT",
    signal: "REACTIVE",
    profile: ["FAST STATE CHANGES", "HIGH ADAPTIVE RANGE", "UNSTABLE PEAK OUTPUT"],
    statusLabels: ["UNFOLDED", "FAST SHIFT", "RISK MED"],
    metrics: [
      { label: "COHERENCE", value: "76%", strength: 76 },
      { label: "TRUST", value: "79", strength: 79 },
      { label: "VALUE", value: "86", strength: 86 },
      { label: "DRIFT", value: "34%", strength: 34 }
    ],
    comparison: [
      { label: "CONTROL", value: "-04", strength: 55 },
      { label: "NOISE", value: "+18", strength: 62 },
      { label: "RECOVERY", value: "0.6S", strength: 92 },
      { label: "LOAD", value: "LIGHT", strength: 18 }
    ]
  },
  {
    id: "obel",
    name: "OBEL",
    systemId: "ID-041 / OBL",
    classification: "ARCHIVE MASS",
    rank: 4,
    trustScore: 72,
    valueScore: 78,
    volatility: 16,
    color: "#f0c66a",
    colorSoft: "#3d3116",
    secondaryColor: "#fff0bf",
    core: "dodeca",
    mass: "HIGH",
    signal: "DENSE",
    profile: ["LEGACY WEIGHT", "SLOW BUT PERSISTENT", "HIGH MEMORY RETENTION"],
    statusLabels: ["INDEXED", "SLOW SHIFT", "VALUE HELD"],
    metrics: [
      { label: "COHERENCE", value: "82%", strength: 82 },
      { label: "TRUST", value: "72", strength: 72 },
      { label: "VALUE", value: "78", strength: 78 },
      { label: "DRIFT", value: "16%", strength: 16 }
    ],
    comparison: [
      { label: "CONTROL", value: "+02", strength: 66 },
      { label: "NOISE", value: "-20", strength: 24 },
      { label: "RECOVERY", value: "3.2S", strength: 42 },
      { label: "LOAD", value: "HIGH", strength: 86 }
    ]
  },
  {
    id: "null",
    name: "NULL-7",
    systemId: "ID-052 / N07",
    classification: "UNVERIFIED SIGNAL",
    rank: 5,
    trustScore: 61,
    valueScore: 69,
    volatility: 52,
    color: "#a78bff",
    colorSoft: "#241a44",
    secondaryColor: "#ded5ff",
    core: "cube",
    mass: "VARIABLE",
    signal: "FRACTURED",
    profile: ["INCOMPLETE IDENTITY", "HIGH MASKING ACTIVITY", "OUTPUT REQUIRES REVIEW"],
    statusLabels: ["UNLOCKED", "RISK HIGH", "MASK PRESENT"],
    metrics: [
      { label: "COHERENCE", value: "58%", strength: 58 },
      { label: "TRUST", value: "61", strength: 61 },
      { label: "VALUE", value: "69", strength: 69 },
      { label: "DRIFT", value: "52%", strength: 52 }
    ],
    comparison: [
      { label: "CONTROL", value: "-17", strength: 33 },
      { label: "NOISE", value: "+41", strength: 84 },
      { label: "RECOVERY", value: "4.9S", strength: 28 },
      { label: "LOAD", value: "VAR", strength: 68 }
    ]
  }
];

export const entityById = Object.fromEntries(
  entities.map((entity) => [entity.id, entity])
) as Record<string, EntityProfile>;
