import React from 'react';
import { motion } from 'framer-motion';
import { Send, Bot } from 'lucide-react';

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    isTyping: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, onSendMessage, isTyping }) => {
    return (
        <div className="p-6 md:p-8 bg-transparent">
            <form onSubmit={onSendMessage} className="max-w-5xl mx-auto relative">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-4xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000"></div>
                    <div className="relative flex gap-3 p-2 bg-white rounded-4xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 transition-all duration-300 group-focus-within:border-blue-200">
                        <div className="grow relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isTyping ? "AI đang trả lời..." : "Hỏi bất cứ điều gì..."}
                                className={`w-full p-4 pl-6 bg-transparent focus:outline-none text-slate-700 font-medium placeholder:text-slate-400 ${isTyping ? 'cursor-not-allowed' : ''}`}
                                autoFocus
                                disabled={isTyping}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="bg-linear-to-br from-blue-600 to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 text-white w-14 h-14 rounded-3xl transition-all duration-500 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 group overflow-hidden"
                        >
                            {isTyping ? (
                                <div className="flex gap-1">
                                    <motion.span
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                    <motion.span
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                    <motion.span
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                </div>
                            ) : (
                                <Send className={`w-6 h-6 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${!input.trim() ? '' : 'animate-pulse'}`} />
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium text-center mt-5 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                    Sử dụng trí tuệ thông minh nhân tạo để tư vấn du lịch. Luôn kiểm tra lại thông tin.
                </p>
            </form>
        </div>
    );
};

export default ChatInput;
