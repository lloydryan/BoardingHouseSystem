const templates = ["modern-apartment", "contemporary-condo", "compact-boarding-house", "minimalist-directory"];

export function BuildingTemplateSelector({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  return (
    <select aria-label="Building template" value={value ?? "modern-apartment"} onChange={(event) => onChange?.(event.target.value)}>
      {templates.map((template) => (
        <option key={template} value={template}>{template.replaceAll("-", " ")}</option>
      ))}
    </select>
  );
}
