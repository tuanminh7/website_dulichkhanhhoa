import React from 'react';
import { Edit2, Trash2, MapPin, Tag, ImagePlus } from 'lucide-react';
import type { Location } from '../../../types';

interface LocationTableProps {
    locations: Location[];
    loading: boolean;
    onEdit: (loc: Location) => void;
    onDelete: (id: number) => void;
}

const LocationTable: React.FC<LocationTableProps> = ({ locations, loading, onEdit, onDelete }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 pl-4">Địa điểm</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Danh mục</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Giá tiền</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Ảnh</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400">Trạng thái</th>
                        <th className="pb-4 font-black text-xs uppercase tracking-widest text-gray-400 text-right pr-4">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <tr key={i} className="animate-pulse">
                                <td className="py-6 pl-4"><div className="h-10 bg-gray-100 rounded-xl" /></td>
                                <td className="py-6"><div className="h-6 bg-gray-50 rounded-lg w-20" /></td>
                                <td className="py-6"><div className="h-6 bg-gray-50 rounded-lg w-16" /></td>
                                <td className="py-6"><div className="h-6 bg-gray-50 rounded-lg w-16" /></td>
                                <td className="py-6 pr-4"><div className="h-10 bg-gray-50 rounded-xl w-24 ml-auto" /></td>
                            </tr>
                        ))
                    ) : (
                        locations.map((loc) => {
                            const imgs = loc.images || [];
                            return (
                                <tr key={loc.id} className="group hover:bg-gray-50 transition-all">
                                    <td className="py-6 pl-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden mr-4 shrink-0">
                                                {imgs[0]?.image_url ? (
                                                    <img src={imgs[0].image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ImagePlus className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{loc.name}</p>
                                                <p className="text-xs text-gray-400 flex items-center mt-1">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {loc.address ? loc.address.substring(0, 35) + (loc.address.length > 35 ? '...' : '') : 'Chưa có địa chỉ'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {loc.category?.name || 'Chưa phân loại'}
                                        </span>
                                    </td>
                                    <td className="py-6">
                                        {(loc.price_range_min || loc.price_range_max) ? (
                                            <div>
                                                <span className="font-bold text-gray-900 text-[13px] block">
                                                    {loc.price_range_min ? `${loc.price_range_min.toLocaleString('vi-VN')} đ` : '0 đ'} - {loc.price_range_max ? `${loc.price_range_max.toLocaleString('vi-VN')} đ` : '...'}
                                                </span>
                                                {loc.price && <span className="text-[10px] text-gray-400 block font-medium mt-0.5">Cố định: {loc.price.toLocaleString('vi-VN')} đ</span>}
                                            </div>
                                        ) : (
                                            <span className="font-bold text-gray-900">
                                                {loc.price ? `${loc.price.toLocaleString('vi-VN')} đ` : '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-6">
                                        <div className="flex -space-x-2">
                                            {imgs.slice(0, 3).map((img, i) => (
                                                <div key={img.id} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white" style={{ zIndex: 3 - i }}>
                                                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {imgs.length > 3 && (
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    +{imgs.length - 3}
                                                </div>
                                            )}
                                            {imgs.length === 0 && (
                                                <span className="text-xs text-gray-300 font-medium">Chưa có ảnh</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${loc.status === 'ACTIVE' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-gray-300'}`} />
                                        <span className={`text-xs font-bold ${loc.status === 'ACTIVE' ? 'text-teal-600' : 'text-gray-400'}`}>
                                            {loc.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                                        </span>
                                    </td>
                                    <td className="py-6 text-right pr-4">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => onEdit(loc)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(loc.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LocationTable;
