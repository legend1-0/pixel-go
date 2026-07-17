// apps/web/src/components/shared/Toast.jsx
import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import "./Toast.css";

function Toast({ message, variant = "info", onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className={`toast${variant === "error" ? " toast--error" : ""}`} role="status">
      <span className="toast__icon">
        {variant === "error" ? (
          <AlertTriangle size={18} strokeWidth={2.5} />
        ) : (
          <CheckCircle2 size={18} strokeWidth={2.5} />
        )}
      </span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default Toast;