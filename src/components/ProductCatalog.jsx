import React, { useState, useMemo } from 'react';
import { Search, MessageCircle, Tag, Plus, Minus, ShoppingBag } from 'lucide-react';
import { resolveImageUrl } from '../utils/api';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ProductCatalog({ categories, products, storeInfo }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState({});
  const [imgErrors, setImgErrors] = useState({});

  const getQty = (id) => quantities[id] || 1;

  const updateQty = (id, delta) => {
    setQuantities((prev) => {
      const next = Math.max(1, (prev[id] || 1) + delta);
      return { ...prev, [id]: next };
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const createWhatsAppOrderLink = (product) => {
    const qty = getQty(product.id);
    const total = product.price * qty;
    const message = `${storeInfo.whatsappGreeting}\n\n` +
      `*Nama Produk:* ${product.name}\n` +
      `*Kemasan:* ${product.unit}\n` +
      `*Jumlah:* ${qty}x\n` +
      `*Estimasi Total:* ${formatRupiah(total)}\n\n` +
      `Mohon info ketersediaan stok ya Kak. Terima kasih!`;

    return `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="katalog" className="py-20 bg-stone-50 border-t border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100/80 px-3.5 py-1.5 rounded-full">
            Menu & Produk Pilihan
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Katalog Produk Kami
          </h2>
          <p className="text-stone-600 text-base">
            Pilih produk favorit Anda, atur jumlah pesanan, dan klik tombol pesan untuk terhubung langsung ke WhatsApp kami.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk atau menu..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-800 mb-1">
              Produk tidak ditemukan
            </h3>
            <p className="text-sm text-stone-500 mb-4">
              Coba gunakan kata kunci lain atau pilih kategori "Semua".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Semua');
                setSearchQuery('');
              }}
              className="text-sm font-semibold text-amber-700 hover:text-amber-800 underline"
            >
              Reset pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const qty = getQty(product.id);
              const hasImgError = imgErrors[product.id];

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                    {!hasImgError && product.image ? (
                      <img
                        src={resolveImageUrl(product.image)}
                        alt={product.name}
                        loading="lazy"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [product.id]: true }))
                        }
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          product.available ? 'hover:scale-105' : 'grayscale opacity-75'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 text-amber-900 p-4 text-center">
                        <ShoppingBag className="w-10 h-10 mb-2 opacity-60" />
                        <span className="text-xs font-semibold">{product.name}</span>
                      </div>
                    )}

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                        {product.badge}
                      </span>
                    )}

                    {/* Category Tag */}
                    <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-stone-700 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <Tag className="w-3 h-3 text-amber-700" />
                      {product.category}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                        <span>Kemasan: {product.unit}</span>
                        {product.available ? (
                          <span className="text-emerald-600 font-semibold">● Tersedia</span>
                        ) : (
                          <span className="text-rose-500 font-semibold">● Habis</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-stone-900 leading-snug mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-100 space-y-4">
                      {/* Price & Quantity Row */}
                      <div className="flex items-center justify-between">
                        <div>
                          {product.originalPrice && (
                            <span className="block text-xs text-stone-400 line-through">
                              {formatRupiah(product.originalPrice)}
                            </span>
                          )}
                          <span className="text-xl font-extrabold text-amber-800">
                            {formatRupiah(product.price)}
                          </span>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                          <button
                            type="button"
                            disabled={!product.available}
                            onClick={() => updateQty(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-sm transition"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-stone-800">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={!product.available}
                            onClick={() => updateQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-sm transition"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Order via WhatsApp Button */}
                      {product.available ? (
                        <a
                          href={createWhatsAppOrderLink(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>
                            Pesan via WhatsApp ({formatRupiah(product.price * qty)})
                          </span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full inline-flex items-center justify-center gap-2 bg-stone-200 text-stone-500 font-semibold text-sm py-3 px-4 rounded-xl cursor-not-allowed"
                        >
                          <span>Stok Sedang Habis</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

