import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { Search, Trash2, ChevronLeft, ChevronRight, FileText, ThumbsUp, MessageSquare, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AdminPost {
    id: string;
    title: string;
    content: string;
    author_name: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    image_url?: string;
}

const ManagePosts: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const page = parseInt(searchParams.get('page') || '1');
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const PER_PAGE = 15;

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

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getPosts({ page, per_page: PER_PAGE, search: search || undefined });
            const data = res.data;
            setPosts(data.posts || []);
            setTotalPages(data.pages || 1);
            setTotal(data.total || 0);
        } catch {
            toast.error('Không thể tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleDelete = async (postId: string) => {
        try {
            await adminService.deletePost(postId);
            toast.success('Đã xóa bài viết thành công');
            setConfirmDelete(null);
            fetchPosts();
        } catch {
            toast.error('Không thể xóa bài viết');
        }
    };

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý bài viết</h1>
                        <p className="text-gray-500 mt-1">
                            <span className="font-semibold text-blue-600">{total}</span> bài viết trong hệ thống
                        </p>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tiêu đề, nội dung..."
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
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold">Không có bài viết nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Bài viết</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Tác giả</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Thích</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Bình luận</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày đăng</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {posts.map((post, idx) => (
                                        <motion.tr
                                            key={post.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <td className="py-4 px-6 max-w-xs">
                                                <p className="font-semibold text-gray-900 text-sm line-clamp-1">{post.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{post.content}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-700 font-medium">{post.author_name}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-pink-500 font-semibold">
                                                    <ThumbsUp className="w-3.5 h-3.5" />{post.likes_count}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-blue-500 font-semibold">
                                                    <MessageSquare className="w-3.5 h-3.5" />{post.comments_count}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-500">
                                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/news/${post.id}`}
                                                        target="_blank"
                                                        className="p-2 rounded-xl bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Xem bài viết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setConfirmDelete(post.id)}
                                                        className="p-2 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                                                        title="Xóa bài viết"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
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
                {confirmDelete && (
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
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Xóa bài viết?</h3>
                            <p className="text-gray-500 text-center text-sm mb-6">Hành động này không thể hoàn tác. Tất cả bình luận và lượt thích cũng sẽ bị xóa.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                    Hủy
                                </button>
                                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
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

export default ManagePosts;
