import React, { useState } from 'react';
import { Menu, X, ShoppingBag, MessageCircle } from 'lucide-react';
import { resolveImageUrl } from '../utils/api';

export default function Navbar({ storeInfo, navigation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const waUrl = `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(
    storeInfo.whatsappGreeting
  )}`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Name */}
          <a href="#beranda" className="flex items-center gap-3 group">
            {!logoError && storeInfo.logo ? (
              <img
                src={resolveImageUrl(storeInfo.logo)}
                alt={storeInfo.name}
                onError={() => setLogoError(true)}
                className="h-11 w-11 rounded-xl object-cover border border-amber-200 shadow-sm"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-sm group-hover:bg-amber-800 transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="block text-xl font-bold text-stone-900 tracking-tight">
                {storeInfo.name}
              </span>
              <span className="block text-xs text-stone-500 font-medium">
                {storeInfo.tagline}
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi WhatsApp</span>
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-none"
            aria-label="Buka Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-5 space-y-2 shadow-lg">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50/60 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp Sekarang</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

