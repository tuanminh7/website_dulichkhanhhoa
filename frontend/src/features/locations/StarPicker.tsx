import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarPickerProps {
    value: number;
    onChange: (v: number) => void;
}

const StarPicker: React.FC<StarPickerProps> = ({ value, onChange }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${
                            s <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'
                        }`}
                    />
                </button>
            ))}
            {value > 0 && (
                <span className="ml-2 text-sm font-bold text-amber-500 animate-in fade-in slide-in-from-left-2 duration-300">
                    {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][value]}
                </span>
            )}
        </div>
    );
};

export default StarPicker;
