import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { locationService, interactionService } from '../../services/api';
import type { Location, Review } from '../../types';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Extracted Components
import LocationHero from '../../features/locations/LocationHero';
import ReviewSection from '../../features/locations/ReviewSection';
import LocationSidebar from '../../features/locations/LocationSidebar';

const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [location, setLocation] = useState<Location | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    // Review form state
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
            await fetchData(location.id);
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Không thể gửi đánh giá';
            toast.error(msg);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return (
        <div className="pt-32 pb-20 flex justify-center bg-white min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!location) return (
        <div className="pt-32 text-center text-red-500 bg-white min-h-screen">
            <h2 className="text-2xl font-bold">Không tìm thấy địa điểm.</h2>
        </div>
    );

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : location.rating_avg || 0;

    return (
        <div className="pb-20 bg-white min-h-screen">
            <LocationHero 
                location={location} 
                avgRating={avgRating} 
                reviewsCount={reviews.length} 
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-16">
                        {/* Description */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Giới thiệu về điểm đến</h2>
                            <p className="text-gray-600 text-xl leading-relaxed whitespace-pre-line font-medium opacity-90">
                                {location.description || 'Chưa có mô tả chi tiết cho địa điểm này.'}
                            </p>
                        </section>

                        {/* Photo Gallery */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Hình ảnh thực tế</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {location.images?.map((img, idx) => (
                                    <motion.div
                                        key={img.id}
                                        whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 1 : -1 }}
                                        className={`rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer border-4 border-white ${
                                            idx === 0 ? 'col-span-2 row-span-2 h-[500px]' : 'h-56'
                                        }`}
                                    >
                                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                    </motion.div>
                                )) || <p className="text-gray-400 italic">Không có hình ảnh bổ sung.</p>}
                            </div>
                        </section>

                        {/* Reviews Section */}
                        <ReviewSection 
                            user={user}
                            reviews={reviews}
                            avgRating={avgRating}
                            rating={rating}
                            setRating={setRating}
                            reviewComment={reviewComment}
                            setReviewComment={setReviewComment}
                            submittingReview={submittingReview}
                            hasReviewed={hasReviewed}
                            handleSubmitReview={handleSubmitReview}
                        />
                    </div>

                    <LocationSidebar 
                        location={location}
                        isFavorite={isFavorite}
                        handleToggleFavorite={handleToggleFavorite}
                    />
                </div>
            </div>
        </div>
    );
};

export default LocationDetail;
