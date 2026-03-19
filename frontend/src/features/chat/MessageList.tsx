import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Map, Utensils, Navigation, Calculator } from 'lucide-react';
import type { ChatMessage } from '../../types';
import MessageItem from './MessageItem';

interface MessageListProps {
    messages: ChatMessage[];
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
    { icon: Utensils, text: "Gợi ý các quán hải sản ngon rẻ ở Nha Trang", color: "from-orange-500 to-amber-500" },
    { icon: Map, text: "Lên lịch trình 3 ngày 2 đêm tại Cam Ranh", color: "from-teal-500 to-emerald-500" },
    { icon: Calculator, text: "Ước tính chi phí đi tự túc đảo Bình Ba", color: "from-violet-500 to-purple-600" },
    { icon: Navigation, text: "Cách di chuyển từ sân bay về trung tâm", color: "from-blue-500 to-cyan-500" },
];

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, messagesEndRef, onSuggestionClick }) => {
    return (
        <div className="grow overflow-y-auto custom-scrollbar relative" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #f1f5fb 100%)' }}>
            {/* Subtle dot pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ backgroundImage: 'radial-gradient(#c7d7f0 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            />

            <div className="relative z-10 px-4 md:px-8 lg:px-12 xl:px-20 py-6 space-y-6 max-w-5xl mx-auto w-full">
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22 }}
                            className="text-center py-10 md:py-16"
                        >
                            {/* Bot icon with glow */}
                            <div className="relative inline-flex mb-8">
                                <div className="absolute inset-0 rounded-3xl bg-blue-500 opacity-20 blur-2xl scale-150" />
                                <div className="relative w-24 h-24 bg-linear-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                                    <Bot className="w-12 h-12 text-white" />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md"
                                    >
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                    </motion.div>
                                </div>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
                                Xin chào du khách! 👋
                            </h2>
                            <p className="text-slate-500 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                                Tôi là <span className="font-bold text-blue-600">AI Tourism Scout</span> – chuyên gia tư vấn du lịch Khánh Hòa.
                                Bạn muốn khám phá điều gì hôm nay?
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
                                {suggestions.map((s, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 + 0.2 }}
                                        whileHover={{ y: -3, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSuggestionClick(s.text)}
                                        className="p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium hover:border-blue-300 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 transition-all text-left flex items-start gap-3 group"
                                    >
                                        <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shrink-0 shadow-sm`}>
                                            <s.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="leading-snug pt-0.5 group-hover:text-slate-900 transition-colors">{s.text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((msg) => (
                        <MessageItem key={msg.id} msg={msg} />
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <motion.div
                            key="typing"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            className="flex justify-start"
                        >
                            <div className="flex items-end gap-3">
                                <div className="w-8 h-8 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-slate-100 rounded-3xl rounded-bl-lg px-5 py-3.5 shadow-sm flex items-center gap-2">
                                    {[0, 1, 2].map(i => (
                                        <motion.span
                                            key={i}
                                            animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                                            className="w-2 h-2 bg-blue-500 rounded-full"
                                        />
                                    ))}
                                    <span className="text-xs text-slate-400 font-medium ml-1">Đang soạn...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} className="h-4" />
            </div>
        </div>
    );
};

export default MessageList;
