import React from 'react';
import Hero from '../../components/home/Hero';
import { motion } from 'framer-motion';
import { Landmark, Utensils, Hotel, ArrowRight, Bot, Calculator, ShieldCheck, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
    { id: 1, name: 'Điểm tham quan', icon: Landmark, color: 'bg-blue-500', path: '/locations?type=ATTRACTION', desc: 'Khám phá các di tích, hòn đảo và khu vui chơi.' },
    { id: 2, name: 'Ẩm thực địa phương', icon: Utensils, color: 'bg-orange-500', path: '/food', desc: 'Thưởng thức nem nướng, hải sản và bún chả cá.' },
    { id: 3, name: 'Lưu trú', icon: Hotel, color: 'bg-teal-500', path: '/stay', desc: 'Từ khách sạn sang trọng đến homestay ấm cúng.' },
];

const features = [
    { name: 'Thông tin chính xác', icon: ShieldCheck, desc: 'Dữ liệu được cập nhật liên tục từ các nguồn tin cậy nhất.' },
    { name: 'Hỗ trợ AI 24/7', icon: Bot, desc: 'Trợ lý ảo luôn sẵn sàng giải đáp mọi thắc mắc của bạn.' },
    { name: 'Tiết kiệm thời gian', icon: Zap, desc: 'Tạo lịch trình tối ưu chỉ trong vài giây.' },
];

const Home: React.FC = () => {
    return (
        <div className="pb-0 overflow-x-hidden pt-0 mt-[-80px]">
            <Hero />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 relative z-10 ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                to={cat.path}
                                className="group block h-full p-10 bg-white rounded-[2.5rem] transition-all duration-500 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-3 border border-gray-50"
                            >
                                <div className={`${cat.color} w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-current/20`}>
                                    <cat.icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{cat.name}</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed font-medium text-lg">{cat.desc}</p>
                                <span className="inline-flex items-center text-blue-600 font-black uppercase tracking-widest text-xs group-hover:gap-3 transition-all">
                                    Khám phá <ArrowRight className="w-4 h-4 ml-2" />
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="mt-40 mb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Tại sao chọn chúng tôi</span>
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight capitalize">Trải nghiệm du lịch <br /> thế hệ mới</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {features.map((f, i) => (
                        <div key={i} className="text-center group">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                                <f.icon className="w-8 h-8" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-4">{f.name}</h4>
                            <p className="text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-32">
                <div className="bg-gray-900 rounded-[4rem] p-12 md:p-24 overflow-hidden relative shadow-2xl shadow-blue-900/20">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-blue-600/20 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px]" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                        <div>
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-8">
                                <Zap className="w-4 h-4 mr-2" /> Sức mạnh của AI
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-10 leading-[1.1] tracking-tighter capitalize">
                                Lên kế hoạch <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-teal-400 to-blue-500">Thông minh</span>
                            </h2>
                            <p className="text-gray-400 text-xl mb-12 leading-relaxed font-medium max-w-xl">
                                Không còn phải lo lắng về việc đi đâu hay ăn gì. AI của chúng tôi sẽ đồng hành cùng bạn trên mọi nẻo đường.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-4">
                                    <Bot className="w-8 h-8 text-blue-400" />
                                    <h4 className="text-xl font-bold text-white">Tư vấn 24/7</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed">Trợ lý ảo thông thạo mọi ngõ ngách Nha Trang.</p>
                                </div>
                                <div className="space-y-4">
                                    <Calculator className="w-8 h-8 text-teal-400" />
                                    <h4 className="text-xl font-bold text-white">Dự toán ngân sách</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed">Tính toán chi phí chính xác cho từng hành trình.</p>
                                </div>
                            </div>

                            <Link
                                to="/chatbot"
                                className="inline-flex items-center px-10 py-5 bg-white text-gray-900 font-black rounded-3xl hover:bg-blue-400 hover:text-white transition-all duration-300 shadow-xl active:scale-95 group uppercase tracking-widest text-sm"
                            >
                                Thử ngay <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="relative">
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl shadow-3xl"
                            >
                                <div className="flex items-center space-x-4 mb-10">
                                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/40">
                                        <Bot className="text-white w-8 h-8" />
                                    </div>
                                    <div>
                                        <h5 className="text-white font-bold">KhanhHoaTravel AI</h5>
                                        <p className="text-teal-400 text-xs font-bold uppercase tracking-widest">Đang Hoạt Động</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/10 p-5 rounded-3xl rounded-tl-none mr-12 text-gray-200 text-sm font-medium leading-relaxed border border-white/5">
                                        Chào bạn! Hãy cho tôi biết sở thích của bạn để tôi gợi ý lịch trình nhé.
                                    </div>
                                    <div className="bg-blue-600/30 p-5 rounded-3xl rounded-tr-none ml-12 text-blue-100 text-sm font-medium leading-relaxed border border-blue-400/20">
                                        Tôi thích đi dạo biển và ăn hải sản vào buổi tối.
                                    </div>
                                    <div className="bg-white/10 p-5 rounded-3xl rounded-tl-none mr-12 text-gray-200 text-sm font-medium leading-relaxed border border-white/5">
                                        Tuyệt vời! Bạn nên bắt đầu từ bãi biển Bình Sơn và ghé nhà hàng Hải Âu - Phan Rang lúc 19h nhé !
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/10 flex gap-4">
                                    <div className="h-14 grow bg-white/5 rounded-2xl border border-white/10 text-gray-500 text-sm font-medium leading-12 ps-4">
                                        Nhập tin nhắn...
                                    </div>
                                    <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -z-10" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Destinations Highlight */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-48 text-center pb-32">
                <span className="text-orange-600 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Khám phá tuyệt phẩm</span>
                <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight tracking-tighter capitalize">Địa danh biểu tượng</h2>
                <p className="text-gray-500 max-w-2xl mx-auto mb-20 text-xl font-medium leading-relaxed">
                    Khánh Hòa là sự hòa quyện hoàn hảo giữa thiên nhiên hùng vĩ và những giá trị văn hóa lâu đời.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { name: 'Vịnh Nha Trang', img: 'https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop', tag: 'Thiên nhiên' },
                        { name: 'Tháp Bà Ponagar', img: 'https://images.unsplash.com/photo-1621250320497-2ba452cc9f8d?q=80&w=2072&auto=format&fit=crop', tag: 'Văn hóa' },
                        { name: 'VinWonders', img: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?q=80&w=2000&auto=format&fit=crop', tag: 'Giải trí' },
                        { name: 'Đảo Hòn Mun', img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop', tag: 'Lặn biển' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="group relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100"
                        >
                            <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

                            <div className="absolute top-8 left-8">
                                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                                    {item.tag}
                                </span>
                            </div>

                            <div className="absolute bottom-10 left-10 text-left">
                                <div className="flex items-center text-orange-400 mb-2">
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                </div>
                                <h4 className="text-3xl font-black text-white mb-4 leading-tight">{item.name}</h4>
                                <Link to="/locations" className="inline-flex items-center text-white/70 hover:text-white font-bold text-sm transition-colors group-hover:gap-2">
                                    Khám phá <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Newsletter/Call to Action */}
            <section className="bg-blue-600 py-32 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">Sẵn sàng để bắt đầu hành trình của bạn?</h2>
                    <p className="text-blue-100 text-xl mb-12 font-medium">Hàng nghìn du khách đã sử dụng dịch vụ của chúng tôi để có một kỳ nghỉ tuyệt vời nhất.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link to="/login" className="px-10 py-5 bg-white text-blue-600 font-black rounded-3xl hover:bg-gray-100 transition-all shadow-2xl active:scale-95 text-lg">
                            ĐĂNG KÝ NGAY
                        </Link>
                        <Link to="/locations" className="px-10 py-5 bg-blue-700 text-white font-black rounded-3xl hover:bg-blue-800 transition-all border border-blue-500 shadow-xl active:scale-95 text-lg">
                            XEM ĐIỂM ĐẾN
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
