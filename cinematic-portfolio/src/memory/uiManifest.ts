import type { UIManifest } from "@/memory/types";

export const uiManifest: UIManifest = {
  boot: {
    eyebrow: "3D personal website",
    title: "Project Atlas",
    statusLabel: "Calibrating atmosphere",
    hint: "Audio blooms after your first interaction. Scroll to move the camera.",
  },
  instructions: {
    scroll: "Scroll to travel between scenes",
    hover: "Hover structures to wake them",
    click: "Click a project chamber to enter it",
    back: "Press Esc or use Return to atlas",
  },
  navigation: {
    atlasLabel: "Never Wet",
    sceneLabel: "Scene",
    projectsLabel: "Project chambers",
  },
  audio: {
    title: "Sound field",
    helper: "Ambient drone and subtle interaction cues with persistent local settings.",
  },
  closing: {
    eyebrow: "Keep exploring",
    title: "The archive stays open after the final frame.",
    body: "Use the chamber links, jump back into the games archive, or return to the scroll journey whenever you want another pass.",
  },
};
