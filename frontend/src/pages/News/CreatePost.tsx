import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { newsService } from '../../services/api';
import { ArrowLeft, Send, Image as ImageIcon, Type, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CreatePost: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await newsService.create(formData);
            toast.success('Đăng bài thành công!');
            navigate(`/news/${response.data.id}`);
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(err.response?.data?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

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

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh minh họa</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl relative bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden">
                                    {imagePreview ? (
                                        <div className="absolute inset-0 w-full h-full">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 border-4 border-emerald-500 rounded-2xl pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 p-1">
                                                    <span>Chọn ảnh từ máy tính</span>
                                                    <input id="image-upload" name="image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 50MB</p>
                                        </div>
                                    )}
                                    {/* Overlay handle image change when preview exists */}
                                    {imagePreview && (
                                        <input title="Thay đổi ảnh" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                                    )}
                                </div>
                            </div>

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
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
