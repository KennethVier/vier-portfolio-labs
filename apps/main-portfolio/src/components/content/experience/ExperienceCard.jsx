import GlassPanel from '../../ui/GlassPanel';
import TimelineIndicator from './TimelineIndicator';
import ExperienceHeader from './ExperienceHeader';
import ExperienceDescription from './ExperienceDescription';
import ExperienceTags from './ExperienceTags';

/**
 * ExperienceCard
 * Individual experience/role card
 */
export default function ExperienceCard({ 
  title, 
  company, 
  period, 
  type, 
  description, 
  highlights,
  tags,
  borderColor,
  dotColor,
  hoverDotColor,
  dotGlow,
  titleColor
}) {
  return (
    <div className="md:pl-24 relative group">
      <TimelineIndicator 
        dotColor={dotColor}
        hoverDotColor={hoverDotColor}
        dotGlow={dotGlow}
      />
      <GlassPanel className={`p-8 rounded-2xl ${borderColor}`}>
        <ExperienceHeader 
          title={title}
          company={company}
          period={period}
          type={type}
          titleColor={titleColor}
        />
        <ExperienceDescription description={description} highlights={highlights} />
        {tags.length > 0 && <ExperienceTags tags={tags} />}
      </GlassPanel>
    </div>
  );
}
