import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await authService.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err: any) {
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        }
    };

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/30">
                        <Key className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">Quên mật khẩu?</h2>
                    <p className="text-gray-500 mt-2 font-medium">
                        {isSubmitted
                            ? 'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn.'
                            : 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                        {error}
                    </div>
                )}

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                            <input
                                type="email"
                                placeholder="Địa chỉ Email"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-700"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center group"
                        >
                            GỬI YÊU CẦU
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-blue-600 font-black hover:underline inline-flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Thử với email khác
                        </button>
                    </div>
                )}

                <div className="mt-10 text-center">
                    <Link to="/login" className="text-gray-500 text-sm font-bold hover:text-blue-600 transition-colors inline-flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại Đăng nhập
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
