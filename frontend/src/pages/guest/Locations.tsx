import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { locationService, categoryService } from '../../services/api';
import type { Location, Category } from '../../types';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../../components/common/Pagination';

const Locations: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [locations, setLocations] = useState<Location[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [locRes, catRes] = await Promise.all([
                    locationService.getAll({
                        status: 'ACTIVE',
                        page: currentPage,
                        per_page: itemsPerPage,
                        category: selectedCategory ? categories.find(c => c.id === selectedCategory)?.type : undefined,
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
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentPage, selectedCategory, searchTerm]);

    // useEffect(() => {
    //     if (searchParams.get('page')) {
    //         setCurrentPage(1);
    //     }
    // }, [selectedCategory, searchTerm]);

    const paginatedLocations = locations;

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Khám phá địa điểm</h1>
                    <p className="text-gray-600 text-lg">Tìm kiếm những điểm đến tuyệt vời nhất tại Khánh Hòa.</p>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-6 mb-12">
                    <div className="relative grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm địa điểm, địa chỉ..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar outline-none">
                        <button
                            onClick={() => {
                                setSelectedCategory(null);
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-4 rounded-2xl font-semibold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200'}`}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-6 py-4 rounded-2xl font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {paginatedLocations.map((loc) => {
                                if (!loc) return null;
                                return (
                                    <motion.div
                                        key={loc.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100"
                                    >
                                        <Link to={`/locations/${loc.id}`} className="block h-full">
                                            <div className="relative h-64 overflow-hidden">
                                                <img
                                                    src={loc.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop'}
                                                    alt={loc.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                        {categories.find(c => c.id === loc.category_id)?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{loc.name}</h3>
                                                    <div className="flex items-center text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                                        <Star className="w-4 h-4 fill-current mr-1" />
                                                        <span className="font-bold text-sm">{loc.rating_avg.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-gray-500 text-sm mb-6">
                                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="line-clamp-1">{loc.address}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                                    <div className="text-gray-900 font-bold">
                                                        {loc.price_range_min ? `${loc.price_range_min.toLocaleString()}đ+` : 'Miễn phí'}
                                                    </div>
                                                    <span className="text-blue-600 font-semibold inline-flex items-center group-hover:gap-2 transition-all cursor-pointer">
                                                        Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                {!loading && locations.length === 0 && (
                    <div className="text-center py-20">
                        <h3 className="text-2xl font-bold text-gray-400">Không tìm thấy địa điểm nào</h3>
                        <p className="text-gray-500 mt-2">Hãy thử đổi từ khóa hoặc bộ lọc khác.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Locations;
