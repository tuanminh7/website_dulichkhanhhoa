import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-950 text-white pt-24 pb-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    <div className="col-span-1 lg:col-span-1">
                        <Link to="/" className="flex items-center mb-8">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mr-4 shadow-xl shadow-blue-500/20">
                                <span className="font-black text-2xl">K</span>
                            </div>
                            <span className="text-2xl font-black tracking-tighter">KhanhHoa<span className="text-blue-500">Travel</span></span>
                        </Link>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            Nền tảng du lịch thông minh hỗ trợ bởi AI, giúp bạn khám phá vẻ đẹp tuyệt vời của Khánh Hòa một cách dễ dàng và hiệu quả nhất.
                        </p>
                        <div className="flex space-x-4">
                            {[Facebook, Instagram, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all duration-300 group border border-white/5">
                                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-10 text-blue-500">Liên kết nhanh</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Điểm đến nổi bật', path: '/locations' },
                                { name: 'Ẩm thực phong phú', path: '/food' },
                                { name: 'Dịch vụ lưu trú', path: '/stay' },
                                { name: 'Trợ lý ảo AI', path: '/chatbot' },
                                { name: 'Ước tính chi phí', path: '/costs' },
                            ].map((link, i) => (
                                <li key={i}>
                                    <Link to={link.path} className="text-gray-400 hover:text-white transition-all flex items-center group font-medium">
                                        <ArrowUpRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-10 text-teal-500">Pháp lý & Hỗ trợ</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Về chúng tôi', path: '/about' },
                                { name: 'Trung tâm hỗ trợ', path: '/contact' },
                                { name: 'Điều khoản sử dụng', path: '/terms' },
                                { name: 'Chính sách bảo mật', path: '/privacy' },
                                { name: 'Dành cho đối tác', path: '/partners' },
                            ].map((link, i) => (
                                <li key={i}>
                                    <Link to={link.path} className="text-gray-400 hover:text-white transition-all font-medium">{link.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-10 text-orange-500">Thông tin liên hệ</h4>
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-4 shrink-0 border border-white/5">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">Xã Ninh Phước, Ninh Thuận, Khánh Hòa</p>
                            </div>
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-4 shrink-0 border border-white/5">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">+84 123 456 789</p>
                            </div>
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-4 shrink-0 border border-white/5">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">contact@nhatrangtravel.vn</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
                        © {new Date().getFullYear()} KHANH HOA TOURISM. DESIGNED FOR EXCELLENCE.
                    </p>
                    <div className="flex items-center space-x-8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white cursor-pointer">Vietnamese</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white cursor-pointer">English</span>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Back to top</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
