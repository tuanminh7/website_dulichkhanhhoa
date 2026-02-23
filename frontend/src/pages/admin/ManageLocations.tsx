import React, { useEffect, useState } from 'react';
import { locationService, categoryService } from '../../services/api';
import type { Location, Category } from '../../types';
import { Plus, Search, Filter, Edit2, Trash2, ExternalLink, MapPin, Tag } from 'lucide-react';

const ManageLocations: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [locRes, catRes] = await Promise.all([
                locationService.getAll(),
                categoryService.getAll()
            ]);
            setLocations(locRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý địa điểm</h1>
                        <p className="text-gray-500 mt-1 font-medium">Cập nhật và quản lý các điểm đến trên bản đồ du lịch. {categories.length > 0 && `Đang quản lý ${categories.length} danh mục.`}</p>
                    </div>
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-500/30 flex items-center hover:bg-blue-700 transition-all active:scale-95">
                        <Plus className="w-5 h-5 mr-3" /> THÊM ĐỊA ĐIỂM
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm địa điểm..."
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-4 bg-gray-50 rounded-2xl text-gray-500 hover:bg-gray-100 transition-all relative">
                                <Filter className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 pl-4">Địa điểm</th>
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Danh mục</th>
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Trạng thái</th>
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 text-right pr-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-6 pl-4"><div className="h-10 bg-gray-100 rounded-xl" /></td>
                                            <td className="py-6"><div className="h-6 bg-gray-50 rounded-lg w-20" /></td>
                                            <td className="py-6"><div className="h-6 bg-gray-50 rounded-lg w-16" /></td>
                                            <td className="py-6 pr-4"><div className="h-10 bg-gray-50 rounded-xl w-24 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredLocations.map((loc) => (
                                        <tr key={loc.id} className="group hover:bg-gray-50 transition-all">
                                            <td className="py-6 pl-4">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden mr-4">
                                                        <img src={loc.images?.[0]?.image_url || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{loc.name}</p>
                                                        <p className="text-xs text-gray-400 flex items-center mt-1">
                                                            <MapPin className="w-3 h-3 mr-1" /> {loc.address?.substring(0, 30)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {loc.category?.name || 'Chưa phân loại'}
                                                </span>
                                            </td>
                                            <td className="py-6">
                                                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${loc.status === 'ACTIVE' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-gray-300'}`} />
                                                <span className={`text-xs font-bold ${loc.status === 'ACTIVE' ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    {loc.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                                                </span>
                                            </td>
                                            <td className="py-6 pr-4">
                                                <div className="flex justify-end space-x-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                                                        <ExternalLink className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filteredLocations.length === 0 && (
                        <div className="text-center py-20">
                            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-medium">Không tìm thấy địa điểm nào khớp với từ khóa.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageLocations;
