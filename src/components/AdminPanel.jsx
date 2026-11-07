import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  HardDrive,
  Package,
  Store,
  Loader2,
  Image as ImageIcon,
  Save,
  Lock,
  LogOut,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiFetch, resolveImageUrl } from '../utils/api';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

const emptyProductForm = {
  id: null,
  name: '',
  category: 'Kopi & Minuman',
  price: '',
  originalPrice: '',
  unit: 'Pcs',
  badge: '',
  description: '',
  image: '',
  available: true,
};

export default function AdminPanel({
  data,
  onDataChange,
  onClose,
  backendConnected,
  onBackendConnected,
}) {
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem('umkm_admin_token') || ''
  );
  const [adminUser, setAdminUser] = useState(
    () => sessionStorage.getItem('umkm_admin_user') || ''
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Change password form state
  const [credForm, setCredForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
  });

  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [showProductModal, setShowProductModal] = useState(false);

  const [storeForm, setStoreForm] = useState({
    name: data.storeInfo?.name || '',
    tagline: data.storeInfo?.tagline || '',
    whatsappNumber: data.storeInfo?.whatsappNumber || '',
    whatsappGreeting: data.storeInfo?.whatsappGreeting || '',
    logo: data.storeInfo?.logo || '',
    bannerImage: data.hero?.bannerImage || '',
    heroTitle: data.hero?.title || '',
    heroSubtitle: data.hero?.subtitle || '',
    address: data.footer?.address || '',
    operationalHours: data.footer?.operationalHours || '',
    phone: data.footer?.phone || '',
    email: data.footer?.email || '',
  });

  const [uploadingField, setUploadingField] = useState(null);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Verify existing token on mount using safe apiFetch
  useEffect(() => {
    if (!authToken) {
      setIsAuthenticated(false);
      setVerifyingSession(false);
      return;
    }

    apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(({ ok, data: info }) => {
        if (!ok) throw new Error('Invalid token');
        setIsAuthenticated(true);
        setAdminUser(info.username || 'admin');
        setCredForm((prev) => ({ ...prev, newUsername: info.username || 'admin' }));
        if (onBackendConnected) onBackendConnected();
      })
      .catch(() => {
        sessionStorage.removeItem('umkm_admin_token');
        sessionStorage.removeItem('umkm_admin_user');
        setAuthToken('');
        setIsAuthenticated(false);
      })
      .finally(() => {
        setVerifyingSession(false);
      });
  }, [authToken]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const { ok, data: result } = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });
      if (!ok || !result.token) {
        throw new Error(result.error || 'Username atau Password salah.');
      }

      sessionStorage.setItem('umkm_admin_token', result.token);
      sessionStorage.setItem('umkm_admin_user', result.username);
      setAuthToken(result.token);
      setAdminUser(result.username);
      setCredForm({
        currentPassword: '',
        newUsername: result.username,
        newPassword: '',
      });
      setIsAuthenticated(true);
      setPasswordInput('');
      if (onBackendConnected) onBackendConnected();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('umkm_admin_token');
    sessionStorage.removeItem('umkm_admin_user');
    setAuthToken('');
    setAdminUser('');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const authHeaders = (extra = {}) => ({
    Authorization: `Bearer ${authToken}`,
    ...extra,
  });

  // Upload image to Backend (/api/upload/:type)
  const handleFileUpload = async (file, type, targetField, customName = '') => {
    if (!file) return;
    setUploadingField(targetField);
    setCompressionInfo(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (customName) formData.append('name', customName);

      const { ok, status, data: result } = await apiFetch(`/api/upload/${type}`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (status === 401) {
        handleLogout();
        throw new Error('Sesi login telah berakhir. Silakan login kembali.');
      }
      if (!ok) {
        throw new Error(result.error || 'Gagal mengunggah gambar');
      }

      if (targetField === 'productImage') {
        setProductForm((prev) => ({ ...prev, image: result.url }));
      } else if (targetField === 'logo') {
        setStoreForm((prev) => ({ ...prev, logo: result.url }));
      } else if (targetField === 'bannerImage') {
        setStoreForm((prev) => ({ ...prev, bannerImage: result.url }));
      }

      setCompressionInfo({
        field: targetField,
        filename: result.filename,
        originalSizeKB: result.originalSizeKB,
        compressedSizeKB: result.compressedSizeKB,
        savedPercent: result.savedPercent,
        url: result.url,
      });

      showToast(
        `Gambar berhasil dikompres ke WebP (${result.originalSizeKB} KB → ${result.compressedSizeKB} KB)`
      );
    } catch (err) {
      alert(`Error Upload: ${err.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  // Open Add Product Modal
  const openAddProduct = () => {
    setEditingProduct(null);
    setCompressionInfo(null);
    setProductForm({
      ...emptyProductForm,
      category: data.categories?.[1] || 'Kopi & Minuman',
    });
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const openEditProduct = (product) => {
    setEditingProduct(product);
    setCompressionInfo(null);
    setProductForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || '',
      unit: product.unit || 'Pcs',
      badge: product.badge || '',
      description: product.description || '',
      image: product.image || '',
      available: product.available !== false,
    });
    setShowProductModal(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = Boolean(editingProduct);
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const { ok, status, data: result } = await apiFetch(url, {
        method,
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(productForm),
      });
      if (status === 401) {
        handleLogout();
        throw new Error('Sesi login telah berakhir. Silakan login kembali.');
      }
      if (!ok) throw new Error(result.error || 'Gagal menyimpan produk');

      onDataChange({
        ...data,
        products: result.products,
        _storage: result._storage || data._storage,
      });
      setShowProductModal(false);
      showToast(isEdit ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Product Stock Availability
  const handleToggleStock = async (product) => {
    try {
      const { ok, status, data: result } = await apiFetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...product,
          available: !product.available,
        }),
      });
      if (status === 401) {
        handleLogout();
        throw new Error('Sesi login telah berakhir.');
      }
      if (!ok) throw new Error(result.error);

      onDataChange({
        ...data,
        products: result.products,
        _storage: result._storage || data._storage,
      });
      showToast(
        `Status stok "${product.name}" diubah menjadi ${!product.available ? 'Tersedia' : 'Habis'}`
      );
    } catch (err) {
      alert(`Gagal mengubah stok: ${err.message}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Hapus produk "${product.name}" beserta file fotonya di server?`)) {
      return;
    }
    try {
      const { ok, status, data: result } = await apiFetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (status === 401) {
        handleLogout();
        throw new Error('Sesi login telah berakhir.');
      }
      if (!ok) throw new Error(result.error);

      onDataChange({
        ...data,
        products: result.products,
        _storage: result._storage || data._storage,
      });
      showToast('Produk & file gambar tidak terpakai berhasil dihapus dari BE.');
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // Save Store & Branding Settings
  const handleSaveStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        storeInfo: {
          ...data.storeInfo,
          name: storeForm.name,
          tagline: storeForm.tagline,
          whatsappNumber: storeForm.whatsappNumber,
          whatsappGreeting: storeForm.whatsappGreeting,
          logo: storeForm.logo,
        },
        hero: {
          ...data.hero,
          title: storeForm.heroTitle,
          subtitle: storeForm.heroSubtitle,
          bannerImage: storeForm.bannerImage,
        },
        footer: {
          ...data.footer,
          address: storeForm.address,
          operationalHours: storeForm.operationalHours,
          phone: storeForm.phone,
          email: storeForm.email,
        },
      };

      const { ok, status, data: updated } = await apiFetch('/api/umkm/store', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (status === 401) {
        handleLogout();
        throw new Error('Sesi login telah berakhir.');
      }
      if (!ok) throw new Error(updated.error || 'Gagal menyimpan pengaturan');

      onDataChange(updated);
      showToast('Pengaturan toko & gambar branding berhasil disimpan di BE!');
    } catch (err) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Change Admin Credentials
  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { ok, data: result } = await apiFetch('/api/auth/credentials', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(credForm),
      });
      if (!ok) throw new Error(result.error || 'Gagal mengubah kredensial');

      sessionStorage.setItem('umkm_admin_token', result.token);
      sessionStorage.setItem('umkm_admin_user', result.username);
      setAuthToken(result.token);
      setAdminUser(result.username);
      setCredForm({
        currentPassword: '',
        newUsername: result.username,
        newPassword: '',
      });
      showToast(result.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const productCategories = (data.categories || []).filter((c) => c !== 'Semua');

  if (verifyingSession) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-3 shadow-xl">
          <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
          <span className="text-sm font-semibold text-stone-700">Memeriksa sesi login...</span>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
          <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Login Admin UMKM</h2>
                <p className="text-[11px] text-stone-400">
                  Akses khusus upload gambar & update produk
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-stone-700">
              <span className="font-bold text-amber-900 block mb-0.5">
                Akun Default Admin:
              </span>
              Username: <code className="font-bold text-amber-800">******</code> | Password:{' '}
              <code className="font-bold text-amber-800">******</code>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl leading-relaxed">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Username Admin
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username..."
                  className="w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Password Admin
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-10 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white font-semibold text-sm py-3 rounded-xl shadow transition"
            >
              {loggingIn ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-4">
        {/* Top Bar */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">
                Panel Admin & Manajemen Gambar (Backend)
              </h2>
              <p className="text-xs text-stone-400">
                Login sebagai <strong className="text-amber-300">{adminUser}</strong> • Gambar
                disimpan rapi di <code className="text-amber-300">server/uploads/</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition"
              title="Keluar sesi Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              aria-label="Tutup Panel Admin"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Backend Status & Storage Info Bar */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-stone-800">
              Status Backend API:{' '}
              {backendConnected ? (
                <span className="text-emerald-700">Terhubung & Terproteksi Token Admin</span>
              ) : (
                <span className="text-rose-600">
                  Offline — Jalankan `npm run dev` untuk mengaktifkan upload BE
                </span>
              )}
            </span>
          </div>

          {data._storage && (
            <div className="text-stone-600 font-medium">
              Penyimpanan <code className="bg-white px-1.5 py-0.5 rounded border">server/uploads/</code>:{' '}
              <strong className="text-amber-900">{data._storage.totalFiles} file</strong> (Total{' '}
              <strong className="text-amber-900">{data._storage.totalSizeKB} KB</strong>)
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-stone-200 flex gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'products'
                ? 'border-amber-700 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Katalog Produk ({data.products?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'branding'
                ? 'border-amber-700 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Profil Toko, Logo & Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'security'
                ? 'border-amber-700 text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Keamanan Login Admin</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Daftar Produk UMKM
                  </h3>
                  <p className="text-xs text-stone-500">
                    Foto produk yang diunggah akan otomatis di-resize (800x600) & disimpan ke{' '}
                    <code>server/uploads/products/</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddProduct}
                  className="inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto border border-stone-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase text-stone-500">
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Harga</th>
                      <th className="py-3 px-4">Lokasi File Gambar</th>
                      <th className="py-3 px-4">Stok</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-sm">
                    {(data.products || []).map((product) => (
                      <tr key={product.id} className="hover:bg-stone-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveImageUrl(product.image)}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover border border-stone-200 bg-stone-100 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900 line-clamp-1">
                                {product.name}
                              </p>
                              <p className="text-xs text-stone-500">{product.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-stone-600">
                          {product.category}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-800">
                          {formatRupiah(product.price)}
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded block max-w-[200px] truncate">
                            {product.image}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStock(product)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${
                              product.available
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                          >
                            {product.available ? '● Tersedia' : '● Habis'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg mr-2 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            /* Tab 2: Store Info & Branding Upload */
            <form onSubmit={handleSaveStore} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload Card */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Logo Toko (Tersimpan di <code>server/uploads/branding/</code>)
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveImageUrl(storeForm.logo)}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-cover border border-stone-300 bg-white"
                    />
                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer shadow-sm transition">
                        {uploadingField === 'logo' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                        ) : (
                          <Upload className="w-4 h-4 text-amber-700" />
                        )}
                        <span>Upload Logo Baru</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e.target.files?.[0], 'logo', 'logo', storeForm.name)
                          }
                        />
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Otomatis di-crop 400x400px & dikompres ke WebP.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Hero Upload Card */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Banner Hero Utama (Tersimpan di <code>server/uploads/branding/</code>)
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveImageUrl(storeForm.bannerImage)}
                      alt="Banner"
                      className="w-24 h-16 rounded-xl object-cover border border-stone-300 bg-white"
                    />
                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer shadow-sm transition">
                        {uploadingField === 'bannerImage' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                        ) : (
                          <Upload className="w-4 h-4 text-amber-700" />
                        )}
                        <span>Upload Banner Baru</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(
                              e.target.files?.[0],
                              'banner',
                              'bannerImage',
                              storeForm.name
                            )
                          }
                        />
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Otomatis dioptimasi maks 1280px & dikompres ke WebP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nama Toko UMKM
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={storeForm.tagline}
                    onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nomor WhatsApp Order (Awali 628...)
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.whatsappNumber}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    value={storeForm.operationalHours}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, operationalHours: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Alamat Lengkap Toko
                </label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Toko'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            /* Tab 3: Change Admin Username & Password */
            <form onSubmit={handleSaveCredentials} className="max-w-md space-y-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Ubah Username & Password Login Admin
                </h3>
                <p className="text-xs text-stone-500">
                  Kredensial disimpan dengan enkripsi hash SHA-256 di{' '}
                  <code>server/data/admin.json</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Username Admin Baru
                </label>
                <input
                  type="text"
                  required
                  value={credForm.newUsername}
                  onChange={(e) => setCredForm({ ...credForm, newUsername: e.target.value })}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password Saat Ini (Wajib untuk verifikasi)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credForm.currentPassword}
                    onChange={(e) =>
                      setCredForm({ ...credForm, currentPassword: e.target.value })
                    }
                    placeholder="Masukkan password saat ini..."
                    className="w-full pl-3.5 pr-10 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credForm.newPassword}
                    onChange={(e) => setCredForm({ ...credForm, newPassword: e.target.value })}
                    placeholder="Masukkan password baru..."
                    className="w-full pl-3.5 pr-10 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow transition"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Perbarui Kredensial Login'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Image Upload Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Foto Produk (Otomatis Kompres WebP ke <code>server/uploads/products/</code>)
                </label>
                <div className="flex items-center gap-4">
                  {productForm.image ? (
                    <img
                      src={resolveImageUrl(productForm.image)}
                      alt="Preview"
                      className="w-20 h-16 rounded-lg object-cover border border-stone-300 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-16 rounded-lg border border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-white shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <label className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer shadow-sm transition">
                      {uploadingField === 'productImage' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>Pilih & Upload Foto dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            e.target.files?.[0],
                            'products',
                            'productImage',
                            productForm.name || 'produk'
                          )
                        }
                      />
                    </label>

                    {compressionInfo && compressionInfo.field === 'productImage' && (
                      <p className="text-xs text-emerald-700 font-semibold">
                        ✓ Terkompresi: {compressionInfo.originalSizeKB} KB →{' '}
                        {compressionInfo.compressedSizeKB} KB (Hemat{' '}
                        {compressionInfo.savedPercent}%)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Es Kopi Susu Gula Aren 1 Liter"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                  >
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Satuan / Kemasan
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="Contoh: Botol 1L / Box"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="65000"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Harga Coret / Promo (Opsional)
                  </label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) =>
                      setProductForm({ ...productForm, originalPrice: e.target.value })
                    }
                    placeholder="75000"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Label Badge (Opsional)
                  </label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="Terlaris / Promo"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={productForm.available}
                      onChange={(e) =>
                        setProductForm({ ...productForm, available: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-700 rounded"
                    />
                    <span>Stok Tersedia</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
