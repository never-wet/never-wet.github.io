import { useEffect, useState } from "react";

function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(total % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function PuzzleTimer({
  enabled,
  startedAt,
  onElapsedChange,
}: {
  enabled: boolean;
  startedAt?: string;
  onElapsedChange?: (elapsed: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!enabled || !startedAt) {
      setElapsed(0);
      return;
    }

    const update = () => {
      const next = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      setElapsed(next);
      onElapsedChange?.(next);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, startedAt, onElapsedChange]);

  return (
    <div className="stat-pill">
      <span>Timer</span>
      <strong>{enabled && startedAt ? formatSeconds(elapsed) : "Paused"}</strong>
    </div>
  );
}
