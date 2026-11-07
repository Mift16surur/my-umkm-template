import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;
const TOKEN_SECRET = process.env.ADMIN_SECRET || 'umkm-secret-key-2026';

// Paths
const SEED_DATA_PATH = path.join(ROOT_DIR, 'src', 'data', 'data.json');
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');
const AUTH_PATH = path.join(DB_DIR, 'admin.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const BRANDING_DIR = path.join(UPLOADS_DIR, 'branding');
const PRODUCTS_DIR = path.join(UPLOADS_DIR, 'products');

// Ensure directories exist
[DB_DIR, UPLOADS_DIR, BRANDING_DIR, PRODUCTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize db.json from src/data/data.json if not present
if (!fs.existsSync(DB_PATH)) {
  const initialData = fs.readFileSync(SEED_DATA_PATH, 'utf-8');
  fs.writeFileSync(DB_PATH, initialData, 'utf-8');
}

// Password hashing helper
function hashPassword(password) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(String(password)).digest('hex');
}

// Initialize default admin credentials (username: admin, password: umkm123)
if (!fs.existsSync(AUTH_PATH)) {
  const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'umkm123';
  fs.writeFileSync(
    AUTH_PATH,
    JSON.stringify(
      {
        username: defaultUsername,
        passwordHash: hashPassword(defaultPassword),
      },
      null,
      2
    ),
    'utf-8'
  );
}

function readAdminAuth() {
  return JSON.parse(fs.readFileSync(AUTH_PATH, 'utf-8'));
}

// Create & Verify Signed Admin Token
function createAdminToken(username) {
  const payload = Buffer.from(
    JSON.stringify({ username, exp: Date.now() + 1000 * 60 * 60 * 12 }) // 12 hours
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Middleware: Protect Upload, Create, Update, Delete routes
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const verified = verifyAdminToken(token);

  if (!verified) {
    return res.status(401).json({
      error: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.',
    });
  }
  req.admin = verified;
  next();
}

// Helper: Read & Write DB (syncs to both server/data/db.json and src/data/data.json)
function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  const serialized = JSON.stringify(data, null, 2);
  fs.writeFileSync(DB_PATH, serialized, 'utf-8');
  try {
    fs.writeFileSync(SEED_DATA_PATH, serialized, 'utf-8');
  } catch {
    // Ignore if read-only in production build
  }
}

// Helper: Safely delete an old uploaded image if it lives inside /uploads/ and is no longer referenced
function cleanupUnusedUpload(oldUrl, dbData) {
  if (!oldUrl || !oldUrl.startsWith('/uploads/')) return;

  const allRefs = [
    dbData.storeInfo?.logo,
    dbData.hero?.bannerImage,
    ...(dbData.products || []).map((p) => p.image),
  ];
  if (allRefs.includes(oldUrl)) return;

  const relativePath = oldUrl.replace(/^\/uploads\//, '');
  const fullPath = path.join(UPLOADS_DIR, relativePath);

  if (fullPath.startsWith(UPLOADS_DIR) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // Ignore deletion errors
    }
  }
}

// Helper: Calculate total storage usage inside server/uploads
function getStorageStats() {
  let totalBytes = 0;
  let totalFiles = 0;

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.isFile()) {
        totalFiles += 1;
        totalBytes += fs.statSync(full).size;
      }
    }
  }

  scanDir(UPLOADS_DIR);
  return {
    totalFiles,
    totalSizeKB: Math.round((totalBytes / 1024) * 10) / 10,
  };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve uploaded images with aggressive browser caching
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '30d',
    etag: true,
  })
);

// Multer setup (in-memory for Sharp processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan.'));
    }
  },
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/login — Login Admin (Username & Password)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminAuth = readAdminAuth();

  if (
    username &&
    password &&
    username.trim() === adminAuth.username &&
    hashPassword(password) === adminAuth.passwordHash
  ) {
    const token = createAdminToken(adminAuth.username);
    return res.json({
      token,
      username: adminAuth.username,
    });
  }

  return res.status(401).json({
    error: 'Username atau Password Admin salah.',
  });
});

// GET /api/auth/me — Verify current Admin session token
app.get('/api/auth/me', requireAdmin, (req, res) => {
  res.json({ authenticated: true, username: req.admin.username });
});

// PUT /api/auth/credentials — Change Admin username / password
app.put('/api/auth/credentials', requireAdmin, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  const adminAuth = readAdminAuth();

  if (!currentPassword || hashPassword(currentPassword) !== adminAuth.passwordHash) {
    return res.status(400).json({ error: 'Password saat ini tidak sesuai.' });
  }

  const updatedUsername = (newUsername || adminAuth.username).trim();
  const updatedHash = newPassword ? hashPassword(newPassword) : adminAuth.passwordHash;

  fs.writeFileSync(
    AUTH_PATH,
    JSON.stringify({ username: updatedUsername, passwordHash: updatedHash }, null, 2),
    'utf-8'
  );

  const token = createAdminToken(updatedUsername);
  res.json({
    message: 'Kredensial login Admin berhasil diperbarui!',
    username: updatedUsername,
    token,
  });
});

// ==========================================
// DATA & UPLOAD ENDPOINTS
// ==========================================

// 1. GET full UMKM data + storage statistics (Public Read)
app.get('/api/umkm', (_req, res) => {
  try {
    const data = readDB();
    const storage = getStorageStats();
    res.json({ ...data, _storage: storage });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat data UMKM', details: err.message });
  }
});

// 2. POST upload & auto-compress image to WebP (Protected by Admin Login)
app.post('/api/upload/:type', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file gambar yang dikirim.' });
    }

    const { type } = req.params;
    const rawName = (req.body.name || req.file.originalname || 'img')
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    const timestamp = Date.now();
    let targetDir = PRODUCTS_DIR;
    let subFolder = 'products';
    let filename = `produk-${rawName || 'item'}-${timestamp}.webp`;
    let transformer = sharp(req.file.buffer).rotate();

    if (type === 'logo') {
      targetDir = BRANDING_DIR;
      subFolder = 'branding';
      filename = `logo-${timestamp}.webp`;
      transformer = transformer
        .resize({ width: 400, height: 400, fit: 'cover' })
        .webp({ quality: 85 });
    } else if (type === 'banner') {
      targetDir = BRANDING_DIR;
      subFolder = 'branding';
      filename = `hero-banner-${timestamp}.webp`;
      transformer = transformer
        .resize({ width: 1280, height: 960, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 });
    } else {
      transformer = transformer
        .resize({ width: 800, height: 600, fit: 'cover' })
        .webp({ quality: 80 });
    }

    const outputPath = path.join(targetDir, filename);
    const info = await transformer.toFile(outputPath);

    const originalSizeKB = Math.round((req.file.size / 1024) * 10) / 10;
    const compressedSizeKB = Math.round((info.size / 1024) * 10) / 10;
    const savedPercent =
      originalSizeKB > 0
        ? Math.max(0, Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100))
        : 0;

    const publicUrl = `/uploads/${subFolder}/${filename}`;

    res.json({
      url: publicUrl,
      filename,
      originalSizeKB,
      compressedSizeKB,
      savedPercent,
      storage: getStorageStats(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memproses gambar', details: err.message });
  }
});

// 3. PUT update storeInfo, hero, categories, or footer (Protected by Admin Login)
app.put('/api/umkm/store', requireAdmin, (req, res) => {
  try {
    const db = readDB();
    const oldLogo = db.storeInfo?.logo;
    const oldBanner = db.hero?.bannerImage;

    if (req.body.storeInfo) {
      db.storeInfo = { ...db.storeInfo, ...req.body.storeInfo };
    }
    if (req.body.hero) {
      db.hero = { ...db.hero, ...req.body.hero };
    }
    if (req.body.about) {
      db.about = { ...db.about, ...req.body.about };
    }
    if (req.body.categories) {
      db.categories = req.body.categories;
    }
    if (req.body.footer) {
      db.footer = { ...db.footer, ...req.body.footer };
    }

    writeDB(db);

    if (oldLogo && oldLogo !== db.storeInfo?.logo) {
      cleanupUnusedUpload(oldLogo, db);
    }
    if (oldBanner && oldBanner !== db.hero?.bannerImage) {
      cleanupUnusedUpload(oldBanner, db);
    }

    res.json({ ...db, _storage: getStorageStats() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan pengaturan toko', details: err.message });
  }
});

// 4. POST create new product (Protected by Admin Login)
app.post('/api/products', requireAdmin, (req, res) => {
  try {
    const db = readDB();
    const newId =
      db.products.length > 0
        ? Math.max(...db.products.map((p) => Number(p.id) || 0)) + 1
        : 1;

    const newProduct = {
      id: newId,
      name: req.body.name || 'Produk Baru',
      category: req.body.category || (db.categories[1] || 'Lainnya'),
      price: Number(req.body.price) || 0,
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : null,
      unit: req.body.unit || 'Pcs',
      badge: req.body.badge || null,
      description: req.body.description || '',
      image: req.body.image || '/uploads/products/produk-1.webp',
      available: req.body.available !== undefined ? Boolean(req.body.available) : true,
    };

    db.products.unshift(newProduct);
    writeDB(db);

    res.status(201).json({ product: newProduct, products: db.products, _storage: getStorageStats() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah produk', details: err.message });
  }
});

// 5. PUT update product by id (Protected by Admin Login)
app.put('/api/products/:id', requireAdmin, (req, res) => {
  try {
    const db = readDB();
    const productId = Number(req.params.id);
    const index = db.products.findIndex((p) => Number(p.id) === productId);

    if (index === -1) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const oldImage = db.products[index].image;
    const updatedProduct = {
      ...db.products[index],
      ...req.body,
      id: productId,
      price: Number(req.body.price ?? db.products[index].price),
      originalPrice:
        req.body.originalPrice !== undefined && req.body.originalPrice !== '' && req.body.originalPrice !== null
          ? Number(req.body.originalPrice)
          : null,
    };

    db.products[index] = updatedProduct;
    writeDB(db);

    if (oldImage && oldImage !== updatedProduct.image) {
      cleanupUnusedUpload(oldImage, db);
    }

    res.json({ product: updatedProduct, products: db.products, _storage: getStorageStats() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui produk', details: err.message });
  }
});

// 6. DELETE product by id (Protected by Admin Login)
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  try {
    const db = readDB();
    const productId = Number(req.params.id);
    const target = db.products.find((p) => Number(p.id) === productId);

    if (!target) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    db.products = db.products.filter((p) => Number(p.id) !== productId);
    writeDB(db);

    cleanupUnusedUpload(target.image, db);

    res.json({ products: db.products, _storage: getStorageStats() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus produk', details: err.message });
  }
});

// JSON 404 handler for any unknown /api route (prevents <!DOCTYPE html> response)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler so Multer/Express errors always return JSON instead of HTML
app.use((err, _req, res, _next) => {
  res.status(err.status || 400).json({
    error: err.message || 'Terjadi kesalahan pada server Backend.',
  });
});

// Serve frontend production build if dist/ exists
const DIST_DIR = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

app.listen(PORT, () => {
  console.log(`✅ UMKM Backend Server berjalan di http://localhost:${PORT}`);
  console.log(`📁 Folder penyimpanan gambar: ${UPLOADS_DIR}`);
});
