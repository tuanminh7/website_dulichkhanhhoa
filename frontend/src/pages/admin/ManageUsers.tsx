import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import type { User } from '../../types';
import { Search, UserPlus, MoreVertical, Shield, Mail, Phone, Calendar, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../../components/common/Pagination';

const ManageUsers: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const currentPage = parseInt(searchParams.get('page') || '1');
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 15;

    const setCurrentPage = (page: number) => {
        const newParams = new URLSearchParams(searchParams);
        if (page === 1) {
            newParams.delete('page');
        } else {
            newParams.set('page', page.toString());
        }
        setSearchParams(newParams);
    };

    // Add Admin modal state
    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
    const [adminForm, setAdminForm] = useState({ fullname: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [savingAdmin, setSavingAdmin] = useState(false);
    const [adminError, setAdminError] = useState('');

    // Make admin confirmation
    const [makingAdminId, setMakingAdminId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminService.getUsers({
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm || undefined
            });
            const data = res.data;
            setUsers(data.users || data);
            if (data.pages) {
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (userId: string) => {
        try {
            await adminService.toggleUserActive(userId);
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Không thể thay đổi trạng thái người dùng');
        }
    };

    const handleMakeAdmin = async (userId: string) => {
        if (!window.confirm('Cấp quyền admin cho người dùng này? Hành động này không thể hoàn tác.')) return;
        setMakingAdminId(userId);
        try {
            await adminService.makeAdmin(userId);
            fetchUsers();
        } catch {
            alert('Không thể cấp quyền admin');
        } finally {
            setMakingAdminId(null);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError('');
        setSavingAdmin(true);
        try {
            await adminService.createAdmin(adminForm);
            setIsAddAdminOpen(false);
            setAdminForm({ fullname: '', email: '', password: '' });
            fetchUsers();
        } catch (err: any) {
            setAdminError(err?.response?.data?.error || 'Không thể tạo tài khoản admin');
        } finally {
            setSavingAdmin(false);
        }
    };

    const paginatedUsers = users;

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý người dùng</h1>
                        <p className="text-gray-500 mt-1 font-medium">Theo dõi và quản trị quyền truy cập của người dùng hệ thống.</p>
                    </div>
                    <button
                        onClick={() => { setIsAddAdminOpen(true); setAdminError(''); }}
                        className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center"
                    >
                        <UserPlus className="w-5 h-5 mr-3" /> THÊM ADMIN
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc email..."
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-4xl" />
                            ))
                        ) : (
                            paginatedUsers.map((user) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                                >
                                    {/* Role menu */}
                                    <div className="absolute top-6 right-6">
                                        {user.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleMakeAdmin(user.id)}
                                                disabled={makingAdminId === user.id}
                                                title="Cấp quyền admin"
                                                className="p-2 text-gray-400 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all disabled:opacity-50"
                                            >
                                                {makingAdminId === user.id ? (
                                                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <MoreVertical className="w-5 h-5" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-2xl mb-4 relative ring-8 ring-blue-50">
                                            {user.avatar
                                                ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                : user.fullname?.[0]?.toUpperCase()
                                            }
                                            {user.role === 'ADMIN' && (
                                                <div className="absolute -bottom-1 -right-1 bg-purple-600 p-1.5 rounded-full text-white ring-2 ring-white">
                                                    <Shield className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{user.fullname}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {user.role}
                                        </span>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-50">
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                                <span className="truncate max-w-[150px]">{user.email}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${user.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                            <span>{(user as any).phone || 'Chưa cập nhật'}</span>
                                        </div>

                                        {user.role !== 'ADMIN' && (
                                            <div className="pt-2 flex gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(user.id)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${user.is_active ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                >
                                                    {user.is_active ? 'VÔ HIỆU HÓA' : 'KÍCH HOẠT'}
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center text-sm text-gray-400 mt-4">
                                            <Calendar className="w-3 h-3 mr-2" />
                                            <span className="text-[10px] font-bold uppercase">
                                                Ngày gia nhập: {new Date((user as any).created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {!loading && users.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-bold">Không tìm thấy người dùng</p>
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Add Admin Modal */}
            <AnimatePresence>
                {isAddAdminOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Thêm Admin mới</h2>
                                    <p className="text-sm text-gray-400 mt-1">Tạo tài khoản với quyền quản trị viên</p>
                                </div>
                                <button
                                    onClick={() => setIsAddAdminOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Họ và tên *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nhập họ và tên..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold"
                                        value={adminForm.fullname}
                                        onChange={e => setAdminForm({ ...adminForm, fullname: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="admin@example.com"
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold"
                                        value={adminForm.email}
                                        onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Mật khẩu *</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            placeholder="Tối thiểu 6 ký tự"
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold pr-14"
                                            value={adminForm.password}
                                            onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {adminError && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
                                        {adminError}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddAdminOpen(false)}
                                        className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all"
                                    >
                                        HỦY
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingAdmin}
                                        className="flex-1 px-8 py-4 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {savingAdmin ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Shield className="w-4 h-4 mr-2" />
                                                TẠO ADMIN
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageUsers;
