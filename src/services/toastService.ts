export type ToastTone = "success" | "error" | "info";

export function toast(message: string, tone: ToastTone = "info") {
  window.dispatchEvent(new CustomEvent("bh:toast", { detail: { message, tone } }));
}
