export type StageId =
  | "gate"
  | "driveway"
  | "exterior"
  | "front-door"
  | "interior"
  | "feature-rooms"
  | "final";

export type PropertyStage = {
  id: StageId;
  number: string;
  progress: number;
  eyebrow: string;
  title: string;
  copy: string;
  align: "left" | "right" | "center";
};

export type HotspotData = {
  id: string;
  stageId: StageId;
  label: string;
  title: string;
  body: string;
  position: [number, number, number];
};

export const propertyReference = {
  styleName: "Modern limestone, glass, and walnut private villa",
  palette: ["limestone", "board-formed concrete", "black steel", "warm walnut", "reflective glass"],
  mood:
    "A cinematic hilltop residence with a long gate approach, low horizontal architecture, warm gallery interiors, and a pool courtyard.",
};

export const propertyStages: PropertyStage[] = [
  {
    id: "gate",
    number: "01",
    progress: 0,
    eyebrow: "Arrival",
    title: "Private Residence",
    copy: "A gated modern estate set behind black steel, limestone piers, and a quiet line of clipped landscape.",
    align: "left",
  },
  {
    id: "driveway",
    number: "02",
    progress: 0.15,
    eyebrow: "Driveway",
    title: "A quiet arrival, designed for presence.",
    copy: "The driveway stretches through low planting, water-soft reflections, and concealed path lighting.",
    align: "right",
  },
  {
    id: "exterior",
    number: "03",
    progress: 0.32,
    eyebrow: "Exterior Reveal",
    title: "Architectural clarity. Natural materiality.",
    copy: "Limestone, concrete, walnut, and glass are composed around deep overhangs and broad windows.",
    align: "left",
  },
  {
    id: "front-door",
    number: "04",
    progress: 0.48,
    eyebrow: "Threshold",
    title: "The entrance holds the whole axis.",
    copy: "A warm walnut portal marks the transition from private landscape to a calm interior volume.",
    align: "right",
  },
  {
    id: "interior",
    number: "05",
    progress: 0.64,
    eyebrow: "Interior",
    title: "Space, light, and calm in perfect balance.",
    copy: "A gallery-scale living room opens to long sightlines, soft furniture, and concealed architectural lighting.",
    align: "left",
  },
  {
    id: "feature-rooms",
    number: "06",
    progress: 0.8,
    eyebrow: "Private Rooms",
    title: "Kitchen, lounge, pool, bedroom, office.",
    copy: "Feature spaces unfold around the central volume with water, stone, and warm evening reflections.",
    align: "right",
  },
  {
    id: "final",
    number: "07",
    progress: 0.94,
    eyebrow: "Private Viewing",
    title: "Book a private viewing.",
    copy: "Explore the residence, review the gallery, or reserve a guided walkthrough with the listing team.",
    align: "center",
  },
];

export const propertyHotspots: HotspotData[] = [
  {
    id: "gate-steel",
    stageId: "gate",
    label: "Gate",
    title: "Blackened Steel Gate",
    body: "Tall slatted panels slide away from a limestone portal to frame the arrival sequence.",
    position: [-2.6, 2.35, 8.6],
  },
  {
    id: "glass-facade",
    stageId: "exterior",
    label: "Glass",
    title: "Reflective Facade",
    body: "Floor-to-ceiling glazing pulls the landscape into the living spaces while preserving a crisp exterior line.",
    position: [3.8, 3.1, -13.15],
  },
  {
    id: "living-light",
    stageId: "interior",
    label: "Lighting",
    title: "Warm Interior Glow",
    body: "Concealed cove light and low pendants keep the room luminous without exposing the source.",
    position: [-3.1, 3.4, -25.8],
  },
  {
    id: "pool-courtyard",
    stageId: "feature-rooms",
    label: "Pool",
    title: "Courtyard Pool",
    body: "A narrow reflecting pool sits beside the lounge, catching the warm interior and evening sky.",
    position: [8.3, 0.55, -34.4],
  },
];

export function getActiveStageIndex(progress: number) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  let activeIndex = 0;

  propertyStages.forEach((stage, index) => {
    const next = propertyStages[index + 1];
    const midpoint = next ? (stage.progress + next.progress) / 2 : 1;

    if (clamped >= midpoint) {
      activeIndex = index + 1;
    }
  });

  return Math.min(activeIndex, propertyStages.length - 1);
}
