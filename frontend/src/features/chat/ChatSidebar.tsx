import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Plus, Trash2, Bot, LogIn, MessageSquarePlus, ChevronRight } from 'lucide-react';
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
        <div className="w-full md:w-72 lg:w-80 bg-linear-to-b from-slate-50 to-white border-r border-slate-200/80 h-full hidden md:flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <History className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-slate-800 text-sm tracking-tight">
                            {user ? 'Lịch sử tư vấn' : 'Hội thoại'}
                        </h2>
                    </div>
                    {user && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCreateSession}
                            disabled={currentSessionId === null}
                            className={`p-2 rounded-xl transition-all text-sm font-semibold flex items-center gap-1.5 ${
                                currentSessionId === null
                                    ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
                            }`}
                            title="Đoạn chat mới"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-xs">Mới</span>
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Session list */}
            <div className="grow overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                {user ? (
                    <AnimatePresence>
                        {sessions.length > 0 ? (
                            sessions.map((s, idx) => (
                                <motion.button
                                    key={s.id}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => onSessionSelect(s.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border relative group ${
                                        currentSessionId === s.id
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'bg-white border-transparent hover:border-slate-200 hover:bg-white text-slate-600 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <MessageSquarePlus className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${currentSessionId === s.id ? 'text-blue-200' : 'text-slate-400'}`} />
                                            <p className="truncate text-[13px] font-medium leading-snug">
                                                {s.title || 'Đoạn chat không tên'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => onDeleteSession(s.id, e)}
                                            disabled={deletingSessionId === s.id}
                                            className={`shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                                currentSessionId === s.id
                                                    ? 'text-white/70 hover:text-white hover:bg-blue-700'
                                                    : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                            } ${deletingSessionId === s.id ? 'opacity-100' : ''}`}
                                        >
                                            {deletingSessionId === s.id ? (
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>

                                    <p className={`text-[10px] mt-1.5 ml-6 ${currentSessionId === s.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                        {new Date(s.started_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>

                                    {currentSessionId === s.id && (
                                        <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
                                    )}
                                </motion.button>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 px-6"
                            >
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <History className="w-7 h-7 text-slate-300" />
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">Bạn chưa có cuộc hội thoại nào.</p>
                                <p className="text-slate-400 text-xs mt-1">Bắt đầu chat để lưu lại!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 space-y-4 mt-2"
                    >
                        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1.5 text-sm">Lưu lại kỷ niệm?</h4>
                            <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
                                Đăng nhập để xem lại lịch sử tư vấn du lịch của bạn.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onLoginClick}
                                className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-300 transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                Đăng nhập ngay
                            </motion.button>
                        </div>

                        <div className="text-center">
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Chưa có tài khoản?</p>
                            <button
                                onClick={onRegisterClick}
                                className="mt-1.5 text-blue-600 font-bold text-sm hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                            >
                                Đăng ký miễn phí →
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer */}
            {user && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-white text-xs font-bold">{user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-slate-700 truncate">{user.full_name || 'Người dùng'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSidebar;
