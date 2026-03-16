import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CalendarDays,
  CheckCircle,
  Clock,
  Users,
  XCircle,
  SlidersHorizontal,
  UtensilsCrossed,
  BedDouble,
  Armchair,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingService } from '../../services/api';
import type { Booking } from '../../types';

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

const serviceIcon = (type: string) => {
  if (type === 'ROOM') return <BedDouble className="w-4 h-4" />;
  if (type === 'TABLE') return <UtensilsCrossed className="w-4 h-4" />;
  return <Armchair className="w-4 h-4" />;
};

const serviceLabel = (type: string) => {
  if (type === 'ROOM') return 'Phòng lưu trú';
  if (type === 'TABLE') return 'Bàn ăn';
  return 'Chỗ ngồi';
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, React.ReactElement> = {
    PENDING: (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
        <Clock className="w-3 h-3" /> Chờ xác nhận
      </span>
    ),
    CONFIRMED: (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
        <CheckCircle className="w-3 h-3" /> Đã xác nhận
      </span>
    ),
    CANCELLED: (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
        <XCircle className="w-3 h-3" /> Đã hủy
      </span>
    ),
  };
  return map[status] ?? null;
};

const BusinessDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const res = await bookingService.manageBookings(status);
      setBookings(res.data as Booking[]);
    } catch {
      toast.error('Không thể tải danh sách đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setProcessing(id);
    try {
      await bookingService.confirmBooking(id);
      toast.success('Đã xác nhận đặt chỗ!');
      fetchBookings();
    } catch {
      toast.error('Lỗi khi xác nhận');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (id: string) => {
    setProcessing(id);
    try {
      await bookingService.cancelBookingByBusiness(id);
      toast.success('Đã hủy đặt chỗ');
      fetchBookings();
    } catch {
      toast.error('Lỗi khi hủy');
    } finally {
      setProcessing(null);
    }
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ duyệt', value: 'PENDING' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý Đặt Chỗ</h1>
              <p className="text-gray-500 font-medium">Xem và xử lý các yêu cầu đặt chỗ từ khách hàng</p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-8 w-fit"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Booking List */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100"
          >
            <SlidersHorizontal className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold tracking-widest text-sm uppercase">Không có yêu cầu nào</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow"
                >
                  {/* Left: Icon */}
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-500">
                    {serviceIcon(booking.service_type)}
                  </div>

                  {/* Middle: Info */}
                  <div className="grow space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-gray-900 text-lg">
                        {booking.customer?.fullname || 'Khách'}
                      </span>
                      <StatusBadge status={booking.status} />
                      <span className="text-xs text-gray-400 font-medium">
                        {serviceLabel(booking.service_type)} · {booking.business?.business_name}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                        {booking.time_slot && ` · ${booking.time_slot}`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {booking.guest_count} khách
                      </span>
                      {booking.notes && (
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" /> {booking.notes}
                        </span>
                      )}
                    </div>

                    {booking.customer?.phone && (
                      <p className="text-xs text-gray-400">
                        📞 {booking.customer.phone} · {booking.customer.email}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {booking.status === 'PENDING' && (
                    <div className="flex gap-3 shrink-0">
                      <button
                        disabled={processing === booking.id}
                        onClick={() => handleCancel(booking.id)}
                        className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button
                        disabled={processing === booking.id}
                        onClick={() => handleConfirm(booking.id)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm shadow-md shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2"
                      >
                        {processing === booking.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Xác nhận
                      </button>
                    </div>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <button
                      disabled={processing === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 shrink-0"
                    >
                      Hủy đặt
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
