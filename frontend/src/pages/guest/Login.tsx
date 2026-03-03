import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
                        <LogIn className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">Chào mừng trở lại</h2>
                    <p className="text-gray-500 mt-2 font-medium">Đăng nhập để khám phá trọn vẹn Nha Trang</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                        {error}
                    </div>
                )}

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
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-700"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" title="Quên mật khẩu?" className="text-sm font-bold text-blue-600 hover:underline">Quên mật khẩu?</Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center group"
                    >
                        ĐĂNG NHẬP
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="relative py-4 flex items-center">
                        <div className="grow border-t border-gray-100"></div>
                        <span className="shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Hoặc đăng nhập với</span>
                        <div className="grow border-t border-gray-100"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="flex items-center justify-center py-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all active:scale-95 group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="ml-3 text-sm font-bold text-gray-700">Google</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center py-4 bg-[#1877F2] rounded-2xl shadow-sm hover:shadow-lg hover:bg-[#166fe5] transition-all active:scale-95 group"
                        >
                            <Facebook className="w-5 h-5 text-white fill-current" />
                            <span className="ml-3 text-sm font-bold text-white">Facebook</span>
                        </button>
                    </div>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm font-medium">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-blue-600 font-black hover:underline">
                            ĐĂNG KÝ NGAY
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
