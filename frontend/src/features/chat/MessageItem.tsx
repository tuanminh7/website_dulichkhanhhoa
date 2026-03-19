import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, X, ZoomIn, ChevronDown, ChevronUp } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface MessageItemProps {
    msg: ChatMessage;
}

// ── Image with skeleton loader + lightbox ──────────────────────────────────
const ChatImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [lightbox, setLightbox] = useState(false);

    const handleLoad = useCallback(() => setStatus('loaded'), []);
    const handleError = useCallback(() => setStatus('error'), []);

    if (status === 'error') return null;

    return (
        <>
            <motion.div
                className="my-3 overflow-hidden rounded-2xl border border-slate-200/60 shadow-md bg-slate-100 relative group cursor-zoom-in"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => status === 'loaded' && setLightbox(true)}
                style={{ minHeight: status === 'loading' ? 180 : undefined }}
            >
                {/* Skeleton shimmer */}
                {status === 'loading' && (
                    <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200 via-slate-100 to-slate-200 bg-size-[200%_100%] animate-shimmer rounded-2xl" />
                )}

                <img
                    src={src}
                    alt={alt}
                    className={`w-full max-w-sm object-cover transition-all duration-500 ${status === 'loaded' ? 'opacity-100 group-hover:scale-[1.03]' : 'opacity-0 absolute inset-0'}`}
                    style={{ maxHeight: 280 }}
                    onLoad={handleLoad}
                    onError={handleError}
                />

                {/* Zoom hint overlay */}
                {status === 'loaded' && (
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                            <ZoomIn className="w-5 h-5 text-slate-700" />
                        </div>
                    </div>
                )}

                {alt && status === 'loaded' && (
                    <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/50 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate">{alt}</p>
                    </div>
                )}
            </motion.div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(false)}
                    >
                        <motion.div
                            className="relative max-w-4xl w-full"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img src={src} alt={alt} className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
                            {alt && (
                                <p className="text-center text-white/80 text-sm mt-3">{alt}</p>
                            )}
                            <button
                                onClick={() => setLightbox(false)}
                                className="absolute -top-3 -right-3 w-9 h-9 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ── Markdown-like text renderer ────────────────────────────────────────────
const renderText = (text: string): React.ReactNode[] => {
    return text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={j} className="italic">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={j} className="bg-black/10 text-[0.85em] px-1.5 py-0.5 rounded font-mono">
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
};

// ── Main MessageItem ───────────────────────────────────────────────────────
const MessageItem: React.FC<MessageItemProps> = ({ msg }) => {
    const isUser = msg.sender_type === 'USER';
    const [expanded, setExpanded] = useState(true);

    // Split content into segments: images vs text blocks
    const segments = msg.message_content.split(/(!\[[^\]]*?\]\([^)]+\))/g);

    // Check if message is long (>500 chars of text content, excluding image markdown)
    const textOnly = msg.message_content.replace(/!\[[^\]]*?\]\([^)]+\)/g, '');
    const isLong = textOnly.length > 800;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
        >
            <div className={`flex max-w-[90%] md:max-w-[78%] lg:max-w-[72%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mb-1 ${
                    isUser
                        ? 'bg-linear-to-br from-slate-700 to-slate-900 text-white'
                        : 'bg-linear-to-br from-blue-500 to-indigo-600 text-white'
                }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                    {/* Bubble */}
                    <div className={`relative px-5 py-4 rounded-3xl shadow-sm ${
                        isUser
                            ? 'bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-br-lg'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                    }`}>
                        <div className={`text-[15px] leading-relaxed space-y-2 ${isLong && !expanded ? 'max-h-48 overflow-hidden relative' : ''}`}>
                            {segments.map((part, i) => {
                                const match = part.match(/!\[([^\]]*?)\]\(([^)]+)\)/);
                                if (match) {
                                    const [, alt, url] = match;
                                    const imageUrl = url.startsWith('http')
                                        ? url
                                        : `/api/ai${url.replace('/api/ai', '')}`;
                                    return <ChatImage key={i} src={imageUrl} alt={alt} />;
                                }

                                if (!part.trim()) return null;

                                // Render lines — support bullet lists
                                const lines = part.split('\n');
                                return (
                                    <div key={i} className="space-y-1">
                                        {lines.map((line, li) => {
                                            if (!line.trim()) return <div key={li} className="h-1" />;

                                            // Heading-like: lines starting with ###
                                            if (line.startsWith('### ')) {
                                                return (
                                                    <p key={li} className={`font-bold text-[16px] mt-2 ${isUser ? 'text-white' : 'text-slate-900'}`}>
                                                        {renderText(line.slice(4))}
                                                    </p>
                                                );
                                            }
                                            if (line.startsWith('## ')) {
                                                return (
                                                    <p key={li} className={`font-extrabold text-[17px] mt-2 ${isUser ? 'text-white' : 'text-slate-900'}`}>
                                                        {renderText(line.slice(3))}
                                                    </p>
                                                );
                                            }

                                            // Bullet list
                                            if (line.match(/^[-*•]\s/)) {
                                                return (
                                                    <div key={li} className="flex items-start gap-2 ml-1">
                                                        <span className={`mt-[6px] w-1.5 h-1.5 rounded-full shrink-0 ${isUser ? 'bg-white/70' : 'bg-blue-500'}`} />
                                                        <span>{renderText(line.replace(/^[-*•]\s/, ''))}</span>
                                                    </div>
                                                );
                                            }

                                            // Number list: "1. ", "2. "
                                            const numMatch = line.match(/^(\d+)\.\s(.+)/);
                                            if (numMatch) {
                                                return (
                                                    <div key={li} className="flex items-start gap-2 ml-1">
                                                        <span className={`text-[13px] font-bold shrink-0 mt-0.5 ${isUser ? 'text-white/80' : 'text-blue-600'}`}>
                                                            {numMatch[1]}.
                                                        </span>
                                                        <span>{renderText(numMatch[2])}</span>
                                                    </div>
                                                );
                                            }

                                            return <p key={li} className="whitespace-pre-wrap">{renderText(line)}</p>;
                                        })}
                                    </div>
                                );
                            })}

                            {/* Gradient fade for long messages */}
                            {isLong && !expanded && (
                                <div className={`absolute bottom-0 inset-x-0 h-16 bg-linear-to-t ${isUser ? 'from-indigo-700' : 'from-white'} to-transparent`} />
                            )}
                        </div>

                        {/* Expand/collapse for long messages */}
                        {isLong && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={`mt-3 flex items-center gap-1 text-xs font-semibold transition-colors ${
                                    isUser ? 'text-white/80 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                                }`}
                            >
                                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {expanded ? 'Thu gọn' : 'Xem thêm'}
                            </button>
                        )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] mt-1.5 text-slate-400 font-medium px-1">
                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default MessageItem;
