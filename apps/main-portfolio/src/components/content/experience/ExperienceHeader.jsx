/**
 * ExperienceHeader
 * Header section of experience card with title, company, date, and type badge
 */
export default function ExperienceHeader({ title, company, period, type, titleColor }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h3 className={`font-headline-section text-xl sm:text-2xl ${titleColor}`}>{title}</h3>
        <p className="mt-1 font-body-md text-sm text-on-surface-variant sm:text-base">{company} <span aria-hidden="true">•</span> {period}</p>
      </div>
      <span className="w-fit rounded-full bg-primary-container px-3 py-1.5 font-label-code text-[11px] text-primary sm:px-4">
        {type}
      </span>
    </div>
  );
}
