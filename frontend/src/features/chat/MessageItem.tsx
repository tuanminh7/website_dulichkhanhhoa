import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface MessageItemProps {
    msg: ChatMessage;
    isTyping?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ msg }) => {
    return (
        <motion.div
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
                                                onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
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
    );
};

export default MessageItem;
