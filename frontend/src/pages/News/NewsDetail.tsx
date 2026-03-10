import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { newsService } from '../../services/api';
import type { Post, Comment as PostComment } from '../../types';
import { MessageSquare, ThumbsUp, Calendar, User, ArrowLeft, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Image Gallery ────────────────────────────────────────────────────────────
const ImageGallery: React.FC<{ images: { image_url: string }[] }> = ({ images }) => {
    const [current, setCurrent] = useState(0);
    if (!images.length) return null;

    if (images.length === 1) {
        return (
            <div className="h-[420px] w-full overflow-hidden">
                <img src={images[0].image_url} alt="Post cover" className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className="relative h-[420px] w-full overflow-hidden bg-gray-900">
            <AnimatePresence mode="wait">
                <motion.img
                    key={current}
                    src={images[current].image_url}
                    alt={`Photo ${current + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                />
            </AnimatePresence>

            {/* Prev / Next */}
            <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 bg-black/50 text-white text-sm font-medium px-3 py-1 rounded-full">
                {current + 1}/{images.length}
            </div>
        </div>
    );
};

// ─── Comment Card ─────────────────────────────────────────────────────────────
interface CommentCardProps {
    comment: PostComment;
    isReply?: boolean;
    user: any;
    onReply: (id: string, name: string) => void;
    onLikeComment: (commentId: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment, isReply, user, onReply, onLikeComment }) => (
    <div className={`flex gap-${isReply ? '3' : '4'} group`}>
        {/* Avatar */}
        <div className="shrink-0">
            <div className={`${isReply ? 'w-8 h-8 rounded-xl' : 'w-12 h-12 rounded-2xl'} bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-md`}>
                {comment.user_avatar ? (
                    <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                ) : (
                    <span className={isReply ? 'text-sm' : 'text-lg'}>{comment.user_name.charAt(0)}</span>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="grow">
            <div className={`bg-gray-50 ${isReply ? 'p-4' : 'p-6'} rounded-[2em] rounded-tl-none border border-gray-100/50 shadow-sm relative`}>
                <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold text-gray-900 ${isReply ? 'text-sm' : ''}`}>{comment.user_name}</span>
                    <span className={`${isReply ? 'text-[11px]' : 'text-xs'} text-gray-400 font-medium`}>
                        {new Date(comment.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className={`text-gray-700 leading-relaxed ${isReply ? 'text-sm' : ''}`}>{comment.content}</p>

                {/* Like badge */}
                {comment.likes_count > 0 && (
                    <div className="absolute -bottom-3 -right-2 bg-white px-2 py-0.5 rounded-full shadow-md border border-gray-100 flex items-center gap-1.5 text-xs font-bold text-gray-600 z-10">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <ThumbsUp className="w-2.5 h-2.5 text-white" />
                        </div>
                        {comment.likes_count}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-4 mt-2 ml-4 ${isReply ? 'text-xs' : 'text-sm'} font-bold text-gray-500`}>
                <button
                    onClick={() => {
                        if (!user) { toast.error('Vui lòng đăng nhập để thích bình luận!'); return; }
                        onLikeComment(comment.id);
                    }}
                    className={`hover:text-blue-600 transition-colors ${comment.user_liked ? 'text-blue-600' : ''}`}
                >
                    {comment.user_liked ? '❤️ Đã thích' : 'Thích'}
                </button>
                <button
                    onClick={() => {
                        if (!user) { toast.error('Vui lòng đăng nhập để phản hồi!'); return; }
                        onReply(comment.id, comment.user_name);
                    }}
                    className="hover:text-blue-600 transition-colors"
                >
                    Phản hồi
                </button>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                    {comment.replies.map(reply => (
                        <div key={reply.id} className="flex gap-3 mt-4">
                            <div className="shrink-0">
                                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                                    {reply.user_avatar ? (
                                        <img src={reply.user_avatar} alt={reply.user_name} className="w-full h-full object-cover" />
                                    ) : reply.user_name.charAt(0)}
                                </div>
                            </div>
                            <div className="grow">
                                <div className="bg-gray-50 p-4 rounded-[2em] rounded-tl-none border border-gray-100/50 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="font-bold text-gray-900 text-sm">{reply.user_name}</span>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            {new Date(reply.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-sm">
                                        <span className="font-semibold text-blue-600 opacity-80 hover:opacity-100 cursor-pointer transition-opacity mr-1">
                                            @{comment.user_name}
                                        </span>
                                        {reply.content}
                                    </p>
                                    {reply.likes_count > 0 && (
                                        <div className="absolute -bottom-2 -right-2 bg-white px-2 py-0.5 rounded-full shadow-md border border-gray-100 flex items-center gap-1.5 text-xs font-bold text-gray-600 z-10">
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                                                <ThumbsUp className="w-2 h-2 text-white" />
                                            </div>
                                            {reply.likes_count}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-1.5 ml-4 text-xs font-bold text-gray-500">
                                    <button
                                        onClick={() => {
                                            if (!user) { toast.error('Vui lòng đăng nhập!'); return; }
                                            onLikeComment(reply.id);
                                        }}
                                        className={`hover:text-blue-600 transition-colors ${reply.user_liked ? 'text-blue-600' : ''}`}
                                    >
                                        {reply.user_liked ? '❤️ Đã thích' : 'Thích'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!user) { toast.error('Vui lòng đăng nhập!'); return; }
                                            onReply(comment.id, reply.user_name);
                                        }}
                                        className="hover:text-blue-600 transition-colors"
                                    >
                                        Phản hồi
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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

    // ── Optimistic like for post ──
    const handleLike = async () => {
        if (!id) return;
        if (!user) { toast.error('Vui lòng đăng nhập để thích bài viết!'); return; }

        // Optimistic update
        setPost(prev => prev ? {
            ...prev,
            user_liked: !prev.user_liked,
            likes_count: prev.user_liked ? prev.likes_count - 1 : prev.likes_count + 1
        } : prev);

        try {
            await newsService.toggleLike(id);
        } catch {
            // Rollback
            setPost(prev => prev ? {
                ...prev,
                user_liked: !prev.user_liked,
                likes_count: prev.user_liked ? prev.likes_count - 1 : prev.likes_count + 1
            } : prev);
        }
    };

    // ── Optimistic like for comment (recursive update) ──
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

        // Optimistic update
        setPost(prev => prev ? { ...prev, comments: updateCommentLike(prev.comments || [], commentId) } : prev);

        try {
            await newsService.toggleCommentLike(id, commentId);
        } catch {
            // Rollback
            setPost(prev => prev ? { ...prev, comments: updateCommentLike(prev.comments || [], commentId) } : prev);
        }
    };

    // ── Submit comment ──
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
            // Refresh to get the new comment tree
            await fetchPost();
        } catch {
            toast.error('Không thể đăng bình luận. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = (id: string, name: string) => {
        setReplyingTo({ id, name });
        // Scroll to comment box
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
                <Link to="/news" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-8 font-medium transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Quay lại danh sách
                </Link>

                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100"
                >
                    {/* Image Gallery */}
                    <ImageGallery images={galleryImages} />

                    <div className="p-8 md:p-12">
                        {/* Meta */}
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

                        {/* Like / Comment count bar */}
                        <div className="flex items-center gap-6 py-8 border-t border-b border-gray-100 mb-12">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${post.user_liked
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

                        {/* Comments Section */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Bình luận</h2>

                            {user ? (
                                <form onSubmit={handleComment} className="mb-12">
                                    <div className="relative">
                                        {replyingTo && (
                                            <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-t-2xl border border-b-0 border-blue-100/50">
                                                <span className="text-sm text-blue-800 font-medium">
                                                    Đang trả lời <strong>{replyingTo.name}</strong>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyingTo(null)}
                                                    className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                        <textarea
                                            id="comment-input"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder={replyingTo ? `Viết câu trả lời cho ${replyingTo.name}...` : 'Chia sẻ cảm nghĩ của bạn...'}
                                            className={`w-full p-6 bg-gray-50 border border-gray-100 ${replyingTo ? 'rounded-b-3xl rounded-t-none' : 'rounded-3xl'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px] shadow-sm`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitting || !comment.trim()}
                                            className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {submitting
                                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                : <Send className="w-5 h-5" />
                                            }
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
                                    <CommentCard
                                        key={c.id}
                                        comment={c}
                                        user={user}
                                        onReply={handleReply}
                                        onLikeComment={handleCommentLike}
                                    />
                                ))}

                                {(!post.comments || post.comments.length === 0) && (
                                    <p className="text-center text-gray-500 py-8 italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        Chưa có bình luận nào. Hãy là người đầu tiên!
                                    </p>
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
