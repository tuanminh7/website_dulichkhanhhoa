import React, { useEffect, useState } from 'react';
import type { SavedItinerary } from '../../types';
import { Calendar, Clock, Plus, Trash2, ArrowRight, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const Itineraries: React.FC = () => {
    const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItineraries();
    }, []);

    const fetchItineraries = async () => {
        try {
            // Dummy data for now as per api.ts current state
            setItineraries([
                { id: 1, user_id: '1', title: 'Khám phá biển đảo 3 ngày', total_budget: 5000000, nodes: [], created_at: new Date().toISOString() },
                { id: 2, user_id: '1', title: 'Ẩm thực Nha Trang cuối tuần', total_budget: 2000000, nodes: [], created_at: new Date().toISOString() },
            ]);
        } catch (error) {
            console.error('Error fetching itineraries:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Lịch trình của tôi</h1>
                        <p className="text-gray-500 mt-2 font-medium">Lưu trữ và quản lý những kế hoạch hành trình tuyệt vời của bạn.</p>
                    </div>
                    <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/30 flex items-center hover:bg-blue-700 transition-all active:scale-95">
                        <Plus className="w-5 h-5 mr-3" /> TẠO LỊCH TRÌNH MỚI
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {itineraries.map((itinerary, idx) => (
                            <motion.div
                                key={itinerary.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Compass className="w-6 h-6" />
                                    </div>
                                    <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{itinerary.title}</h3>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center text-sm text-gray-500 font-medium">
                                        <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                                        {new Date(itinerary.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 font-medium">
                                        <Clock className="w-4 h-4 mr-3 text-gray-400" />
                                        3 Ngày 2 Đêm
                                    </div>
                                    <div className="flex items-center text-sm text-blue-600 font-black uppercase tracking-widest mt-4">
                                        Ngân sách: {itinerary.total_budget?.toLocaleString()} đ
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-2xl font-bold text-gray-700 transition-all flex items-center justify-center">
                                    XEM CHI TIẾT <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {itineraries.length === 0 && !loading && (
                    <div className="text-center py-24 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Compass className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có lịch trình nào</h3>
                        <p className="text-gray-400 max-w-sm mx-auto font-medium">Hãy bắt đầu lên kế hoạch cho chuyến đi mơ ước của bạn ngay hôm nay!</p>
                        <button className="mt-8 bg-gray-900 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all active:scale-95">
                            BẮT ĐẦU NGAY
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Itineraries;
