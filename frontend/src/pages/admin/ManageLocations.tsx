import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { locationService, categoryService } from '../../services/api';
import type { Location, Category, LocationImage } from '../../types';
import { Plus, Search, MapPin } from 'lucide-react';
import Pagination from '../../components/common/Pagination';

// Extracted Components
import LocationTable from '../../features/admin/locations/LocationTable';
import LocationFormModal from '../../features/admin/locations/LocationFormModal';

const ManageLocations: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
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
        price: '',
        status: 'ACTIVE'
    });

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

    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<LocationImage[]>([]);
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locRes, catRes] = await Promise.all([
                locationService.getAll({
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm || undefined
                }),
                categoryService.getAll()
            ]);
            setLocations(locRes.data);
            if (locRes.meta) {
                setTotalPages(locRes.meta.pages);
            }
            setCategories(catRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage, searchTerm]);

    const openModal = async (loc?: Location) => {
        if (loc) {
            setEditingLocation(loc);
            setFormData({
                name: loc.name,
                description: loc.description || '',
                address: loc.address || '',
                category_id: loc.category_id?.toString() || '',
                price: loc.price?.toString() || '',
                status: loc.status || 'ACTIVE'
            });
            try {
                const res = await locationService.getById(loc.id);
                const fullLoc = res.data as any;
                setExistingImages(fullLoc.images || loc.images || []);
            } catch {
                setExistingImages(loc.images || []);
            }
        } else {
            setEditingLocation(null);
            setFormData({
                name: '',
                description: '',
                address: '',
                category_id: categories[0]?.id.toString() || '',
                price: '',
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

        newFilePreviews.forEach(url => URL.revokeObjectURL(url));

        setNewFiles(prev => [...prev, ...files]);
        setNewFilePreviews(prev => [
            ...prev,
            ...files.map(f => URL.createObjectURL(f))
        ]);
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

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý DU LỊCH</h1>
                        <p className="text-gray-500 mt-1 font-medium">
                            Cập nhật và quản lý các điểm đến trên bản đồ du lịch.{' '}
                            {categories.length > 0 && `Đang quản lý ${categories.length} danh mục.`}
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-500/30 flex items-center hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-3" /> THÊM DU LỊCH
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
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <LocationTable
                        locations={locations}
                        loading={loading}
                        onEdit={openModal}
                        onDelete={handleDelete}
                    />

                    {!loading && locations.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-bold">Không tìm thấy địa điểm nào</p>
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            <LocationFormModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                editingLocation={editingLocation}
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                existingImages={existingImages}
                newFilePreviews={newFilePreviews}
                deletingImageId={deletingImageId}
                fileInputRef={fileInputRef}
                saving={saving}
                handleSubmit={handleSubmit}
                handleFilesChange={handleFilesChange}
                handleDeleteExistingImage={handleDeleteExistingImage}
                handleSetPrimaryImage={handleSetPrimaryImage}
                removeNewFile={removeNewFile}
            />
        </div>
    );
};

export default ManageLocations;
