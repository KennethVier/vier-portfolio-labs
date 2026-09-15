/** 
 * ProjectImage
 * Project preview image, with a branded fallback for projects that do not yet have a public screenshot.
 */
export default function ProjectImage({ src, alt, featured = false, title = "" }) {
  const heightClass = featured ? "h-64 md:h-72" : "h-48";

  return (
    <div className={`${heightClass} mb-8 rounded-xl overflow-hidden bg-surface-container-high relative`}>
      {src ? (
        <img
          className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
          src={src}
          alt={alt}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          role="img"
          aria-label={alt}
        >
          <div className="absolute -left-16 top-8 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-10 bottom-4 h-48 w-48 rounded-full bg-tertiary/10 blur-3xl" />
          <div className="relative z-10 text-center">
            <div className="font-mono text-xs tracking-[0.35em] text-tertiary/70">ARCHITECTURE / AI / LEARNING</div>
            <div className="mt-4 font-display-hero text-3xl text-primary">{title}</div>
            <div className="mx-auto mt-5 h-px w-32 bg-tertiary/50" />
          </div>
        </div>
      )}
    </div>
  );
}
