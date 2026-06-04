/**
 * ExperienceTags
 * Hashtag skill tags for an experience entry
 */
export default function ExperienceTags({ tags = [] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <span
          key={tag}
          className="font-label-code text-xs text-outline-variant hover:text-primary transition-colors cursor-default"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
