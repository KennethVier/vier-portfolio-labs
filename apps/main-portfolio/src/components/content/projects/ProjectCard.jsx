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
  number,
  role,
  highlights = [],
  featured = false
}) {
  return (
    <GlassPanel className={`project-card group h-full ${featured ? "p-5 sm:p-7 lg:p-10" : "p-5 sm:p-7"}`}>
      <div className={featured && image ? "grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12" : ""}>
        <ProjectImage src={image} alt={alt} featured={featured} />

        <div className="space-y-5">
        {eyebrow && (
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 pb-4 font-label-caps text-label-caps tracking-[0.15em] text-tertiary">
            <span>{eyebrow}</span>
            {number && <span className="text-outline">/{number}</span>}
          </div>
        )}

        <ProjectHeader title={title} icon={icon} />
        <p className={`${featured ? "text-base sm:text-lg" : "text-base"} font-body-md leading-relaxed text-on-surface-variant`}>{description}</p>

        {role && (
          <div className="grid gap-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/45 p-4 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
            <span className="font-label-caps text-label-caps text-outline">My engineering</span>
            <span className="text-sm leading-6 text-on-surface">{role}</span>
          </div>
        )}

        {highlights.length > 0 && (
          <ul className="space-y-3 border-l border-tertiary/40 pl-4 sm:pl-5">
            {highlights.map((highlight) => (
              <li key={highlight} className="font-body-md text-on-surface-variant leading-relaxed">
                <span className="text-tertiary">→</span> {highlight}
              </li>
            ))}
          </ul>
        )}

        <ProjectTechTags tags={tags} />
        <ProjectLinks links={links} projectName={title} />
        </div>
      </div>
    </GlassPanel>
  );
}
