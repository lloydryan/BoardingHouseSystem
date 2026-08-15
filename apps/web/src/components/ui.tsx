import { ReactNode } from "react";
import { motion } from "framer-motion";

export function Page({ title, eyebrow, actions, children }: { title: string; eyebrow?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="page-head">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        <div className="actions">{actions}</div>
      </div>
      {children}
    </motion.section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <motion.article className="stat-card" whileHover={{ y: -2 }} transition={{ duration: 0.16 }}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </motion.article>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">No records yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}
