import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { newsService } from '../../services/api';
import type { Post, Comment as PostComment } from '../../types';
import { MessageSquare, ThumbsUp, Calendar, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Extracted Components
import ImageGallery from '../../features/news/ImageGallery';
import CommentSection from '../../features/news/CommentSection';

const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPost = useCallback(async () => {
        if (!id) return;
        try {
            const response = await newsService.getById(id);
            setPost(response.data);
        } catch {
            navigate('/news');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { fetchPost(); }, [fetchPost]);

    const handleLike = async () => {
        if (!id) return;
        if (!user) { toast.error('Vui lòng đăng nhập để thích bài viết!'); return; }

        setPost(prev => prev ? {
            ...prev,
            user_liked: !prev.user_liked,
            likes_count: prev.user_liked ? prev.likes_count - 1 : prev.likes_count + 1
        } : prev);

        try {
            await newsService.toggleLike(id);
        } catch {
            setPost(prev => prev ? {
                ...prev,
                user_liked: !prev.user_liked,
                likes_count: prev.user_liked ? prev.likes_count - 1 : prev.likes_count + 1
            } : prev);
        }
    };

    const updateCommentLike = (comments: PostComment[], commentId: string): PostComment[] => {
        return comments.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    user_liked: !c.user_liked,
                    likes_count: c.user_liked ? c.likes_count - 1 : c.likes_count + 1
                };
            }
            if (c.replies?.length) {
                return { ...c, replies: updateCommentLike(c.replies, commentId) };
            }
            return c;
        });
    };

    const handleCommentLike = async (commentId: string) => {
        if (!id || !user) return;

        setPost(prev => prev ? { ...prev, comments: updateCommentLike(prev.comments || [], commentId) } : prev);

        try {
            await newsService.toggleCommentLike(id, commentId);
        } catch {
            setPost(prev => prev ? { ...prev, comments: updateCommentLike(prev.comments || [], commentId) } : prev);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !user || !comment.trim() || submitting) return;

        setSubmitting(true);
        try {
            if (replyingTo) {
                await newsService.replyComment(id, replyingTo.id, comment);
            } else {
                await newsService.addComment(id, comment);
            }
            setComment('');
            setReplyingTo(null);
            await fetchPost();
        } catch {
            toast.error('Không thể đăng bình luận. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = (id: string, name: string) => {
        setReplyingTo({ id, name });
        document.getElementById('comment-input')?.focus();
    };

    if (loading) return (
        <div className="pt-32 pb-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!post) return null;

    const galleryImages = post.images?.length
        ? post.images
        : post.image_url
            ? [{ image_url: post.image_url }]
            : [];

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/news" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-8 font-medium transition-colors group">
                    <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
                    Quay lại danh sách
                </Link>

                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100"
                >
                    <ImageGallery images={galleryImages} />

                    <div className="p-8 md:p-12">
                        <div className="flex items-center text-sm text-gray-500 mb-6 gap-6">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                {new Date(post.created_at).toLocaleDateString('vi-VN', {
                                    year: 'numeric', month: 'long', day: 'numeric'
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
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${
                                    post.user_liked
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <ThumbsUp className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
                                {post.likes_count} Thích
                            </button>
                            <div className="flex items-center gap-2 text-gray-600 font-bold px-4">
                                <MessageSquare className="w-5 h-5" />
                                {post.comments_count} Bình luận
                            </div>
                        </div>

                        <CommentSection
                            user={user}
                            comment={comment}
                            setComment={setComment}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            submitting={submitting}
                            handleComment={handleComment}
                            handleReply={handleReply}
                            handleCommentLike={handleCommentLike}
                            comments={post.comments || []}
                        />
                    </div>
                </motion.article>
            </div>
        </div>
    );
};

export default NewsDetail;
