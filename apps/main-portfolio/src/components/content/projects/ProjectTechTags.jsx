/**
 * ProjectTechTags
 * Tech stack tags for a project
 */
export default function ProjectTechTags({ tags = [] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-4">
      {tags.map((tag) => (
        <span
          key={tag}
          className="font-label-code text-xs px-2 py-1 rounded bg-surface-container-lowest border border-outline-variant/10 tech-tag"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
