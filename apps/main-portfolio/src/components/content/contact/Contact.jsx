import GlassPanel from '../../ui/GlassPanel';
import ContactTitle from './ContactTitle';
import ContactMethod from './ContactMethod';
import { CONTACT_METHODS } from './constants';

export default function Contact() {
    return (
        <section className="py-section-v-lg reveal-section" id="contact">
            <GlassPanel className="rounded-3xl p-16 text-center space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-colors duration-1000">
                </div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/10 blur-[100px] rounded-full group-hover:bg-tertiary/20 transition-colors duration-1000">
                </div>
                <ContactTitle />
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 pt-12">
                    {CONTACT_METHODS.map((method) => (
                        <ContactMethod
                            key={method.id}
                            label={method.label}
                            href={method.href}
                            icon={method.icon}
                            hoverColor={method.hoverColor}
                        />
                    ))}
                </div>
            </GlassPanel>
        </section>
    )
}
