import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/api';

const Register: React.FC = () => {
<<<<<<< HEAD
    const [name, setName] = useState('');
=======
    const [fullname, setFullname] = useState('');
>>>>>>> Tuan
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
<<<<<<< HEAD
=======
    const [loading, setLoading] = useState(false);
>>>>>>> Tuan
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
<<<<<<< HEAD
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            await authService.register({ fullname: name, email, password });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
=======
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            await authService.register({ fullname, email, password });
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
>>>>>>> Tuan
        }
    };

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen flex items-center justify-center px-4">
            <motion.div
<<<<<<< HEAD
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
=======
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
>>>>>>> Tuan
                className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/30">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">Tạo tài khoản</h2>
<<<<<<< HEAD
                    <p className="text-gray-500 mt-2 font-medium">Tham gia cùng chúng tôi để khám phá Nha Trang</p>
=======
                    <p className="text-gray-500 mt-2 font-medium">Bắt đầu hành trình khám phá Khánh Hòa</p>
>>>>>>> Tuan
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                        {error}
                    </div>
                )}

<<<<<<< HEAD
                <form onSubmit={handleSubmit} className="space-y-4">
=======
                <form onSubmit={handleSubmit} className="space-y-5">
>>>>>>> Tuan
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Họ và tên"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-700"
<<<<<<< HEAD
                            value={name}
                            onChange={(e) => setName(e.target.value)}
=======
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
>>>>>>> Tuan
                            required
                        />
                    </div>
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
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-700"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

<<<<<<< HEAD
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center group"
                        >
                            ĐĂNG KÝ
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
=======
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
>>>>>>> Tuan
                </form>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm font-medium">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-blue-600 font-black hover:underline">
                            ĐĂNG NHẬP
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
