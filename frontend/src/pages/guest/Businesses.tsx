import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { businessService } from '../../services/api';
import type { BusinessRegistration } from '../../types';
import { MapPin, Building2, Store, Tent } from 'lucide-react';
import { motion } from 'framer-motion';

const getBusinessIcon = (type: string) => {
    switch (type) {
        case 'HOTEL': return <Building2 className="w-5 h-5" />;
        case 'RESTAURANT': return <Store className="w-5 h-5" />;
        case 'ATTRACTION': return <Tent className="w-5 h-5" />;
        default: return <Building2 className="w-5 h-5" />;
    }
};

const getBusinessLabel = (type: string) => {
    switch (type) {
        case 'HOTEL': return 'Khách sạn / Lưu trú';
        case 'RESTAURANT': return 'Nhà hàng / Quán ăn';
        case 'ATTRACTION': return 'Khu du lịch / Giải trí';
        default: return type;
    }
};

const Businesses: React.FC = () => {
    const [businesses, setBusinesses] = useState<BusinessRegistration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await businessService.getApprovedBusinesses();
                setBusinesses(res.data);
            } catch (err) {
                console.error("Failed to fetch businesses", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBusinesses();
    }, []);

    if (loading) {
        return <div className="pt-32 text-center">Đang tải danh sách doanh nghiệp...</div>;
    }

    return (
        <div className="pt-28 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight">
                        Doanh nghiệp <span className="text-blue-600">Đối tác</span>
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Khám phá các doanh nghiệp dịch vụ du lịch uy tín tại Khánh Hòa và đặt chỗ ngay hôm nay.
                    </p>
                </div>

                {businesses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg">Hiện chưa có doanh nghiệp nào được phê duyệt.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {businesses.map((bus, idx) => (
                            <motion.div
                                key={bus.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Link to={`/businesses/${bus.id}`} className="group block h-full">
                                    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full flex flex-col">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            {getBusinessIcon(bus.business_type)}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {bus.business_name}
                                        </h3>
                                        <div className="flex items-center text-sm font-semibold text-gray-500 mb-4 bg-gray-50 px-3 py-1.5 rounded-xl w-fit">
                                            {getBusinessLabel(bus.business_type)}
                                        </div>
                                        <div className="flex items-start text-gray-600 mb-6 mt-auto">
                                            <MapPin className="w-5 h-5 mr-3 shrink-0 text-gray-400" />
                                            <p className="text-sm line-clamp-2 leading-relaxed">{bus.headquarters_address}</p>
                                        </div>
                                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                                            <span className="text-sm font-bold text-gray-500">Xem chi tiết & Đặt chỗ</span>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Businesses;
