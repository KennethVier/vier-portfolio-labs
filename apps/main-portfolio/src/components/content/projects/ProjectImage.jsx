/** 
 * ProjectImage
 * Project preview image, with a branded fallback for projects that do not yet have a public screenshot.
 */
export default function ProjectImage({ src, alt, featured = false }) {
  if (!src) return null;

  const heightClass = featured ? "h-64 md:h-72" : "h-48";

  return (
    <div className={`${heightClass} mb-8 rounded-xl overflow-hidden bg-surface-container-high relative`}>
      <img
        className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
        src={src}
        alt={alt}
        loading="lazy"
        width="1920"
        height="960"
      />
    </div>
  );
}
