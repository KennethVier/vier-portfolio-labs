import Button from '../../ui/Button';
import HeroTechTags from './HeroTechTags';

/**
 * HeroContent
 * Primary positioning and conversion actions for the portfolio.
 */
export default function HeroContent() {
  return (
    <div className="flex-1 space-y-8">
      <HeroTechTags />

      <div className="inline-flex items-center gap-2 rounded-full border border-tertiary/25 bg-tertiary/5 px-4 py-2 font-label-caps text-label-caps text-tertiary">
        <span className="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_12px_rgba(76,214,251,0.8)]" />
        Available for selected freelance & part-time projects
      </div>

      <h1 className="font-display-hero text-display-hero text-primary leading-tight">
        Reliable Full-Stack <br />
        & AI-Powered Software <br />
        <span className="text-tertiary">Built for Real Products</span>
      </h1>

      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
        Backend-heavy Software Engineer building web applications, APIs, AI integrations,
        and business tools with Java, Spring Boot, React, TypeScript, and PostgreSQL —
        from architecture and data modeling to testing and deployment.
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <Button label="Explore Case Studies" href="#projects" variant="primary" />
        <Button
          label="Start a Project"
          href="mailto:kennethcerrado23@gmail.com?subject=Freelance%20Project%20Inquiry%20-%20Kenneth%20Cerrado"
          variant="secondary"
        />
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
        <span>Remote · Philippines</span>
      </div>
    </div>
  );
}
