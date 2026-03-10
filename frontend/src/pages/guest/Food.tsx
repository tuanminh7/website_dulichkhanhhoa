import React, { useEffect, useState } from 'react';
import { dishService, locationService } from '../../services/api';
import type { Dish, Location } from '../../types';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Food: React.FC = () => {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [restaurants, setRestaurants] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dishRes, locRes] = await Promise.all([
                    dishService.getAll(),
                    locationService.getAll({ category: 'FOOD' })
                ]);
                setDishes(dishRes.data);
                setRestaurants(locRes.data as any);
            } catch (error) {
                console.error('Error fetching food data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="pt-24 pb-20 bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Tinh hoa ẩm thực Khánh Hòa</h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                        Khám phá những món ăn đặc sản và những địa điểm ăn uống nổi tiếng không thể bỏ qua khi đến xứ Trầm Hương.
                    </p>
                </div>

                <div className="mb-20">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Món ngon đặc sản</h2>
                        <Link to="/chatbot" className="text-blue-600 font-semibold text-sm hover:underline">Hỏi AI về món ăn</Link>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="min-w-[300px] h-48 bg-gray-100 animate-pulse rounded-3xl" />)
                        ) : (
                            dishes.map(dish => {
                                if (!dish) return null;
                                return (
                                    <div key={dish.id} className="min-w-[300px] group relative h-48 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                                        <img
                                            src={dish.image_url || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=2000&auto=format&fit=crop'}
                                            alt={dish.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-4 left-4">
                                            <h3 className="text-white font-bold text-xl">{dish.name}</h3>
                                            <p className="text-gray-300 text-xs line-clamp-1">{dish.description}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {!loading && dishes.length === 0 && (
                            <div className="w-full py-12 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                Dữ liệu món ăn đang được cập nhật...
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Địa điểm ăn uống nổi bật</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-3xl" />)
                        ) : (
                            restaurants.map(rest => {
                                if (!rest) return null;
                                return (
                                    <div key={rest.id} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100 group">
                                        <div className="h-48 relative overflow-hidden">
                                            <img
                                                src={rest.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop'}
                                                alt={rest.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{rest.name}</h3>
                                            <div className="flex items-center text-gray-500 text-sm mb-4">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                <span className="line-clamp-1">{rest.address}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center text-orange-500 font-bold">
                                                    <Star className="w-4 h-4 fill-current mr-1" />
                                                    {rest.rating_avg.toFixed(1)}
                                                </div>
                                                <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Food;
