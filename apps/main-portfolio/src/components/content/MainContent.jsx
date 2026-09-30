import Hero from './hero/Hero';
import Projects from './projects/Projects';
import Services from './services/Services';
import TechStack from './techStack/TechStack';
import Experience from './experience/Experience';
import About from './about/About';
import Contact from './contact/Contact';

export default function MainContent() {
  return (
    <main id="main-content" className="site-shell pt-18">
      <Hero />
      <Projects />
      <Experience />
      <TechStack />
      <Services />
      <About />
      <Contact />
    </main>
  );
}
