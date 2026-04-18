import { useGame } from "../../hooks/useGame";

export const NotificationTray = () => {
  const { state, dispatch } = useGame();

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
