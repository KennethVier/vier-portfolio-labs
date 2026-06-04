/**
 * ExperienceHeader
 * Header section of experience card with title, company, date, and type badge
 */
export default function ExperienceHeader({ title, company, period, type, titleColor }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h3 className={`font-headline-section text-2xl ${titleColor}`}>{title}</h3>
        <p className="text-on-surface-variant font-body-md">{company} • {period}</p>
      </div>
      <span className="font-label-code text-label-code px-4 py-1.5 rounded-full bg-primary-container text-primary">
        {type}
      </span>
    </div>
  );
}
