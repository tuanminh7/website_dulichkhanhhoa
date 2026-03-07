import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/api';
import type { ChatMessage, ChatSession } from '../../types';
import { Bot, User, Send, Plus, History, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (currentSessionId) {
            fetchMessages(currentSessionId);
        }
    }, [currentSessionId]);

    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages, isTyping]);

    const fetchSessions = async () => {
        try {
            const res = await chatService.getSessions();
            setSessions(res.data);
            if (res.data.length > 0 && !currentSessionId) {
                setCurrentSessionId(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const fetchMessages = async (id: number) => {
        try {
            const res = await chatService.getSessionMessages(id);
            setMessages(res.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !currentSessionId) return;

        const userMsg: any = {
            id: Date.now(),
            sender_type: 'USER',
            message_content: input,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await chatService.sendMessage(currentSessionId, input);
            setMessages(prev => [...prev, res.data]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const createNewSession = async () => {
        try {
            const res = await chatService.createSession(`Cuộc hội thoại mới ${sessions.length + 1}`);
            setSessions([res.data, ...sessions]);
            setCurrentSessionId(res.data.id);
            setMessages([]);
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    return (
        <div className="pt-20 h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar - Chat History */}
            <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full md:block hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900 flex items-center">
                        <History className="w-5 h-5 mr-2 text-blue-600" />
                        Lịch sử tư vấn
                    </h2>
                    <button
                        onClick={createNewSession}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Đoạn chat mới"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="grow overflow-y-auto p-3 space-y-2">
                    {sessions.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentSessionId(s.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${currentSessionId === s.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <p className="truncate text-sm">{s.title || 'Không có tiêu đề'}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(s.started_at).toLocaleDateString()}</p>
                        </button>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-center py-10 px-4">
                            <p className="text-gray-400 text-sm italic">Chưa có cuộc hội thoại nào.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="grow flex flex-col h-full relative">
                {/* Chat Header */}
                <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/30">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">AI Tourism Scout</h3>
                            <p className="text-xs text-teal-600">Sẵn sàng tư vấn cho bạn</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="Ước tính chi phí">
                            <Calculator className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors md:hidden" title="Lịch sử">
                            <History className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="grow overflow-y-auto p-6 space-y-6">
                    <AnimatePresence>
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: .8 }}
                                className="max-w-lg mx-auto text-center py-20"
                            >
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bot className="w-10 h-10 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Chào mừng bạn trở lại!</h2>
                                <p className="text-gray-500 text-lg">
                                    Hãy hỏi tôi bất cứ điều gì về du lịch Khánh Hòa. Ví dụ: "Gợi ý quán ăn ở Nha Trang" hoặc "Ước tính chi phí đi đảo 1 ngày".
                                </p>
                            </motion.div>
                        )}
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: msg.sender_type === 'USER' ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex ${msg.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[80%] ${msg.sender_type === 'USER' ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender_type === 'USER' ? 'ml-3 bg-gray-200 text-gray-600' : 'mr-3 bg-blue-100 text-blue-600'}`}>
                                        {msg.sender_type === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl shadow-sm ${msg.sender_type === 'USER' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                        <p className="text-sm leading-relaxed">{msg.message_content}</p>
                                        <span className={`text-[9px] mt-1 block ${msg.sender_type === 'USER' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {isTyping && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="flex items-center bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm space-x-1">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                        <div className="grow relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                                autoFocus
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1"
                                title="Sử dụng giọng nói"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || !currentSessionId}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-[10px] text-gray-400 text-center mt-3">
                        Hệ thống AI có thể nhầm lẫn thông tin. Vui lòng xác nhận lại độ chính xác.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
