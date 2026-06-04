/**
 * Button
 * Reusable button component (primary/secondary variants)
 */
export default function Button({ 
  label, 
  href = "#", 
  variant = "primary",
  className = ""
}) {
  const baseClasses = "font-label-caps text-label-caps rounded-xl transition-all duration-300";
  
  const variantClasses = variant === "primary"
    ? "bg-primary text-on-primary px-8 py-4 hover:shadow-[0_0_25px_rgba(191,194,255,0.5)]"
    : "border border-outline text-on-surface px-8 py-4 hover:bg-surface-variant/20 hover:shadow-[0_0_20px_rgba(159,239,254,0.1)]";

  return (
    <a 
      href={href}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {label}
    </a>
  );
}
