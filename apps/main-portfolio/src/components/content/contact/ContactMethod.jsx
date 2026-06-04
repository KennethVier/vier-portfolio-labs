import ContactMethodIcon from './ContactMethodIcon';

/**
 * ContactMethod
 * Individual contact method card (email, github, linkedin)
 */
export default function ContactMethod({ label, href, icon, hoverColor, isExternal = false }) {
  return (
    <a
      className="group flex flex-col items-center gap-2"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      <ContactMethodIcon icon={icon} hoverColor={hoverColor} />
      <span className="font-label-code text-label-code">{label}</span>
    </a>
  );
}
