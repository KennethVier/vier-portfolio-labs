import GlassPanel from '../../ui/GlassPanel';
import ProjectImage from './ProjectImage';
import ProjectHeader from './ProjectHeader';
import ProjectTechTags from './ProjectTechTags';
import ProjectLinks from './ProjectLinks';

/**
 * ProjectCard
 * Individual project card component
 */
export default function ProjectCard({ title, description, image, alt, icon, tags, links }) {
  return (
    <GlassPanel className="p-8 project-card group">
      <ProjectImage src={image} alt={alt} />
      <div className="space-y-4">
        <ProjectHeader title={title} icon={icon} />
        <p className="font-body-md text-on-surface-variant">{description}</p>
        <ProjectTechTags tags={tags} />
        <ProjectLinks links={links} />
      </div>
    </GlassPanel>
  );
}
