import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import type { SystemStatistic } from '../../types';
import { Users, MapPin, MessageSquare, TrendingUp, Activity, ArrowUpRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<SystemStatistic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminService.getStats();
                // Ensure we handle array or object response correctly
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
        return <div className="pt-24 text-center">Đang tải dữ liệu quản trị...</div>;
    }

    const statCards = [
        { title: 'Tổng người dùng', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500', trend: '+12%' },
        { title: 'Địa điểm du lịch', value: stats?.total_locations || 0, icon: MapPin, color: 'bg-teal-500', trend: '+3' },
        { title: 'Cuộc hội thoại AI', value: stats?.total_chats || 0, icon: MessageSquare, color: 'bg-purple-500', trend: '+150' },
        { title: 'Lượt truy cập', value: '2.4k', icon: Activity, color: 'bg-orange-500', trend: '+22%' },
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {statCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 group hover:shadow-xl transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${card.color} text-white shadow-lg`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <span className="text-teal-600 font-bold text-sm bg-teal-50 px-2 py-1 rounded-lg flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    {card.trend}
                                </span>
                            </div>
                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{card.title}</h3>
                            <p className="text-3xl font-black text-gray-900">{card.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Hoạt động gần đây</h2>
                                <button className="text-blue-600 font-bold text-sm hover:underline">Xem tất cả</button>
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-blue-50 transition-colors">
                                            <Activity className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                        </div>
                                        <div className="grow pb-6 border-b border-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">Người dùng mới đăng ký</p>
                                                <p className="text-sm text-gray-400">nguyen@example.com vừa tạo tài khoản</p>
                                            </div>
                                            <span className="text-xs text-gray-400">14 phút trước</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Locations */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Địa điểm phổ biến nhất</h2>
                            <div className="space-y-4">
                                {stats?.most_visited_locations?.map((loc: any, idx) => (
                                    <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-50">
                                        <div className="w-10 h-10 font-black text-xl text-gray-200 mr-4">0{idx + 1}</div>
                                        <div className="grow">
                                            <p className="font-bold text-gray-800">{loc.name || 'Địa điểm du lịch'}</p>
                                            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                                            </div>
                                        </div>
                                        <div className="ml-6 text-right">
                                            <p className="font-black text-gray-900">{loc.views || '1,240'}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Lượt xem</p>
                                        </div>
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
                                <Link to="/admin/locations" className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center justify-between group font-semibold">
                                    <span>Quản lý địa điểm</span>
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                                <Link to="/admin/users" className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center justify-between group font-semibold">
                                    <span>Quản lý người dùng</span>
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                                <Link to="/admin/categories" className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center justify-between group font-semibold">
                                    <span>Quản lý danh mục</span>
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Trạng thái hệ thống</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">Server API</span>
                                    <span className="flex items-center text-teal-500 text-xs font-bold">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse" />
                                        Hoạt động
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">AI Service</span>
                                    <span className="flex items-center text-teal-500 text-xs font-bold">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse" />
                                        Hoạt động
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">Cơ sở dữ liệu</span>
                                    <span className="flex items-center text-teal-500 text-xs font-bold">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse" />
                                        Hoạt động
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
