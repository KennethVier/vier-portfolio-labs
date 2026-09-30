import GlassPanel from '../../ui/GlassPanel';
import ContactTitle from './ContactTitle';
import ContactMethod from './ContactMethod';
import { CONTACT_METHODS } from './constants';

export default function Contact() {
    return (
        <section className="section-block reveal-section" id="contact">
            <GlassPanel className="group relative space-y-7 overflow-hidden rounded-3xl p-6 text-center sm:p-10 lg:p-16">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-colors duration-1000">
                </div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/10 blur-[100px] rounded-full group-hover:bg-tertiary/20 transition-colors duration-1000">
                </div>
                <ContactTitle />
                <div className="flex flex-col items-stretch justify-center gap-3 pt-5 sm:flex-row sm:items-center sm:gap-5">
                    {CONTACT_METHODS.map((method) => (
                        <ContactMethod
                            key={method.id}
                            label={method.label}
                            href={method.href}
                            icon={method.icon}
                            hoverColor={method.hoverColor}
                            isExternal={method.isExternal}
                        />
                    ))}
                </div>
            </GlassPanel>
        </section>
    )
}
