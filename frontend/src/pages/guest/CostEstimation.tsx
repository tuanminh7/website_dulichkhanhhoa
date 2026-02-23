import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Coins, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ExpenseItem {
    id: string;
    name: string;
    category: string;
    cost: number;
}

const CostEstimation: React.FC = () => {
    const [items, setItems] = useState<ExpenseItem[]>([
        { id: '1', name: 'Vé máy bay khứ hồi', category: 'Di chuyển', cost: 2500000 },
        { id: '2', name: 'Khách sạn 3 sao (3 đêm)', category: 'Lưu trú', cost: 1800000 },
        { id: '3', name: 'Ăn uống cơ bản (4 ngày)', category: 'Ẩm thực', cost: 1200000 },
    ]);

    const [newItem, setNewItem] = useState({ name: '', category: 'Ẩm thực', cost: '' });

    const addItem = () => {
        if (!newItem.name || !newItem.cost) return;
        setItems([
            ...items,
            { id: Date.now().toString(), name: newItem.name, category: newItem.category, cost: parseInt(newItem.cost) }
        ]);
        setNewItem({ name: '', category: 'Ẩm thực', cost: '' });
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-teal-500/30">
                        <Calculator className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4">Ước tính chi phí chuyến đi</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-medium">Lên kế hoạch ngân sách thông minh cho chuyến hành trình đến Nha Trang của bạn.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Form and List */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Plus className="w-5 h-5 mr-3 text-teal-600" /> Thêm khoản chi phí
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Tên khoản chi (ví dụ: Thuê xe máy)"
                                    className="md:col-span-1 p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                                <select
                                    className="p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium appearance-none"
                                    value={newItem.category}
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    <option>Ẩm thực</option>
                                    <option>Lưu trú</option>
                                    <option>Di chuyển</option>
                                    <option>Giải trí</option>
                                    <option>Mua sắm</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Số tiền (VNĐ)"
                                    className="p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                                    value={newItem.cost}
                                    onChange={e => setNewItem({ ...newItem, cost: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={addItem}
                                className="w-full mt-6 bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
                            >
                                THÊM VÀO DANH SÁCH
                            </button>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-8">Danh sách chi tiết</h2>
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-teal-100 group transition-all"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold mr-4 shadow-sm">
                                                    {item.category[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{item.name}</p>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-black text-gray-900">{item.cost.toLocaleString()} đ</span>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {items.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                                        <p className="text-gray-400 font-medium">Chưa có khoản chi phí nào.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-teal-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-teal-500/30 sticky top-24">
                            <Coins className="w-10 h-10 mb-6 text-white/50" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-2 opacity-70">Tổng dự kiến</h2>
                            <p className="text-5xl font-black mb-10">{totalCost.toLocaleString()} đ</p>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold bg-white/10 p-4 rounded-2xl">
                                    <span>Số người:</span>
                                    <span>01 Người</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold bg-white/10 p-4 rounded-2xl">
                                    <span>Thời gian:</span>
                                    <span>3 Ngày 2 Đêm</span>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-teal-200 mb-6">Phân bỏ chi phí</p>
                                <div className="flex gap-2 h-3 rounded-full bg-white/10 overflow-hidden">
                                    <div className="bg-white w-[40%]" title="Di chuyển" />
                                    <div className="bg-teal-300 w-[30%]" title="Lưu trú" />
                                    <div className="bg-orange-300 w-[20%]" title="Ẩm thực" />
                                    <div className="bg-purple-300 w-[10%]" title="Khác" />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="flex items-center text-[10px] font-bold">
                                        <div className="w-2 h-2 bg-white rounded-full mr-2" /> Di chuyển
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold">
                                        <div className="w-2 h-2 bg-teal-300 rounded-full mr-2" /> Lưu trú
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Info className="w-5 h-5 mr-3 text-blue-500" /> Lưu ý ngân sách
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                Giá cả có thể thay đổi tùy theo mùa du lịch cao điểm (tháng 6 - tháng 8). Hãy kiểm tra lại bảng giá mới nhất trong mục <Link to="/admin" className="text-blue-600 hover:underline">Trạng thái hệ thống</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostEstimation;
