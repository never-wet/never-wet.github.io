import type { OverworldMessage } from "../memory/types";

interface WorldMessageOverlayProps {
  message: OverworldMessage;
  onClose: () => void;
}

export const WorldMessageOverlay = ({ message, onClose }: WorldMessageOverlayProps) => (
  <div className="scene-overlay message-overlay">
    <div className="message-panel">
      <p className="hud-label">Field Event</p>
      <h2>{message.title}</h2>
      {message.body.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <button className="primary-button" onClick={onClose} type="button">
        Continue
      </button>
    </div>
  </div>
);
