import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGalleryProps {
    images: { image_url: string }[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    const [current, setCurrent] = useState(0);
    if (!images.length) return null;

    if (images.length === 1) {
        return (
            <div className="h-[420px] w-full overflow-hidden">
                <img src={images[0].image_url} alt="Post cover" className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className="relative h-[420px] w-full overflow-hidden bg-gray-900">
            <AnimatePresence mode="wait">
                <motion.img
                    key={current}
                    src={images[current].image_url}
                    alt={`Photo ${current + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                />
            </AnimatePresence>

            {/* Prev / Next */}
            <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125 shadow-sm' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 bg-black/50 text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                {current + 1}/{images.length}
            </div>
        </div>
    );
};

export default ImageGallery;
