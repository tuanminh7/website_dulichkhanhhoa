import { AnimatePresence, motion } from 'framer-motion';
import { Check, Edit2, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryService } from '../../services/api';
import type { Category } from '../../types';
import Pagination from '../../components/common/Pagination';

const ManageCategories: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', type: 'ATTRACTION' as any, icon: '' });
    const currentPage = parseInt(searchParams.get('page') || '1');
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getAll();
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoryService.update(editingCategory.id, formData);
            } else {
                await categoryService.create(formData);
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData({ name: '', type: 'ATTRACTION', icon: '' });
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Lỗi khi lưu danh mục');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
        try {
            await categoryService.delete(id);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Lỗi khi xóa danh mục');
        }
    };

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, type: category.type, icon: category.icon || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', type: 'ATTRACTION', icon: '' });
        }
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const paginatedCategories = categories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý danh mục</h1>
                        <p className="text-gray-500 mt-1 font-medium">Quản lý các nhóm địa điểm (Tham quan, Ẩm thực, Lưu trú).</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" /> THÊM MỚI
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            {paginatedCategories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 mr-4">
                                            <Tag className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{cat.name}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{cat.type}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => openModal(cat)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl overflow-hidden"
                        >
                            <h2 className="text-2xl font-black text-gray-900 mb-6">
                                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Tên danh mục</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Loại (Type)</label>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold appearance-none"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="ATTRACTION">Tham quan (Attraction)</option>
                                        <option value="FOOD">Ẩm thực (Food)</option>
                                        <option value="STAY">Lưu trú (Stay)</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all"
                                    >
                                        HỦY
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center"
                                    >
                                        <Check className="w-5 h-5 mr-2" /> {editingCategory ? 'CẬP NHẬT' : 'XÁC NHẬN'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageCategories;
