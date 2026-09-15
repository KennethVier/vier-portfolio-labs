/**
 * ContactTitle
 * Opportunity-neutral final contact message.
 */
export default function ContactTitle() {
  return (
    <>
      <span className="font-label-caps text-label-caps tracking-[0.18em] text-tertiary">START A CONVERSATION</span>
      <h2 className="contact-title mx-auto max-w-4xl font-display-hero text-on-background">
        Have a role, system, or engineering problem worth discussing?
      </h2>
      <p className="mx-auto max-w-2xl font-body-lg text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
        I'm open to software engineering opportunities, technical collaborations, part-time or
        freelance work, and conversations around backend systems, full-stack products, automation,
        and practical AI integration.
      </p>
    </>
  );
}
