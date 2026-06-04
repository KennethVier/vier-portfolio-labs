import ProfileImage from './ProfileImage';
import AboutContent from './AboutContent';

export default function About() {
    return (
        <section className="py-section-v-lg reveal-section" id="about">
            <div className="flex flex-col md:flex-row items-center gap-16">
                <ProfileImage />
                <AboutContent />
            </div>
        </section>
    )
}
