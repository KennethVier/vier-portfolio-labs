/**
 * GlassPanel
 * Reusable glass-morphism container component
 */
export default function GlassPanel({ children, className = "", hoverable = false }) {
  const baseClasses = "glass-panel rounded-2xl";
  const hoverClasses = hoverable ? "hover:border-primary/40" : "";
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}
