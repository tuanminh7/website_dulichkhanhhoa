import React, { useEffect, useRef, useState } from 'react';
import { locationService, categoryService } from '../../services/api';
import type { Location, Category } from '../../types';
import { Plus, Search, Edit2, Trash2, MapPin, Tag, Upload, X, Star, ImagePlus } from 'lucide-react';

interface LocationImage {
    id: number;
    image_url: string;
    is_primary: boolean;
}

const ManageLocations: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        category_id: '',
        status: 'ACTIVE'
    });

    // Multi-image state
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<LocationImage[]>([]);
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
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

    const openModal = async (loc?: Location) => {
        if (loc) {
            setEditingLocation(loc);
            setFormData({
                name: loc.name,
                description: loc.description || '',
                address: loc.address || '',
                category_id: loc.category_id?.toString() || '',
                status: loc.status || 'ACTIVE'
            });
            // Load full location data to get all images
            try {
                const res = await locationService.getById(loc.id);
                const fullLoc = res.data as any;
                setExistingImages(fullLoc.images || loc.images || []);
            } catch {
                setExistingImages((loc as any).images || []);
            }
        } else {
            setEditingLocation(null);
            setFormData({
                name: '',
                description: '',
                address: '',
                category_id: categories[0]?.id.toString() || '',
                status: 'ACTIVE'
            });
            setExistingImages([]);
        }
        setNewFiles([]);
        setNewFilePreviews([]);
        setIsModalOpen(true);
    };

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Revoke old previews
        newFilePreviews.forEach(url => URL.revokeObjectURL(url));

        setNewFiles(prev => [...prev, ...files]);
        setNewFilePreviews(prev => [
            ...prev,
            ...files.map(f => URL.createObjectURL(f))
        ]);
        // Reset input so same file can be picked again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeNewFile = (idx: number) => {
        URL.revokeObjectURL(newFilePreviews[idx]);
        setNewFiles(prev => prev.filter((_, i) => i !== idx));
        setNewFilePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!editingLocation) return;
        setDeletingImageId(imageId);
        try {
            await locationService.deleteImage(editingLocation.id, imageId);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } catch {
            alert('Không thể xóa ảnh này');
        } finally {
            setDeletingImageId(null);
        }
    };

    const handleSetPrimaryImage = async (imageId: number) => {
        if (!editingLocation) return;
        try {
            await locationService.setPrimaryImage(editingLocation.id, imageId);
            setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })));
        } catch {
            alert('Không thể đặt ảnh chính');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => data.append(key, value));

            // Attach first batch of new files directly (for create, these become location images)
            newFiles.forEach(f => data.append('images[]', f));

            if (editingLocation) {
                await locationService.update(editingLocation.id, data);
            } else {
                await locationService.create(data);
            }
            setIsModalOpen(false);
            newFilePreviews.forEach(url => URL.revokeObjectURL(url));
            fetchData();
        } catch (error) {
            console.error('Error saving location:', error);
            alert('Lỗi khi lưu địa điểm');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
        try {
            await locationService.delete(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting location:', error);
            alert('Lỗi khi xóa địa điểm');
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
                        <p className="text-gray-500 mt-1 font-medium">
                            Cập nhật và quản lý các điểm đến trên bản đồ du lịch.{' '}
                            {categories.length > 0 && `Đang quản lý ${categories.length} danh mục.`}
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-500/30 flex items-center hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-3" /> THÊM ĐỊA ĐIỂM
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm địa điểm..."
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 pl-4">Địa điểm</th>
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Danh mục</th>
                                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Ảnh</th>
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
                                            <td className="py-6"><div className="h-6 bg-gray-50 rounded-lg w-16" /></td>
                                            <td className="py-6 pr-4"><div className="h-10 bg-gray-50 rounded-xl w-24 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredLocations.map((loc) => {
                                        const imgs: LocationImage[] = (loc as any).images || [];
                                        return (
                                            <tr key={loc.id} className="group hover:bg-gray-50 transition-all">
                                                <td className="py-6 pl-4">
                                                    <div className="flex items-center">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden mr-4 shrink-0">
                                                            {imgs[0]?.image_url ? (
                                                                <img src={imgs[0].image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                    <ImagePlus className="w-5 h-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{loc.name}</p>
                                                            <p className="text-xs text-gray-400 flex items-center mt-1">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {loc.address ? loc.address.substring(0, 35) + (loc.address.length > 35 ? '...' : '') : 'Chưa có địa chỉ'}
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
                                                    <div className="flex -space-x-2">
                                                        {imgs.slice(0, 3).map((img, i) => (
                                                            <div key={img.id} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white" style={{ zIndex: 3 - i }}>
                                                                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                        {imgs.length > 3 && (
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                +{imgs.length - 3}
                                                            </div>
                                                        )}
                                                        {imgs.length === 0 && (
                                                            <span className="text-xs text-gray-300 font-medium">Chưa có ảnh</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${loc.status === 'ACTIVE' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-gray-300'}`} />
                                                    <span className={`text-xs font-bold ${loc.status === 'ACTIVE' ? 'text-teal-600' : 'text-gray-400'}`}>
                                                        {loc.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                                                    </span>
                                                </td>
                                                <td className="py-6 pr-4">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openModal(loc)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(loc.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        {!loading && filteredLocations.length === 0 && (
                            <div className="text-center py-16 text-gray-400">
                                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-bold">Chưa có địa điểm nào</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-start justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 relative shadow-2xl my-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900">
                                {editingLocation ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}
                            </h2>
                            <button
                                onClick={() => { setIsModalOpen(false); newFilePreviews.forEach(u => URL.revokeObjectURL(u)); }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Tên + Danh mục */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Tên địa điểm *</label>
                                    <input
                                        type="text" required
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Danh mục *</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Địa chỉ */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Địa chỉ *</label>
                                <input
                                    type="text" required
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Mô tả</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-28 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Nhập mô tả về địa điểm..."
                                />
                            </div>

                            {/* Trạng thái */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Trạng thái</label>
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">Tạm ngưng</option>
                                </select>
                            </div>

                            {/* --- Ảnh hiện có (khi edit) --- */}
                            {editingLocation && existingImages.length > 0 && (
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
                                        Ảnh hiện có ({existingImages.length})
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {existingImages.map(img => (
                                            <div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
                                                <img src={img.image_url} alt="" className="w-full h-full object-cover" />

                                                {/* Primary badge */}
                                                {img.is_primary && (
                                                    <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-white rounded-full p-1 shadow-md">
                                                        <Star className="w-3 h-3 fill-white" />
                                                    </div>
                                                )}

                                                {/* Action overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                                    {!img.is_primary && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetPrimaryImage(img.id)}
                                                            title="Đặt làm ảnh chính"
                                                            className="bg-yellow-400 text-white p-1.5 rounded-xl hover:bg-yellow-500 transition-all shadow-lg"
                                                        >
                                                            <Star className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExistingImage(img.id)}
                                                        disabled={deletingImageId === img.id}
                                                        title="Xóa ảnh"
                                                        className="bg-red-500 text-white p-1.5 rounded-xl hover:bg-red-600 transition-all shadow-lg disabled:opacity-50"
                                                    >
                                                        {deletingImageId === img.id ? (
                                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- Upload ảnh mới --- */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
                                    {editingLocation ? 'Thêm ảnh mới' : 'Hình ảnh'}
                                </label>

                                {/* Drop zone */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                                >
                                    <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-400 mx-auto mb-3 transition-all" />
                                    <p className="font-bold text-gray-400 group-hover:text-blue-500 transition-all text-sm">
                                        Nhấn để chọn ảnh
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP • Có thể chọn nhiều ảnh</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFilesChange}
                                />

                                {/* Preview grid for new files */}
                                {newFilePreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {newFilePreviews.map((preview, idx) => (
                                            <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
                                                <img src={preview} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                                                {idx === 0 && existingImages.length === 0 && (
                                                    <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-white rounded-full p-1 shadow-md">
                                                        <Star className="w-3 h-3 fill-white" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewFile(idx)}
                                                    className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {newFilePreviews.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-2 font-medium">
                                        Đã chọn {newFilePreviews.length} ảnh mới.
                                        {existingImages.length === 0 && ' Ảnh đầu tiên sẽ là ảnh chính.'}
                                    </p>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); newFilePreviews.forEach(u => URL.revokeObjectURL(u)); }}
                                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all"
                                >
                                    HỦY
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        editingLocation ? 'CẬP NHẬT' : 'XÁC NHẬN'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageLocations;
