import type { EntityProfile } from "@/data/entities";

export function hexToRgbTriplet(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `${red} ${green} ${blue}`;
}

export function getEntityTheme(entity: EntityProfile) {
  return {
    "--identity-color": entity.color,
    "--identity-color-soft": entity.colorSoft,
    "--identity-color-rgb": hexToRgbTriplet(entity.color),
    "--identity-secondary": entity.secondaryColor,
    "--identity-secondary-rgb": hexToRgbTriplet(entity.secondaryColor)
  };
}
