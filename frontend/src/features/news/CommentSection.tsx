import React from 'react';
import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Comment as PostComment } from '../../types';
import CommentCard from './CommentCard';

interface CommentSectionProps {
    user: any;
    comment: string;
    setComment: (val: string) => void;
    replyingTo: { id: string; name: string } | null;
    setReplyingTo: (val: { id: string; name: string } | null) => void;
    submitting: boolean;
    handleComment: (e: React.FormEvent) => void;
    handleReply: (id: string, name: string) => void;
    handleCommentLike: (commentId: string) => void;
    comments: PostComment[];
}

const CommentSection: React.FC<CommentSectionProps> = ({
    user,
    comment,
    setComment,
    replyingTo,
    setReplyingTo,
    submitting,
    handleComment,
    handleReply,
    handleCommentLike,
    comments
}) => {
    return (
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
                    <Link to="/login" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95">
                        Đăng nhập ngay
                    </Link>
                </div>
            )}

            <div className="space-y-8">
                {comments?.map((c) => (
                    <CommentCard
                        key={c.id}
                        comment={c}
                        user={user}
                        onReply={handleReply}
                        onLikeComment={handleCommentLike}
                    />
                ))}

                {(!comments || comments.length === 0) && (
                    <p className="text-center text-gray-500 py-8 italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        Chưa có bình luận nào. Hãy là người đầu tiên!
                    </p>
                )}
            </div>
        </section>
    );
};

export default CommentSection;
