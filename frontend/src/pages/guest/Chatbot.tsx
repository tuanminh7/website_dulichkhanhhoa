import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/api';
import type { ChatMessage, ChatSession } from '../../types';
import { Bot, Calculator, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
        <div className="pt-20 h-screen bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden font-sans">
            <ChatSidebar
                user={user}
                sessions={sessions}
                currentSessionId={currentSessionId}
                deletingSessionId={deletingSessionId}
                onSessionSelect={setCurrentSessionId}
                onCreateSession={createNewSession}
                onDeleteSession={handleDeleteSession}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
            />

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
            `}} />
        </div>
    );
};

export default Chatbot;
