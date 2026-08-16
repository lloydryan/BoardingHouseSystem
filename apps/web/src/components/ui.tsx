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

export function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <motion.article className={`stat-card ${icon ? "has-icon" : ""}`} whileHover={{ y: -2 }} transition={{ duration: 0.16 }}>
      {icon ? <div className="stat-icon">{icon}</div> : null}
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

export function TableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="table-wrap skeleton-table-wrap" aria-label="Loading table">
      <table>
        <thead>
          <tr>{Array.from({ length: columns }).map((_, index) => <th key={index}><SkeletonBlock className="heading-line" /></th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, cellIndex) => (
                <td key={cellIndex}><SkeletonBlock className={cellIndex % 3 === 0 ? "short" : "row-line"} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span className={`skeleton-block ${className}`} aria-hidden="true" />;
}

export function PageSkeleton({ title = "Loading", variant = "dashboard" }: { title?: string; variant?: "dashboard" | "table" | "detail" }) {
  return (
    <Page title={title}>
      <div className="skeleton-stack" aria-label="Loading content">
        <div className="skeleton-stat-grid">
          {Array.from({ length: variant === "detail" ? 6 : 4 }).map((_, index) => (
            <article className="skeleton-stat" key={index}>
              <SkeletonBlock className="short" />
              <SkeletonBlock className="medium" />
              <SkeletonBlock className="tiny" />
            </article>
          ))}
        </div>
        {variant === "table" ? (
          <TableSkeleton />
        ) : (
          <div className="skeleton-panel-grid">
            <SkeletonBlock className="panel-title" />
            <SkeletonBlock className="panel-line" />
            <SkeletonBlock className="panel-line wide-line" />
            <SkeletonBlock className="panel-line" />
          </div>
        )}
      </div>
    </Page>
  );
}
