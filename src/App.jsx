import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings } from 'lucide-react';
import fallbackUmkmData from './data/data.json';
import { apiFetch } from './utils/api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import ProductCatalog from './components/ProductCatalog';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [umkmData, setUmkmData] = useState(fallbackUmkmData);
  const [backendConnected, setBackendConnected] = useState(false);
  const [showAdmin, setShowAdmin] = useState(
    () => window.location.hash === '#admin'
  );

  const loadBackendData = async () => {
    try {
      const { ok, data } = await apiFetch('/api/umkm');
      if (ok && data?.storeInfo) {
        setUmkmData(data);
        setBackendConnected(true);
      } else {
        setBackendConnected(false);
      }
    } catch {
      setBackendConnected(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  const {
    storeInfo,
    navigation,
    hero,
    about,
    categories,
    products,
    testimonials,
    footer,
  } = umkmData;

  useEffect(() => {
    if (storeInfo?.name) {
      document.title = storeInfo.tagline
        ? `${storeInfo.name} — ${storeInfo.tagline}`
        : storeInfo.name;
    }
  }, [storeInfo]);

  const floatingWaUrl = `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(
    storeInfo.whatsappGreeting
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      <Navbar storeInfo={storeInfo} navigation={navigation} />
      <main className="flex-grow">
        <Hero hero={hero} storeInfo={storeInfo} />
        <About about={about} />
        <ProductCatalog
          categories={categories}
          products={products}
          storeInfo={storeInfo}
        />
        <Testimonials testimonials={testimonials} />
      </main>
      <Footer
        storeInfo={storeInfo}
        footer={footer}
        navigation={navigation}
      />

      {/* Floating Admin Panel Trigger (Bottom Left) */}
      <button
        type="button"
        onClick={() => {
          loadBackendData();
          setShowAdmin(true);
        }}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-stone-900/90 hover:bg-stone-900 text-stone-200 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-full shadow-lg border border-stone-700 transition-all"
        title="Buka Panel Admin & Upload Gambar ke Backend"
      >
        <Settings className="w-4 h-4 text-amber-400" />
        <span>Admin & Upload BE</span>
      </button>

      {/* Floating WhatsApp Button (Bottom Right) */}
      <a
        href={floatingWaUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat via WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Chat WhatsApp</span>
      </a>

      {/* Admin Modal */}
      {showAdmin && (
        <AdminPanel
          data={umkmData}
          onDataChange={(updated) => {
            setUmkmData(updated);
            setBackendConnected(true);
          }}
          onClose={() => setShowAdmin(false)}
          backendConnected={backendConnected}
          onBackendConnected={() => setBackendConnected(true)}
        />
      )}
    </div>
  );
}
