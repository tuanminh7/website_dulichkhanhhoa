import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { Users, MapPin, MessageSquare, TrendingUp, Activity, ArrowUpRight, BarChart3, FileText, Star, MessagesSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminService.getStats();
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setStats(data);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="pt-32 pb-20 flex justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const s = stats?.stats || {};

    const statCards = [
        { title: 'Người dùng', value: s.total_users || 0, icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50', trend: `+${s.new_users_30_days || 0} tháng này` },
        { title: 'Địa điểm', value: s.total_places || 0, icon: MapPin, color: 'bg-teal-500', bgLight: 'bg-teal-50', trend: `${s.active_places || 0} đang hoạt động` },
        { title: 'Bài viết', value: s.total_posts || 0, icon: FileText, color: 'bg-violet-500', bgLight: 'bg-violet-50', trend: 'Tin tức & bài đăng' },
        { title: 'Bình luận', value: s.total_comments || 0, icon: MessagesSquare, color: 'bg-pink-500', bgLight: 'bg-pink-50', trend: 'Trên tất cả bài viết' },
        { title: 'Đánh giá', value: s.total_reviews || 0, icon: Star, color: 'bg-amber-500', bgLight: 'bg-amber-50', trend: 'Đánh giá địa điểm' },
        { title: 'Cuộc hội thoại AI', value: s.total_chat_sessions || 0, icon: MessageSquare, color: 'bg-purple-500', bgLight: 'bg-purple-50', trend: 'Với AI chatbot' },
    ];

    const quickActions = [
        { to: '/admin/locations', label: 'Quản lý địa điểm' },
        { to: '/admin/users', label: 'Quản lý người dùng' },
        { to: '/admin/categories', label: 'Quản lý danh mục' },
        { to: '/admin/posts', label: 'Quản lý bài viết' },
        { to: '/admin/comments', label: 'Quản lý bình luận' },
        { to: '/admin/reviews', label: 'Quản lý đánh giá' },
    ];

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trang quản trị</h1>
                        <p className="text-gray-500 mt-1">Chào mừng trở lại, Admin! Đây là tổng quan hệ thống của bạn.</p>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center hover:bg-blue-700 transition-all active:scale-95">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Xuất báo cáo
                    </button>
                </div>

                {/* Stats Grid - 6 cards, 3 columns on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                    {statCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07 }}
                            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl transition-all"
                        >
                            <div className={`p-2.5 rounded-2xl ${card.color} text-white shadow-md w-fit mb-3`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-black text-gray-900 mb-0.5">{card.value.toLocaleString()}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
                            <p className="text-[11px] text-gray-400">{card.trend}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top Locations */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Địa điểm phổ biến nhất</h2>
                            </div>
                            <div className="space-y-4">
                                {(stats?.popular_places || []).slice(0, 5).map((loc: any, idx: number) => (
                                    <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-50">
                                        <div className="w-10 h-10 font-black text-xl text-gray-200 mr-4">0{idx + 1}</div>
                                        <div className="grow">
                                            <p className="font-bold text-gray-800">{loc.name || 'Địa điểm du lịch'}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(loc.rating_avg || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                                ))}
                                                <span className="text-xs text-gray-500 ml-1">{loc.rating_avg ? Number(loc.rating_avg).toFixed(1) : 'Chưa có'}</span>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex items-center gap-1.5">
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            <span className="font-black text-gray-800 text-sm">{loc.rating_avg ? Number(loc.rating_avg).toFixed(1) : '-'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.popular_places || stats.popular_places.length === 0) && (
                                    <p className="text-center text-gray-400 py-8 italic">Chưa có dữ liệu</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Người dùng mới nhất</h2>
                                <Link to="/admin/users" className="text-blue-600 font-bold text-sm hover:underline">Xem tất cả</Link>
                            </div>
                            <div className="space-y-4">
                                {(stats?.recent_users || []).map((u: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                                            {u.avatar ? <img src={u.avatar} alt={u.fullname} className="w-full h-full object-cover" /> : u.fullname?.charAt(0)}
                                        </div>
                                        <div className="grow">
                                            <p className="font-semibold text-gray-800 text-sm">{u.fullname}</p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions & System Info */}
                    <div className="space-y-8">
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-500/20 text-white">
                            <h3 className="text-xl font-bold mb-6">Thao tác nhanh</h3>
                            <div className="space-y-3">
                                {quickActions.map(action => (
                                    <Link
                                        key={action.to}
                                        to={action.to}
                                        className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center justify-between group font-semibold"
                                    >
                                        <span>{action.label}</span>
                                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Trạng thái hệ thống</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Server API', status: 'Hoạt động' },
                                    { label: 'AI Service', status: 'Hoạt động' },
                                    { label: 'Cơ sở dữ liệu', status: 'Hoạt động' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm">{item.label}</span>
                                        <span className="flex items-center text-teal-500 text-xs font-bold">
                                            <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse" />
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
