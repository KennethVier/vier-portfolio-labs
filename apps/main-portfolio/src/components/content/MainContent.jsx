import React from 'react';
import Hero from './hero/Hero';
import Projects from './projects/Projects';
import TechStack from './techStack/TechStack';
import Experience from './experience/Experience';
import About from './about/About';
import Contact from './contact/Contact';

export default function MainContent() {
    return (
        <main className="max-w-container-max mx-auto px-gutter pt-20">
            <Hero />
            <Projects />
            <TechStack />
            <Experience />
            <About />
            <Contact />
        </main>
    )
}