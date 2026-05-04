import { useEffect, useState } from "react";
import { TOAST_EVENT } from "./toast";

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (event) => {
      const nextToast = event.detail;
      setToasts((prev) => [...prev, nextToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== nextToast.id));
      }, 3000);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-64 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
