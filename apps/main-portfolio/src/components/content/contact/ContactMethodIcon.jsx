/**
 * ContactMethodIcon
 * Icon circle for contact method
 */
export default function ContactMethodIcon({ icon, hoverColor }) {
  return (
    <div className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center group-hover:bg-${hoverColor} group-hover:text-on-${hoverColor} group-hover:shadow-[0_0_20px_rgba(191,194,255,0.4)] transition-all`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  );
}
