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
    <div className="relative group md:pl-20">
      <TimelineIndicator 
        dotColor={dotColor}
        hoverDotColor={hoverDotColor}
        dotGlow={dotGlow}
      />
      <GlassPanel className={`rounded-2xl p-5 sm:p-7 lg:p-8 ${borderColor}`}>
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
