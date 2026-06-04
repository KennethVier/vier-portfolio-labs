/**
 * SectionHeader
 * Reusable section header with label and headline (used across all sections)
 */
export default function SectionHeader({ label, title, subtitle = null, centered = false }) {
  return (
    <div className={centered ? "text-center mb-16" : "mb-16"}>
      <span className="font-label-caps text-label-caps text-tertiary tracking-widest mb-4 block">
        {label}
      </span>
      <h2 className="font-headline-section text-headline-section text-on-background">
        {title}
      </h2>
      {subtitle && (
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
