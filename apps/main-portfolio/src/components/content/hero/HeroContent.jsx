import Button from '../../ui/Button';
import HeroTechTags from './HeroTechTags';

/**
 * HeroContent
 * Primary positioning and navigation actions for the portfolio.
 */
export default function HeroContent() {
  return (
    <div className="flex-1 space-y-8">
      <HeroTechTags />

      <div className="inline-flex items-center gap-2 rounded-full border border-tertiary/25 bg-tertiary/5 px-4 py-2 font-label-caps text-label-caps text-tertiary">
        <span className="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_12px_rgba(76,214,251,0.8)]" />
        Software Engineering · Product Development · Practical AI
      </div>

      <h1 className="font-display-hero text-display-hero text-primary leading-tight">
        <span className="mb-4 block font-label-caps text-label-caps tracking-[0.18em] text-on-surface-variant">
          Kenneth Vier Cerrado · Software Engineer
        </span>
        Building Reliable Software <br />
        Across Backend, Web <br />
        <span className="text-tertiary">& Intelligent Systems</span>
      </h1>

      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
        Backend-heavy Software Engineer working across Java and Spring Boot systems, React products,
        PostgreSQL data layers, APIs, automation, and AI-enabled workflows. This portfolio brings
        together my professional experience, engineering projects, and the systems I build to keep
        growing beyond a single stack or role.
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <Button label="Explore Engineering Work" href="#projects" variant="primary" />
        <Button label="View Experience" href="#experience" variant="secondary" />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 font-label-caps text-label-caps text-on-surface-variant">
        <a
          className="transition-colors hover:text-tertiary"
          href="https://github.com/KennethVier"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
        <a
          className="transition-colors hover:text-tertiary"
          href="https://www.linkedin.com/in/kenneth-vier-cerrado-39a863261"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn ↗
        </a>
        <span>Philippines · Open to meaningful opportunities & collaborations</span>
      </div>
    </div>
  );
}
