import React from 'react';
import { CATEGORIES } from '../types';
import {
  Sparkles,
  Smartphone,
  Shirt,
  Watch,
  Armchair,
  Smile,
  Trophy,
  Headphones,
  ShoppingBag,
  Coffee
} from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ selectedCategory, onSelectCategory }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'All':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Consumer Tech & Gadgets':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'Designer Apparel & Footwear':
        return <Shirt className="w-3.5 h-3.5" />;
      case 'Watches & Fine Jewelry':
        return <Watch className="w-3.5 h-3.5" />;
      case 'Home, Living & Interior':
        return <Armchair className="w-3.5 h-3.5" />;
      case 'Beauty, Skincare & Fragrance':
        return <Smile className="w-3.5 h-3.5" />;
      case 'Sports, Fitness & Activewear':
        return <Trophy className="w-3.5 h-3.5" />;
      case 'Audio & Pro Sound':
        return <Headphones className="w-3.5 h-3.5" />;
      case 'Luxury Bags & Accessories':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'Gourmet & Modern Pantry':
        return <Coffee className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
