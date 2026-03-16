import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileText, User, MapPin, Upload, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RegisterBusiness = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    tax_code: '',
    headquarters_address: '',
    representative_name: '',
    business_type: 'HOTEL',
    description: '',
  });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    business_license: null,
    representative_id_front: null,
    representative_id_back: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [field]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!files.business_license || !files.representative_id_front || !files.representative_id_back) {
      toast.error('Vui lòng tải lên đầy đủ hồ sơ pháp lý');
      setLoading(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, (formData as any)[key]));
    data.append('business_license', files.business_license);
    data.append('representative_id_front', files.representative_id_front);
    data.append('representative_id_back', files.representative_id_back);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/business/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setSubmitted(true);
      toast.success('Gửi đơn đăng ký thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Đã xảy ra lỗi khi gửi đơn');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Đã nhận đơn đăng ký!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Cảm ơn bạn đã quan tâm đến việc hợp tác cùng chúng tôi. Đội ngũ admin sẽ xem xét hồ sơ của bạn và phản hồi sớm nhất qua email hoặc số điện thoại đã cung cấp.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            Quay lại trang chủ
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Hợp Tác <span className="text-blue-600">Phát Triển</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Đăng ký doanh nghiệp của bạn để xuất hiện trên bản đồ du lịch Khánh Hòa và tiếp cận hàng triệu khách du lịch tiềm năng.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-4xl shadow-2xl overflow-hidden border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            {/* Form Sections */}
            <div className="space-y-12">
              {/* Section 1: Thông tin cơ bản */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin cơ bản</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Tên doanh nghiệp <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="text"
                        name="business_name"
                        required
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="VD: Khách sạn Mường Thanh"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Mã số thuế <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="text"
                        name="tax_code"
                        required
                        value={formData.tax_code}
                        onChange={handleChange}
                        placeholder="Mã số thuế doanh nghiệp"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Địa chỉ trụ sở chính <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="text"
                        name="headquarters_address"
                        required
                        value={formData.headquarters_address}
                        onChange={handleChange}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Người đại diện pháp luật <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="text"
                        name="representative_name"
                        required
                        value={formData.representative_name}
                        onChange={handleChange}
                        placeholder="Họ và tên"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Loại hình kinh doanh <span className="text-red-500">*</span></label>
                    <select
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                    >
                      <option value="HOTEL">Khách sạn / Lưu trú</option>
                      <option value="RESTAURANT">Nhà hàng / Ẩm thực</option>
                      <option value="ATTRACTION">Điểm tham quan / Vui chơi</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Hồ sơ pháp lý */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Hồ sơ pháp lý</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 ml-1">Giấy phép kinh doanh <span className="text-red-500">*</span></label>
                    <div className="relative border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-3xl p-6 transition-all group bg-gray-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'business_license')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {files.business_license ? files.business_license.name : 'Tải lên ảnh chụp GPKD'}
                        </p>
                        <p className="text-xs text-gray-500">Định dạng JPG, PNG. Tối đa 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 ml-1">CCCD (Mặt trước) <span className="text-red-500">*</span></label>
                    <div className="relative border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-3xl p-6 transition-all group bg-gray-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'representative_id_front')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {files.representative_id_front ? files.representative_id_front.name : 'Tải lên mặt trước CCCD'}
                        </p>
                        <p className="text-xs text-gray-500">Định dạng JPG, PNG. Tối đa 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 ml-1">CCCD (Mặt sau) <span className="text-red-500">*</span></label>
                    <div className="relative border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-3xl p-6 transition-all group bg-gray-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'representative_id_back')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {files.representative_id_back ? files.representative_id_back.name : 'Tải lên mặt sau CCCD'}
                        </p>
                        <p className="text-xs text-gray-500">Định dạng JPG, PNG. Tối đa 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Mô tả */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Mô tả dịch vụ</h2>
                </div>
                <div className="space-y-2">
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Hãy chia sẻ thêm về dịch vụ, điểm nổi bật hoặc bất cứ thông tin nào giúp chúng tôi hiểu hơn về doanh nghiệp của bạn..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                  ></textarea>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-12 border-t border-gray-100 italic text-gray-500 text-sm mb-8">
              Bằng việc nhấn "Gửi đơn đăng ký", bạn cam kết các thông tin cung cấp là chính xác và chịu hoàn toàn trách nhiệm trước pháp luật.
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-lg tracking-wider uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-500/25'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Gửi đơn đăng ký
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterBusiness;
