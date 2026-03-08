import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout: React.FC = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="grow">
                <Outlet />
            </main>
            {(location.pathname !== "/chatbot") && <Footer />}
        </div>
    );
};

export default MainLayout;
