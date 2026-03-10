import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { newsService } from '../../services/api';
import type { Post } from '../../types';
import { MessageSquare, ThumbsUp, Calendar, User, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [liked, setLiked] = useState(false);

    const fetchPost = async () => {
        if (!id) return;
        try {
            const response = await newsService.getById(id);
            setPost(response.data);
        } catch (error) {
            console.error('Error fetching post:', error);
            navigate('/news');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    const handleLike = async () => {
        if (!id || !user) return;
        try {
            const response = await newsService.toggleLike(id);
            setLiked(response.data.liked);
            // Refresh post to get updated count
            const postRes = await newsService.getById(id);
            setPost(postRes.data);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !user || !comment.trim() || submitting) return;
        
        setSubmitting(true);
        try {
            await newsService.addComment(id, comment);
            setComment('');
            // Refresh post to get new comments
            const postRes = await newsService.getById(id);
            setPost(postRes.data);
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="pt-32 pb-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!post) return null;

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/news" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-8 font-medium transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Quay lại danh sách
                </Link>

                <motion.article 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100"
                >
                    {post.image_url && (
                        <div className="h-[400px] w-full overflow-hidden">
                            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        <div className="flex items-center text-sm text-gray-500 mb-6 gap-6">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                {new Date(post.created_at).toLocaleDateString('vi-VN', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                            <span className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-blue-500" />
                                {post.author_name}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 leading-tight">
                            {post.title}
                        </h1>

                        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-12">
                            {post.content}
                        </div>

                        <div className="flex items-center gap-6 py-8 border-t border-b border-gray-100 mb-12">
                            <button 
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                                    liked ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                                disabled={!user}
                            >
                                <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                                {post.likes_count} Thích
                            </button>
                            <div className="flex items-center gap-2 text-gray-600 font-bold px-4">
                                <MessageSquare className="w-5 h-5" />
                                {post.comments_count} Bình luận
                            </div>
                        </div>

                        {/* Comments Section */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Bình luận</h2>
                            
                            {user ? (
                                <form onSubmit={handleComment} className="mb-12">
                                    <div className="relative">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Chia sẻ cảm nghĩ của bạn..."
                                            className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitting || !comment.trim()}
                                            className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-8 bg-blue-50 border border-blue-100 rounded-3xl text-center mb-12">
                                    <p className="text-blue-800 font-medium mb-4">Bạn cần đăng nhập để bình luận bài viết này.</p>
                                    <Link to="/login" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">
                                        Đăng nhập ngay
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-8">
                                {post.comments?.map((c) => (
                                    <div key={c.id} className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-md">
                                                {c.user_avatar ? (
                                                    <img src={c.user_avatar} alt={c.user_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    c.user_name.charAt(0)
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="bg-gray-50 p-6 rounded-[2rem] rounded-tl-none">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-gray-900">{c.user_name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(c.created_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 leading-relaxed">{c.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {(!post.comments || post.comments.length === 0) && (
                                    <p className="text-center text-gray-500 py-8 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                )}
                            </div>
                        </section>
                    </div>
                </motion.article>
            </div>
        </div>
    );
};

export default NewsDetail;
