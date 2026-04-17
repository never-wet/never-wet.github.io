import { useGame } from "../../hooks/useGame";

export function ToastViewport() {
  const { toasts, dismissToast } = useGame();

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast ${toast.tone ? `toast--${toast.tone}` : ""}`}
          onClick={() => dismissToast(toast.id)}
        >
          <strong>{toast.title}</strong>
          <span>{toast.body}</span>
        </button>
      ))}
    </div>
  );
}
