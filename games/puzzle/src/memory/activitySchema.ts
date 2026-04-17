import type { ActivityEntry, ActivityType } from "./types";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `activity-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function createActivity(
  type: ActivityType,
  label: string,
  entityId: string,
  detail?: string,
): ActivityEntry {
  return {
    id: createId(),
    type,
    label,
    entityId,
    detail,
    timestamp: new Date().toISOString(),
  };
}
