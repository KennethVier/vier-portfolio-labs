/**
 * TechTag
 * Reusable tech/skill badge used in Hero, Projects, and other sections
 */
export default function TechTag({ label, className = "" }) {
  return (
    <span className={`font-label-code text-label-code px-3 py-1 rounded bg-surface-container-highest border border-outline-variant/20 text-tertiary tech-tag ${className}`}>
      {label}
    </span>
  );
}
