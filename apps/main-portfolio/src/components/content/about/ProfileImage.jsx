import profilePic from "/images/PASSPORT_SIZE_ID_PIC.jpg";

/**
 * ProfileImage
 * Profile image with frame and grayscale hover effect
 */
export default function ProfileImage() {
    return (
        <div>
            <div className="group relative mx-auto aspect-[4/5] w-full max-w-sm">
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-primary/70 transition-transform duration-300 group-hover:translate-x-2 group-hover:translate-y-2">
                </div>
                <div className="absolute inset-0 bg-surface-container-high rounded-2xl overflow-hidden">
                    <img
                        className="h-full w-full object-cover object-top grayscale transition duration-500 group-hover:grayscale-0"
                        alt="Kenneth Vier Cerrado, Software Engineer"
                        src={profilePic}
                        loading="lazy"
                        width="411"
                        height="531"
                    />
                </div>
            </div>
        </div>
    );
}
