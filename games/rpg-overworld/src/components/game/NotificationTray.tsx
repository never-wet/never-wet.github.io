import { useEffect, useRef } from "react";
import { useGame } from "../../hooks/useGame";
import { audioManager } from "../../lib/audio/audioManager";

export const NotificationTray = () => {
  const { state, dispatch } = useGame();
  const lastNotificationId = useRef<string | null>(null);

  useEffect(() => {
    const latest = state.notifications[0];
    if (!latest || latest.id === lastNotificationId.current) {
      return;
    }

    lastNotificationId.current = latest.id;
    if (latest.tone === "reward") {
      audioManager.playSfx(/quest/i.test(latest.message) ? "quest-complete" : "pickup");
      return;
    }
    if (latest.tone === "quest") {
      audioManager.playSfx("quest-complete");
      return;
    }
    if (latest.tone === "danger") {
      audioManager.playSfx("boss-warning");
    }
  }, [state.notifications]);

  return (
    <div className="notification-tray" aria-live="polite">
      {state.notifications.map((notification) => (
        <button
          key={notification.id}
          className={`notification notification-${notification.tone}`}
          onClick={() => dispatch({ type: "DISMISS_NOTIFICATION", id: notification.id })}
          type="button"
        >
          <span>{notification.message}</span>
        </button>
      ))}
    </div>
  );
};
