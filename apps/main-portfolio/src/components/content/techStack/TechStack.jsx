import SectionHeader from '../../ui/SectionHeader';
import SkillCategory from './SkillCategory';
import { SKILL_CATEGORIES } from './constants';

export default function TechStack() {
  return (
    <section className="section-block reveal-section" id="skills">
      <div className="section-intro mx-auto max-w-3xl text-center">
        <SectionHeader label="ENGINEERING STACK" title="Tools grouped by the work they support" centered={true} />
        <p className="text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
          A practical stack spanning backend services, product interfaces, persistence, AI integration,
          verification, and deployment.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {SKILL_CATEGORIES.map((category) => (
          <SkillCategory
            key={category.id}
            title={category.title}
            icon={category.icon}
            borderColor={category.borderColor}
            iconColor={category.iconColor}
            dotColor={category.dotColor}
            skills={category.skills}
          />
        ))}
      </div>
    </section>
  );
}
