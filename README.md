# Template Website UMKM (Fullstack: React + Tailwind CSS + Express Backend)

Template website katalog & pemesanan WhatsApp siap pakai untuk berbagai jenis UMKM, dilengkapi **Backend Express + Sharp** untuk penyimpanan gambar yang rapi dan terkompresi otomatis ke format **WebP**, serta **Panel Admin** terintegrasi.

## Struktur Direktori

```text
my-umkm-template/
├── server/                      <-- BACKEND (Node.js + Express + Sharp)
│   ├── index.js                 <-- REST API & Auto-Compressor Gambar (.webp)
│   ├── data/
│   │   └── db.json              <-- Database JSON dinamis di sisi Backend
│   └── uploads/                 <-- PENYIMPANAN GAMBAR RAPI DI BACKEND
│       ├── branding/            <-- Logo & Hero Banner (.webp)
│       └── products/            <-- Foto-foto produk (.webp)
├── src/
│   ├── data/
│   │   └── data.json            <-- Data sinkronisasi & fallback
│   ├── components/
│   │   ├── Navbar.jsx           <-- Navigasi atas (Logo & Menu)
│   │   ├── Hero.jsx             <-- Banner sambutan & Call to Action (CTA)
│   │   ├── About.jsx            <-- Cerita / Profil singkat UMKM
│   │   ├── ProductCatalog.jsx   <-- Daftar produk, filter kategori & Order WhatsApp
│   │   ├── Testimonials.jsx     <-- Ulasan pelanggan
│   │   ├── Footer.jsx           <-- Kontak, Alamat, & Sosmed
│   │   └── AdminPanel.jsx       <-- Panel Admin untuk Upload Gambar & Kelola Produk
│   ├── App.jsx                  <-- Merangkai komponen & koneksi ke Backend
│   ├── main.jsx                 <-- Titik masuk aplikasi (Entry point)
│   └── index.css                <-- Konfigurasi Tailwind CSS
├── package.json
├── vite.config.js               <-- Proxy otomatis /api dan /uploads ke Backend
└── tailwind.config.js
```

## Cara Menjalankan Aplikasi (Frontend + Backend Sekaligus)

1. Instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan Frontend & Backend secara bersamaan:
   ```bash
   npm run dev
   ```
   - **Frontend (Vite)** berjalan di `http://localhost:5173`
   - **Backend (Express API & Storage)** berjalan di `http://localhost:3001`

## Cara Mengelola Produk & Upload Gambar ke Backend

1. Buka website di browser, lalu klik tombol **"Admin & Upload BE"** di pojok kiri bawah layar (atau akses URL `http://localhost:5173/#admin`).
2. Di dalam **Panel Admin**:
   - **Tab Katalog Produk**: Tambah produk baru, edit harga/deskripsi, ubah status stok (*Tersedia* / *Habis*) dengan 1 klik, dan **Upload Foto Produk** langsung dari HP/laptop.
   - **Tab Profil Toko, Logo & Banner**: Ganti nama toko, nomor WhatsApp, serta upload Logo dan Banner baru.
3. **Keunggulan Penyimpanan Gambar di Backend (`server/uploads/`)**:
   - Setiap gambar yang diunggah otomatis di-*resize* dan dikompresi ke format **WebP** menggunakan `sharp` (ukuran file hemat hingga 80–90%, rata-rata hanya **10–25 KB** per foto).
   - Tersimpan rapi sesuai kategori folder (`server/uploads/branding/` dan `server/uploads/products/`).
   - Saat produk dihapus atau fotonya diganti melalui Admin Panel, file gambar lama yang sudah tidak terpakai di `server/uploads/` **otomatis dihapus** oleh Backend agar penyimpanan server selalu bersih.
