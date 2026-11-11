import React, { useRef, useState, useEffect } from 'react';
import { Shield, Zap, Sparkles, Trophy, Award, Layers, MapPin, User, Car, ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeBrandName } from '../utils/brandLogos';

export default function StatsBar({ 
  cars = [], 
  brands = [], 
  selectedBrand = 'Tutti', 
  setSelectedBrand,
  owners = [],
  selectedOwner = 'Tutti',
  setSelectedOwner,
  locations = [],
  selectedLocation = 'Tutti',
  setSelectedLocation,
  totalCarsCount = 0,
  filteredCount = 0
}) {
  const brandScrollRef = useRef(null);
  const ownersScrollRef = useRef(null);
  const [canScrollBrandLeft, setCanScrollBrandLeft] = useState(false);
  const [canScrollBrandRight, setCanScrollBrandRight] = useState(true);

  const checkBrandScroll = () => {
    if (brandScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = brandScrollRef.current;
      setCanScrollBrandLeft(scrollLeft > 2);
      setCanScrollBrandRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkBrandScroll();
    const el = brandScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkBrandScroll, { passive: true });
      window.addEventListener('resize', checkBrandScroll);
      return () => {
        el.removeEventListener('scroll', checkBrandScroll);
        window.removeEventListener('resize', checkBrandScroll);
      };
    }
  }, [brands, totalCarsCount]);

  const scrollBrands = (direction) => {
    if (brandScrollRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      brandScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleWheelScroll = (ref) => (e) => {
    if (e.deltaY !== 0 && ref.current) {
      ref.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="space-y-0.5 mb-1">
      {/* 1. Brand Horizontal Filter Chips with Desktop Arrows & Wheel Scroll */}
      <div className="relative flex items-center group py-0.5">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scrollBrands('left')}
          disabled={!canScrollBrandLeft}
          className={`hidden md:flex items-center justify-center w-6 h-7 bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700/80 rounded-l-md shrink-0 transition-all z-10 shadow-sm ${
            !canScrollBrandLeft ? 'opacity-25 cursor-not-allowed' : 'opacity-100 hover:scale-105 active:scale-95'
          }`}
          title="Scorri marchi a sinistra"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Brands - ALWAYS justify-start so first brands (ALFA ROMEO, AUDI...) are NEVER cut off */}
        <div 
          ref={brandScrollRef}
          onWheel={handleWheelScroll(brandScrollRef)}
          className="flex items-center space-x-1.5 overflow-x-auto px-1 py-0.5 no-scrollbar scroll-smooth w-full justify-start select-none"
        >
          <button
            type="button"
            onClick={() => setSelectedBrand('Tutti')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
              selectedBrand === 'Tutti'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tutti i Marchi ({totalCarsCount})
          </button>
          
          {brands.map(brand => {
            const brandNorm = normalizeBrandName(brand);
            const count = cars.filter(c => normalizeBrandName(c.brand) === brandNorm).length;
            const isSelected = selectedBrand !== 'Tutti' && normalizeBrandName(selectedBrand) === brandNorm;
            return (
              <button
                type="button"
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="uppercase font-bold tracking-wider">{brand}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scrollBrands('right')}
          disabled={!canScrollBrandRight}
          className={`hidden md:flex items-center justify-center w-6 h-7 bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700/80 rounded-r-md shrink-0 transition-all z-10 shadow-sm ${
            !canScrollBrandRight ? 'opacity-25 cursor-not-allowed' : 'opacity-100 hover:scale-105 active:scale-95'
          }`}
          title="Scorri marchi a destra"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Proprietari (Owners) Filter Chips */}
      {owners.length > 0 && setSelectedOwner && (
        <div className="relative py-0.5 border-t border-slate-800/40">
          <div 
            ref={ownersScrollRef}
            onWheel={handleWheelScroll(ownersScrollRef)}
            className={`flex items-center space-x-1.5 overflow-x-auto px-1 py-0.5 no-scrollbar scroll-smooth select-none ${
              owners.length > 7 ? 'justify-start' : 'justify-start md:justify-center'
            }`}
          >
            {/* Owner Section Icon & Label */}
            <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold shrink-0 pr-1 select-none">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-slate-300 font-semibold">Proprietari:</span>
            </div>

            {/* "Tutti i Proprietari" Chip */}
            <button
              type="button"
              onClick={() => setSelectedOwner('Tutti')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1.5 ${
                selectedOwner === 'Tutti'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Tutti i Proprietari</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedOwner === 'Tutti' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {totalCarsCount}
              </span>
            </button>

            {/* Individual Owners Chips */}
            {owners.map(owner => {
              const count = cars.filter(c => {
                const carOwner = (c.proprietario || c.owner || '').trim().replace(/\s+/g, ' ').toLowerCase();
                return carOwner === owner.trim().replace(/\s+/g, ' ').toLowerCase();
              }).length;
              const isSelected = selectedOwner !== 'Tutti' && selectedOwner.trim().toLowerCase() === owner.trim().toLowerCase();

              return (
                <button
                  type="button"
                  key={owner}
                  onClick={() => setSelectedOwner(isSelected ? 'Tutti' : owner)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-sm shadow-amber-500/10 font-bold'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{owner}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Location / Garage Horizontal Filter Chips (if locations exist) */}
      {locations.length > 0 && setSelectedLocation && (
        <div className="flex items-center space-x-1.5 overflow-x-auto px-1 py-0.5 no-scrollbar scroll-smooth border-t border-slate-800/40 justify-start md:justify-center">
          <div className="flex items-center space-x-1 text-slate-400 text-xs font-bold shrink-0 pr-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Garage:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedLocation('Tutti')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              selectedLocation === 'Tutti'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-bold'
                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Tutti i Garage
          </button>

          {locations.map(loc => {
            const count = cars.filter(c => {
              const carLoc = (c.location || c.ubicazione || '').trim().replace(/\s+/g, ' ').toLowerCase();
              return carLoc === loc.trim().replace(/\s+/g, ' ').toLowerCase();
            }).length;
            const isSelected = selectedLocation.trim().toLowerCase() === loc.trim().toLowerCase();
            return (
              <button
                type="button"
                key={loc}
                onClick={() => setSelectedLocation(isSelected ? 'Tutti' : loc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-sm font-bold'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{loc}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
