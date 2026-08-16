import { Check, Palette, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, apiPatch } from "../../services/apiService";
import { Page, PageSkeleton } from "../../components/ui";
import { toast } from "../../services/toastService";

const themePresets = [
  {
    presetName: "Professional Blue",
    primaryColor: "#2563eb",
    secondaryColor: "#0f766e",
    accentColor: "#f59e0b",
    sidebarColor: "#0b1220",
    headerColor: "#ffffff",
    backgroundColor: "#f6f8fb",
    textColor: "#101828",
    darkPrimaryColor: "#60a5fa",
    darkSecondaryColor: "#2dd4bf",
    darkAccentColor: "#fbbf24",
    darkSidebarColor: "#020617",
    darkHeaderColor: "#111827",
    darkBackgroundColor: "#0f172a",
    darkTextColor: "#f8fafc"
  },
  {
    presetName: "Emerald Ledger",
    primaryColor: "#059669",
    secondaryColor: "#2563eb",
    accentColor: "#f59e0b",
    sidebarColor: "#06251f",
    headerColor: "#ffffff",
    backgroundColor: "#f4fbf8",
    textColor: "#10201b",
    darkPrimaryColor: "#34d399",
    darkSecondaryColor: "#60a5fa",
    darkAccentColor: "#fbbf24",
    darkSidebarColor: "#021d18",
    darkHeaderColor: "#09231e",
    darkBackgroundColor: "#071713",
    darkTextColor: "#ecfdf5"
  },
  {
    presetName: "Slate Gold",
    primaryColor: "#334155",
    secondaryColor: "#ca8a04",
    accentColor: "#2563eb",
    sidebarColor: "#0f172a",
    headerColor: "#ffffff",
    backgroundColor: "#f8fafc",
    textColor: "#111827",
    darkPrimaryColor: "#cbd5e1",
    darkSecondaryColor: "#facc15",
    darkAccentColor: "#60a5fa",
    darkSidebarColor: "#020617",
    darkHeaderColor: "#111827",
    darkBackgroundColor: "#0f172a",
    darkTextColor: "#f8fafc"
  },
  {
    presetName: "Warm Coral",
    primaryColor: "#e11d48",
    secondaryColor: "#0f766e",
    accentColor: "#f97316",
    sidebarColor: "#1f1720",
    headerColor: "#ffffff",
    backgroundColor: "#fff7f7",
    textColor: "#1f1720",
    darkPrimaryColor: "#fb7185",
    darkSecondaryColor: "#2dd4bf",
    darkAccentColor: "#fdba74",
    darkSidebarColor: "#1f0f17",
    darkHeaderColor: "#22121a",
    darkBackgroundColor: "#160c12",
    darkTextColor: "#fff1f2"
  },
  {
    presetName: "Indigo Night",
    primaryColor: "#4f46e5",
    secondaryColor: "#0891b2",
    accentColor: "#f59e0b",
    sidebarColor: "#11112a",
    headerColor: "#ffffff",
    backgroundColor: "#f7f7ff",
    textColor: "#111827",
    darkPrimaryColor: "#818cf8",
    darkSecondaryColor: "#22d3ee",
    darkAccentColor: "#fbbf24",
    darkSidebarColor: "#090923",
    darkHeaderColor: "#11112a",
    darkBackgroundColor: "#0b1028",
    darkTextColor: "#eef2ff"
  },
  {
    presetName: "Clean Neutral",
    primaryColor: "#111827",
    secondaryColor: "#64748b",
    accentColor: "#2563eb",
    sidebarColor: "#111827",
    headerColor: "#ffffff",
    backgroundColor: "#f8fafc",
    textColor: "#111827",
    darkPrimaryColor: "#e5e7eb",
    darkSecondaryColor: "#94a3b8",
    darkAccentColor: "#60a5fa",
    darkSidebarColor: "#020617",
    darkHeaderColor: "#111827",
    darkBackgroundColor: "#0f172a",
    darkTextColor: "#f8fafc"
  }
] as const;

type ThemePresetName = (typeof themePresets)[number]["presetName"];

export function ThemeBranding() {
  const [theme, setTheme] = useState<any>();
  const [selectedPreset, setSelectedPreset] = useState<ThemePresetName>(themePresets[0].presetName);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem("bh_color_mode") ?? "light");
  useEffect(() => { api<any>("/api/theme").then(setTheme); }, []);
  useEffect(() => {
    if (!theme) return;
    setSelectedPreset((theme.presetName ?? themePresets[0].presetName) as ThemePresetName);
  }, [theme]);
  const selectedTheme = useMemo(() => {
    return themePresets.find((preset) => preset.presetName === selectedPreset) ?? themePresets[0];
  }, [selectedPreset]);
  useEffect(() => {
    const syncMode = () => setMode(localStorage.getItem("bh_color_mode") ?? document.documentElement.dataset.mode ?? "light");
    window.addEventListener("storage", syncMode);
    window.addEventListener("bh:mode-change", syncMode);
    return () => {
      window.removeEventListener("storage", syncMode);
      window.removeEventListener("bh:mode-change", syncMode);
    };
  }, []);
  const previewTheme = {
    ...theme,
    ...selectedTheme,
    primaryColor: mode === "dark" ? selectedTheme.darkPrimaryColor : selectedTheme.primaryColor,
    secondaryColor: mode === "dark" ? selectedTheme.darkSecondaryColor : selectedTheme.secondaryColor,
    accentColor: mode === "dark" ? selectedTheme.darkAccentColor : selectedTheme.accentColor,
    sidebarColor: mode === "dark" ? selectedTheme.darkSidebarColor : selectedTheme.sidebarColor,
    headerColor: mode === "dark" ? selectedTheme.darkHeaderColor : selectedTheme.headerColor,
    backgroundColor: mode === "dark" ? selectedTheme.darkBackgroundColor : selectedTheme.backgroundColor,
    textColor: mode === "dark" ? selectedTheme.darkTextColor : selectedTheme.textColor
  };
  if (!theme) return <PageSkeleton title="Theme and Branding" variant="detail" />;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    apiPatch("/api/theme", { ...selectedTheme, ...formData, presetName: selectedTheme.presetName }).then((next) => {
      setTheme(next);
      window.dispatchEvent(new Event("bh:theme-change"));
      toast("Theme saved.", "success");
    }).catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Theme and Branding" eyebrow="Select a ready-made workspace style">
      <form className="grid two" onSubmit={save}>
        <div className="theme-config">
          <div className="theme-preset-grid">
            {themePresets.map((preset) => (
              <button
                className={`theme-preset ${preset.presetName === selectedPreset ? "selected" : ""}`}
                key={preset.presetName}
                type="button"
                onClick={() => setSelectedPreset(preset.presetName)}
              >
                <span className="preset-swatch-row">
                  {[
                    mode === "dark" ? preset.darkPrimaryColor : preset.primaryColor,
                    mode === "dark" ? preset.darkSecondaryColor : preset.secondaryColor,
                    mode === "dark" ? preset.darkAccentColor : preset.accentColor,
                    mode === "dark" ? preset.darkSidebarColor : preset.sidebarColor
                  ].map((color) => <i key={color} style={{ background: color }} />)}
                </span>
                <strong>{preset.presetName}</strong>
                {preset.presetName === selectedPreset ? <Check size={17} /> : <Palette size={17} />}
              </button>
            ))}
          </div>
          <div className="form-grid theme-copy-fields">
            <label>Business name<input name="businessName" defaultValue={theme.businessName} /></label>
            <label>Receipt header<input name="receiptHeader" defaultValue={theme.receiptHeader} /></label>
            <label>Billing header<input name="billingStatementHeader" defaultValue={theme.billingStatementHeader} /></label>
          </div>
          <button type="button" className="subtle-btn" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? "Hide advanced colors" : "Advanced colors"}</button>
          {showAdvanced ? (
            <div className="form-grid advanced-theme-fields">
              {["primaryColor", "secondaryColor", "accentColor", "sidebarColor", "headerColor", "backgroundColor", "textColor", "darkPrimaryColor", "darkSecondaryColor", "darkAccentColor", "darkSidebarColor", "darkHeaderColor", "darkBackgroundColor", "darkTextColor"].map((key) => <label key={key}>{key}<input name={key} type="color" defaultValue={(selectedTheme as any)[key] ?? theme[key]} /></label>)}
            </div>
          ) : null}
          <button className="primary-btn"><Save size={16} /> Save theme</button>
        </div>
        <article className="theme-preview theme-preview-modern" style={{ "--preview-primary": previewTheme.primaryColor, "--preview-secondary": previewTheme.secondaryColor, "--preview-accent": previewTheme.accentColor, "--preview-sidebar": previewTheme.sidebarColor, "--preview-bg": previewTheme.backgroundColor, "--preview-text": previewTheme.textColor } as any}>
          <aside>{theme.businessName}</aside>
          <section>
            <span>{selectedTheme.presetName}</span>
            <h3>Billing Statement</h3>
            <p>{theme.billingStatementHeader}</p>
            <div className="preview-mini-stats"><strong>12</strong><strong>8</strong><strong>4</strong></div>
            <button>Primary action</button>
          </section>
        </article>
      </form>
    </Page>
  );
}


