import { useState } from "react";
import { useSite } from "@/app/SiteProvider";
import { useAudio } from "@/audio/AudioProvider";
import { uiManifest } from "@/memory/uiManifest";

export function AudioDock() {
  const { audioSettings, updateAudioSettings } = useSite();
  const { audioReady, requestAudioStart } = useAudio();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`audio-dock${expanded ? " is-expanded" : ""}`}>
      <button
        type="button"
        className="audio-dock__toggle"
        onClick={() => {
          requestAudioStart();
          setExpanded((current) => !current);
        }}
      >
        <span>{uiManifest.audio.title}</span>
        <strong>{audioSettings.muted ? "Muted" : audioReady ? "Live" : "Standby"}</strong>
      </button>
      <div className="audio-dock__panel">
        <p className="audio-dock__helper">{uiManifest.audio.helper}</p>
        <div className="audio-dock__row">
          <span>Master</span>
          <input
            aria-label="Master volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioSettings.masterVolume}
            onChange={(event) => {
              requestAudioStart();
              updateAudioSettings({ masterVolume: Number(event.target.value) });
            }}
          />
        </div>
        <div className="audio-dock__row">
          <span>Ambient</span>
          <input
            aria-label="Ambient volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioSettings.ambientVolume}
            onChange={(event) => {
              requestAudioStart();
              updateAudioSettings({ ambientVolume: Number(event.target.value) });
            }}
          />
        </div>
        <div className="audio-dock__row">
          <span>SFX</span>
          <input
            aria-label="SFX volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioSettings.sfxVolume}
            onChange={(event) => {
              requestAudioStart();
              updateAudioSettings({ sfxVolume: Number(event.target.value) });
            }}
          />
        </div>
        <button
          type="button"
          className="audio-dock__mute"
          onClick={() => {
            requestAudioStart();
            updateAudioSettings({ muted: !audioSettings.muted });
          }}
        >
          {audioSettings.muted ? "Unmute field" : "Mute field"}
        </button>
      </div>
    </div>
  );
}
