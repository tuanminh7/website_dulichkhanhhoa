import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, Paperclip, Mic } from 'lucide-react';

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    isTyping: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, onSendMessage, isTyping }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest('form');
            if (form) form.requestSubmit();
        }
    };

    const charCount = input.length;
    const showCount = charCount > 200;

    return (
        <div className="relative px-4 md:px-8 lg:px-12 xl:px-20 py-4 md:py-5 bg-white/80 backdrop-blur-xl border-t border-slate-200/70">
            <form onSubmit={onSendMessage} className="max-w-5xl mx-auto">
                <div className="relative group">
                    {/* Glow ring */}
                    <div className="absolute -inset-px rounded-2xl bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[2px]" />

                    <div className="relative bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-200 group-focus-within:border-transparent transition-colors overflow-hidden">
                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isTyping ? 'AI đang trả lời...' : 'Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)'}
                            rows={1}
                            disabled={isTyping}
                            className="w-full resize-none px-5 pt-4 pb-2 bg-transparent focus:outline-none text-slate-700 text-[15px] placeholder:text-slate-400 disabled:cursor-not-allowed leading-relaxed"
                        />

                        {/* Bottom toolbar */}
                        <div className="flex items-center justify-between px-3 pb-3 pt-1">
                            {/* Left side tools */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                    title="Đính kèm (sắp ra mắt)"
                                    disabled
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                    title="Giọng nói (sắp ra mắt)"
                                    disabled
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                {showCount && (
                                    <span className={`text-xs font-medium ml-1 ${charCount > 1800 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {charCount}/2000
                                    </span>
                                )}
                            </div>

                            {/* Send button */}
                            <motion.button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                whileHover={{ scale: input.trim() && !isTyping ? 1.05 : 1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm ${
                                    input.trim() && !isTyping
                                        ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-md'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isTyping ? (
                                    <div className="flex gap-1 items-center">
                                        {[0, 1, 2].map(i => (
                                            <motion.span
                                                key={i}
                                                animate={{ scale: [1, 1.4, 1] }}
                                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Gửi
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium text-center mt-3 flex items-center justify-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    AI tư vấn du lịch Khánh Hòa · Luôn kiểm tra lại thông tin trước khi đặt chỗ
                </p>
            </form>
        </div>
    );
};

export default ChatInput;
