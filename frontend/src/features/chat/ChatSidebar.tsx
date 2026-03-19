import React from 'react';
import { motion } from 'framer-motion';
import { History, Plus, Trash2, Bot, LogIn } from 'lucide-react';
import type { ChatSession } from '../../types';

interface ChatSidebarProps {
    user: any;
    sessions: ChatSession[];
    currentSessionId: number | null;
    deletingSessionId: number | null;
    onSessionSelect: (id: number) => void;
    onCreateSession: () => void;
    onDeleteSession: (id: number, e: React.MouseEvent) => void;
    onLoginClick: () => void;
    onRegisterClick: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    user,
    sessions,
    currentSessionId,
    deletingSessionId,
    onSessionSelect,
    onCreateSession,
    onDeleteSession,
    onLoginClick,
    onRegisterClick
}) => {
    return (
        <div className="w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200 h-full md:flex md:flex-col hidden shadow-xl shadow-slate-200/50">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-linear-to-r from-white to-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center tracking-tight">
                    <History className="w-5 h-5 mr-2.5 text-blue-600" />
                    {user ? 'Lịch sử tư vấn' : 'Đăng nhập'}
                </h2>
                {user && (
                    <button
                        onClick={onCreateSession}
                        disabled={currentSessionId === null}
                        className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${currentSessionId === null
                            ? 'text-slate-300 cursor-not-allowed bg-slate-50 border-slate-100'
                            : 'hover:bg-blue-600 hover:text-white text-blue-600 shadow-sm hover:shadow-blue-200'}`}
                        title={currentSessionId === null ? "Đang ở đoạn chat mới" : "Đoạn chat mới"}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {user ? (
                    <>
                        {sessions.map(s => (
                            <motion.button
                                key={s.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSessionSelect(s.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border relative group ${currentSessionId === s.id
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 font-medium'
                                    : 'bg-white border-transparent hover:border-blue-100 hover:bg-blue-50/50 text-slate-600 shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="truncate text-sm pr-6 grow">{s.title || 'Đoạn chat không tên'}</p>
                                    <button
                                        onClick={(e) => onDeleteSession(s.id, e)}
                                        disabled={deletingSessionId === s.id}
                                        className={`absolute top-3.5 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${currentSessionId === s.id
                                                ? 'text-white/80 hover:text-white hover:bg-blue-700'
                                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                            } ${deletingSessionId === s.id ? 'opacity-100 cursor-not-allowed' : ''}`}
                                        title="Xóa đoạn chat"
                                    >
                                        {deletingSessionId === s.id ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center mt-2 opacity-70 text-[10px]">
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentSessionId === s.id ? 'bg-white' : 'bg-blue-400'}`} />
                                    {new Date(s.started_at).toLocaleDateString('vi-VN')}
                                </div>
                            </motion.button>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-12 px-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <History className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-400 text-sm font-medium italic">Bạn chưa có cuộc hội thoại nào.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-4 space-y-6">
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <Bot className="w-10 h-10 text-blue-600 mb-4" />
                            <h4 className="font-bold text-slate-800 mb-2">Lưu lại kỷ niệm?</h4>
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                Đăng nhập để xem lại lịch sử tư vấn và lưu trữ các gợi ý du lịch tuyệt vời của bạn.
                            </p>
                            <button
                                onClick={onLoginClick}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Đăng nhập ngay
                            </button>
                        </div>

                        <div className="text-center px-4">
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Hoặc bạn có thể</p>
                            <button
                                onClick={onRegisterClick}
                                className="mt-2 text-blue-600 font-bold hover:underline"
                            >
                                Đăng ký tài khoản mới
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
