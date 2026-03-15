import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Token không hợp lệ hoặc đã hết hạn.');
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword({ token, new_password: password });
            toast.success('Đặt lại mật khẩu thành công!');
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="pt-24 pb-20 bg-gray-50 min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 text-center"
                >
                    <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Thành công!</h2>
                    <p className="text-gray-500 font-medium mb-8">
                        Mật khẩu của bạn đã được thay đổi. Bạn sẽ được chuyển hướng về trang đăng nhập trong giây lát.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-600 transition-all"
                    >
                        ĐĂNG NHẬP NGAY
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/30">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">Đặt lại mật khẩu</h2>
                    <p className="text-gray-500 mt-2 font-medium">Nhập mật khẩu mới cho tài khoản của bạn.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                        <input
                            type="password"
                            placeholder="Mật khẩu mới"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-700"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center group disabled:opacity-50"
                    >
                        {loading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT MẬT KHẨU'}
                        {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

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

export default ResetPassword;
