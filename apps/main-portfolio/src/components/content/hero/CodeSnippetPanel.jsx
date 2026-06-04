/**
 * CodeSnippetPanel
 * Glass panel displaying code snippet with syntax highlighting
 */
export default function CodeSnippetPanel() {
  return (
    <div className="glass-panel w-full h-125 rounded-2xl p-8 relative overflow-hidden animate-float">
      <div className="flex gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-error"></div>
        <div className="w-3 h-3 rounded-full bg-secondary"></div>
        <div className="w-3 h-3 rounded-full bg-tertiary"></div>
      </div>
      <pre className="font-label-code text-label-code space-y-1">
        <span className="code-syntax-dim">@RestController</span>
        <p className="code-syntax-blue">public class <span className="code-syntax-cyan">ArchitectController</span> {"{"}</p>
        <span className="code-syntax-dim pl-10">@GetMapping("/api/v1/projects")</span>
        <p className="code-syntax-blue pl-10">public ResponseEntity&lt;List&lt;Project&gt;&gt; <span className="code-syntax-cyan">getWorks</span>() <span>{"{"}</span></p>
        <span className="code-syntax-blue pl-20">return</span> projectService.<span className="code-syntax-cyan">getActiveDeployments</span>()
        <p className="code-syntax-cyan pl-section-v-lg">.stream()</p>
        <p className="code-syntax-cyan pl-section-v-lg">.map(this::mapToDto)</p>
        <p className="code-syntax-cyan pl-section-v-lg">.collect(Collectors.<span className="code-syntax-cyan">toList</span>());</p>
        <span className="pl-10">{"}"}</span>
        <p>{"}"}</p>
      </pre>
    </div>
  );
}
