import SectionHeader from '../../ui/SectionHeader';
import GlassPanel from '../../ui/GlassPanel';
import Button from '../../ui/Button';

const SERVICES = [
  {
    icon: "web",
    title: "Full-Stack Product Development",
    description:
      "End-to-end web applications with responsive React interfaces, Spring Boot APIs, authentication, relational data, and deployable production boundaries.",
    tags: ["React", "Spring Boot", "PostgreSQL", "REST APIs"]
  },
  {
    icon: "dns",
    title: "Backend & API Engineering",
    description:
      "Business logic, database design, integrations, security boundaries, migrations, background processing, debugging, and performance-focused backend work.",
    tags: ["Java", "Spring", "JPA", "SQL"]
  },
  {
    icon: "psychology",
    title: "AI-Powered Applications",
    description:
      "Practical LLM features, RAG, document processing, structured AI output, provider integrations, and AI workflows designed around deterministic application boundaries.",
    tags: ["Spring AI", "RAG", "Gemini", "Ollama"]
  },
  {
    icon: "build",
    title: "Existing App Improvements",
    description:
      "Feature delivery, bug fixing, API integration, refactoring, automated testing, architecture cleanup, and maintainability improvements for existing products.",
    tags: ["Testing", "Refactoring", "Integration", "Quality"]
  }
];

export default function Services() {
  return (
    <section className="py-section-v-lg reveal-section" id="services">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeader label="FREELANCE SERVICES" title="What I Can Build For You" centered={true} />
        <p className="mt-5 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          I work best on projects where solid software engineering matters as much as shipping:
          clear boundaries, maintainable code, reliable data flows, validation, and practical AI where it adds value.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICES.map((service) => (
          <GlassPanel key={service.title} className="p-8 group h-full" hoverable={true}>
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                <span className="material-symbols-outlined">{service.icon}</span>
              </div>
              <div>
                <h3 className="font-headline-section text-xl text-on-surface">{service.title}</h3>
                <p className="mt-3 font-body-md text-on-surface-variant leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
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

      <div className="mt-10 flex justify-center">
        <Button
          label="Discuss a Project"
          href="mailto:kennethcerrado23@gmail.com?subject=Freelance%20Project%20Inquiry%20-%20Kenneth%20Cerrado"
          variant="primary"
        />
      </div>
    </section>
  );
}
