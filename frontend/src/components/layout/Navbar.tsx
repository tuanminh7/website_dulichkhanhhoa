import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout, isAdmin, isBusiness, loading } = useAuth();

    const navLinks = [
        { name: 'Du Lịch', path: '/locations' },
        { name: 'Tin Tức', path: '/news' },
        { name: 'Tư Vấn AI', path: '/chatbot' },
        ...(isBusiness ? [{ name: 'Quản Lý', path: '/business' }] : [{ name: 'Hợp Tác', path: '/register-business' }]),
    ];

    const handleLogout = () => {
        logout();
    };



    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-xl border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="shrink-0 flex items-center group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform">
                                <span className="font-black text-xl">K</span>
                            </div>
                            <span className="text-xl font-extrabold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                KhanhHoa<span className="text-blue-600">Travel</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-2">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                            {isAdmin && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center ${isActive
                                            ? 'text-purple-700 bg-purple-50'
                                            : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                                        }`
                                    }
                                >
                                    Admin
                                </NavLink>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-3">
                        {loading ? (
                            <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-full" />
                        ) : user ? (
                            <div className="flex items-center space-x-3">
                                <Link to="/profile" className="flex items-center gap-2 p-1.5 pr-4 bg-gray-50 rounded-full hover:bg-gray-100 transition-all border border-gray-100">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                                        <img src={user.avatar || '/avatar-holder.svg'} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{user.fullname}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 active:scale-95 flex items-center"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Đăng nhập
                            </Link>
                        )}
                    </div>


                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-50 overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-2">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `block px-4 py-3 rounded-xl text-base font-bold ${isActive
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                            {isAdmin && (
                                <NavLink
                                    to="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `block px-4 py-3 rounded-xl text-base font-bold ${isActive
                                            ? 'text-purple-700 bg-purple-50'
                                            : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                                        }`
                                    }
                                >
                                    Quản trị hệ thống
                                </NavLink>
                            )}
                            <div className="pt-4 mt-2 border-t border-gray-100">
                                {loading ? (
                                    <div className="h-14 w-full bg-gray-50 animate-pulse rounded-2xl" />
                                ) : user ? (
                                    <div className="space-y-2">
                                        <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center p-4 bg-gray-50 rounded-2xl">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 font-bold">
                                                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full" /> : user.fullname}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{user.fullname}</p>
                                                <p className="text-xs text-gray-500">Xem hồ sơ của bạn</p>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center p-4 text-red-500 font-bold"
                                        >
                                            <LogOut className="w-5 h-5 mr-4" /> Đăng xuất
                                        </button>
                                    </div>
                                ) : (
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center bg-gray-900 text-white p-4 rounded-2xl font-bold">
                                        Đăng nhập
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
