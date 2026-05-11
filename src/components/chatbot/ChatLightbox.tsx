import React from 'react';
import { X } from 'lucide-react';

interface ChatLightboxProps {
    lightboxImage: string | null;
    setLightboxImage: (img: string | null) => void;
}

export const ChatLightbox: React.FC<ChatLightboxProps> = ({
    lightboxImage,
    setLightboxImage
}) => {
    if (!lightboxImage) return null;

    return (
        <div
            className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/5 backdrop-blur-[1px] animate-fadeIn"
            onClick={() => setLightboxImage(null)}
        >
            {/* Floating Close Button */}
            <div className="absolute top-10 right-10 z-[1000001]">
                <button
                    className="bg-white text-gray-900 p-4 rounded-full shadow-2xl border-2 border-gray-200 hover:bg-gray-50 transition-all hover:scale-110 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage(null);
                    }}
                >
                    <X className="w-8 h-8" />
                </button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
                <img
                    src={lightboxImage}
                    alt="Full view"
                    className="max-w-[95%] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.3)] border-8 border-white animate-scaleIn"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};
