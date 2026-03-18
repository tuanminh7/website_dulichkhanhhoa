import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/api';
import type { ChatMessage, ChatSession } from '../../types';
import { Bot, User, Send, Plus, History, Calculator, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Chatbot: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [guestSessionToken, setGuestSessionToken] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);
    const telemetrySent = useRef(new Set<string>());
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isFetching.current) {
            if (user) {
                if (guestSessionToken) {
                    setGuestSessionToken(null);
                    setCurrentSessionId(null);
                    setMessages([]);
                }
                fetchSessions();
            } else {
                // If we lose user, clear everything
                setSessions([]);
                setCurrentSessionId(null);
                setGuestSessionToken(null);
                setMessages([]);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && currentSessionId) {
            fetchMessages(currentSessionId);
        }
    }, [currentSessionId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const extractImageSlug = (imageUrl: string) => {
        try {
            const normalizedUrl = imageUrl.startsWith('http') ? new URL(imageUrl).pathname : imageUrl;
            const cleanPath = normalizedUrl.split('?')[0].replace(/\/+$/, '');
            return cleanPath.split('/').pop() || null;
        } catch {
            return null;
        }
    };

    const trackChatbotTelemetry = (payload: {
        event_type: 'client_image_loaded' | 'client_image_error' | 'client_stream_missing_done';
        session_id?: number | null;
        message_id?: number | null;
        image_url?: string;
    }) => {
        const imageSlug = payload.image_url ? extractImageSlug(payload.image_url) : null;
        const dedupeKey = [
            payload.event_type,
            payload.session_id ?? 'none',
            payload.message_id ?? 'none',
            imageSlug ?? payload.image_url ?? 'no-image',
        ].join(':');

        if (telemetrySent.current.has(dedupeKey)) {
            return;
        }
        telemetrySent.current.add(dedupeKey);

        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token && token !== 'null') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch('/api/ai/telemetry', {
            method: 'POST',
            headers,
            keepalive: true,
            body: JSON.stringify({
                event_type: payload.event_type,
                session_id: payload.session_id,
                message_id: payload.message_id,
                image_slug: imageSlug,
                image_url: payload.image_url,
            })
        }).catch((error) => {
            console.error('Error sending chatbot telemetry:', error);
            telemetrySent.current.delete(dedupeKey);
        });
    };

    const fetchSessions = async () => {
        if (!user || isFetching.current) return;
        isFetching.current = true;
        try {
            const res = await chatService.getSessions();
            setSessions(res.data);
            if (res.data.length > 0) {
                if (currentSessionId === null) {
                    setCurrentSessionId(res.data[0].id);
                }
            } else {
                // If no sessions, just clear locally
                setCurrentSessionId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setSessions([]);
            setCurrentSessionId(null);
            setMessages([]);
        } finally {
            isFetching.current = false;
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
        if (!input.trim()) return;

        const userMsg: any = {
            id: Date.now(),
            sender_type: 'USER',
            message_content: input,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        let sessionId = currentSessionId;
        let nextGuestToken = guestSessionToken;
        
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token && token !== 'null') {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/ai/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    session_id: sessionId,
                    message: input,
                    guest_token: nextGuestToken
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error === 'GUEST_LIMIT_REACHED') {
                    setShowLimitModal(true);
                    setIsTyping(false);
                    return;
                }
                throw new Error('Failed to send message');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader found');

            const decoder = new TextDecoder();
            let aiMessageId: number | null = null;
            let currentText = '';
            let buffer = '';
            let didReceiveDone = false;

            while (true) {
                const { done, value } = await reader.read();

                if (value) {
                    buffer += decoder.decode(value, { stream: !done });
                }

                const lines = buffer.split('\n');
                buffer = done ? '' : (lines.pop() || '');

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(trimmedLine.slice(6));

                        if (data.session_id && !currentSessionId) {
                            setCurrentSessionId(data.session_id);
                            sessionId = data.session_id;
                        }

                        if (data.guest_token) {
                            nextGuestToken = data.guest_token;
                            setGuestSessionToken(data.guest_token);
                        }

                        if (data.text) {
                            currentText += data.text;
                            setMessages(prev => {
                                const lastMsg = prev[prev.length - 1];
                                if (lastMsg && lastMsg.sender_type === 'AI' && lastMsg.id === aiMessageId) {
                                    return [...prev.slice(0, -1), { ...lastMsg, message_content: currentText }];
                                } else {
                                    const newMsg: ChatMessage = {
                                        id: aiMessageId || Date.now() + 1,
                                        session_id: currentSessionId || data.session_id || 0,
                                        sender_type: 'AI',
                                        message_content: currentText,
                                        created_at: new Date().toISOString()
                                    };
                                    aiMessageId = newMsg.id;
                                    return [...prev, newMsg];
                                }
                            });
                        }

                        if (typeof data.replace_text === 'string') {
                            currentText = data.replace_text;
                            setMessages(prev => {
                                const lastMsg = prev[prev.length - 1];
                                if (lastMsg && lastMsg.sender_type === 'AI' && lastMsg.id === aiMessageId) {
                                    return [...prev.slice(0, -1), { ...lastMsg, message_content: currentText }];
                                }

                                const newMsg: ChatMessage = {
                                    id: aiMessageId || Date.now() + 1,
                                    session_id: sessionId || data.session_id || 0,
                                    sender_type: 'AI',
                                    message_content: currentText,
                                    created_at: new Date().toISOString()
                                };
                                aiMessageId = newMsg.id;
                                return [...prev, newMsg];
                            });
                        }

                        if (data.done && data.ai_message) {
                            didReceiveDone = true;
                            setMessages(prev => prev.map(m => (
                                m.sender_type === 'AI' && (m.id === aiMessageId || !m.id)
                                    ? { ...data.ai_message, id: aiMessageId || data.ai_message.id }
                                    : m
                            )));
                            if (user) {
                                fetchSessions();
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }

                if (done) break;
            }

            if (!didReceiveDone && currentText.trim()) {
                trackChatbotTelemetry({
                    event_type: 'client_stream_missing_done',
                    session_id: sessionId,
                    message_id: aiMessageId,
                });
                const safeText = currentText.trim().replace(/[,:;\-–—\s]+$/u, '');
                setMessages(prev => prev.map(m => (m.sender_type === 'AI' && m.id === aiMessageId)
                    ? { ...m, message_content: `${safeText}\n\n(Bạn muốn mình tiếp tục phần còn lại không?)` }
                    : m
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Add error message to UI
            const errorMsg: ChatMessage = {
                id: Date.now(),
                session_id: currentSessionId || 0,
                sender_type: 'AI',
                message_content: "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Bạn hãy thử lại sau nhé.",
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const createNewSession = () => {
        // Prevent creating a new session if the current one is already empty and unsaved
        if (currentSessionId === null && messages.length === 0) {
            return;
        }
        
        // If current session is empty but has an ID, we can still "reset" to a new unsaved session
        // but typically the user wants a new one only if the current one has content.
        if (messages.length === 0 && sessions.length > 0 && currentSessionId !== null) {
            // Already empty, just switch to null
            setCurrentSessionId(null);
            setGuestSessionToken(null);
            setMessages([]);
            return;
        }

        setCurrentSessionId(null);
        setGuestSessionToken(null);
        setMessages([]);
    };

    return (
        <div className="pt-20 h-screen bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Sidebar - Chat History */}
            <div className="w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200 h-full md:flex md:flex-col hidden shadow-xl shadow-slate-200/50">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-linear-to-r from-white to-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center tracking-tight">
                        <History className="w-5 h-5 mr-2.5 text-blue-600" />
                        {user ? 'Lịch sử tư vấn' : 'Đăng nhập'}
                    </h2>
                    {user && (
                        <button
                            onClick={() => createNewSession()}
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
                                    onClick={() => setCurrentSessionId(s.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${currentSessionId === s.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 font-medium'
                                        : 'bg-white border-transparent hover:border-blue-100 hover:bg-blue-50/50 text-slate-600 shadow-sm'}`}
                                >
                                    <p className="truncate text-sm pr-2">{s.title || 'Đoạn chat không tên'}</p>
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
                                    onClick={() => navigate('/login')}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Đăng nhập ngay
                                </button>
                            </div>
                            
                            <div className="text-center px-4">
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Hoặc bạn có thể</p>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="mt-2 text-blue-600 font-bold hover:underline"
                                >
                                    Đăng ký tài khoản mới
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="grow flex flex-col h-full relative bg-transparent">
                {/* Chat Header */}
                <div className="bg-white/70 backdrop-blur-md p-5 border-b border-slate-200/60 flex justify-between items-center shadow-[0_1px_10px_rgba(0,0,0,0.02)] z-10">
                    <div className="flex items-center">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white mr-4 shadow-xl shadow-blue-500/20 transform hover:rotate-12 transition-transform cursor-pointer">
                                <Bot className="w-7 h-7" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">AI Tourism Scout</h3>
                            <div className="flex items-center">
                                <span className="flex h-2 w-2 relative mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">Đang trực tuyến</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2.5">
                        <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Ước tính chi phí">
                            <Calculator className="w-5.5 h-5.5" />
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-800 rounded-xl transition-all md:hidden" title="Lịch sử">
                            <History className="w-5.5 h-5.5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
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
                                            onClick={() => setInput(q)}
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
                            <motion.div
                                key={msg.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.sender_type === 'USER' ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mt-1 transform group-hover:scale-110 transition-transform ${msg.sender_type === 'USER' ? 'ml-4 bg-slate-800 text-white' : 'mr-4 bg-white text-blue-600 border border-blue-50'}`}>
                                        {msg.sender_type === 'USER' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className={`p-5 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] ${msg.sender_type === 'USER' ? 'bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none' : 'bg-white/90 backdrop-blur-md text-slate-800 border border-slate-100/50 rounded-tl-none'}`}>
                                            <div className="text-[15px] leading-relaxed space-y-3 font-normal">
                                                {msg.message_content.split(/(!\[[\s\S]*?\]\([^)]*\))/g).map((part, i) => {
                                                    const match = part.match(/!\[([^\]]*?)\]\(([^)]+)\)/);
                                                    if (match) {
                                                        const [, alt, url] = match;
                                                        const imageUrl = url.startsWith('http') ? url : `/api/ai${url.replace('/api/ai', '')}`;
                                                        return (
                                                            <motion.div
                                                                key={i}
                                                                className="my-4 overflow-hidden rounded-2xl border-4 border-white shadow-lg"
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                            >
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={alt}
                                                                    className="w-full max-w-md object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                                                                    onLoad={() => trackChatbotTelemetry({
                                                                        event_type: 'client_image_loaded',
                                                                        session_id: msg.session_id,
                                                                        message_id: msg.id,
                                                                        image_url: imageUrl,
                                                                    })}
                                                                    onError={(e) => {
                                                                        trackChatbotTelemetry({
                                                                            event_type: 'client_image_error',
                                                                            session_id: msg.session_id,
                                                                            message_id: msg.id,
                                                                            image_url: imageUrl,
                                                                        });
                                                                        e.currentTarget.parentElement!.style.display = 'none';
                                                                    }}
                                                                />
                                                            </motion.div>
                                                        );
                                                    }
                                                    return (
                                                        <p key={i} className="whitespace-pre-wrap">
                                                            {part.split(/(\*\*.*?\*\*)/g).map((subPart, j) => {
                                                                if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                                                    return <strong key={j} className="font-bold underline decoration-blue-500/30 underline-offset-2">{subPart.slice(2, -2)}</strong>;
                                                                }
                                                                return subPart;
                                                            })}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] mt-2.5 font-bold tracking-tight uppercase px-1 ${msg.sender_type === 'USER' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {isTyping && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start">
                                <div className="flex items-center ml-13 bg-white/80 backdrop-blur-sm border border-slate-100 p-4 px-6 rounded-3xl rounded-tl-none shadow-sm space-x-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s]" />
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]" />
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                                    <span className="text-xs text-blue-500 font-bold ml-2">Đang nghĩ...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 md:p-8 bg-transparent">
                    <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto relative">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-4xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000"></div>
                            <div className="relative flex gap-3 p-2 bg-white rounded-4xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 transition-all duration-300 group-focus-within:border-blue-200">
                                <div className="grow relative flex items-center">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Hỏi bất cứ điều gì..."
                                        className="w-full p-4 pl-6 bg-transparent focus:outline-none text-slate-700 font-medium placeholder:text-slate-400"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="bg-linear-to-br from-blue-600 to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 text-white w-14 h-14 rounded-3xl transition-all duration-500 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 group"
                                >
                                    <Send className={`w-6 h-6 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${!input.trim() ? '' : 'animate-pulse'}`} />
                                </button>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium text-center mt-5 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                            Sử dụng trí tuệ thông minh nhân tạo để tư vấn du lịch. Luôn kiểm tra lại thông tin.
                        </p>
                    </form>
                </div>
            </div>

            {/* Guest Limit Modal */}
            <AnimatePresence>
                {showLimitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-600 to-indigo-600" />
                            
                            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                                <Bot className="w-10 h-10 text-blue-600" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 text-center mb-4 tracking-tight">Hết lượt chat thử!</h3>
                            <p className="text-slate-500 text-center mb-8 leading-relaxed">
                                Bạn đã trải nghiệm 3 câu hỏi miễn phí. Để tiếp tục trò chuyện và lưu lại lịch sử tư vấn, hãy đăng nhập ngay nhé!
                            </p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Đăng nhập ngay
                                </button>
                                <button
                                    onClick={() => setShowLimitModal(false)}
                                    className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                                >
                                    Để sau
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}} />
        </div>
    );
};

export default Chatbot;
