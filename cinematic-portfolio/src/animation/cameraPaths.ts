import { CatmullRomCurve3, Vector3 } from "three";
import { projectIndex } from "@/memory/projectIndex";
import type { CameraAnchorDefinition, ProjectId } from "@/memory/types";

export const journeyCameraAnchors: CameraAnchorDefinition[] = [
  {
    id: "intro-start",
    position: [0, 2.05, 20.8],
    target: [0, 1.3, 10.8],
    fov: 42,
  },
  {
    id: "threshold-approach",
    position: [4.1, 2.3, 13.2],
    target: [1, 1.25, 5.4],
    fov: 43,
  },
  {
    id: "lantern-orbit",
    position: [-8.15, 2.95, 6],
    target: [-4.7, 1.4, 0.2],
    fov: 44,
  },
  {
    id: "midnight-drift",
    position: [6.95, 2.2, -2.35],
    target: [4.1, 1.3, -7.35],
    fov: 44,
  },
  {
    id: "reel-ascend",
    position: [3.1, 4.05, -7.2],
    target: [0.2, 1.8, -17.4],
    fov: 56,
  },
  {
    id: "outro-fade",
    position: [0, 3.6, -22.4],
    target: [0, 1.85, -28.6],
    fov: 42,
  },
];

const anchorLookup = Object.fromEntries(journeyCameraAnchors.map((anchor) => [anchor.id, anchor]));

const journeyPositionCurve = new CatmullRomCurve3(
  journeyCameraAnchors.map(
    (anchor) => new Vector3(anchor.position[0], anchor.position[1], anchor.position[2]),
  ),
  false,
  "catmullrom",
  0.08,
);

const journeyTargetCurve = new CatmullRomCurve3(
  journeyCameraAnchors.map(
    (anchor) => new Vector3(anchor.target[0], anchor.target[1], anchor.target[2]),
  ),
  false,
  "catmullrom",
  0.08,
);

const projectCameraLookup = Object.fromEntries(
  projectIndex.map((project) => [project.id, project.detailCamera]),
);

export function getJourneyCameraAnchor(anchorId: string) {
  return anchorLookup[anchorId];
}

export function sampleJourneyCamera(progress: number) {
  const position = journeyPositionCurve.getPointAt(progress);
  const target = journeyTargetCurve.getPointAt(progress);
  return { position, target };
}

export function getProjectCamera(projectId: ProjectId) {
  return projectCameraLookup[projectId];
}
