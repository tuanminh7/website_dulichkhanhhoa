import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import type { User } from '../../types';
import { Search, UserPlus, MoreVertical, Shield, Mail, Phone, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await adminService.getUsers();
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý người dùng</h1>
                        <p className="text-gray-500 mt-1 font-medium">Theo dõi và quản trị quyền truy cập của người dùng hệ thống.</p>
                    </div>
                    <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center">
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
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-[2rem]" />
                            ))
                        ) : (
                            filteredUsers.map((user) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute top-6 right-6">
                                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-2xl mb-4 relative ring-8 ring-blue-50">
                                            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full" /> : user.fullname[0]}
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
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                            <span>{user.phone || 'Chưa cập nhật'}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-400 mt-4">
                                            <Calendar className="w-3 h-3 mr-2" />
                                            <span className="text-[10px] font-bold uppercase">Ngày gia nhập: {new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
