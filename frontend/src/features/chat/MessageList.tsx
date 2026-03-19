import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send } from 'lucide-react';
import type { ChatMessage } from '../../types';
import MessageItem from './MessageItem';

interface MessageListProps {
    messages: ChatMessage[];
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onSuggestionClick: (suggestion: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, messagesEndRef, onSuggestionClick }) => {
    return (
        <div className="grow overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px] bg-opacity-20">
            <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="max-w-2xl mx-auto text-center py-16"
                    >
                        <div className="w-24 h-24 bg-linear-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                            <Bot className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Xin chào du khách!</h2>
                        <p className="text-slate-500 text-lg mb-12 max-w-md mx-auto leading-relaxed">
                            Tôi là chuyên gia du lịch ảo. Bạn cần trợ giúp gì cho chuyến đi Khánh Hòa sắp tới?
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {[
                                "Gợi ý các quán hải sản ngon rẻ ở Nha Trang",
                                "Lên lịch trình 3 ngày 2 đêm tại Cam Ranh",
                                "Ước tính chi phí đi tự túc đảo Bình Ba",
                                "Cách di chuyển từ sân bay về trung tâm"
                            ].map((q, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -4, backgroundColor: '#ffffff', borderColor: '#3b82f6' }}
                                    onClick={() => onSuggestionClick(q)}
                                    className="p-4 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left flex items-start group"
                                >
                                    <Send className="w-4 h-4 mr-3 mt-0.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
                                    {q}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
                {messages.map((msg) => (
                    <MessageItem key={msg.id} msg={msg} />
                ))}
                {isTyping && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start">
                        <div className="flex items-center ml-13 bg-white/80 backdrop-blur-sm border border-slate-100 p-4 px-6 rounded-3xl rounded-tl-none shadow-sm space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation_duration:0.6s]" />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation_duration:0.6s] [animation_delay:0.1s]" />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation_duration:0.6s] [animation_delay:0.2s]" />
                            <span className="text-xs text-blue-500 font-bold ml-2">Đang nghĩ...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
