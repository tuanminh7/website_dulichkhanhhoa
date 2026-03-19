import React from 'react';
import { MessageSquare, ShieldCheck, Send, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Review, User } from '../../types';
import StarPicker from './StarPicker';
import RatingSummary from './RatingSummary';

interface ReviewSectionProps {
    user: User | null;
    reviews: Review[];
    avgRating: number;
    rating: number;
    setRating: (v: number) => void;
    reviewComment: string;
    setReviewComment: (v: string) => void;
    submittingReview: boolean;
    hasReviewed: boolean;
    handleSubmitReview: (e: React.FormEvent) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
    user,
    reviews,
    avgRating,
    rating,
    setRating,
    reviewComment,
    setReviewComment,
    submittingReview,
    hasReviewed,
    handleSubmitReview
}) => {
    return (
        <div className="pt-12 border-t border-gray-100">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Đánh giá từ du khách</h2>
            </div>

            <RatingSummary reviews={reviews} avgRating={avgRating} />

            <AnimatePresence mode="wait">
                {!user ? (
                    <motion.div
                        key="login-prompt"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 bg-blue-50 border border-blue-100 rounded-[2.5rem] text-center mb-12 shadow-sm"
                    >
                        <Star className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                        <p className="text-blue-900 font-bold mb-6 text-lg">Đăng nhập để chia sẻ đánh giá của bạn về địa điểm này.</p>
                        <Link
                            to="/login"
                            className="inline-block px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                        >
                            ĐĂNG NHẬP NGAY
                        </Link>
                    </motion.div>
                ) : hasReviewed ? (
                    <motion.div
                        key="already-reviewed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-teal-50 border border-teal-100 rounded-3xl text-center mb-12 flex items-center justify-center gap-3"
                    >
                        <ShieldCheck className="w-6 h-6 text-teal-500" />
                        <p className="text-teal-700 font-bold italic">Bạn đã đánh giá địa điểm này. Cảm ơn phản hồi của bạn!</p>
                    </motion.div>
                ) : (
                    <motion.form
                        key="review-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmitReview}
                        className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 mb-12 shadow-sm"
                    >
                        <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wider">Viết đánh giá của bạn</h3>
                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Chất lượng dịch vụ</label>
                            <StarPicker value={rating} onChange={setRating} />
                        </div>
                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nhận xét chi tiết</label>
                            <textarea
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                placeholder="Hãy mô tả chi tiết trải nghiệm của bạn (vị trí, dịch vụ, giá cả...)"
                                rows={4}
                                className="w-full p-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm font-medium shadow-inner transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submittingReview || rating === 0}
                            className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl shadow-blue-500/40 active:scale-95 uppercase tracking-widest text-xs"
                        >
                            {submittingReview
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <Send className="w-4 h-4" />
                            }
                            Gửi đánh giá ngay
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {reviews.length > 0 ? (
                    reviews.map((rev, idx) => (
                        <motion.div
                            key={rev.id}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden shrink-0 shadow-lg border-2 border-white">
                                        {rev.user?.avatar
                                            ? <img src={rev.user.avatar} alt={rev.user.fullname} className="w-full h-full object-cover" />
                                            : (rev.user?.fullname || 'U').charAt(0)
                                        }
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 text-lg leading-tight">{rev.user?.fullname || 'Du khách ẩn danh'}</h4>
                                        <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                                            {new Date(rev.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                    ))}
                                </div>
                            </div>
                            {rev.comment && (
                                <p className="text-gray-600 leading-relaxed font-medium pl-2 border-l-4 border-blue-500/20 italic">
                                    "{rev.comment}"
                                </p>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-6 opacity-50" />
                        <p className="text-gray-400 font-bold text-lg">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
