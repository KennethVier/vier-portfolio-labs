import TechTag from '../../ui/TechTag';

/**
 * HeroTechTags
 * High-signal stack tags that match the portfolio's current engineering focus.
 */
export default function HeroTechTags({
  tags = ["JAVA + SPRING", "REACT + TYPESCRIPT", "POSTGRESQL", "AI INTEGRATION"]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TechTag key={tag} label={tag} />
      ))}
    </div>
  );
}
