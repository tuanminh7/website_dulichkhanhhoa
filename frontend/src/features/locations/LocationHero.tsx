import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Location } from '../../types';

interface LocationHeroProps {
    location: Location;
    avgRating: number;
    reviewsCount: number;
}

const LocationHero: React.FC<LocationHeroProps> = ({ location, avgRating, reviewsCount }) => {
    return (
        <div className="relative h-[60vh] overflow-hidden">
            <img
                src={location.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1544918877-460635b64a36?q=80&w=2070&auto=format&fit=crop'}
                alt={location.name}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />

            <div className="absolute top-8 left-8">
                <Link to="/locations" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all flex items-center font-bold">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại
                </Link>
            </div>

            <div className="absolute bottom-12 left-12 right-12 text-white animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30">
                        {location.category?.name}
                    </span>
                    <div className="flex items-center text-amber-400 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                        <Star className="w-4 h-4 fill-current mr-1.5" />
                        <span className="font-bold">{avgRating.toFixed(1)}</span>
                        <span className="text-xs ml-1 text-amber-300/80">({reviewsCount})</span>
                    </div>
                    {(location.price || location.price_range_min) && (
                        <div className="flex items-center text-teal-400 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                            <span className="font-black text-xs mr-1">₫</span>
                            <span className="font-bold text-sm">
                                {location.price 
                                    ? `${location.price.toLocaleString('vi-VN')} đ` 
                                    : `${location.price_range_min?.toLocaleString('vi-VN')} đ+`}
                            </span>
                        </div>
                    )}
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase leading-tight tracking-tighter shadow-sm">{location.name}</h1>
                <div className="flex flex-wrap items-center gap-6 text-gray-200">
                    <div className="flex items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/5">
                        <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                        <span className="font-bold text-sm">{location.address}</span>
                    </div>
                    <div className="flex items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/5">
                        <ShieldCheck className="w-5 h-5 mr-3 text-teal-400" />
                        <span className="font-bold text-sm italic">Đã xác minh điểm đến</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationHero;
