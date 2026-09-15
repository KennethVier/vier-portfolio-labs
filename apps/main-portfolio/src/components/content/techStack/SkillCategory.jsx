import GlassPanel from '../../ui/GlassPanel';
import SkillList from './SkillList';

/**
 * SkillCategory
 * Skill category panel (Backend, Frontend, Database, Tools)
 */
export default function SkillCategory({ title, icon, borderColor, iconColor, dotColor, skills }) {
  return (
    <GlassPanel className={`rounded-2xl border-l-2 p-5 sm:p-7 ${borderColor} glow-hover`}>
      <div className="mb-5 flex items-center gap-3">
        <span className={`material-symbols-outlined ${iconColor} text-2xl`} aria-hidden="true">{icon}</span>
        <h3 className="font-label-caps text-label-caps text-on-surface">{title}</h3>
      </div>
      <SkillList skills={skills} dotColor={dotColor} />
    </GlassPanel>
  );
}
