import ProfileImage from './ProfileImage';
import AboutContent from './AboutContent';

export default function About() {
    return (
        <section className="section-block reveal-section" id="about">
            <div className="grid items-center gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
                <ProfileImage />
                <AboutContent />
            </div>
        </section>
    )
}
