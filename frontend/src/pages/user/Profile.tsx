import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { interactionService } from '../../services/api';
import type { Favorite } from '../../types';
import { User, Mail, Phone, Heart, Clock, Settings, LogOut, ChevronRight, MapPin, History as HistoryIcon } from 'lucide-react';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            const res = await interactionService.getFavorites();
            setFavorites(res.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="pt-32 pb-20 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Vui lòng đăng nhập</h2>
                <p className="text-gray-500 mt-2">Bạn cần đăng nhập để xem thông tin cá nhân.</p>
                <button className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30">
                    Đăng nhập ngay
                </button>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Info Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 sticky top-24">
                            <div className="text-center mb-8">
                                <div className="w-32 h-32 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center text-blue-600 relative border-4 border-white shadow-xl">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.fullname} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16" />
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-teal-500 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-white" title="Verified Account">
                                        <ChevronRight className="w-6 h-6 -rotate-90" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{user.fullname}</h2>
                                <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mt-1">{user.role}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                                    <Mail className="w-5 h-5 text-gray-400 mr-4" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Email</p>
                                        <p className="text-sm font-medium text-gray-700">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                                    <Phone className="w-5 h-5 text-gray-400 mr-4" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Số điện thoại</p>
                                        <p className="text-sm font-medium text-gray-700">{user.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 space-y-3">
                                <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                                    <div className="flex items-center">
                                        <Settings className="w-5 h-5 text-gray-400 mr-4 group-hover:text-blue-600" />
                                        <span className="font-semibold text-gray-700 group-hover:text-gray-900">Cài đặt tài khoản</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-colors font-semibold"
                                >
                                    <LogOut className="w-5 h-5 mr-4" />
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Activity Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Favorites */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <Heart className="w-6 h-6 mr-3 text-red-500 fill-current" />
                                    Địa điểm yêu thích
                                </h3>
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{favorites.length} địa điểm</span>
                            </div>

                            {loading ? (
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                    {[1, 2].map(i => <div key={i} className="min-w-[280px] h-40 bg-gray-100 animate-pulse rounded-3xl" />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {favorites.map(fav => (
                                        <div key={fav.id} className="group flex bg-gray-50 rounded-3xl overflow-hidden hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-blue-100">
                                            <div className="w-24 h-full bg-gray-200 overflow-hidden">
                                                <img src={fav.location?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="p-4 grow">
                                                <h4 className="font-bold text-gray-900 line-clamp-1">{fav.location?.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {fav.location?.address}
                                                </p>
                                                <button className="mt-3 text-blue-600 text-xs font-bold flex items-center">
                                                    Xem ngay <ChevronRight className="w-3 h-3 ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {favorites.length === 0 && !loading && (
                                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                    <Heart className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 text-sm italic">Bạn chưa lưu địa điểm nào.</p>
                                </div>
                            )}
                        </div>

                        {/* History Placeholder */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-8">
                                <Clock className="w-6 h-6 mr-3 text-blue-600" />
                                Lịch sử tư vấn gần đây
                            </h3>
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-blue-50 transition-colors">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                                                <HistoryIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700 group-hover:text-blue-700">Tư vấn lịch trình đi đảo 2 ngày</p>
                                                <p className="text-xs text-gray-400">23 Tháng 2, 2026</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-300" />
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

export default Profile;
