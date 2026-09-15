import GlassPanel from '../../ui/GlassPanel';
import ProjectImage from './ProjectImage';
import ProjectHeader from './ProjectHeader';
import ProjectTechTags from './ProjectTechTags';
import ProjectLinks from './ProjectLinks';

/**
 * ProjectCard
 * Supports deeper flagship case studies while preserving the compact card treatment for supporting work.
 */
export default function ProjectCard({
  title,
  description,
  image,
  alt,
  icon,
  tags,
  links,
  eyebrow,
  highlights = [],
  featured = false
}) {
  return (
    <GlassPanel className={`project-card group h-full ${featured ? "p-8 md:p-10" : "p-8"}`}>
      <ProjectImage src={image} alt={alt} featured={featured} title={title} />

      <div className="space-y-4">
        {eyebrow && (
          <div className="font-label-caps text-label-caps tracking-[0.18em] text-tertiary">
            {eyebrow}
          </div>
        )}

        <ProjectHeader title={title} icon={icon} />
        <p className="font-body-md text-on-surface-variant leading-relaxed">{description}</p>

        {highlights.length > 0 && (
          <ul className="space-y-3 border-l border-outline-variant/40 pl-5">
            {highlights.map((highlight) => (
              <li key={highlight} className="font-body-md text-on-surface-variant leading-relaxed">
                <span className="text-tertiary">→</span> {highlight}
              </li>
            ))}
          </ul>
        )}

        <ProjectTechTags tags={tags} />
        <ProjectLinks links={links} />
      </div>
    </GlassPanel>
  );
}
