/**
 * ExperienceDescription
 * Description and highlights for experience role
 */
export default function ExperienceDescription({ description, highlights = [] }) {
  return (
    <div className="mb-6 max-w-4xl font-body-md leading-7 text-on-surface">
      {description && <p className="text-on-surface-variant">{description}</p>}
      {highlights.length > 0 && (
        <ul className={`${description ? "mt-5" : ""} space-y-3 border-l border-outline-variant/40 pl-4 sm:pl-5`}>
          {highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
