import GlassPanel from '../../ui/GlassPanel';
import SkillList from './SkillList';

/**
 * SkillCategory
 * Skill category panel (Backend, Frontend, Database, Tools)
 */
export default function SkillCategory({ title, icon, borderColor, iconColor, dotColor, skills }) {
  return (
    <GlassPanel className={`p-8 rounded-2xl border-l-4 ${borderColor} glow-hover`}>
      <span className={`material-symbols-outlined ${iconColor} text-4xl mb-4`}>{icon}</span>
      <h3 className="font-label-caps text-label-caps text-on-surface mb-6">{title}</h3>
      <SkillList skills={skills} dotColor={dotColor} />
    </GlassPanel>
  );
}
