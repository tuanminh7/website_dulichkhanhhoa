import React from 'react';
import { ThumbsUp } from 'lucide-react';
import type { Comment as PostComment } from '../../types';
import toast from 'react-hot-toast';

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
                    <span className={isReply ? 'text-sm' : 'text-lg'}>{comment.user_name?.charAt(0)}</span>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="grow">
            <div className={`bg-gray-50 ${isReply ? 'p-4' : 'p-6'} rounded-[2em] rounded-tl-none border border-gray-100/50 shadow-sm relative transition-shadow hover:shadow-md`}>
                <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold text-gray-900 ${isReply ? 'text-sm' : ''}`}>{comment.user_name}</span>
                    <span className={`${isReply ? 'text-[11px]' : 'text-xs'} text-gray-400 font-medium`}>
                        {new Date(comment.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className={`text-gray-700 leading-relaxed ${isReply ? 'text-sm' : ''}`}>{comment.content}</p>

                {/* Like badge */}
                {comment.likes_count > 0 && (
                    <div className="absolute -bottom-3 -right-2 bg-white px-2 py-0.5 rounded-full shadow-md border border-gray-100 flex items-center gap-1.5 text-xs font-bold text-gray-600 z-10 animate-in fade-in zoom-in duration-300">
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
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            isReply={true}
                            user={user}
                            onReply={onReply}
                            onLikeComment={onLikeComment}
                        />
                    ))}
                </div>
            )}
        </div>
    </div>
);

export default CommentCard;
