import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { newsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Send, Image as ImageIcon, Type, AlignLeft, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;

const CreatePost: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auth guard: redirect to login if not authenticated
    useEffect(() => {
        if (user === null) {
            toast.error('Vui lòng đăng nhập để đăng bài!');
            navigate('/login', { replace: true, state: { from: '/news/create' } });
        }
    }, [user, navigate]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        const combined = [...imageFiles, ...newFiles];

        if (combined.length > MAX_IMAGES) {
            toast.error(`Chỉ được upload tối đa ${MAX_IMAGES} ảnh`);
            return;
        }

        const newPreviews = newFiles.map(f => URL.createObjectURL(f));
        setImageFiles(combined);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            imageFiles.forEach(file => formData.append('images[]', file));

            const response = await newsService.create(formData);
            toast.success('Đăng bài thành công!');
            navigate(`/news/${response.data.id}`);
        } catch (err: any) {
            console.error('Error creating post:', err);
            toast.error(err.response?.data?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // While user state is loading (undefined), show spinner
    if (user === undefined) {
        return (
            <div className="pt-32 pb-20 flex justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/news" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-8 font-medium transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Hủy và quay lại
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
                >
                    <div className="p-8 md:p-12">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Đăng bài viết mới</h1>
                        <p className="text-gray-500 mb-10">Chia sẻ những trải nghiệm thú vị của bạn với mọi người.</p>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Title */}
                            <div>
                                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 ml-1">
                                    <Type className="w-4 h-4 mr-2 text-blue-500" />
                                    Tiêu đề bài viết
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ví dụ: Review Nha Trang 3 ngày 2 đêm siêu rẻ..."
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-bold"
                                    required
                                />
                            </div>

                            {/* Multi-Image Upload */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-3 ml-1">
                                    <span className="flex items-center">
                                        <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
                                        Ảnh minh họa
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        {imageFiles.length}/{MAX_IMAGES} ảnh
                                    </span>
                                </label>

                                {/* Preview Grid */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
                                        <AnimatePresence>
                                            {imagePreviews.map((preview, index) => (
                                                <motion.div
                                                    key={preview}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="relative aspect-square rounded-2xl overflow-hidden group shadow-md"
                                                >
                                                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                                                            Bìa
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Upload Button */}
                                {imageFiles.length < MAX_IMAGES && (
                                    <label
                                        htmlFor="images-upload"
                                        className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
                                            <Plus className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-blue-600">Thêm ảnh</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP — còn {MAX_IMAGES - imageFiles.length} ảnh</p>
                                        <input
                                            id="images-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="sr-only"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Content */}
                            <div>
                                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 ml-1">
                                    <AlignLeft className="w-4 h-4 mr-2 text-blue-500" />
                                    Nội dung bài viết
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Chi tiết về chuyến đi, cảm nhận của bạn về con người và địa điểm..."
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[300px] leading-relaxed"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !title.trim() || !content.trim()}
                                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Đăng bài ngay
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CreatePost;
