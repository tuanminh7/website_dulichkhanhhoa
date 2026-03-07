import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center pt-20">
            <div className="relative mb-8">
                <h1 className="text-9xl font-black text-blue-600/10 select-none">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-4xl font-bold text-gray-800">Ối! Lạc đường rồi</p>
                </div>
            </div>

            <div className="max-w-md animate-float">
                <img
                    src="https://illustrations.popsy.co/blue/crashed-error.svg"
                    alt="404 Illustration"
                    className="w-full h-auto mb-8 drop-shadow-2xl"
                />
            </div>

            <p className="text-gray-600 text-lg mb-8 max-w-sm">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển. Đừng lo lắng, hãy quay lại trang chủ nhé!
            </p>

            <Link to="/" className="btn-primary">
                <span className="mr-2">🏠</span>
                Quay lại Trang Chủ
            </Link>
        </div>
    );
};

export default NotFound;
