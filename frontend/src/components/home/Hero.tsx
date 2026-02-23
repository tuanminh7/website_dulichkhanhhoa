import React from 'react';
import { Search, MapPin, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
    return (
        <div className="relative h-[85vh] w-full overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            </div>

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-start pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl"
                >
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-10 backdrop-blur-md border border-blue-500/20">
                        <Compass className="w-4 h-4 mr-2" />
                        Khám phá xứ Trầm Hương
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1.05] tracking-tighter">
                        Vẻ đẹp <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-blue-500">Tuyệt diệu</span><br />
                        của Khánh Hòa
                    </h1>
                    <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl leading-relaxed font-medium">
                        Khám phá những bãi biển thiên đường, ẩm thực tinh túy và trải nghiệm dịch vụ du lịch thông minh bậc nhất.
                    </p>

                    <div className="w-full max-w-xl bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex-grow relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Bạn muốn đi đâu ở Nha Trang?"
                                    className="w-full bg-white/5 text-white placeholder-gray-400 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                                />
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95 flex items-center justify-center whitespace-nowrap">
                                Tìm kiếm ngay
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-wrap gap-6">
                        <div className="flex items-center text-gray-300">
                            <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                            <span>Hòn Tre</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                            <MapPin className="w-5 h-5 mr-3 text-teal-400" />
                            <span>Tháp Bà Ponagar</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                            <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                            <span>Vịnh Vân Phong</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                </div>
            </motion.div>
        </div>
    );
};

export default Hero;
