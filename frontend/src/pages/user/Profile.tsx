import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { interactionService } from '../../services/api';
import type { Favorite } from '../../types';
import { User, Mail, Phone, Heart, Clock, Settings, LogOut, ChevronRight, MapPin, History as HistoryIcon, Edit2, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';
import { toast } from 'react-hot-toast';

const Profile: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({
        fullname: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setEditData({
                fullname: user.fullname,
                phone: user.phone || ''
            });
        }
    }, [user]);

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

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await userService.updateProfile(editData);
            // The API returns { message: string, user: User }
            if (res.data && (res.data as any).user) {
                updateUser((res.data as any).user);
            } else {
                updateUser(res.data);
            }
            setIsEditing(false);
            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Có lỗi xảy ra khi cập nhật thông tin.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setEditData({
                fullname: user.fullname,
                phone: user.phone || ''
            });
        }
        setIsEditing(false);
    };

    // ProtectedRoute handles redirection, but we still need a null check for TypeScript
    if (!user) return null;

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* User Info Card */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-500 via-teal-400 to-indigo-500"></div>
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
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editData.fullname}
                                            onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
                                            className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-center font-bold text-lg"
                                            placeholder="Họ và tên"
                                        />
                                        <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest">{user.role}</p>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900">{user.fullname}</h2>
                                        <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mt-1">{user.role}</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:border-blue-100 group">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email</p>
                                        <p className="text-sm font-semibold text-gray-700">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:border-blue-100 group">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mr-4 group-hover:bg-teal-100 transition-colors">
                                        <Phone className="w-5 h-5 text-teal-500" />
                                    </div>
                                    <div className="grow">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Số điện thoại</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.phone}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                className="w-full bg-transparent text-sm font-semibold text-gray-700 focus:outline-none border-b border-blue-200"
                                                placeholder="Chưa cập nhật"
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-gray-700">{user.phone || 'Chưa cập nhật'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="grow flex items-center justify-center py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                                        >
                                            {saving ? 'Đang lưu...' : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" /> Lưu
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full flex items-center justify-center py-3 border-2 border-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-colors group"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                        Chỉnh sửa hồ sơ
                                    </button>
                                )}
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
                    <div className="lg:col-span-8 space-y-8">
                        {/* Favorites */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
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
                                        <Link 
                                            key={fav.id} 
                                            to={`/locations/${fav.location?.id}`}
                                            className="group relative flex bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 text-left"
                                        >
                                            <div className="w-28 h-full bg-gray-100 overflow-hidden">
                                                <img 
                                                    src={fav.location?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop'} 
                                                    alt="" 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                />
                                            </div>
                                            <div className="p-5 grow flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{fav.location?.name}</h4>
                                                    <p className="text-xs text-gray-500 mt-2 flex items-start">
                                                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-400 shrink-0 mt-0.5" />
                                                        <span className="line-clamp-1">{fav.location?.address}</span>
                                                    </p>
                                                </div>
                                                <div className="mt-4 text-blue-600 text-xs font-bold flex items-center group/btn">
                                                    <span>Xem chi tiết</span>
                                                    <ChevronRight className="w-3.5 h-3.5 ml-1 transform group-hover/btn:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
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
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-8">
                                <Clock className="w-6 h-6 mr-3 text-blue-600" />
                                Lịch sử tư vấn gần đây
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map(i => (
                                    <div 
                                        key={i} 
                                        onClick={() => navigate('/chatbot')}
                                        className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                <HistoryIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Tư vấn lịch trình đi đảo 2 ngày</p>
                                                <p className="text-xs text-gray-500 mt-1">23 Tháng 2, 2026</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
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
