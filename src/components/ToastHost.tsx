import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ToastTone } from "../services/toastService";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismissToast = (id: number) => setItems((current) => current.filter((toast) => toast.id !== id));

  useEffect(() => {
    function addToast(event: Event) {
      const detail = (event as CustomEvent<{ message: string; tone?: ToastTone }>).detail;
      const item = { id: Date.now(), message: detail.message, tone: detail.tone ?? "info" };
      setItems((current) => [...current, item].slice(-4));
      window.setTimeout(() => dismissToast(item.id), 3600);
    }

    window.addEventListener("bh:toast", addToast);
    return () => window.removeEventListener("bh:toast", addToast);
  }, []);

  const toneMeta = {
    success: { title: "Success", Icon: CheckCircle2 },
    error: { title: "Needs attention", Icon: AlertCircle },
    info: { title: "Update", Icon: Info }
  } satisfies Record<ToastTone, { title: string; Icon: typeof Info }>;

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {items.map((item) => {
        const { Icon, title } = toneMeta[item.tone];
        return (
          <div className={`toast ${item.tone}`} key={item.id}>
            <div className="toast-icon">
              <Icon size={18} />
            </div>
            <div>
              <strong>{title}</strong>
              <span>{item.message}</span>
            </div>
            <button className="toast-close" type="button" aria-label="Close notification" onClick={() => dismissToast(item.id)}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

