import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, LogIn } from 'lucide-react';

interface GuestLimitModalProps {
    show: boolean;
    onClose: () => void;
    onLoginClick: () => void;
}

const GuestLimitModal: React.FC<GuestLimitModalProps> = ({ show, onClose, onLoginClick }) => {
    return (
        <AnimatePresence>
            {show && (
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
                                onClick={onLoginClick}
                                className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <LogIn className="w-5 h-5" />
                                Đăng nhập ngay
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                            >
                                Để sau
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GuestLimitModal;
