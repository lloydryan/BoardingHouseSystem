import { useEffect, useState } from "react";
import type { ToastTone } from "../lib/toast";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function addToast(event: Event) {
      const detail = (event as CustomEvent<{ message: string; tone?: ToastTone }>).detail;
      const item = { id: Date.now(), message: detail.message, tone: detail.tone ?? "info" };
      setItems((current) => [...current, item].slice(-4));
      window.setTimeout(() => setItems((current) => current.filter((toast) => toast.id !== item.id)), 3600);
    }

    window.addEventListener("bh:toast", addToast);
    return () => window.removeEventListener("bh:toast", addToast);
  }, []);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div className={`toast ${item.tone}`} key={item.id}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
