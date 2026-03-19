import React from 'react';
import { Star } from 'lucide-react';
import type { Review } from '../../types';

interface RatingSummaryProps {
    reviews: Review[];
    avgRating: number;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({ reviews, avgRating }) => {
    if (reviews.length === 0) return null;
    const counts = [5, 4, 3, 2, 1].map(s => ({
        star: s,
        count: reviews.filter(r => r.rating === s).length
    }));
    return (
        <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-amber-50 rounded-[2.5rem] mb-12 border border-amber-100 shadow-sm animate-in fade-in zoom-in duration-500">
            <div className="text-center shrink-0">
                <p className="text-6xl font-black text-amber-500 leading-none mb-2">{avgRating.toFixed(1)}</p>
                <div className="flex items-center gap-0.5 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />
                    ))}
                </div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{reviews.length} đánh giá</p>
            </div>
            <div className="flex-1 w-full space-y-2">
                {counts.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-400 w-3">{star}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden border border-amber-100/30">
                            <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-4 text-right">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RatingSummary;
