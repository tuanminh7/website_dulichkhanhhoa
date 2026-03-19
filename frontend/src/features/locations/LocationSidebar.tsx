import React from 'react';
import { Heart, Clock, MapPin, Share2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Location } from '../../types';

interface LocationSidebarProps {
    location: Location;
    isFavorite: boolean;
    handleToggleFavorite: () => void;
}

const LocationSidebar: React.FC<LocationSidebarProps> = ({ location, isFavorite, handleToggleFavorite }) => {
    return (
        <div className="space-y-10">
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-gray-300 sticky top-24 border border-white/5">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black uppercase tracking-tighter shadow-sm leading-tight">Thông tin nhanh</h3>
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-4 rounded-2xl backdrop-blur-md transition-all duration-300 transform active:scale-90 shadow-lg ${
                            isFavorite
                                ? 'bg-red-500 text-white shadow-red-500/40'
                                : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                        }`}
                    >
                        <Heart className={`w-7 h-7 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="space-y-10">
                    <div className="flex items-start group">
                        <div className="p-3 bg-blue-500/10 rounded-2xl mr-5 group-hover:bg-blue-500/20 transition-colors">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 opacity-60">Giờ mở cửa</p>
                            <ul className="text-sm font-bold space-y-2">
                                {location.opening_hours?.map(oh => (
                                    <li key={oh.id} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                                        <span className="text-gray-400">Thứ {oh.day_of_week + 1}</span>
                                        <span className="text-blue-200">{oh.open_time} - {oh.close_time}</span>
                                    </li>
                                )) || <li className="text-gray-500 italic">Đang cập nhật...</li>}
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-start group">
                        <div className="p-3 bg-teal-500/10 rounded-2xl mr-5 group-hover:bg-teal-500/20 transition-colors">
                            <MapPin className="w-6 h-6 text-teal-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 opacity-60">Địa chỉ cụ thể</p>
                            <p className="text-sm font-bold leading-relaxed text-gray-200">{location.address}</p>
                        </div>
                    </div>

                    {(location.price || location.price_range_min) && (
                        <div className="flex items-start group">
                            <div className="p-3 bg-orange-500/10 rounded-2xl mr-5 group-hover:bg-orange-500/20 transition-colors">
                                <span className="text-orange-400 font-bold text-xl">₫</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 opacity-60">Giá tham khảo</p>
                                <p className="text-xl font-black text-orange-400">
                                    {location.price 
                                        ? `${location.price.toLocaleString('vi-VN')} đ` 
                                        : `${location.price_range_min?.toLocaleString('vi-VN')} đ+`}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-10 border-t border-white/10 space-y-4">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-4xl font-black transition-all flex items-center justify-center shadow-xl shadow-blue-500/30 text-sm tracking-widest active:scale-95 group">
                            <Share2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> CHIA SẺ VỚI BẠN BÈ
                        </button>
                        <a
                            href={location.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-white/10 hover:bg-white/20 py-5 rounded-4xl font-black transition-all block text-center text-sm tracking-widest border border-white/5 active:scale-95"
                        >
                            XEM TRÊN GOOGLE MAPS
                        </a>
                    </div>
                </div>
            </div>

            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-[3rem] p-10 border border-blue-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter">Gợi ý từ AI ⚡</h3>
                <p className="text-sm text-gray-600 mb-8 font-bold leading-relaxed italic border-l-4 border-blue-500/30 pl-4">
                    "Theo thống kê, thời điểm vắng khách nhất ở đây là tầm 8-10 giờ sáng. Bạn nên đi vào giờ này để có những tấm hình đẹp nhất!"
                </p>
                <Link to="/chatbot" className="inline-flex items-center text-blue-600 font-black text-xs hover:gap-2 transition-all uppercase tracking-widest group">
                    Hỏi AI trợ lý thêm <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
};

export default LocationSidebar;
