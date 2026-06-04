import Button from '../../ui/Button';
import HeroTechTags from './HeroTechTags';

/**
 * HeroContent
 * Left side text content and CTA buttons for hero section
 */
export default function HeroContent() {
  return (
    <div className="flex-1 space-y-8">
      <HeroTechTags />
      <h1 className="font-display-hero text-display-hero text-primary leading-tight">
        Building Modern <br />
        Software Solutions <br />
        <span className="text-tertiary">Built to Scale</span>
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
        Software Engineer building full-stack applications with
        Java Spring Boot, React, and scalable architectures —
        focused on performance, maintainability, and clean code.
      </p>
      <div className="flex items-center gap-4 pt-4">
        <Button label="View Projects" href="#projects" variant="primary" />
        <Button label="Contact Me" href="#contact" variant="secondary" />
      </div>
    </div>
  );
}
