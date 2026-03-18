import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { businessService, bookingService } from '../../services/api';
import type { BusinessRegistration } from '../../types';
import { MapPin, ArrowLeft, Building2, Store, Tent, Check, Calendar, Users, Clock, AlignLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const getBusinessIcon = (type: string) => {
    switch (type) {
        case 'HOTEL': return <Building2 className="w-8 h-8" />;
        case 'RESTAURANT': return <Store className="w-8 h-8" />;
        case 'ATTRACTION': return <Tent className="w-8 h-8" />;
        default: return <Building2 className="w-8 h-8" />;
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

const BusinessDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [business, setBusiness] = useState<BusinessRegistration | null>(null);
    const [loading, setLoading] = useState(true);

    // Booking state
    const [serviceType, setServiceType] = useState<'ROOM' | 'TABLE' | 'SEAT'>('TABLE');
    const [bookingDate, setBookingDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [guestCount, setGuestCount] = useState<number>(1);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Contact Info State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    useEffect(() => {
        if (user) {
            setCustomerName(user.fullname || '');
            setCustomerPhone(user.phone || '');
        }
    }, [user]);

    useEffect(() => {
        const fetchBusiness = async () => {
            if (!id) return;
            try {
                const res = await businessService.getBusinessDetail(id);
                setBusiness(res.data);
                
                // Set default service type based on business type
                if (res.data.business_type === 'HOTEL') setServiceType('ROOM');
                else if (res.data.business_type === 'RESTAURANT') setServiceType('TABLE');
                else setServiceType('SEAT');

            } catch (err) {
                console.error("Failed to fetch business details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBusiness();
    }, [id]);

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Vui lòng đăng nhập để đặt chỗ');
            return;
        }

        if (!bookingDate) {
            toast.error('Vui lòng chọn ngày đặt chỗ');
            return;
        }

        if (!customerName.trim() || !customerPhone.trim()) {
            toast.error('Vui lòng nhập họ tên và số điện thoại người liên hệ');
            return;
        }

        if (!id) return;

        setSubmitting(true);
        try {
            await bookingService.createBooking({
                business_registration_id: id,
                service_type: serviceType,
                booking_date: bookingDate,
                time_slot: timeSlot,
                guest_count: guestCount,
                notes: notes,
                customer_name: customerName,
                customer_phone: customerPhone
            });
            toast.success('Đặt chỗ thành công! Chờ doanh nghiệp xác nhận.');
            // Reset form
            setBookingDate('');
            setTimeSlot('');
            setNotes('');
            setGuestCount(1);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="pt-32 text-center">Đang tải thông tin...</div>;
    }

    if (!business) {
        return <div className="pt-32 text-center text-red-500">Không tìm thấy doanh nghiệp.</div>;
    }

    return (
        <div className="pt-20 pb-20 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link to="/businesses" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-6 font-medium">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại danh sách
                    </Link>
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
                            {getBusinessIcon(business.business_type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    {getBusinessLabel(business.business_type)}
                                </span>
                                <span className="flex items-center text-teal-600 bg-teal-50 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    <Check className="w-4 h-4 mr-1" /> Đã xác thực
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{business.business_name}</h1>
                            <div className="flex items-center text-gray-600 font-medium">
                                <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                                {business.headquarters_address}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Giới thiệu</h2>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {business.description || 'Doanh nghiệp chưa cập nhật bài giới thiệu chi tiết.'}
                            </p>
                        </div>

                        {/* Additional Info (Optional) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h2>
                            <ul className="space-y-4 text-gray-600 font-medium">
                                <li className="flex">
                                    <span className="w-32 text-gray-400">Đại diện:</span>
                                    <span className="text-gray-900">{business.representative_name}</span>
                                </li>
                                <li className="flex">
                                    <span className="w-32 text-gray-400">Mã số thuế:</span>
                                    <span className="text-gray-900">{business.tax_code}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Booking Form Sidebar */}
                    <div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl sticky top-28">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Đặt chỗ trực tuyến</h2>
                            
                            {!user ? (
                                <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-blue-800 font-medium mb-4">Vui lòng đăng nhập để tiến hành đặt chỗ với doanh nghiệp này.</p>
                                    <Link to="/login" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
                                        Đăng nhập ngay
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleBooking} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên người đặt</label>
                                        <input
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại liên hệ</label>
                                        <input
                                            type="tel"
                                            required
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Loại dịch vụ</label>
                                        <select
                                            value={serviceType}
                                            onChange={(e) => setServiceType(e.target.value as any)}
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                                        >
                                            <option value="ROOM">Đặt phòng</option>
                                            <option value="TABLE">Đặt bàn</option>
                                            <option value="SEAT">Đặt vé / Chỗ ngồi</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" /> Ngày đến
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" /> Giờ (Tùy chọn)
                                            </label>
                                            <input
                                                type="time"
                                                value={timeSlot}
                                                onChange={(e) => setTimeSlot(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                                <Users className="w-4 h-4 mr-2 text-gray-400" /> Số khách
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={guestCount}
                                                onChange={(e) => setGuestCount(parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                            <AlignLeft className="w-4 h-4 mr-2 text-gray-400" /> Ghi chú (Tùy chọn)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Yêu cầu đặc biệt..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 mt-4 flex justify-center items-center"
                                    >
                                        {submitting ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            'Gửi yêu cầu đặt chỗ'
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-400 text-center mt-4">
                                        Doanh nghiệp sẽ liên hệ hoặc xác nhận qua hệ thống sau khi nhận được yêu cầu.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetail;
