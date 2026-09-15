import SectionHeader from '../../ui/SectionHeader';
import GlassPanel from '../../ui/GlassPanel';

const CAPABILITIES = [
  {
    icon: "dns",
    title: "Backend & API Engineering",
    description:
      "Designing business logic, REST APIs, relational data models, authentication flows, integrations, migrations, background processing, and maintainable service boundaries.",
    tags: ["Java", "Spring Boot", "Spring Security", "PostgreSQL"]
  },
  {
    icon: "web",
    title: "Full-Stack Product Development",
    description:
      "Building complete product experiences from responsive React interfaces through backend APIs and persistence, with attention to usability, validation, and production-ready behavior.",
    tags: ["React", "TypeScript", "REST APIs", "SQL"]
  },
  {
    icon: "psychology",
    title: "AI-Enabled Software",
    description:
      "Exploring practical LLM features, RAG, document processing, structured AI output, agentic workflows, and provider integrations while keeping critical application rules deterministic.",
    tags: ["Spring AI", "RAG", "Ollama", "AI Workflows"]
  },
  {
    icon: "verified",
    title: "Software Quality & Delivery",
    description:
      "Improving existing systems through automated testing, debugging, refactoring, security-minded implementation, code review, CI awareness, and maintainability-focused engineering.",
    tags: ["Testing", "Security", "Refactoring", "CI/CD"]
  }
];

export default function Services() {
  return (
    <section className="py-section-v-lg reveal-section" id="capabilities">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeader label="ENGINEERING FOCUS" title="What I Build & How I Work" centered={true} />
        <p className="mt-5 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          These are the recurring areas across my professional work and independent projects. I enjoy
          shipping useful software, but I care just as much about architecture, data integrity, testing,
          maintainability, and choosing AI only where it creates real product value.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {CAPABILITIES.map((capability) => (
          <GlassPanel key={capability.title} className="p-8 group h-full" hoverable={true}>
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                <span className="material-symbols-outlined">{capability.icon}</span>
              </div>
              <div>
                <h3 className="font-headline-section text-xl text-on-surface">{capability.title}</h3>
                <p className="mt-3 font-body-md text-on-surface-variant leading-relaxed">
                  {capability.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {capability.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-outline-variant/30 bg-surface-variant/10 px-3 py-1 font-label-caps text-label-caps text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
