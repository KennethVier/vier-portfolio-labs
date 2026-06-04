/**
 * AboutDescription
 * About text with inline highlighted spans
 */
export default function AboutDescription() {
    return (
        <>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                I'm a <span className="text-on-surface font-semibold">Software Engineer </span>
                with hands-on experience building scalable web applications using
                <span className="text-primary"> Java Spring Boot</span>,
                <span className="text-primary"> React</span>, and relational databases.
                I enjoy solving real-world problems through clean backend architecture,
                API development, and responsive user experiences.
            </p>

            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                From optimizing enterprise systems and automating workflows to building
                personal full-stack projects like an
                <span className="text-tertiary"> AI-powered quiz generation platform</span>,
                I focus on writing maintainable, scalable, and performance-oriented solutions
                while continuously improving as an engineer.
            </p>
        </>
    );
}
