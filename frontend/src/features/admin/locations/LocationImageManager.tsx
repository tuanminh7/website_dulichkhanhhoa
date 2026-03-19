import React from 'react';
import { Upload, X, Star, Trash2 } from 'lucide-react';
import type { LocationImage } from '../../../types';

interface LocationImageManagerProps {
    editingLocation: any;
    existingImages: LocationImage[];
    newFilePreviews: string[];
    deletingImageId: number | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteExistingImage: (id: number) => void;
    handleSetPrimaryImage: (id: number) => void;
    removeNewFile: (idx: number) => void;
}

const LocationImageManager: React.FC<LocationImageManagerProps> = ({
    editingLocation,
    existingImages,
    newFilePreviews,
    deletingImageId,
    fileInputRef,
    handleFilesChange,
    handleDeleteExistingImage,
    handleSetPrimaryImage,
    removeNewFile
}) => {
    return (
        <div className="space-y-6">
            {/* Existing Images */}
            {editingLocation && existingImages.length > 0 && (
                <div>
                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
                        Ảnh hiện có ({existingImages.length})
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {existingImages.map(img => (
                            <div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
                                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                {img.is_primary && (
                                    <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-white rounded-full p-1 shadow-md">
                                        <Star className="w-3 h-3 fill-white" />
                                    </div>
                                )}
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

            {/* Upload New */}
            <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
                    {editingLocation ? 'Thêm ảnh mới' : 'Hình ảnh'}
                </label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                >
                    <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-400 mx-auto mb-3 transition-all" />
                    <p className="font-bold text-gray-400 group-hover:text-blue-500 transition-all text-sm">Nhấn để chọn ảnh</p>
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

                {newFilePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {newFilePreviews.map((preview, idx) => (
                            <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
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
            </div>
        </div>
    );
};

export default LocationImageManager;
