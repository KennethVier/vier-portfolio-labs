/**
 * AboutDescription
 * Engineering story aligned with the portfolio's overall professional positioning.
 */
export default function AboutDescription() {
  return (
    <>
      <p className="font-body-lg text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
        I'm <span className="text-on-surface font-semibold">Kenneth Vier Cerrado</span>, a backend-heavy
        Software Engineer focused on building reliable products with
        <span className="text-primary"> Java and Spring Boot</span>,
        <span className="text-primary"> React and TypeScript</span>, and
        <span className="text-primary"> PostgreSQL</span>. I care about the engineering details that
        still matter after the demo works: clear architecture, validation, transactions, testing,
        security boundaries, maintainability, and predictable system behavior.
      </p>

      <p className="font-body-lg text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
        I also work professionally as <span className="text-on-surface">Kenneth Vier</span>. Across
        professional delivery work and independent product builds, I keep expanding beyond traditional
        application development into <span className="text-tertiary">AI-enabled software and agentic workflows</span>
        — including RAG, document processing, LLM integrations, automation, and AI-assisted engineering.
        The goal is straightforward: understand the problem deeply, design the right system, and carry it
        through to a reliable implementation.
      </p>
    </>
  );
}
