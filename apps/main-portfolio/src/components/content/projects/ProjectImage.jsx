/**
 * ProjectImage
 * Project card image with hover scale effect
 */
export default function ProjectImage({ src, alt }) {
  return (
    <div className="h-48 mb-8 rounded-xl overflow-hidden bg-surface-container-high relative">
      <img 
        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
        src={src}
        alt={alt}
      />
    </div>
  );
}
