import profilePic from "/images/PASSPORT_SIZE_ID_PIC.jpg";

/**
 * ProfileImage
 * Profile image with frame and grayscale hover effect
 */
export default function ProfileImage() {
    return (
        <div className="flex-1">
            <div className="relative w-full aspect-square max-w-md mx-auto group">
                <div className="absolute inset-0 border-2 border-primary rounded-2xl translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500">
                </div>
                <div className="absolute inset-0 bg-surface-container-high rounded-2xl overflow-hidden">
                    <img
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                        data-alt="Professional portrait of a software engineer"
                        src={profilePic}
                    />
                </div>
            </div>
        </div>
    );
}
