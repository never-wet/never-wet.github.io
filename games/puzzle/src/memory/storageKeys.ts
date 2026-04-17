export const STORAGE_NAMESPACE = "puzzle-escape-lab";
export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  root: `${STORAGE_NAMESPACE}:state`,
  legacyRoots: ["puzzleEscapeLab:state", "escapeLab:state"],
} as const;
