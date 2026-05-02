"use client";

import { CSSProperties, useEffect } from "react";
import {
  CHARACTER_OPTIONS,
  CHARACTER_STORAGE_KEY,
  CharacterCustomization,
  DEFAULT_CHARACTER
} from "../lib/worldData";
import { useWorldStore } from "../store/useWorldStore";

export function CharacterCustomizer() {
  const character = useWorldStore((state) => state.character);
  const setCharacter = useWorldStore((state) => state.setCharacter);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHARACTER_STORAGE_KEY) || "{}");
      setCharacter({ ...DEFAULT_CHARACTER, ...saved });
    } catch {
      setCharacter(DEFAULT_CHARACTER);
    }
  }, [setCharacter]);

  useEffect(() => {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character));
  }, [character]);

  return (
    <section className="floating-panel customizer-panel is-open" aria-label="Character customization">
      <header>
        <div>
          <small>Avatar</small>
          <strong>Character Customization</strong>
        </div>
      </header>
      <div className="panel-body">
        <Swatches label="Outfit color" values={CHARACTER_OPTIONS.outfitColors} active={character.outfitColor} onPick={(outfitColor) => setCharacter({ outfitColor })} />
        <Swatches label="Hair color" values={CHARACTER_OPTIONS.hairColors} active={character.hairColor} onPick={(hairColor) => setCharacter({ hairColor })} />
        <Choices label="Hair style" values={CHARACTER_OPTIONS.hairStyles} active={character.hairStyle} onPick={(hairStyle) => setCharacter({ hairStyle } as Partial<CharacterCustomization>)} />
        <Choices label="Accessory" values={CHARACTER_OPTIONS.accessories} active={character.accessory} onPick={(accessory) => setCharacter({ accessory } as Partial<CharacterCustomization>)} />
        <Choices label="Avatar type" values={CHARACTER_OPTIONS.avatarTypes} active={character.avatarType} onPick={(avatarType) => setCharacter({ avatarType } as Partial<CharacterCustomization>)} />
      </div>
    </section>
  );
}

function Swatches({
  label,
  values,
  active,
  onPick
}: {
  label: string;
  values: readonly string[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="control-group">
      <span>{label}</span>
      <div className="swatch-row">
        {values.map((value) => (
          <button
            key={value}
            className={`swatch ${active === value ? "is-active" : ""}`}
            style={{ "--swatch": value } as CSSProperties}
            type="button"
            aria-label={`${label} ${value}`}
            onClick={() => onPick(value)}
          />
        ))}
      </div>
    </div>
  );
}

function Choices<T extends string>({
  label,
  values,
  active,
  onPick
}: {
  label: string;
  values: readonly T[];
  active: string;
  onPick: (value: T) => void;
}) {
  return (
    <div className="control-group">
      <span>{label}</span>
      <div className="choice-row">
        {values.map((value) => (
          <button
            key={value}
            className={`choice-pill ${active === value ? "is-active" : ""}`}
            type="button"
            onClick={() => onPick(value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
