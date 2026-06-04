import ContactMethodIcon from './ContactMethodIcon';

/**
 * ContactMethod
 * Individual contact method card (email, github, linkedin)
 */
export default function ContactMethod({ label, href, icon, hoverColor }) {
  return (
    <a className="group flex flex-col items-center gap-2" href={href}>
      <ContactMethodIcon icon={icon} hoverColor={hoverColor} />
      <span className="font-label-code text-label-code">{label}</span>
    </a>
  );
}
