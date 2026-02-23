import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { locationService, interactionService } from '../../services/api';
import type { Location, Review } from '../../types';
import { MapPin, Clock, Star, Heart, Share2, ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [location, setLocation] = useState<Location | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData(parseInt(id));
        }
    }, [id]);

    const fetchData = async (locationId: number) => {
        try {
            const [locRes, revRes] = await Promise.all([
                locationService.getById(locationId),
                interactionService.getReviews(locationId)
            ]);
            setLocation(locRes.data);
            setReviews(revRes.data);
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!location) return;
        try {
            await interactionService.toggleFavorite(location.id);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    if (loading) return <div className="pt-32 text-center">Đang tải thông tin...</div>;
    if (!location) return <div className="pt-32 text-center text-red-500">Không tìm thấy địa điểm.</div>;

    return (
        <div className="pt-20 pb-20 bg-white">
            <div className="relative h-[60vh] overflow-hidden">
                <img
                    src={location.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop'}
                    alt={location.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                <div className="absolute top-8 left-8">
                    <Link to="/locations" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all flex items-center font-bold">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại
                    </Link>
                </div>

                <div className="absolute bottom-12 left-12 right-12 text-white">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            {location.category?.name}
                        </span>
                        <div className="flex items-center text-orange-400 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 fill-current mr-1" />
                            <span className="font-bold">{location.rating_avg.toFixed(1)}</span>
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase leading-tight">{location.name}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-gray-200">
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                            <span className="font-medium">{location.address}</span>
                        </div>
                        <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 mr-2 text-teal-400" />
                            <span className="font-medium">Đã xác minh</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-12">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Giới thiệu</h2>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {location.description || 'Chưa có mô tả chi tiết cho địa điểm này.'}
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hình ảnh</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {location.images?.map((img, idx) => (
                                    <motion.div
                                        key={img.id}
                                        whileHover={{ scale: 1.05 }}
                                        className={`rounded-3xl overflow-hidden shadow-md cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2 h-96' : 'h-44'}`}
                                    >
                                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                    </motion.div>
                                )) || <p className="text-gray-400 italic">Không có hình ảnh bổ sung.</p>}
                            </div>
                        </div>

                        <div className="pt-12 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-bold text-gray-900">Đánh giá từ du khách</h2>
                                <button className="bg-gray-50 text-gray-900 px-6 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-100">
                                    Viết đánh giá
                                </button>
                            </div>

                            <div className="space-y-8">
                                {reviews.length > 0 ? (
                                    reviews.map((rev) => (
                                        <div key={rev.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm mr-4 border border-gray-100">
                                                        {rev.user?.fullname?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{rev.user?.fullname || 'Ẩn danh'}</h4>
                                                        <p className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-orange-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed font-medium italic">"{rev.comment}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                        <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-gray-200 sticky top-24">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">Thông tin nhanh</h3>
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`p-3 rounded-2xl backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <Clock className="w-5 h-5 mr-4 text-blue-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Giờ mở cửa</p>
                                        <ul className="text-sm font-medium space-y-1">
                                            {location.opening_hours?.map(oh => (
                                                <li key={oh.id} className="flex justify-between gap-4">
                                                    <span className="text-gray-400">Thứ {oh.day_of_week + 1}:</span>
                                                    <span>{oh.open_time} - {oh.close_time}</span>
                                                </li>
                                            )) || <li>Cập nhật sau</li>}
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <MapPin className="w-5 h-5 mr-4 text-teal-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Địa chỉ</p>
                                        <p className="text-sm font-medium leading-relaxed">{location.address}</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/10">
                                    <button className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black transition-all mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <Share2 className="w-5 h-5 mr-2" /> CHIA SẺ VỚI BẠN BÈ
                                    </button>
                                    <a
                                        href={location.map_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black transition-all block text-center"
                                    >
                                        XEM TRÊN GOOGLE MAPS
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-[2.5rem] p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Gợi ý từ AI</h3>
                            <p className="text-sm text-gray-600 mb-6 font-medium leading-relaxed">
                                "Theo thống kê, thời điểm vắng khách nhất ở đây là tầm 8-10 giờ sáng. Bạn nên đi vào giờ này để có những tấm hình đẹp nhất!"
                            </p>
                            <Link to="/chatbot" className="inline-flex items-center text-blue-600 font-bold text-sm hover:underline">
                                Hỏi AI thêm <ChevronRightIcon className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export default LocationDetail;
