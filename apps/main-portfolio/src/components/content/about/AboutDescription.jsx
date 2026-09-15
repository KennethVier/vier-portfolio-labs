/** 
 * AboutDescription
 * Engineering story aligned with the portfolio's client-facing positioning.
 */
export default function AboutDescription() {
  return (
    <>
      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
        I'm a <span className="text-on-surface font-semibold">backend-heavy Software Engineer </span>
        focused on building reliable products with
        <span className="text-primary"> Java and Spring Boot</span>,
        <span className="text-primary"> React and TypeScript</span>, and
        <span className="text-primary"> PostgreSQL</span>. I care about the engineering details that
        still matter after the demo works: clear architecture, validation, transactions, testing,
        security boundaries, and maintainability.
      </p>

      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
        My recent work increasingly combines traditional software engineering with
        <span className="text-tertiary"> AI-enabled product development</span> — RAG, document processing,
        LLM integrations, and AI-assisted workflows — while keeping application state and critical
        business rules deterministic. For freelance work, I bring the same approach to new builds,
        existing systems, and features that need to ship cleanly.
      </p>
    </>
  );
}
