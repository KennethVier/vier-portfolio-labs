import Button from '../../ui/Button';
import HeroTechTags from './HeroTechTags';

/**
 * HeroContent
 * Primary positioning and navigation actions for the portfolio.
 */
export default function HeroContent() {
  return (
    <div className="space-y-7">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-tertiary/25 bg-tertiary/5 px-3 py-2 font-label-caps text-[10px] leading-4 text-tertiary sm:px-4 sm:text-label-caps">
        <span className="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_12px_rgba(76,214,251,0.8)]" />
        Software Engineer · Philippines
      </div>

      <h1 className="hero-title max-w-4xl font-display-hero text-primary">
        I engineer software systems that are built to <span className="text-tertiary">keep working.</span>
      </h1>

      <p className="max-w-2xl font-body-lg text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
        Kenneth Vier Cerrado is a backend-heavy Software Engineer building full-stack products,
        Java and Spring services, PostgreSQL data layers, and AI-enabled workflows—with architecture,
        validation, testing, and recovery designed in from the start.
      </p>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
        <Button label="Explore Flagship Work" href="#projects" variant="primary" />
        <Button label="View Experience" href="#experience" variant="secondary" />
      </div>

      <HeroTechTags />

      <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-outline-variant/20 pt-5 font-label-caps text-label-caps text-on-surface-variant">
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
        <span className="basis-full sm:basis-auto">Open to engineering roles, collaboration, and part-time work</span>
      </div>
    </div>
  );
}
