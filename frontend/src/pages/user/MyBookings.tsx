import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Users,
  XCircle,
  BedDouble,
  UtensilsCrossed,
  Armchair,
  MapPin,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingService } from '../../services/api';
import type { Booking } from '../../types';

const serviceIcon = (type: string) => {
  if (type === 'ROOM') return <BedDouble className="w-5 h-5" />;
  if (type === 'TABLE') return <UtensilsCrossed className="w-5 h-5" />;
  return <Armchair className="w-5 h-5" />;
};

const serviceLabel = (type: string) => {
  const m: Record<string, string> = { ROOM: 'Phòng lưu trú', TABLE: 'Bàn ăn', SEAT: 'Chỗ ngồi' };
  return m[type] ?? type;
};

const statusColor = (status: string) => {
  if (status === 'CONFIRMED') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const statusLabel = (status: string) => {
  const m: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
  };
  return m[status] ?? status;
};

const statusIcon = (status: string) => {
  if (status === 'CONFIRMED') return <CheckCircle className="w-3 h-3" />;
  if (status === 'CANCELLED') return <XCircle className="w-3 h-3" />;
  return <Clock className="w-3 h-3" />;
};

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingService.myBookings();
      setBookings(res.data as Booking[]);
    } catch {
      toast.error('Không thể tải danh sách đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await bookingService.cancelBooking(id);
      toast.success('Đã hủy đặt chỗ');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Lỗi khi hủy đặt chỗ');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Đặt Chỗ Của Tôi</h1>
              <p className="text-gray-500 font-medium">Lịch sử và trạng thái các đặt chỗ của bạn</p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100"
          >
            <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold tracking-widest text-sm uppercase">Chưa có đặt chỗ nào</p>
            <p className="text-gray-400 text-sm mt-2">Hãy tìm kiếm doanh nghiệp và thực hiện đặt chỗ!</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-5 hover:shadow-md transition-shadow"
                >
                  {/* Icon + service type */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      booking.service_type === 'ROOM'
                        ? 'bg-blue-50 text-blue-500'
                        : booking.service_type === 'TABLE'
                        ? 'bg-orange-50 text-orange-500'
                        : 'bg-purple-50 text-purple-500'
                    }`}
                  >
                    {serviceIcon(booking.service_type)}
                  </div>

                  {/* Info */}
                  <div className="grow space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-gray-900 text-lg">
                        {booking.business?.business_name || 'Doanh nghiệp'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor(booking.status)}`}
                      >
                        {statusIcon(booking.status)} {statusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 text-gray-700 font-semibold">
                        {serviceIcon(booking.service_type)} {serviceLabel(booking.service_type)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                        {booking.time_slot && ` · ${booking.time_slot}`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {booking.guest_count} khách
                      </span>
                    </div>

                    {booking.business?.headquarters_address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {booking.business.headquarters_address}
                      </p>
                    )}

                    {booking.notes && (
                      <p className="text-xs text-gray-500 italic">Ghi chú: {booking.notes}</p>
                    )}
                  </div>

                  {/* Cancel action */}
                  {booking.status === 'PENDING' && (
                    <button
                      disabled={cancelling === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {cancelling === booking.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Hủy đặt chỗ
                    </button>
                  )}

                  {/* Created date */}
                  <p className="text-xs text-gray-300 font-medium shrink-0 hidden md:block">
                    {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
