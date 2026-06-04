/**
 * ExperienceDescription
 * Description and highlights for experience role
 */
export default function ExperienceDescription({ description, highlights = [] }) {
  return (
    <div className="font-body-md text-on-surface max-w-4xl mb-6">
      {description && <p>{description}</p>}
      {highlights.length > 0 && (
        <ul className="space-y-3 list-disc pl-5">
          {highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
