/**
 * IconButton
 * Reusable circular icon button component (used in Contact, Footer)
 */
export default function IconButton({ 
  icon, 
  href = "#", 
  hoverColor = "primary",
  label = ""
}) {
  const hoverClasses = `group-hover:bg-${hoverColor} group-hover:text-on-${hoverColor} group-hover:shadow-[0_0_20px_rgba(191,194,255,0.4)]`;
  
  return (
    <a className="group flex flex-col items-center gap-2" href={href}>
      <div className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center ${hoverClasses} transition-all`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {label && <span className="font-label-code text-label-code">{label}</span>}
    </a>
  );
}
