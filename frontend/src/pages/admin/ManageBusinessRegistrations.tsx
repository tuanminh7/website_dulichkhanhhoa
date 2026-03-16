import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  Tag,
  User,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface BusinessRegistration {
  id: string;
  business_name: string;
  tax_code: string;
  headquarters_address: string;
  representative_name: string;
  business_license_url: string;
  representative_id_front_url: string;
  representative_id_back_url: string;
  business_type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes: string;
  created_at: string;
  user: {
    fullname: string;
    email: string;
  };
}

const ManageBusinessRegistrations = () => {
  const [registrations, setRegistrations] = useState<BusinessRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<BusinessRegistration | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = filter === 'ALL' ? {} : { status: filter };
      const response = await axios.get('/api/admin/business/registrations', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data.registrations);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedReg) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/business/registrations/${selectedReg.id}/process`, {
        status,
        admin_notes: adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(status === 'APPROVED' ? 'Đã phê duyệt' : 'Đã từ chối');
      setSelectedReg(null);
      setAdminNotes('');
      fetchRegistrations();
    } catch (error) {
      toast.error('Lỗi khi xử lý');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: any = {
      'HOTEL': 'Khách sạn',
      'RESTAURANT': 'Nhà hàng',
      'ATTRACTION': 'Điểm tham quan'
    };
    return types[type] || type;
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Duyệt Doanh Nghiệp</h1>
          <p className="text-gray-500 font-medium">Quản lý hồ sơ đối tác đăng ký kinh doanh</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === s
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Mới' : s === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Không có đơn đăng ký nào</p>
          </div>
        ) : (
          registrations.map((reg) => (
            <motion.div
              layout
              key={reg.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>

              <div className="grow space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{reg.business_name}</h3>
                  {getStatusBadge(reg.status)}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {reg.headquarters_address}</span>
                  <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {getTypeLabel(reg.business_type)}</span>
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {reg.representative_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedReg(reg)}
                  className="px-6 py-3 bg-gray-50 text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" /> Xem chi tiết
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReg(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative z-10"
            >
              <button
                onClick={() => setSelectedReg(null)}
                className="absolute right-6 top-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 leading-none mb-2">{selectedReg.business_name}</h2>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedReg.status)}
                      <span className="text-gray-400 text-sm font-medium">Đăng ký ngày: {new Date(selectedReg.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Thông tin đối tác</h4>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="text-xs font-bold text-gray-400 block mb-1">Mã số thuế</label>
                          <p className="font-bold text-gray-900">{selectedReg.tax_code}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="text-xs font-bold text-gray-400 block mb-1">Địa chỉ trụ sở</label>
                          <p className="font-bold text-gray-900">{selectedReg.headquarters_address}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="text-xs font-bold text-gray-400 block mb-1">Người đại diện</label>
                          <p className="font-bold text-gray-900">{selectedReg.representative_name}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="text-xs font-bold text-gray-400 block mb-1">Người gửi yêu cầu</label>
                          <p className="font-bold text-gray-900">{selectedReg.user.fullname} ({selectedReg.user.email})</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Mô tả dịch vụ</h4>
                      <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-6 rounded-3xl">
                        {selectedReg.description || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Hồ sơ đính kèm</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                          <img
                            src={selectedReg.business_license_url}
                            alt="Giấy phép kinh doanh"
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <a href={selectedReg.business_license_url} target="_blank" className="p-3 bg-white rounded-full text-blue-600 shadow-xl"><ExternalLink className="w-6 h-6" /></a>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-black/60 to-transparent">
                            <p className="text-white text-xs font-bold">Giấy phép kinh doanh</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <img
                              src={selectedReg.representative_id_front_url}
                              alt="CCCD Mặt trước"
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <a href={selectedReg.representative_id_front_url} target="_blank" className="p-3 bg-white rounded-full text-blue-600 shadow-xl"><ExternalLink className="w-6 h-6" /></a>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-black/60 to-transparent">
                              <p className="text-white text-xs font-bold">CCCD (Mặt trước)</p>
                            </div>
                          </div>

                          <div className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <img
                              src={selectedReg.representative_id_back_url}
                              alt="CCCD Mặt sau"
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <a href={selectedReg.representative_id_back_url} target="_blank" className="p-3 bg-white rounded-full text-blue-600 shadow-xl"><ExternalLink className="w-6 h-6" /></a>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-black/60 to-transparent">
                              <p className="text-white text-xs font-bold">CCCD (Mặt sau)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedReg.status === 'PENDING' ? (
                      <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Phản hồi / Ghi chú</label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Nhập ghi chú cho đối tác (lý do từ chối, yêu cầu bổ sung...)"
                          className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-medium text-sm transition-all"
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <button
                            disabled={processing}
                            onClick={() => handleProcess('REJECTED')}
                            className="flex-1 py-4 bg-red-100 text-red-600 font-black rounded-2xl hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-5 h-5" /> Từ chối
                          </button>
                          <button
                            disabled={processing}
                            onClick={() => handleProcess('APPROVED')}
                            className="flex-2 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                          >
                            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle className="w-5 h-5" />}
                            Phê duyệt ngay
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú của Admin</h4>
                        <p className="text-gray-700 font-medium italic">{selectedReg.admin_notes || 'Không có ghi chú'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageBusinessRegistrations;
