import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div className="flex justify-center items-center gap-2 mt-12">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all shadow-sm"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`min-w-[48px] h-12 rounded-xl font-bold transition-all shadow-sm ${
                        currentPage === page
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-500 hover:text-blue-600'
                    }`}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all shadow-sm"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Pagination;
