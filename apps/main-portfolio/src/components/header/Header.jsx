import React from 'react';
import NavLink from './NavLink';
import HireButton from './HireButton';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-outline-variant/20">
            <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-gutter py-base">

                <div className="justify-self-start">
                    <div className="font-headline-section text-headline-section tracking-tighter text-primary">
                        VIER.OS
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-8 justify-self-center">
                    <NavLink label="Projects" href="#projects" isActive={true} />
                    <NavLink label="Skills" href="#skills" />
                    <NavLink label="About" href="#about" />
                    <NavLink label="Experience" href="#experience" />
                    <NavLink label="Contact" href="#contact" />
                </nav>

                <div className="justify-self-end">
                    <HireButton />
                </div>

            </div>
        </header>
    )
}
