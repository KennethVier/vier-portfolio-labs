import ContactMethodIcon from './ContactMethodIcon';

/**
 * ContactMethod
 * Individual contact method card (email, github, linkedin)
 */
export default function ContactMethod({ label, href, icon, hoverColor, isExternal = false }) {
  return (
    <a
      className="group flex min-h-14 items-center justify-center gap-3 rounded-xl border border-outline-variant/20 px-5 py-3 transition-colors hover:border-tertiary/50 hover:bg-surface-variant/10 sm:min-w-36"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      <ContactMethodIcon icon={icon} hoverColor={hoverColor} />
      <span className="font-label-code text-label-code">{label}</span>
    </a>
  );
}
