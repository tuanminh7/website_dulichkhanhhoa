import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { locationService } from '../../services/api';
import type { Location } from '../../types';
import { MapPin, Star, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Pagination from '../../components/common/Pagination';

const Stay: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [accommodations, setAccommodations] = useState<Location[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
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
        const fetchData = async () => {
            try {
                const res = await locationService.getAll({ category: 'STAY' });
                setAccommodations(res.data as any);
            } catch (error) {
                console.error('Error fetching stay data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = accommodations.filter(acc => {
        if (!acc) return false;
        return acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.address?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // useEffect(() => {
    //     setCurrentPage(1);
    // }, [searchTerm]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedItems = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Tìm kiếm nơi lưu trú</h1>
                    <p className="text-gray-600 text-lg">Từ resort 5 sao đến homestay thân thiện, tìm căn phòng hoàn hảo cho kỳ nghỉ của bạn.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm tên khách sạn, khu vực..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-[450px] bg-gray-200 animate-pulse rounded-3xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {paginatedItems.map((acc) => {
                            if (!acc) return null;
                            return (
                            <motion.div
                                key={acc.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100"
                            >
                                <Link to={`/locations/${acc.id}`} className="block h-full">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={acc.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'}
                                            alt={acc.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center">
                                                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{acc.name}</h3>
                                            <div className="flex items-center text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                                <Star className="w-4 h-4 fill-current mr-1" />
                                                <span className="font-bold text-sm">{acc.rating_avg.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm mb-6">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <span className="line-clamp-1">{acc.address}</span>
                                        </div>

                                        <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                            <div>
                                                <span className="text-gray-400 text-xs block mb-1">Giá từ</span>
                                                <span className="text-gray-900 font-bold text-lg">
                                                    {acc.price_range_min ? `${acc.price_range_min.toLocaleString()}đ` : 'Liên hệ'}
                                                </span>
                                                <span className="text-gray-400 text-sm"> / đêm</span>
                                            </div>
                                            <span className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors inline-block cursor-pointer">
                                                Đặt ngay
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                            );
                        })}
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-20">
                        <h3 className="text-2xl font-bold text-gray-400">Không tìm thấy chỗ nào phù hợp</h3>
                        <p className="text-gray-500 mt-2">Vui lòng kiểm tra lại từ khóa tìm kiếm.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stay;
