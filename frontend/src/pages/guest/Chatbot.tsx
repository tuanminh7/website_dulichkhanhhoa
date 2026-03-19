import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/api';
import type { ChatMessage, ChatSession } from '../../types';
import { Bot, History, X, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Extracted Components
import ChatSidebar from '../../features/chat/ChatSidebar';
import MessageList from '../../features/chat/MessageList';
import ChatInput from '../../features/chat/ChatInput';
import GuestLimitModal from '../../features/chat/GuestLimitModal';

const Chatbot: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);
    const isCreating = useRef(false);
    const isInitialSessionCreation = useRef(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isFetching.current) {
            if (user) {
                fetchSessions();
            } else {
                setSessions([]);
                setCurrentSessionId(null);
                setMessages([]);
            }
        }
    }, [user]);

    useEffect(() => {
        if (currentSessionId && !isInitialSessionCreation.current) {
            fetchMessages(currentSessionId);
        }
        if (isInitialSessionCreation.current) {
            isInitialSessionCreation.current = false;
        }
    }, [currentSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

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

        try {
            if (sessionId === null) {
                if (isCreating.current) return;
                isCreating.current = true;
                try {
                    const title = input.length > 30 ? input.substring(0, 30) + '...' : input;
                    isInitialSessionCreation.current = true;
                    const res = await chatService.createSession(title);
                    sessionId = res.data.id;
                    setCurrentSessionId(sessionId);
                    setSessions(prev => [res.data, ...prev]);
                } finally {
                    isCreating.current = false;
                }
            }

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
                body: JSON.stringify({ session_id: sessionId, message: input })
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

                        if (data.done && data.ai_message) {
                            didReceiveDone = true;
                            setMessages(prev => prev.map(m => (m.sender_type === 'AI' && (m.id === aiMessageId || !m.id)) ? data.ai_message : m));
                            setTimeout(() => {
                                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }

                if (done) break;
            }

            if (!didReceiveDone && currentText.trim()) {
                const safeText = currentText.trim().replace(/[,:;\-–—\s]+$/u, '');
                setMessages(prev => prev.map(m => (m.sender_type === 'AI' && m.id === aiMessageId)
                    ? { ...m, message_content: `${safeText}\n\n(Bạn muốn mình tiếp tục phần còn lại không?)` }
                    : m
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
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
        if (currentSessionId === null && messages.length === 0) return;
        if (messages.length === 0 && sessions.length > 0 && currentSessionId !== null) {
            setCurrentSessionId(null);
            setMessages([]);
            return;
        }
        setCurrentSessionId(null);
        setMessages([]);
    };

    const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (deletingSessionId) return;

        if (window.confirm('Bạn có chắc chắn muốn xóa đoạn chat này không?')) {
            try {
                setDeletingSessionId(id);
                await chatService.deleteSession(id);
                setSessions(prev => prev.filter(s => s.id !== id));
                if (currentSessionId === id) {
                    setCurrentSessionId(null);
                    setMessages([]);
                }
            } catch (error) {
                console.error('Error deleting session:', error);
                alert('Có lỗi xảy ra khi xóa đoạn chat.');
            } finally {
                setDeletingSessionId(null);
            }
        }
    };

    return (
        <div className="pt-20 h-screen flex flex-col overflow-hidden font-sans" style={{ background: '#f1f5fb' }}>
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop sidebar */}
                <ChatSidebar
                    user={user}
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    deletingSessionId={deletingSessionId}
                    onSessionSelect={(id) => { setCurrentSessionId(id); setMobileSidebarOpen(false); }}
                    onCreateSession={() => { createNewSession(); setMobileSidebarOpen(false); }}
                    onDeleteSession={handleDeleteSession}
                    onLoginClick={() => navigate('/login')}
                    onRegisterClick={() => navigate('/register')}
                />

                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                    {mobileSidebarOpen && (
                        <>
                            <motion.div
                                key="overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
                                onClick={() => setMobileSidebarOpen(false)}
                            />
                            <motion.div
                                key="mobile-sidebar"
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden flex flex-col bg-white shadow-2xl pt-16"
                            >
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                {/* Reuse sidebar content inline for mobile */}
                                <div className="flex flex-col h-full overflow-hidden">
                                    <ChatSidebar
                                        user={user}
                                        sessions={sessions}
                                        currentSessionId={currentSessionId}
                                        deletingSessionId={deletingSessionId}
                                        onSessionSelect={(id) => { setCurrentSessionId(id); setMobileSidebarOpen(false); }}
                                        onCreateSession={() => { createNewSession(); setMobileSidebarOpen(false); }}
                                        onDeleteSession={handleDeleteSession}
                                        onLoginClick={() => { navigate('/login'); setMobileSidebarOpen(false); }}
                                        onRegisterClick={() => { navigate('/register'); setMobileSidebarOpen(false); }}
                                    />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main chat area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat header */}
                    <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/70 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center gap-3">
                            {/* Mobile sidebar toggle */}
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            >
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>

                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 text-[15px] leading-tight">AI Tourism Scout</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                    </span>
                                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Đang trực tuyến</p>
                                </div>
                            </div>
                        </div>

                        {/* Right action: show history on mobile */}
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Lịch sử"
                        >
                            <History className="w-5 h-5" />
                        </button>
                    </div>

                    <MessageList
                        messages={messages}
                        isTyping={isTyping}
                        messagesEndRef={messagesEndRef}
                        onSuggestionClick={setInput}
                    />

                    <ChatInput
                        input={input}
                        setInput={setInput}
                        isTyping={isTyping}
                        onSendMessage={handleSendMessage}
                    />
                </div>
            </div>

            <GuestLimitModal
                show={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onLoginClick={() => navigate('/login')}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .animate-shimmer { animation: shimmer 1.5s infinite linear; }
            `}} />
        </div>
    );
};

export default Chatbot;
