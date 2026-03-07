import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';

const LoadingOverlay: React.FC = () => {
    const { isLoading } = useLoading();

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-white/40 backdrop-blur-md"
                >
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20">
                            {/* Inner Circle */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full"
                            />
                            {/* Outer Pulse */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="absolute inset-[-8px] border-4 border-blue-400/30 rounded-full"
                            />
                        </div>
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 text-blue-700 font-bold tracking-widest text-sm uppercase"
                        >
                            Đang xử lý...
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingOverlay;
