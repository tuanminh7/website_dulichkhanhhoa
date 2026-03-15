import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { locationService, interactionService } from '../../services/api';
import type { Location, Review } from '../../types';
import { MapPin, Clock, Star, Heart, Share2, ArrowLeft, MessageSquare, ShieldCheck, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Star Picker ──────────────────────────────────────────────────────────────
const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${
                            s <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'
                        }`}
                    />
                </button>
            ))}
            {value > 0 && (
                <span className="ml-2 text-sm font-bold text-amber-500">
                    {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][value]}
                </span>
            )}
        </div>
    );
};

// ─── Rating Summary ───────────────────────────────────────────────────────────
const RatingSummary: React.FC<{ reviews: Review[]; avgRating: number }> = ({ reviews, avgRating }) => {
    if (reviews.length === 0) return null;
    const counts = [5, 4, 3, 2, 1].map(s => ({
        star: s,
        count: reviews.filter(r => r.rating === s).length
    }));
    return (
        <div className="flex items-center gap-8 p-6 bg-amber-50 rounded-3xl mb-8 border border-amber-100">
            <div className="text-center shrink-0">
                <p className="text-5xl font-black text-amber-500">{avgRating.toFixed(1)}</p>
                <div className="flex items-center gap-0.5 justify-center my-1">
                    {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />
                    ))}
                </div>
                <p className="text-sm text-gray-500 font-medium">{reviews.length} đánh giá</p>
            </div>
            <div className="flex-1 space-y-1.5">
                {counts.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 w-3">{star}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [location, setLocation] = useState<Location | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    // Review form
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    const fetchData = useCallback(async (locationId: number) => {
        try {
            const [locRes, revRes] = await Promise.all([
                locationService.getById(locationId),
                interactionService.getReviews(locationId)
            ]);
            setLocation(locRes.data);
            const revs: Review[] = Array.isArray(revRes.data) ? revRes.data : [];
            setReviews(revs);
            // Check if current user already reviewed
            if (user) {
                setHasReviewed(revs.some(r => r.user_id === user.id));
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (id) fetchData(parseInt(id));
    }, [id, fetchData]);

    const handleToggleFavorite = async () => {
        if (!user) { toast.error('Vui lòng đăng nhập để yêu thích địa điểm!'); return; }
        if (!location) return;
        try {
            await interactionService.toggleFavorite(location.id);
            setIsFavorite(!isFavorite);
            toast.success(isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích!');
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error('Vui lòng đăng nhập để đánh giá!'); return; }
        if (rating === 0) { toast.error('Vui lòng chọn số sao!'); return; }
        if (!location) return;

        setSubmittingReview(true);
        try {
            await interactionService.addReview(location.id, { rating, comment: reviewComment });
            toast.success('Cảm ơn bạn đã đánh giá!');
            setRating(0);
            setReviewComment('');
            setHasReviewed(true);
            // Reload data
            await fetchData(location.id);
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Không thể gửi đánh giá';
            toast.error(msg);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="pt-32 text-center">Đang tải thông tin...</div>;
    if (!location) return <div className="pt-32 text-center text-red-500">Không tìm thấy địa điểm.</div>;

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : location.rating_avg || 0;

    return (
        <div className="pt-20 pb-20 bg-white">
            {/* Hero Image */}
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
                            <span className="font-bold">{avgRating.toFixed(1)}</span>
                            <span className="text-xs ml-1 text-orange-300">({reviews.length})</span>
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
                        {/* Description */}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Giới thiệu</h2>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {location.description || 'Chưa có mô tả chi tiết cho địa điểm này.'}
                            </p>
                        </div>

                        {/* Photo Gallery */}
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

                        {/* Reviews Section */}
                        <div className="pt-12 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900">Đánh giá từ du khách</h2>
                            </div>

                            {/* Rating Summary */}
                            <RatingSummary reviews={reviews} avgRating={avgRating} />

                            {/* Review Form */}
                            <AnimatePresence mode="wait">
                                {!user ? (
                                    <motion.div
                                        key="login-prompt"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-8 bg-blue-50 border border-blue-100 rounded-3xl text-center mb-8"
                                    >
                                        <Star className="w-10 h-10 text-blue-300 mx-auto mb-3" />
                                        <p className="text-blue-800 font-medium mb-4">Đăng nhập để chia sẻ đánh giá của bạn về địa điểm này.</p>
                                        <Link
                                            to="/login"
                                            className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all"
                                        >
                                            Đăng nhập ngay
                                        </Link>
                                    </motion.div>
                                ) : hasReviewed ? (
                                    <motion.div
                                        key="already-reviewed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-6 bg-teal-50 border border-teal-100 rounded-3xl text-center mb-8"
                                    >
                                        <ShieldCheck className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                                        <p className="text-teal-700 font-semibold">Bạn đã đánh giá địa điểm này rồi. Cảm ơn!</p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="review-form"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handleSubmitReview}
                                        className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-8"
                                    >
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Viết đánh giá của bạn</h3>
                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-gray-600 mb-2">Chất lượng</label>
                                            <StarPicker value={rating} onChange={setRating} />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-gray-600 mb-2">Nhận xét (tùy chọn)</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={e => setReviewComment(e.target.value)}
                                                placeholder="Chia sẻ trải nghiệm của bạn tại đây..."
                                                rows={4}
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingReview || rating === 0}
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30"
                                        >
                                            {submittingReview
                                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                : <Send className="w-4 h-4" />
                                            }
                                            Gửi đánh giá
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Reviews List */}
                            <div className="space-y-6">
                                {reviews.length > 0 ? (
                                    reviews.map((rev, idx) => (
                                        <motion.div
                                            key={rev.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                                        {rev.user?.avatar
                                                            ? <img src={rev.user.avatar} alt={rev.user.fullname} className="w-full h-full object-cover" />
                                                            : (rev.user?.fullname || 'U').charAt(0)
                                                        }
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{rev.user?.fullname || 'Ẩn danh'}</h4>
                                                        <p className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1,2,3,4,5].map(s => (
                                                        <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {rev.comment && (
                                                <p className="text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                                            )}
                                        </motion.div>
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

                    {/* Sidebar */}
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
