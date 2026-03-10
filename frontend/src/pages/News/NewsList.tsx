import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsService } from '../../services/api';
import type { Post } from '../../types';
import { MessageSquare, ThumbsUp, Calendar, User, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NewsList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await newsService.getAll();
                setPosts(response.data.posts);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Tin tức & Review</h1>
                        <p className="text-gray-600 text-lg">Những trải nghiệm du lịch thực tế từ cộng đồng.</p>
                    </div>
                    <Link
                        to="/news/create"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 group"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                        Viết bài mới
                    </Link>
                </div>

                {/* Search */}
                <div className="relative mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài viết..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[450px] bg-gray-200 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filteredPosts.map((post) => (
                                <motion.div
                                    key={post.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100 flex flex-col h-full"
                                >
                                    <Link to={`/news/${post.id}`} className="block relative h-64 overflow-hidden">
                                        <img
                                            src={post.image_url || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop'}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                            <span className="text-white font-semibold">Đọc tiếp bài viết</span>
                                        </div>
                                    </Link>

                                    <div className="p-6 flex flex-col grow">
                                        <div className="flex items-center text-xs text-gray-500 mb-3 gap-4">
                                            <span className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="flex items-center">
                                                <User className="w-3 h-3 mr-1" />
                                                {post.author_name}
                                            </span>
                                        </div>

                                        <Link to={`/news/${post.id}`} className="block mb-4">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                                                {post.title}
                                            </h3>
                                        </Link>

                                        <p className="text-gray-600 line-clamp-3 mb-6 grow">
                                            {post.content}
                                        </p>

                                        <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center text-gray-500">
                                                    <ThumbsUp className="w-4 h-4 mr-1.5" />
                                                    <span className="text-sm font-medium">{post.likes_count}</span>
                                                </div>
                                                <div className="flex items-center text-gray-500">
                                                    <MessageSquare className="w-4 h-4 mr-1.5" />
                                                    <span className="text-sm font-medium">{post.comments_count}</span>
                                                </div>
                                            </div>
                                            <Link to={`/news/${post.id}`} className="text-blue-600 font-bold text-sm hover:underline">
                                                Chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && filteredPosts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Không tìm thấy bài viết nào</h3>
                        <p className="text-gray-500 mt-2">Hãy thử đổi từ khóa tìm kiếm khác.</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-6 text-blue-600 font-bold hover:underline"
                        >
                            Xóa tìm kiếm
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsList;
