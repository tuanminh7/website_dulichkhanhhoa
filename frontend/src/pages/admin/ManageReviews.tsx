import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import { Search, Trash2, ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AdminReview {
    id: number;
    location_id: number;
    location_name?: string;
    user_id: string;
    user?: { fullname: string; avatar?: string; email?: string };
    rating: number;
    comment?: string;
    created_at: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star
                key={s}
                className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
            />
        ))}
    </div>
);

const ManageReviews: React.FC = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const page = parseInt(searchParams.get('page') || '1');
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const PER_PAGE = 20;

    const setPage = (newPage: number | ((prev: number) => number)) => {
        const nextPage = typeof newPage === 'function' ? newPage(page) : newPage;
        const newParams = new URLSearchParams(searchParams);
        if (nextPage === 1) {
            newParams.delete('page');
        } else {
            newParams.set('page', nextPage.toString());
        }
        setSearchParams(newParams);
    };

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getReviews({ page, per_page: PER_PAGE, search: search || undefined });
            const data = res.data;
            setReviews(data.reviews || []);
            setTotalPages(data.pages || 1);
            setTotal(data.total || 0);
        } catch {
            toast.error('Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleDelete = async (reviewId: number) => {
        try {
            await adminService.deleteReview(reviewId);
            toast.success('Đã xóa đánh giá thành công');
            setConfirmDelete(null);
            fetchReviews();
        } catch {
            toast.error('Không thể xóa đánh giá');
        }
    };

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý đánh giá</h1>
                        <p className="text-gray-500 mt-1">
                            <span className="font-semibold text-blue-600">{total}</span> đánh giá địa điểm trong hệ thống
                        </p>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nội dung đánh giá..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                            Tìm
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold">Không có đánh giá nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Người đánh giá</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Địa điểm</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Sao</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhận xét</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {reviews.map((review, idx) => (
                                        <motion.tr
                                            key={review.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-amber-50/30 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                                                        {review.user?.avatar
                                                            ? <img src={review.user.avatar} alt="" className="w-full h-full object-cover" />
                                                            : (review.user?.fullname || 'U').charAt(0)
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{review.user?.fullname || 'Người dùng'}</p>
                                                        {review.user?.email && <p className="text-xs text-gray-400">{review.user.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                                    <span className="text-sm text-gray-700 font-medium">{review.location_name || `#${review.location_id}`}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col items-center gap-1">
                                                    <StarRating rating={review.rating} />
                                                    <span className="text-xs text-amber-600 font-bold">{review.rating}/5</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 max-w-xs">
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {review.comment || <span className="italic text-gray-400">Không có nhận xét</span>}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => setConfirmDelete(review.id)}
                                                    className="p-2 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                                                    title="Xóa đánh giá"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
                        onClick={() => setConfirmDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Xóa đánh giá?</h3>
                            <p className="text-gray-500 text-center text-sm mb-6">Đánh giá sẽ bị xóa vĩnh viễn và điểm đánh giá trung bình của địa điểm sẽ được cập nhật lại.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                    Hủy
                                </button>
                                <button onClick={() => handleDelete(confirmDelete!)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
                                    Xóa
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageReviews;
