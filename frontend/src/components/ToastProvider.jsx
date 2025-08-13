import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastCtx = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idRef.current;
      const t = {
        id,
        type: toast.type || "info",
        message: toast.message || "",
        duration: toast.duration ?? 3000,
      };
      setToasts((list) => [...list, t]);
      if (t.duration > 0) {
        setTimeout(() => remove(id), t.duration);
      }
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      show: (message, opts = {}) => push({ message, ...opts }),
      success: (message, opts = {}) =>
        push({ message, type: "success", ...opts }),
      error: (message, opts = {}) => push({ message, type: "error", ...opts }),
      info: (message, opts = {}) => push({ message, type: "info", ...opts }),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            onClick={() => remove(t.id)}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
