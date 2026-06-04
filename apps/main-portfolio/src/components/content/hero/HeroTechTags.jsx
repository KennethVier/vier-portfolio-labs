import TechTag from '../../ui/TechTag';

/**
 * HeroTechTags
 * Container for tech stack tags in hero section
 */
export default function HeroTechTags({ tags = ["JAVA", "SPRING", "POSTGRESQL", "REACT"] }) {
  return (
    <div className="inline-flex gap-2">
      {tags.map((tag) => (
        <TechTag key={tag} label={tag} />
      ))}
    </div>
  );
}
