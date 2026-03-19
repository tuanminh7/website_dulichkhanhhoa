import React from 'react';
import { X } from 'lucide-react';
import type { Category, Location, LocationImage } from '../../../types';
import LocationImageManager from './LocationImageManager';

interface LocationFormModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    editingLocation: Location | null;
    formData: any;
    setFormData: (data: any) => void;
    categories: Category[];
    existingImages: LocationImage[];
    newFilePreviews: string[];
    deletingImageId: number | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    saving: boolean;
    handleSubmit: (e: React.FormEvent) => void;
    handleFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteExistingImage: (id: number) => void;
    handleSetPrimaryImage: (id: number) => void;
    removeNewFile: (idx: number) => void;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
    isModalOpen,
    setIsModalOpen,
    editingLocation,
    formData,
    setFormData,
    categories,
    existingImages,
    newFilePreviews,
    deletingImageId,
    fileInputRef,
    saving,
    handleSubmit,
    handleFilesChange,
    handleDeleteExistingImage,
    handleSetPrimaryImage,
    removeNewFile
}) => {
    if (!isModalOpen) return null;

    return (
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

                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Địa chỉ *</label>
                        <input
                            type="text" required
                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Mô tả</label>
                        <textarea
                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-28 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Nhập mô tả về địa điểm..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Giá tiền (VND) - Cho Tour</label>
                        <input
                            type="number"
                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Nhập giá tiền nếu là tour..."
                        />
                    </div>

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

                    <LocationImageManager
                        editingLocation={editingLocation}
                        existingImages={existingImages}
                        newFilePreviews={newFilePreviews}
                        deletingImageId={deletingImageId}
                        fileInputRef={fileInputRef}
                        handleFilesChange={handleFilesChange}
                        handleDeleteExistingImage={handleDeleteExistingImage}
                        handleSetPrimaryImage={handleSetPrimaryImage}
                        removeNewFile={removeNewFile}
                    />

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
    );
};

export default LocationFormModal;
