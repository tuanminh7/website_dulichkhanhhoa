import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { newsService } from '../../services/api';
import { ArrowLeft, Send, Image as ImageIcon, Type, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const CreatePost: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError('Tiêu đề và nội dung không được để trống');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const response = await newsService.create( { title, content, image_url: imageUrl });
            navigate(`/news/${response.data.id}`);
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(err.response?.data?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
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
                                <label className="flex items-center text-sm font-bold text-gray-700 mb-3 ml-1">
                                    <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
                                    Link ảnh minh họa (URL)
                                </label>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
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
                                disabled={submitting}
                                className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
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
