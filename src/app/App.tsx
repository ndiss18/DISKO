import React, { useEffect, useState } from "react";
import {
  ShoppingCart, Search, Bell, User, Menu, X, ChevronRight,
  Star, Tag, Package, TrendingUp, Users, Settings, FileText,
  CheckCircle, Clock, XCircle, Upload, Eye, Edit, Trash2,
  Plus, Filter, ArrowLeft, MapPin, Phone, Mail, LogOut,
  BarChart2, ShoppingBag, CreditCard, AlertCircle, ChevronDown,
  Store, Percent, Receipt, DollarSign, Heart, Minus, Check,
  Camera, Download, Home
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { getCurrentUser, loginUser, registerUser, type AuthUser } from "../lib/authApi";
import { createOrder, type OrderItemPayload, type ShippingPayload } from "../lib/orderApi";

// ─── Types ───────────────────────────────────────────────────
type Page =
  | "landing" | "login" | "register"
  | "catalog" | "promo-list" | "product-detail"
  | "cart" | "checkout" | "upload-payment"
  | "order-status" | "profile" | "notifications"
  | "umkm-dashboard" | "umkm-products" | "umkm-add-product"
  | "umkm-promos" | "umkm-payment-verify" | "umkm-orders"
  | "umkm-reports" | "umkm-statistics"
  | "admin-dashboard" | "admin-users" | "admin-transactions" | "admin-system";

type Role = "user" | "umkm" | "admin";
type Product = typeof PRODUCTS[number];
type CartItem = Product & { qty: number };

const AUTH_TOKEN_KEY = "disko_auth_token";
const AUTH_USER_KEY = "disko_auth_user";
const CART_STORAGE_KEY = "disko_cart";

function storeAuth(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function loadStoredCart(): CartItem[] {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (_error) {
    return [];
  }
}

function storeCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

// ─── Mock Data ────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 1, name: "Bakso Spesial Mas Bro", umkm: "Warung Mas Bro",
    category: "Makanan", price: 15000, originalPrice: 20000, discount: 25,
    rating: 4.8, sold: 234, stock: 50,
    image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400&h=300&fit=crop&auto=format",
    description: "Bakso sapi asli dengan kuah kaldu spesial, dilengkapi mie, tahu, dan pelengkap lainnya. Cocok untuk makan siang atau malam.",
  },
  {
    id: 2, name: "Kopi Susu Nusantara", umkm: "Kedai Kopi Nusantara",
    category: "Minuman", price: 12000, originalPrice: 18000, discount: 33,
    rating: 4.9, sold: 512, stock: 100,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format",
    description: "Kopi susu premium dari biji kopi pilihan lokal, diseduh dengan teknik pour-over dan dicampur susu segar.",
  },
  {
    id: 3, name: "Nasi Gudeg Bu Sari", umkm: "Warung Bu Sari",
    category: "Makanan", price: 18000, originalPrice: 25000, discount: 28,
    rating: 4.7, sold: 189, stock: 30,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format",
    description: "Nasi gudeg khas Yogyakarta dengan jackfruit manis, ayam kampung, telur bacem, dan sambal krecek.",
  },
  {
    id: 4, name: "Mie Ayam Cak Dul", umkm: "Mie Cak Dul",
    category: "Makanan", price: 13000, originalPrice: 16000, discount: 19,
    rating: 4.6, sold: 341, stock: 60,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format",
    description: "Mie ayam dengan topping ayam cincang berbumbu, jamur kuping, bakso, dan kuah kaldu ayam spesial.",
  },
  {
    id: 5, name: "Es Teh Tarik Pak Joko", umkm: "Es Teh Pak Joko",
    category: "Minuman", price: 7000, originalPrice: 10000, discount: 30,
    rating: 4.5, sold: 678, stock: 200,
    image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&h=300&fit=crop&auto=format",
    description: "Es teh tarik segar dengan teh premium yang ditarik berkali-kali untuk menghasilkan busa yang sempurna.",
  },
  {
    id: 6, name: "Martabak Telur Spesial", umkm: "Martabak Keluarga",
    category: "Snack", price: 22000, originalPrice: 28000, discount: 21,
    rating: 4.7, sold: 156, stock: 25,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&auto=format",
    description: "Martabak telur renyah dengan isian telur, daging cincang, daun bawang, dan bumbu rahasia keluarga.",
  },
  {
    id: 7, name: "Sate Ayam Madura", umkm: "Sate Pak Haji",
    category: "Makanan", price: 20000, originalPrice: 25000, discount: 20,
    rating: 4.9, sold: 423, stock: 40,
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop&auto=format",
    description: "Sate ayam Madura asli dengan bumbu kacang special, lontong, dan acar timun yang menyegarkan.",
  },
  {
    id: 8, name: "Jus Alpukat Krim", umkm: "Jus Segar Mbak Rina",
    category: "Minuman", price: 15000, originalPrice: 20000, discount: 25,
    rating: 4.6, sold: 234, stock: 80,
    image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop&auto=format",
    description: "Jus alpukat segar dicampur susu kental manis dan sirup cokelat premium, creamy dan menyegarkan.",
  },
];

const PROMOS = [
  {
    id: 1, title: "Flash Sale Pagi", description: "Diskon hingga 50% untuk semua minuman",
    discount: 50, validUntil: "31 Des 2024", code: "PAGIDISKO",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=300&fit=crop&auto=format",
    category: "Minuman", isActive: true,
  },
  {
    id: 2, title: "Promo Makan Siang", description: "Buy 1 Get 1 untuk menu makanan pilihan",
    discount: 50, validUntil: "25 Des 2024", code: "SIANGDISKO",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=300&fit=crop&auto=format",
    category: "Makanan", isActive: true,
  },
  {
    id: 3, title: "Weekend Special", description: "Gratis ongkir untuk semua pesanan akhir pekan",
    discount: 0, validUntil: "29 Des 2024", code: "WEEKENDDISKO",
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&h=300&fit=crop&auto=format",
    category: "Semua", isActive: true,
  },
];

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Snack", "Dessert"];

const SALES_DATA = [
  { month: "Jul", sales: 4200000, orders: 142 },
  { month: "Agu", sales: 5800000, orders: 198 },
  { month: "Sep", sales: 4900000, orders: 167 },
  { month: "Okt", sales: 7200000, orders: 243 },
  { month: "Nov", sales: 8900000, orders: 312 },
  { month: "Des", sales: 11200000, orders: 389 },
];

const CAT_PIE = [
  { name: "Makanan", value: 60, color: "#2E7D32" },
  { name: "Minuman", value: 25, color: "#66BB6A" },
  { name: "Snack", value: 10, color: "#A5D6A7" },
  { name: "Dessert", value: 5, color: "#C8E6C9" },
];

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

// ─── Shared UI Components ─────────────────────────────────────
type BadgeVariant = "default" | "discount" | "success" | "warning" | "danger" | "outline";
function Bdg({ children, variant = "default", className = "" }: {
  children: React.ReactNode; variant?: BadgeVariant; className?: string;
}) {
  const s: Record<BadgeVariant, string> = {
    default: "bg-primary text-white",
    discount: "bg-orange-500 text-white",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
    outline: "border border-border text-foreground bg-transparent",
  };
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${s[variant]} ${className}`}>{children}</span>;
}

type BtnVariant = "primary" | "outline" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";
function Btn({ children, onClick, variant = "primary", size = "md", className = "", disabled = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: BtnVariant;
  size?: BtnSize; className?: string; disabled?: boolean;
}) {
  const vs: Record<BtnVariant, string> = {
    primary: "bg-primary text-white hover:bg-green-700 active:bg-green-800 shadow-sm",
    outline: "border-2 border-primary text-primary hover:bg-green-50",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const ss: Record<BtnSize, string> = {
    sm: "text-xs px-3 py-1.5 rounded-lg",
    md: "text-sm px-4 py-2.5 rounded-xl",
    lg: "text-sm px-6 py-3 rounded-xl",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${vs[variant]} ${ss[size]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      {children}
    </button>
  );
}

function StatCard({ icon, label, value, sub, color = "green" }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  color?: "green" | "blue" | "orange" | "purple";
}) {
  const cs: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cs[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function ProductCard({ product, onClick }: { product: typeof PRODUCTS[0]; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="relative overflow-hidden bg-muted" style={{ height: 180 }}>
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {product.discount > 0 && (
          <div className="absolute top-2.5 left-2.5"><Bdg variant="discount">-{product.discount}%</Bdg></div>
        )}
        <button className="absolute top-2.5 right-2.5 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:text-red-500 transition-colors">
          <Heart size={13} />
        </button>
      </div>
      <div className="p-3.5">
        <p className="text-xs text-muted-foreground mb-0.5 truncate">{product.umkm}</p>
        <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2.5">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-semibold">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.sold} terjual)</span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-base font-bold text-primary">{fmtPrice(product.price)}</span>
          <span className="text-xs text-muted-foreground line-through">{fmtPrice(product.originalPrice)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────
function Navbar({ setPage, cartCount = 2, role, setRole }: {
  setPage: (p: Page) => void; cartCount?: number; role: Role; setRole: (r: Role) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const roleLabel: Record<Role, string> = { user: "Pelanggan", umkm: "UMKM", admin: "Admin" };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <button onClick={() => setPage("landing")} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <Tag size={15} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-primary tracking-tight">DISKO</span>
        </button>

        <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-muted rounded-xl px-3 py-2 border border-transparent focus-within:border-primary/30">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input placeholder="Cari produk, UMKM, promo..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
        </div>

        <div className="flex items-center gap-1">
          <div className="relative hidden sm:block">
            <button onClick={() => setRoleOpen(!roleOpen)} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted px-3 py-1.5 rounded-lg">
              <span>Demo: {roleLabel[role]}</span><ChevronDown size={11} />
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 w-36">
                {(["user", "umkm", "admin"] as Role[]).map(r => (
                  <button key={r} onClick={() => { setRole(r); setRoleOpen(false); setPage(r === "user" ? "landing" : r === "umkm" ? "umkm-dashboard" : "admin-dashboard"); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${role === r ? "text-primary font-semibold" : ""}`}>
                    {roleLabel[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setPage("notifications")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted relative">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button onClick={() => setPage("cart")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted relative">
            <ShoppingCart size={17} />
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">{cartCount}</span>}
          </button>
          <button onClick={() => setPage("profile")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted">
            <User size={17} />
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted md:hidden">
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 mb-3">
            <Search size={15} className="text-muted-foreground" />
            <input placeholder="Cari produk..." className="bg-transparent text-sm outline-none w-full" />
          </div>
          {[
            { label: "Beranda", p: "landing" as Page },
            { label: "Katalog", p: "catalog" as Page },
            { label: "Promo", p: "promo-list" as Page },
            { label: "Profil", p: "profile" as Page },
          ].map(item => (
            <button key={item.p} onClick={() => { setPage(item.p); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted rounded-lg transition-colors">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Dashboard Sidebar ────────────────────────────────────────
function Sidebar({ role, page, setPage }: { role: Role; page: Page; setPage: (p: Page) => void }) {
  const umkmLinks = [
    { icon: <Home size={17} />, label: "Dashboard", p: "umkm-dashboard" as Page },
    { icon: <Package size={17} />, label: "Produk", p: "umkm-products" as Page },
    { icon: <Percent size={17} />, label: "Promo & Diskon", p: "umkm-promos" as Page },
    { icon: <CreditCard size={17} />, label: "Verifikasi Bayar", p: "umkm-payment-verify" as Page },
    { icon: <ShoppingBag size={17} />, label: "Pesanan", p: "umkm-orders" as Page },
    { icon: <FileText size={17} />, label: "Laporan", p: "umkm-reports" as Page },
    { icon: <BarChart2 size={17} />, label: "Statistik", p: "umkm-statistics" as Page },
  ];
  const adminLinks = [
    { icon: <Home size={17} />, label: "Dashboard", p: "admin-dashboard" as Page },
    { icon: <Users size={17} />, label: "Pengguna", p: "admin-users" as Page },
    { icon: <Receipt size={17} />, label: "Transaksi", p: "admin-transactions" as Page },
    { icon: <Settings size={17} />, label: "Data Sistem", p: "admin-system" as Page },
  ];
  const links = role === "umkm" ? umkmLinks : adminLinks;

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-card border-r border-border sticky top-16 overflow-y-auto" style={{ height: "calc(100vh - 64px)" }}>
      <div className="p-5 flex-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          {role === "umkm" ? "UMKM Panel" : "Admin Panel"}
        </p>
        <nav className="space-y-1">
          {links.map(link => (
            <button key={link.p} onClick={() => setPage(link.p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === link.p ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {link.icon}{link.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-5 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
            <User size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{role === "umkm" ? "Warung Mas Bro" : "Admin DISKO"}</p>
            <p className="text-xs text-muted-foreground">{role === "umkm" ? "UMKM Owner" : "Administrator"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
//  USER PAGES
// ═══════════════════════════════════════════════════════════════

function LandingPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute right-32 bottom-0 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute left-1/2 top-1/3 w-32 h-32 bg-white/5 rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-green-700/60 text-green-100 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              🔥 Flash Sale — Diskon hingga 50% hari ini!
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              Hemat Lebih,<br />Dukung UMKM Lokal
            </h1>
            <p className="text-green-100 text-lg mb-8 max-w-md mx-auto md:mx-0">
              Temukan promo dan diskon terbaik dari ratusan UMKM lokal di sekitarmu. Belanja hemat, usaha lokal makin maju.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Btn size="lg" onClick={() => setPage("catalog")} className="!bg-white !text-primary hover:!bg-green-50 shadow-lg font-bold">
                <Search size={17} /> Cari Produk
              </Btn>
              <Btn size="lg" onClick={() => setPage("promo-list")} className="!bg-transparent !border-2 !border-white !text-white hover:!bg-green-700">
                <Tag size={17} /> Lihat Promo
              </Btn>
            </div>
          </div>
          <div className="flex-1 max-w-sm w-full">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img src="https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=380&fit=crop&auto=format" alt="UMKM Food" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag size={17} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Produk Aktif</p>
                    <p className="font-bold text-sm text-foreground">1.248 Produk Terverifikasi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-50 border-y border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "248+", label: "UMKM Terdaftar" },
            { value: "1.2K+", label: "Produk Aktif" },
            { value: "12K+", label: "Pelanggan Puas" },
            { value: "Rp 2.4M", label: "Hemat Hari Ini" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold">Kategori Populer</h2>
          <button onClick={() => setPage("catalog")} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">Lihat Semua <ChevronRight size={14} /></button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {[
            { icon: "🍜", label: "Makanan" }, { icon: "☕", label: "Minuman" },
            { icon: "🍰", label: "Dessert" }, { icon: "🥨", label: "Snack" },
            { icon: "🛍️", label: "Fashion" }, { icon: "💄", label: "Kecantikan" },
            { icon: "🧴", label: "Kesehatan" }, { icon: "📦", label: "Lainnya" },
          ].map(cat => (
            <button key={cat.label} onClick={() => setPage("catalog")}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-primary hover:bg-green-50 transition-all duration-150 group shadow-sm">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary leading-tight text-center">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold">Promo Unggulan</h2>
          <button onClick={() => setPage("promo-list")} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">Semua Promo <ChevronRight size={14} /></button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PROMOS.map(promo => (
            <div key={promo.id} onClick={() => setPage("promo-list")} className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow">
              <img src={promo.image} alt={promo.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Bdg variant="discount" className="mb-2">
                  {promo.discount > 0 ? `HEMAT ${promo.discount}%` : "PROMO SPESIAL"}
                </Bdg>
                <h3 className="text-white font-bold text-base">{promo.title}</h3>
                <p className="text-green-200 text-xs mt-0.5">{promo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold">Produk Terpopuler</h2>
          <button onClick={() => setPage("catalog")} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">Lihat Semua <ChevronRight size={14} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PRODUCTS.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onClick={() => setPage("product-detail")} />)}
        </div>
      </section>

      {/* UMKM CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-primary rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/5 rounded-full" />
          <Store size={40} className="mx-auto mb-4 text-green-200" />
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 relative">Punya UMKM? Daftarkan Sekarang!</h2>
          <p className="text-green-100 mb-7 max-w-md mx-auto relative">Bergabung dengan 248+ UMKM lokal dan jangkau lebih banyak pelanggan. Kelola produk, promo, dan pesanan dengan mudah.</p>
          <Btn size="lg" onClick={() => setPage("register")} className="!bg-white !text-primary hover:!bg-green-50 mx-auto font-bold shadow-lg">
            Daftar UMKM Gratis
          </Btn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center"><Tag size={13} className="text-white" /></div>
                <span className="font-extrabold text-primary text-lg">DISKO</span>
              </div>
              <p className="text-sm text-muted-foreground">Platform promo & diskon UMKM lokal untuk mahasiswa dan masyarakat.</p>
            </div>
            {[
              { title: "Pengguna", links: ["Beranda", "Katalog Produk", "Promo & Diskon", "Keranjang"] },
              { title: "UMKM", links: ["Daftar UMKM", "Dashboard", "Panduan Seller", "FAQ"] },
              { title: "Kontak", links: ["Pusat Bantuan", "Hubungi Kami", "Kebijakan Privasi", "Syarat & Ketentuan"] },
            ].map(col => (
              <div key={col.title}>
                <p className="font-bold mb-3 text-sm">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><button className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</button></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
            © 2024 DISKO — Diskon UMKM Lokal. Proyek Rekayasa Perangkat Lunak · Universitas.
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoginPage({ setPage, onAuthSuccess }: { setPage: (p: Page) => void; onAuthSuccess: (token: string, user: AuthUser) => void }) {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("budi@email.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await loginUser({ email, password });
      onAuthSuccess(result.token, result.user);
      setPage(result.user.role === "umkm" ? "umkm-dashboard" : result.user.role === "admin" ? "admin-dashboard" : "landing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Tag size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Masuk ke DISKO</h1>
          <p className="text-muted-foreground text-sm mt-1">Temukan promo terbaik di sekitarmu</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email</label>
              <div className="flex items-center bg-muted rounded-xl px-3 gap-2 border border-transparent focus-within:border-primary/40">
                <Mail size={14} className="text-muted-foreground shrink-0" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" className="bg-transparent py-2.5 text-sm outline-none w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Password</label>
              <div className="flex items-center bg-muted rounded-xl px-3 gap-2 border border-transparent focus-within:border-primary/40">
                <Settings size={14} className="text-muted-foreground shrink-0" />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="bg-transparent py-2.5 text-sm outline-none flex-1" />
                <button onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground">
                  <Eye size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" defaultChecked />
                <span className="text-muted-foreground">Ingat saya</span>
              </label>
              <button className="text-primary font-semibold hover:underline">Lupa password?</button>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 font-semibold mt-4">{error}</p>}
          <Btn className="w-full mt-6" size="lg" onClick={handleLogin} disabled={loading}>{loading ? "Memproses..." : "Masuk"}</Btn>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">atau masuk dengan</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <button className="w-full border border-border rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors">
            <span className="font-bold text-blue-500">G</span> Google
          </button>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Belum punya akun?{" "}
            <button onClick={() => setPage("register")} className="text-primary font-bold hover:underline">Daftar sekarang</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ setPage, onAuthSuccess }: { setPage: (p: Page) => void; onAuthSuccess: (token: string, user: AuthUser) => void }) {
  const [role, setRole] = useState<"user" | "umkm">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessCategory, setBusinessCategory] = useState(CATEGORIES.filter(c => c !== "Semua")[0]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await registerUser({ name, email, phone, password, role, businessCategory });
      onAuthSuccess(result.token, result.user);
      setPage(result.user.role === "umkm" ? "umkm-dashboard" : "landing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Tag size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Buat Akun DISKO</h1>
          <p className="text-muted-foreground text-sm mt-1">Gratis, cepat, dan mudah</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex bg-muted rounded-xl p-1 mb-5">
            {(["user", "umkm"] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === r ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}>
                {r === "user" ? "👤 Pelanggan" : "🏪 UMKM"}
              </button>
            ))}
          </div>
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{role === "umkm" ? "Nama UMKM" : "Nama Lengkap"}</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={role === "umkm" ? "Warung Bu Sari" : "Budi Santoso"} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">No. HP / WhatsApp</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08123456789" className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
            </div>
            {role === "umkm" && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Kategori Usaha</label>
                <select value={businessCategory} onChange={e => setBusinessCategory(e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none">
                  {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 karakter" className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 font-semibold mt-4">{error}</p>}
          <Btn className="w-full mt-6" size="lg" onClick={handleRegister} disabled={loading}>
            {loading ? "Memproses..." : "Buat Akun"}
          </Btn>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Dengan mendaftar, kamu menyetujui <span className="text-primary font-medium">Syarat & Ketentuan</span> DISKO
          </p>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Sudah punya akun? <button onClick={() => setPage("login")} className="text-primary font-bold hover:underline">Masuk</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function CatalogPage({ setPage }: { setPage: (p: Page) => void }) {
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("terpopuler");

  const filtered = PRODUCTS.filter(p =>
    (selectedCat === "Semua" || p.category === selectedCat) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.umkm.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold mb-1">Katalog Produk</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} produk ditemukan</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm focus-within:border-primary/40">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk atau UMKM..." className="bg-transparent text-sm outline-none w-full" />
          {query && <button onClick={() => setQuery("")}><X size={14} className="text-muted-foreground" /></button>}
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-sm">
          <Filter size={13} className="text-muted-foreground" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-transparent text-sm outline-none">
            <option value="terpopuler">Terpopuler</option>
            <option value="termurah">Termurah</option>
            <option value="diskon">Diskon Terbesar</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${selectedCat === cat ? "bg-primary text-white border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => setPage("product-detail")} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-bold text-lg">Produk tidak ditemukan</p>
          <p className="text-muted-foreground text-sm mt-1">Coba kata kunci atau kategori lain</p>
        </div>
      )}
    </div>
  );
}

function PromoListPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold mb-1">Promo &amp; Diskon</h1>
      <p className="text-muted-foreground text-sm mb-6">Hemat lebih banyak dengan promo eksklusif DISKO</p>

      <div className="space-y-4 mb-10">
        {PROMOS.map(promo => (
          <div key={promo.id} onClick={() => setPage("catalog")} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="relative">
              <img src={promo.image} alt={promo.title} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent" />
              <div className="absolute left-5 bottom-5 right-5">
                <Bdg variant="discount" className="mb-2">
                  {promo.discount > 0 ? `DISKON ${promo.discount}%` : "PROMO SPESIAL"}
                </Bdg>
                <h2 className="text-white text-xl font-extrabold">{promo.title}</h2>
                <p className="text-green-200 text-sm mt-0.5">{promo.description}</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kode Promo</p>
                <div className="flex items-center gap-2">
                  <span className="bg-green-50 text-primary font-mono font-bold text-sm px-3 py-1 rounded-lg border border-green-200">{promo.code}</span>
                  <button className="text-xs text-primary font-semibold hover:underline">Salin</button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Berlaku hingga</p>
                <p className="text-sm font-bold">{promo.validUntil}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-extrabold mb-4">Produk Diskon Hari Ini 🔖</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...PRODUCTS].sort((a, b) => b.discount - a.discount).map(p => (
          <ProductCard key={p.id} product={p} onClick={() => setPage("product-detail")} />
        ))}
      </div>
    </div>
  );
}

function ProductDetailPage({ setPage, onAddToCart }: { setPage: (p: Page) => void; onAddToCart: (product: Product, qty: number) => void }) {
  const product = PRODUCTS[0];
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => setPage("catalog")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
        <ArrowLeft size={15} /> Kembali ke Katalog
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-muted border border-border" style={{ height: 320 }}>
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3"><Bdg variant="discount">-{product.discount}%</Bdg></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[...Array(4)].map((_, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? "border-primary" : "border-transparent"}`} style={{ height: 64 }}>
                <img src={product.image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.umkm} · {product.category}</p>
          <h1 className="text-2xl font-extrabold mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
              ))}
              <span className="font-bold ml-1">{product.rating}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{product.sold} terjual</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-green-600 font-semibold">Stok: {product.stock}</span>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-primary">{fmtPrice(product.price)}</span>
              <span className="text-lg text-muted-foreground line-through mb-0.5">{fmtPrice(product.originalPrice)}</span>
            </div>
            <p className="text-sm text-green-700 font-semibold mt-1">
              Hemat {fmtPrice(product.originalPrice - product.price)} ({product.discount}% off)
            </p>
          </div>

          <div className="mb-5">
            <p className="font-bold mb-2 text-sm">Deskripsi Produk</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-semibold">Jumlah:</span>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1 border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card font-bold transition-colors">
                <Minus size={13} />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card font-bold transition-colors">
                <Plus size={13} />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">Subtotal: <strong className="text-primary">{fmtPrice(product.price * qty)}</strong></span>
          </div>

          <div className="flex gap-3 mb-4">
            <Btn size="lg" className="flex-1" onClick={() => { onAddToCart(product, qty); setPage("cart"); }}>
              <ShoppingCart size={17} /> Tambah ke Keranjang
            </Btn>
            <button className="w-12 h-12 border-2 border-border rounded-xl flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-all">
              <Heart size={17} />
            </button>
          </div>

          <div className="p-3 bg-muted rounded-xl flex items-center gap-3">
            <MapPin size={15} className="text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold">Lokasi UMKM</p>
              <p className="text-xs text-muted-foreground">Jl. Pahlawan No. 12, Malang · 0.8 km dari lokasimu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartPage({ setPage, items, onUpdateQty, onRemoveItem }: {
  setPage: (p: Page) => void;
  items: CartItem[];
  onUpdateQty: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingFee = items.length > 0 ? 5000 : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPage("catalog")} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-extrabold">Keranjang <span className="text-muted-foreground font-normal text-lg">({items.length})</span></h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-sm hover:border-primary/20 transition-colors">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.umkm}</p>
                <h3 className="font-bold text-sm truncate">{item.name}</h3>
                {item.discount > 0 && <Bdg variant="discount" className="mt-1">-{item.discount}%</Bdg>}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="font-extrabold text-primary">{fmtPrice(item.price)}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 border border-border">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-card font-bold transition-colors"><Minus size={11} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-card font-bold transition-colors"><Plus size={11} /></button>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-bold mb-3">Kode Promo</p>
            <div className="flex gap-2">
              <input placeholder="Masukkan kode promo (contoh: PAGIDISKO)" className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
              <Btn size="sm">Pakai</Btn>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-fit sticky top-20">
          <h3 className="font-bold mb-4">Ringkasan Pesanan</h3>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.qty, 0)} item)</span>
              <span className="font-semibold">{fmtPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ongkos kirim</span>
              <span className="font-semibold">{fmtPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Diskon promo</span>
              <span className="font-semibold">-{fmtPrice(0)}</span>
            </div>
          </div>
          <div className="border-t border-border pt-3 mb-5">
            <div className="flex justify-between font-extrabold text-lg">
              <span>Total</span>
              <span className="text-primary">{fmtPrice(total)}</span>
            </div>
          </div>
          <Btn size="lg" className="w-full" onClick={() => setPage("checkout")} disabled={items.length === 0}>
            Checkout Sekarang
          </Btn>
          <button onClick={() => setPage("catalog")} className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-primary transition-colors">
            + Tambah produk lain
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutPage({ setPage, items, authToken, onOrderCreated }: {
  setPage: (p: Page) => void;
  items: CartItem[];
  authToken: string | null;
  onOrderCreated: () => void;
}) {
  const [payMethod, setPayMethod] = useState("transfer");
  const [shipping, setShipping] = useState<ShippingPayload>({
    recipientName: "Budi Santoso",
    phone: "082234567890",
    address: "Jl. Soekarno Hatta No. 45, Kec. Lowokwaru, Malang 65141",
    city: "Malang",
    province: "Jawa Timur",
    postalCode: "65141",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = items.length > 0 ? 5000 : 0;
  const total = subtotal + shippingFee;

  const updateShipping = (key: keyof ShippingPayload, value: string) => {
    setShipping(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateOrder = async () => {
    if (!authToken) {
      setPage("login");
      return;
    }

    if (items.length === 0) {
      setPage("cart");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await createOrder(authToken, {
        shipping,
        paymentMethod: payMethod as "transfer" | "ewallet" | "cod",
        items: items.map<OrderItemPayload>(item => ({
          productId: item.id,
          name: item.name,
          umkm: item.umkm,
          category: item.category,
          image: item.image,
          price: item.price,
          qty: item.qty,
        })),
      });
      onOrderCreated();
      setPage(payMethod === "transfer" ? "upload-payment" : "order-status");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPage("cart")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-extrabold">Checkout</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-4">Informasi Pengiriman</h3>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Penerima *</label>
                  <input value={shipping.recipientName} onChange={e => updateShipping("recipientName", e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">No. HP *</label>
                  <input value={shipping.phone} onChange={e => updateShipping("phone", e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Alamat Lengkap *</label>
                <textarea value={shipping.address} onChange={e => updateShipping("address", e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none resize-none border border-transparent focus:border-primary/40" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kota</label>
                  <input value={shipping.city} onChange={e => updateShipping("city", e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Provinsi</label>
                  <input value={shipping.province} onChange={e => updateShipping("province", e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kode Pos</label>
                  <input value={shipping.postalCode} onChange={e => updateShipping("postalCode", e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-4">Metode Pembayaran</h3>
            <div className="space-y-3">
              {[
                { id: "transfer", label: "Transfer Bank", icon: "🏦", sub: "BCA, Mandiri, BNI, BRI" },
                { id: "ewallet", label: "E-Wallet", icon: "📱", sub: "GoPay, OVO, DANA, ShopeePay" },
                { id: "cod", label: "Bayar di Tempat (COD)", icon: "💵", sub: "Bayar saat barang tiba" },
              ].map(m => (
                <label key={m.id} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${payMethod === m.id ? "border-primary bg-green-50" : "border-border hover:border-green-200"}`}>
                  <input type="radio" name="pay" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} className="accent-primary" />
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-3">Detail Pesanan</h3>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.umkm} x {item.qty}</p>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">{fmtPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-fit sticky top-20">
          <h3 className="font-bold mb-4">Ringkasan</h3>
          <div className="space-y-2 text-sm mb-4">
            {[["Subtotal", fmtPrice(subtotal)], ["Ongkir", fmtPrice(shippingFee)], ["Diskon", `-${fmtPrice(0)}`]].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className={val.startsWith("-") ? "text-green-600 font-semibold" : "font-semibold"}>{val}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 mb-5">
            <div className="flex justify-between font-extrabold text-xl">
              <span>Total</span>
              <span className="text-primary">{fmtPrice(total)}</span>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 font-semibold mb-3">{error}</p>}
          <Btn size="lg" className="w-full" onClick={handleCreateOrder} disabled={loading || items.length === 0}>
            {loading ? "Memproses..." : "Buat Pesanan"}
          </Btn>
          <p className="text-xs text-center text-muted-foreground mt-3">Dengan memesan, kamu menyetujui syarat DISKO</p>
        </div>
      </div>
    </div>
  );
}

function UploadPaymentPage({ setPage }: { setPage: (p: Page) => void }) {
  const [uploaded, setUploaded] = useState(false);
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setPage("checkout")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-extrabold">Upload Bukti Bayar</h1>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5">
        <p className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">i</span>
          Informasi Transfer
        </p>
        <div className="space-y-2.5">
          {[["Bank", "BCA"], ["No. Rekening", "1234567890"], ["Atas Nama", "DISKO UMKM LOKAL"], ["Jumlah Transfer", "Rp 45.000"]].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-sm text-green-700">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-900">{val}</span>
                {label === "No. Rekening" && <button className="text-xs text-primary font-semibold hover:underline">Salin</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
        <p className="font-bold mb-4">Unggah Bukti Pembayaran</p>
        {!uploaded ? (
          <div onClick={() => setUploaded(true)} className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-green-50 transition-all">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center"><Upload size={24} className="text-muted-foreground" /></div>
            <p className="text-sm font-semibold">Klik untuk upload foto bukti transfer</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, PDF — maks. 5MB</p>
            <Btn size="sm" variant="outline"><Camera size={13} /> Pilih File</Btn>
          </div>
        ) : (
          <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-800">bukti_transfer_bca.jpg</p>
              <p className="text-xs text-green-600">2.3 MB · Berhasil diunggah</p>
            </div>
            <button onClick={() => setUploaded(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={15} /></button>
          </div>
        )}
      </div>

      <Btn size="lg" className="w-full" disabled={!uploaded} onClick={() => setPage("order-status")}>
        Konfirmasi Pembayaran
      </Btn>
    </div>
  );
}

function OrderStatusPage({ setPage }: { setPage: (p: Page) => void }) {
  const steps = [
    { label: "Pesanan Diterima", sub: "25 Des 2024, 10:32 WIB", done: true },
    { label: "Pembayaran Dikonfirmasi", sub: "25 Des 2024, 10:48 WIB", done: true },
    { label: "Sedang Disiapkan UMKM", sub: "25 Des 2024, 11:05 WIB", done: true },
    { label: "Dalam Pengiriman", sub: "Estimasi tiba 30 menit lagi", done: false, active: true },
    { label: "Pesanan Tiba", sub: "Menunggu konfirmasi penerimaan", done: false },
  ];
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPage("profile")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-extrabold">Status Pesanan</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground">ID Pesanan</p>
            <p className="font-mono font-bold">#DSK-20241225-001</p>
          </div>
          <Bdg variant="warning">Dalam Pengiriman</Bdg>
        </div>
        <div className="flex gap-3">
          <img src={PRODUCTS[0].image} alt="" className="w-14 h-14 rounded-xl object-cover" />
          <div>
            <p className="font-semibold text-sm">{PRODUCTS[0].name}</p>
            <p className="text-xs text-muted-foreground">{PRODUCTS[0].umkm} · 2 item</p>
            <p className="text-sm font-extrabold text-primary mt-1">{fmtPrice(PRODUCTS[0].price * 2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h3 className="font-bold mb-5">Lacak Pesanan</h3>
        <div className="relative pl-10">
          <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-border" />
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div className={`absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${step.done ? "bg-primary border-primary" : step.active ? "bg-amber-400 border-amber-400" : "bg-white border-border"}`}>
                  {step.done ? <Check size={13} className="text-white" /> : step.active ? <Clock size={13} className="text-white" /> : <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />}
                </div>
                <div className={!step.done && !step.active ? "opacity-40" : ""}>
                  <p className={`text-sm font-bold ${step.active ? "text-amber-600" : step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Btn variant="outline"><Phone size={14} /> Hubungi UMKM</Btn>
        <Btn onClick={() => setPage("landing")}><CheckCircle size={14} /> Pesanan Diterima</Btn>
      </div>
    </div>
  );
}

function ProfilePage({ setPage, onLogout }: { setPage: (p: Page) => void; onLogout: () => void }) {
  const orders = [
    { id: "#DSK-001", product: "Bakso Spesial Mas Bro", status: "Selesai", date: "20 Des 2024", amount: 30000 },
    { id: "#DSK-002", product: "Kopi Susu Nusantara", status: "Dalam Pengiriman", date: "24 Des 2024", amount: 12000 },
    { id: "#DSK-003", product: "Mie Ayam Cak Dul", status: "Menunggu Konfirmasi", date: "25 Des 2024", amount: 26000 },
  ];
  const statusV = (s: string): BadgeVariant => s === "Selesai" ? "success" : s === "Dalam Pengiriman" ? "warning" : "outline";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-primary rounded-2xl p-6 text-white mb-6 relative overflow-hidden shadow-md">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -left-5 bottom-0 w-28 h-28 bg-white/5 rounded-full" />
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Budi Santoso</h2>
            <p className="text-green-100 text-sm">budi.santoso@email.com</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-green-200" />
              <span className="text-xs text-green-200">Malang, Jawa Timur</span>
            </div>
          </div>
          <button className="ml-auto w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
            <Edit size={15} className="text-white" />
          </button>
        </div>
        <div className="flex gap-6 mt-5 pt-4 border-t border-white/20">
          {[{ label: "Pesanan", val: "12" }, { label: "Ulasan", val: "8" }, { label: "Favorit", val: "24" }].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-extrabold">{s.val}</p>
              <p className="text-xs text-green-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Pesanan Saya</h3>
          <button onClick={() => setPage("order-status")} className="text-sm text-primary font-semibold hover:underline">Lihat Semua</button>
        </div>
        <div className="space-y-2.5">
          {orders.map(o => (
            <div key={o.id} onClick={() => setPage("order-status")} className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{o.product}</p>
                <p className="text-xs text-muted-foreground">{o.id} · {o.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{fmtPrice(o.amount)}</p>
                <Bdg variant={statusV(o.status)} className="mt-0.5">{o.status}</Bdg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {[
          { icon: <User size={15} />, label: "Edit Profil", action: undefined },
          { icon: <MapPin size={15} />, label: "Alamat Pengiriman", action: undefined },
          { icon: <Bell size={15} />, label: "Notifikasi", action: () => setPage("notifications") },
          { icon: <CreditCard size={15} />, label: "Metode Pembayaran", action: undefined },
          { icon: <Settings size={15} />, label: "Pengaturan Akun", action: undefined },
          { icon: <LogOut size={15} />, label: "Keluar", action: onLogout, danger: true },
        ].map(item => (
          <button key={item.label} onClick={item.action}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0 ${(item as any).danger ? "text-red-600" : ""}`}>
            {item.icon}
            <span className="flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight size={13} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationsPage({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  const notifs = [
    { icon: "🔥", title: "Flash Sale Dimulai!", body: "Diskon hingga 50% untuk semua minuman. Segera pesan sebelum kehabisan!", time: "5 menit lalu", unread: true },
    { icon: "✅", title: "Pesanan Dikonfirmasi", body: "Pesanan #DSK-003 telah dikonfirmasi oleh Mie Cak Dul. Sedang disiapkan.", time: "20 menit lalu", unread: true },
    { icon: "🚚", title: "Pesanan Dalam Pengiriman", body: "Pesanan #DSK-002 sedang dalam perjalanan ke lokasimu. ETA 25 menit.", time: "1 jam lalu", unread: false },
    { icon: "🎁", title: "Promo Spesial Untukmu", body: "Dapatkan gratis ongkir untuk pesanan malam ini dengan kode MALEM50.", time: "3 jam lalu", unread: false },
    { icon: "⭐", title: "Beri Ulasan Produk", body: "Bagaimana pengalamanmu dengan Bakso Spesial Mas Bro? Yuk berikan ulasan!", time: "1 hari lalu", unread: false },
    { icon: "🏷️", title: "Kode Promo Baru", body: "Gunakan kode PAGIDISKO untuk diskon 30% untuk pembelian pertama hari ini.", time: "2 hari lalu", unread: false },
    { icon: "📦", title: "Stok Terbatas", body: "Nasi Gudeg Bu Sari yang kamu favoritkan hampir habis. Pesan sekarang!", time: "2 hari lalu", unread: false },
  ];
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Notifikasi</h1>
        <button className="text-sm text-primary font-semibold hover:underline">Tandai Semua Dibaca</button>
      </div>
      <div className="space-y-2">
        {notifs.map((n, i) => (
          <div key={i} className={`rounded-2xl p-4 flex gap-3 border cursor-pointer transition-colors hover:bg-green-50/50 ${n.unread ? "bg-green-50/60 border-green-200" : "bg-card border-border"}`}>
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xl shrink-0">{n.icon}</div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2">
                <p className={`text-sm ${n.unread ? "font-bold" : "font-semibold"}`}>{n.title}</p>
                {n.unread && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  UMKM PAGES
// ═══════════════════════════════════════════════════════════════

function UMKMDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const recentOrders = [
    { id: "#001", customer: "Budi S.", product: "Bakso Spesial x2", amount: 30000, status: "Baru" },
    { id: "#002", customer: "Ani W.", product: "Bakso Spesial", amount: 15000, status: "Diproses" },
    { id: "#003", customer: "Citra R.", product: "Bakso Spesial x3", amount: 45000, status: "Dikirim" },
    { id: "#004", customer: "Dodi M.", product: "Bakso Spesial", amount: 15000, status: "Selesai" },
  ];
  const statusV = (s: string): BadgeVariant => s === "Selesai" ? "success" : s === "Baru" ? "danger" : s === "Dikirim" ? "warning" : "outline";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard UMKM</h1>
        <p className="text-sm text-muted-foreground">Selamat datang kembali, Warung Mas Bro 👋</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={17} />} label="Pendapatan Bulan Ini" value="Rp 11,2 Jt" sub="+18% dari bulan lalu" color="green" />
        <StatCard icon={<ShoppingBag size={17} />} label="Total Pesanan" value="389" sub="42 menunggu proses" color="blue" />
        <StatCard icon={<Package size={17} />} label="Produk Aktif" value="12" sub="2 stok hampir habis" color="orange" />
        <StatCard icon={<Star size={17} />} label="Rating Rata-rata" value="4.8 ⭐" sub="dari 234 ulasan" color="purple" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-1">Pendapatan 6 Bulan Terakhir</h3>
        <p className="text-xs text-muted-foreground mb-4">Total revenue dari seluruh produk</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={SALES_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v: number) => fmtPrice(v)} labelStyle={{ fontWeight: 600 }} />
            <Area type="monotone" dataKey="sales" stroke="#2E7D32" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ r: 4, fill: "#2E7D32" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Pesanan Terbaru</h3>
          <button onClick={() => setPage("umkm-orders")} className="text-sm text-primary font-semibold hover:underline">Lihat Semua</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                {["ID", "Pelanggan", "Produk", "Total", "Status"].map(h => (
                  <th key={h} className="text-left pb-2.5 pr-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{o.id}</td>
                  <td className="py-3 pr-4 font-semibold">{o.customer}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{o.product}</td>
                  <td className="py-3 pr-4 font-bold text-primary">{fmtPrice(o.amount)}</td>
                  <td className="py-3"><Bdg variant={statusV(o.status)}>{o.status}</Bdg></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UMKMProducts({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Manajemen Produk</h1>
          <p className="text-sm text-muted-foreground">{PRODUCTS.length} produk terdaftar</p>
        </div>
        <Btn onClick={() => setPage("umkm-add-product")}><Plus size={15} /> Tambah Produk</Btn>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm">
          <Search size={14} className="text-muted-foreground" />
          <input placeholder="Cari produk..." className="bg-transparent text-sm outline-none w-full" />
        </div>
        <select className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">
          <option>Semua Kategori</option>
          {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">
          <option>Semua Status</option><option>Aktif</option><option>Non-aktif</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>{["Produk", "Kategori", "Harga Jual", "Diskon", "Stok", "Terjual", "Status", "Aksi"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {PRODUCTS.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                      <div>
                        <p className="font-semibold text-xs leading-tight max-w-32 truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.umkm}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Bdg variant="outline">{p.category}</Bdg></td>
                  <td className="py-3 px-4 font-bold text-primary whitespace-nowrap">{fmtPrice(p.price)}</td>
                  <td className="py-3 px-4"><Bdg variant="discount">-{p.discount}%</Bdg></td>
                  <td className="py-3 px-4 font-semibold">{p.stock}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.sold}</td>
                  <td className="py-3 px-4"><Bdg variant="success">Aktif</Bdg></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setPage("umkm-add-product")} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"><Edit size={13} /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Menampilkan {PRODUCTS.length} dari {PRODUCTS.length} produk</span>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 border border-border rounded-lg hover:bg-muted">‹</button>
            <button className="px-2.5 py-1 bg-primary text-white rounded-lg">1</button>
            <button className="px-2.5 py-1 border border-border rounded-lg hover:bg-muted">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UMKMAddProduct({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPage("umkm-products")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-extrabold">Tambah Produk Baru</h1>
      </div>
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-bold mb-3">Foto Produk</p>
          <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-green-50 transition-all">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center"><Camera size={24} className="text-muted-foreground" /></div>
            <p className="text-sm font-semibold">Upload foto produk</p>
            <p className="text-xs text-muted-foreground">PNG, JPG — maks. 5MB per foto (maks. 5 foto)</p>
            <Btn size="sm" variant="outline"><Upload size={13} /> Pilih Foto</Btn>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <p className="font-bold">Informasi Produk</p>
          {[
            { label: "Nama Produk *", placeholder: "Contoh: Bakso Spesial Kuah Gurih" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Kategori *</label>
            <select className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none">
              {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Deskripsi Produk *</label>
            <textarea placeholder="Jelaskan produkmu dengan detail — bahan, rasa, porsi, dll." className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none resize-none border border-transparent focus:border-primary/40" rows={3} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <p className="font-bold">Harga, Diskon &amp; Stok</p>
          <div className="grid grid-cols-2 gap-3">
            {[["Harga Normal (Rp) *", "20000"], ["Harga Diskon (Rp)", "15000"], ["Stok *", "50"], ["Min. Pesanan", "1"]].map(([label, ph]) => (
              <div key={label}>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                <input type="number" placeholder={ph} className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-primary/40" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Satuan</label>
            <select className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none">
              <option>Porsi</option><option>Buah</option><option>Gram</option><option>Botol</option><option>Gelas</option><option>Pack</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <Btn variant="outline" className="flex-1" onClick={() => setPage("umkm-products")}>Batal</Btn>
          <Btn className="flex-1" onClick={() => setPage("umkm-products")}>Simpan Produk</Btn>
        </div>
      </div>
    </div>
  );
}

function UMKMPromos({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Promo &amp; Diskon</h1>
          <p className="text-sm text-muted-foreground">Kelola promosi untuk produkmu</p>
        </div>
        <Btn><Plus size={15} /> Buat Promo</Btn>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={<Percent size={17} />} label="Promo Aktif" value="3" color="green" />
        <StatCard icon={<TrendingUp size={17} />} label="Produk Terdiskon" value="8" color="orange" />
        <StatCard icon={<ShoppingBag size={17} />} label="Order via Promo" value="142" sub="bulan ini" color="blue" />
      </div>
      <div className="space-y-4">
        {PROMOS.map(promo => (
          <div key={promo.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <img src={promo.image} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0 border border-border" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">{promo.title}</h3>
                <Bdg variant="success">Aktif</Bdg>
              </div>
              <p className="text-sm text-muted-foreground truncate">{promo.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs bg-green-50 text-primary font-mono font-bold px-2 py-0.5 rounded-lg border border-green-200">{promo.code}</span>
                <span className="text-xs text-muted-foreground">Hingga {promo.validUntil}</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"><Edit size={13} /></button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UMKMPaymentVerify({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  const payments = [
    { id: "#DSK-001", customer: "Budi Santoso", amount: 39000, bank: "BCA", date: "25 Des, 10:30 WIB" },
    { id: "#DSK-002", customer: "Ani Widyastuti", amount: 22000, bank: "Mandiri", date: "25 Des, 11:15 WIB" },
    { id: "#DSK-003", customer: "Citra Rahma", amount: 65000, bank: "BNI", date: "25 Des, 11:48 WIB" },
  ];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Verifikasi Pembayaran</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={<Clock size={17} />} label="Menunggu Verifikasi" value="3" color="orange" />
        <StatCard icon={<CheckCircle size={17} />} label="Dikonfirmasi Hari Ini" value="12" color="green" />
        <StatCard icon={<XCircle size={17} />} label="Ditolak" value="1" color="purple" />
      </div>
      <div className="space-y-4">
        {payments.map(p => (
          <div key={p.id} className="bg-card border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center border border-border shrink-0 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Receipt size={28} className="text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold">{p.id}</span>
                  <Bdg variant="warning">Menunggu</Bdg>
                </div>
                <p className="text-sm font-bold">{p.customer}</p>
                <p className="text-xs text-muted-foreground">{p.bank} · {p.date}</p>
                <p className="text-2xl font-extrabold text-primary mt-2">{fmtPrice(p.amount)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground border border-border rounded-xl py-2.5 hover:bg-muted transition-colors">
                <Eye size={13} /> Lihat Bukti
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition-colors">
                <XCircle size={13} /> Tolak
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-primary rounded-xl py-2.5 hover:bg-green-700 transition-colors">
                <CheckCircle size={13} /> Konfirmasi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UMKMOrders({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  const orders = [
    { id: "#DSK-001", customer: "Budi Santoso", product: "Bakso Spesial x2", amount: 30000, status: "Baru", time: "10:32" },
    { id: "#DSK-002", customer: "Ani Widyastuti", product: "Bakso Spesial x1", amount: 15000, status: "Diproses", time: "10:45" },
    { id: "#DSK-003", customer: "Citra Rahma", product: "Bakso Spesial x3", amount: 45000, status: "Dikirim", time: "11:00" },
    { id: "#DSK-004", customer: "Dodi Maulana", product: "Bakso Spesial x1", amount: 15000, status: "Selesai", time: "09:15" },
    { id: "#DSK-005", customer: "Eka Saputra", product: "Bakso Spesial x2", amount: 30000, status: "Dibatalkan", time: "08:50" },
  ];
  const statusV = (s: string): BadgeVariant => s === "Selesai" ? "success" : s === "Baru" ? "danger" : s === "Dikirim" ? "warning" : s === "Dibatalkan" ? "danger" : "outline";
  const [filter, setFilter] = useState("Semua");

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Manajemen Pesanan</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Semua", "Baru", "Diproses", "Dikirim", "Selesai", "Dibatalkan"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${filter === s ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary"}`}>{s}</button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>{["ID Pesanan", "Pelanggan", "Produk", "Total", "Waktu", "Status", "Aksi"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{o.id}</td>
                  <td className="py-3 px-4 font-semibold whitespace-nowrap">{o.customer}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">{o.product}</td>
                  <td className="py-3 px-4 font-bold text-primary whitespace-nowrap">{fmtPrice(o.amount)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{o.time}</td>
                  <td className="py-3 px-4"><Bdg variant={statusV(o.status)}>{o.status}</Bdg></td>
                  <td className="py-3 px-4">
                    <select className="bg-muted rounded-lg px-2 py-1 text-xs outline-none border border-border">
                      <option>Update</option><option>Proses</option><option>Kirim</option><option>Selesai</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UMKMReports({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  const rows = [
    { date: "25 Des", orders: 12, items: 28, revenue: 312000 },
    { date: "24 Des", orders: 18, items: 41, revenue: 467000 },
    { date: "23 Des", orders: 9, items: 19, revenue: 218000 },
    { date: "22 Des", orders: 21, items: 47, revenue: 528000 },
    { date: "21 Des", orders: 15, items: 33, revenue: 389000 },
    { date: "20 Des", orders: 7, items: 14, revenue: 181000 },
    { date: "19 Des", orders: 13, items: 26, revenue: 336000 },
  ];
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Laporan Transaksi</h1>
        <div className="flex gap-2">
          <select className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">
            <option>7 Hari Terakhir</option><option>30 Hari</option><option>3 Bulan</option>
          </select>
          <Btn size="sm" variant="outline"><Download size={13} /> Export CSV</Btn>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<DollarSign size={17} />} label="Total Pendapatan" value="Rp 2,4 Jt" sub="7 hari terakhir" color="green" />
        <StatCard icon={<ShoppingBag size={17} />} label="Total Pesanan" value="95" sub="rata-rata 13/hari" color="blue" />
        <StatCard icon={<TrendingUp size={17} />} label="Item Terjual" value="208" color="orange" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>{["Tanggal", "Pesanan", "Item Terjual", "Pendapatan"].map(h => (
                <th key={h} className="text-left py-3 px-5 text-xs font-bold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.date} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-5 font-semibold">{r.date}</td>
                  <td className="py-3 px-5 text-muted-foreground">{r.orders} pesanan</td>
                  <td className="py-3 px-5 text-muted-foreground">{r.items} item</td>
                  <td className="py-3 px-5 font-bold text-primary">{fmtPrice(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UMKMStatistics({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Statistik Penjualan</h1>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-1">Pendapatan per Bulan</h3>
          <p className="text-xs text-muted-foreground mb-4">Total rupiah masuk per bulan</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SALES_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => fmtPrice(v)} />
              <Bar dataKey="sales" fill="#2E7D32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-1">Jumlah Pesanan per Bulan</h3>
          <p className="text-xs text-muted-foreground mb-4">Jumlah order yang masuk</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={SALES_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#2E7D32" strokeWidth={2.5} dot={{ r: 4, fill: "#2E7D32" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4">Penjualan per Kategori</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={CAT_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                  {CAT_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {CAT_PIE.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-sm flex-1">{c.name}</span>
                  <span className="text-sm font-bold">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4">Produk Terlaris</h3>
          <div className="space-y-3.5">
            {[...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-extrabold shrink-0 ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${(p.sold / 700) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-muted-foreground shrink-0">{p.sold}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN PAGES
// ═══════════════════════════════════════════════════════════════

function AdminDashboard({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, Administrator DISKO 👋</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={17} />} label="Total Pengguna" value="12.480" sub="+234 bulan ini" color="blue" />
        <StatCard icon={<Store size={17} />} label="UMKM Terdaftar" value="248" sub="12 pending verifikasi" color="green" />
        <StatCard icon={<Receipt size={17} />} label="Total Transaksi" value="8.912" sub="bulan Desember" color="orange" />
        <StatCard icon={<DollarSign size={17} />} label="Nilai Transaksi" value="Rp 892 Jt" sub="bulan ini" color="purple" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-1">Pertumbuhan Pengguna</h3>
          <p className="text-xs text-muted-foreground mb-4">Akumulasi pelanggan & UMKM aktif</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={SALES_DATA.map(d => ({ ...d, users: Math.floor(d.orders * 3.2) }))} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976D2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#1976D2" strokeWidth={2.5} fill="url(#userGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4">UMKM Pending Verifikasi</h3>
          <div className="space-y-3">
            {[
              { name: "Warung Soto Betawi Pak Udin", cat: "Makanan", date: "24 Des 2024" },
              { name: "Kue Tradisional Mbak Lastri", cat: "Snack", date: "24 Des 2024" },
              { name: "Minuman Jamu Bu Parmi", cat: "Minuman", date: "23 Des 2024" },
            ].map(u => (
              <div key={u.name} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0"><Store size={15} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.cat} · {u.date}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="px-2.5 py-1 bg-primary text-white text-xs rounded-lg font-bold hover:bg-green-700 transition-colors">Setujui</button>
                  <button className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-bold hover:bg-red-100 transition-colors">Tolak</button>
                </div>
              </div>
            ))}
            <button onClick={() => setPage("admin-users")} className="w-full text-center text-sm text-primary font-semibold hover:underline">Lihat semua permintaan →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  const users = [
    { id: 1, name: "Budi Santoso", email: "budi@email.com", role: "Pelanggan", orders: 12, joined: "1 Jan 2024", status: "Aktif" },
    { id: 2, name: "Warung Mas Bro", email: "masbro@umkm.com", role: "UMKM", orders: 389, joined: "15 Okt 2023", status: "Aktif" },
    { id: 3, name: "Ani Widyastuti", email: "ani@email.com", role: "Pelanggan", orders: 7, joined: "12 Feb 2024", status: "Aktif" },
    { id: 4, name: "Kedai Kopi Nusantara", email: "kopi@umkm.com", role: "UMKM", orders: 512, joined: "3 Sep 2023", status: "Aktif" },
    { id: 5, name: "Citra Rahma", email: "citra@email.com", role: "Pelanggan", orders: 3, joined: "20 Des 2024", status: "Baru" },
    { id: 6, name: "Sate Pak Haji", email: "satehaji@umkm.com", role: "UMKM", orders: 423, joined: "7 Nov 2023", status: "Aktif" },
  ];
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Manajemen Pengguna</h1>
        <Btn><Plus size={15} /> Tambah User</Btn>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm">
          <Search size={14} className="text-muted-foreground" />
          <input placeholder="Cari nama atau email..." className="bg-transparent text-sm outline-none w-full" />
        </div>
        <select className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">
          <option>Semua Role</option><option>Pelanggan</option><option>UMKM</option><option>Admin</option>
        </select>
        <select className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm">
          <option>Semua Status</option><option>Aktif</option><option>Non-aktif</option><option>Baru</option>
        </select>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>{["Pengguna", "Role", "Transaksi", "Bergabung", "Status", "Aksi"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0"><User size={13} className="text-primary" /></div>
                      <div>
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Bdg variant={u.role === "UMKM" ? "default" : "outline"}>{u.role}</Bdg></td>
                  <td className="py-3 px-4 text-muted-foreground font-medium">{u.orders}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">{u.joined}</td>
                  <td className="py-3 px-4"><Bdg variant={u.status === "Aktif" ? "success" : "warning"}>{u.status}</Bdg></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"><Eye size={13} /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"><Edit size={13} /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><XCircle size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Menampilkan 6 dari 12.480 pengguna</span>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 border border-border rounded-lg hover:bg-muted">‹</button>
            <button className="px-2.5 py-1 bg-primary text-white rounded-lg">1</button>
            <button className="px-2.5 py-1 border border-border rounded-lg hover:bg-muted">2</button>
            <button className="px-2.5 py-1 border border-border rounded-lg hover:bg-muted">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminTransactions({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  const txns = [
    { id: "#DSK-2024-001", buyer: "Budi S.", seller: "Warung Mas Bro", amount: 30000, status: "Selesai", date: "25 Des" },
    { id: "#DSK-2024-002", buyer: "Ani W.", seller: "Kedai Kopi Nusantara", amount: 12000, status: "Dalam Proses", date: "25 Des" },
    { id: "#DSK-2024-003", buyer: "Citra R.", seller: "Warung Bu Sari", amount: 54000, status: "Menunggu Bayar", date: "25 Des" },
    { id: "#DSK-2024-004", buyer: "Dodi M.", seller: "Mie Cak Dul", amount: 26000, status: "Selesai", date: "24 Des" },
    { id: "#DSK-2024-005", buyer: "Eka S.", seller: "Sate Pak Haji", amount: 40000, status: "Dibatalkan", date: "24 Des" },
    { id: "#DSK-2024-006", buyer: "Fajar N.", seller: "Es Teh Pak Joko", amount: 21000, status: "Selesai", date: "24 Des" },
  ];
  const statusV = (s: string): BadgeVariant => s === "Selesai" ? "success" : s === "Dalam Proses" ? "warning" : s === "Dibatalkan" ? "danger" : "outline";

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Monitoring Transaksi</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<CheckCircle size={17} />} label="Selesai" value="8.245" color="green" />
        <StatCard icon={<Clock size={17} />} label="Dalam Proses" value="342" color="orange" />
        <StatCard icon={<AlertCircle size={17} />} label="Menunggu Bayar" value="128" color="blue" />
        <StatCard icon={<XCircle size={17} />} label="Dibatalkan" value="197" color="purple" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex gap-3 flex-wrap">
          <div className="flex-1 min-w-40 flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Cari ID transaksi, pembeli, UMKM..." className="bg-transparent text-sm outline-none w-full" />
          </div>
          <select className="bg-muted rounded-xl px-3 py-2 text-sm outline-none">
            <option>Semua Status</option><option>Selesai</option><option>Dalam Proses</option><option>Dibatalkan</option>
          </select>
          <Btn size="sm" variant="outline"><Download size={13} /> Export</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>{["ID Transaksi", "Pembeli", "UMKM", "Jumlah", "Tanggal", "Status", "Aksi"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{t.id}</td>
                  <td className="py-3 px-4 font-semibold">{t.buyer}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">{t.seller}</td>
                  <td className="py-3 px-4 font-bold text-primary whitespace-nowrap">{fmtPrice(t.amount)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.date}</td>
                  <td className="py-3 px-4"><Bdg variant={statusV(t.status)}>{t.status}</Bdg></td>
                  <td className="py-3 px-4">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"><Eye size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminSystem({ setPage: _setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Data &amp; Pengaturan Sistem</h1>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4">Pengaturan Aplikasi</h3>
          <div className="space-y-3.5">
            {[
              ["Nama Aplikasi", "DISKO — Diskon UMKM Lokal"],
              ["Versi Sistem", "1.0.0"],
              ["Maks. Diskon (%)", "70"],
              ["Biaya Layanan (%)", "2.5"],
              ["Email Notifikasi", "admin@disko.id"],
              ["Batas Upload Foto (MB)", "5"],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <label className="text-sm text-muted-foreground shrink-0">{label}</label>
                <input defaultValue={val} className="bg-muted rounded-xl px-3 py-1.5 text-sm outline-none text-right border border-transparent focus:border-primary/40 max-w-48" />
              </div>
            ))}
          </div>
          <Btn className="mt-5 w-full">Simpan Pengaturan</Btn>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Kategori Produk</h3>
            <Btn size="sm"><Plus size={12} /> Tambah</Btn>
          </div>
          <div className="space-y-2">
            {["Makanan", "Minuman", "Snack", "Dessert", "Fashion", "Kecantikan", "Kesehatan"].map(cat => (
              <div key={cat} className="flex items-center justify-between p-2.5 bg-muted rounded-xl hover:bg-green-50 transition-colors">
                <span className="text-sm font-semibold">{cat}</span>
                <div className="flex gap-1">
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-primary transition-colors"><Edit size={12} /></button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm lg:col-span-2">
          <h3 className="font-bold mb-4">Status Sistem</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "API Server", uptime: "99.9%", ok: true },
              { label: "Database", uptime: "100%", ok: true },
              { label: "Payment Gateway", uptime: "99.7%", ok: true },
              { label: "Push Notification", uptime: "99.5%", ok: true },
            ].map(s => (
              <div key={s.label} className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" style={{ animation: "pulse 2s infinite" }} />
                  <span className="text-xs font-bold text-green-700">Online</span>
                </div>
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Uptime: {s.uptime}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════════

const protectedPages = new Set<Page>([
  "cart", "checkout", "upload-payment", "order-status", "profile", "notifications",
  "umkm-dashboard", "umkm-products", "umkm-add-product", "umkm-promos",
  "umkm-payment-verify", "umkm-orders", "umkm-reports", "umkm-statistics",
  "admin-dashboard", "admin-users", "admin-transactions", "admin-system",
]);

function requiredRoleForPage(page: Page): Role | null {
  if (page.startsWith("umkm-")) return "umkm";
  if (page.startsWith("admin-")) return "admin";
  return null;
}

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [role, setRole] = useState<Role>("user");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(loadStoredCart);

  useEffect(() => {
    storeCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!token) return;

    setAuthToken(token);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setCurrentUser(parsedUser);
        setRole(parsedUser.role);
      } catch (_error) {
        clearStoredAuth();
        setAuthToken(null);
      }
    }

    getCurrentUser(token)
      .then(({ user }) => {
        storeAuth(token, user);
        setCurrentUser(user);
        setRole(user.role);
      })
      .catch(() => {
        clearStoredAuth();
        setAuthToken(null);
        setCurrentUser(null);
        setRole("user");
        setPage("login");
      });
  }, []);

  const handleAuthSuccess = (token: string, user: AuthUser) => {
    storeAuth(token, user);
    setAuthToken(token);
    setCurrentUser(user);
    setRole(user.role);
  };

  const logout = () => {
    clearStoredAuth();
    setAuthToken(null);
    setCurrentUser(null);
    setRole("user");
    setPage("login");
  };

  const addToCart = (product: Product, qty: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item);
      }

      return [...prev, { ...product, qty }];
    });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeCartItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const navigate = (nextPage: Page) => {
    const requiredRole = requiredRoleForPage(nextPage);

    if (protectedPages.has(nextPage) && !authToken) {
      setPage("login");
      return;
    }

    if (requiredRole && currentUser?.role !== requiredRole && currentUser?.role !== "admin") {
      setPage("landing");
      return;
    }

    setPage(nextPage);
  };

  const isDash = Boolean(authToken && (page.startsWith("umkm-") || page.startsWith("admin-")));
  const showNav = !isDash && page !== "login" && page !== "register";

  const renderPage = () => {
    const p = { setPage: navigate };
    switch (page) {
      case "landing": return <LandingPage {...p} />;
      case "login": return <LoginPage setPage={setPage} onAuthSuccess={handleAuthSuccess} />;
      case "register": return <RegisterPage setPage={setPage} onAuthSuccess={handleAuthSuccess} />;
      case "catalog": return <CatalogPage {...p} />;
      case "promo-list": return <PromoListPage {...p} />;
      case "product-detail": return <ProductDetailPage {...p} onAddToCart={addToCart} />;
      case "cart": return <CartPage {...p} items={cartItems} onUpdateQty={updateCartQty} onRemoveItem={removeCartItem} />;
      case "checkout": return <CheckoutPage {...p} items={cartItems} authToken={authToken} onOrderCreated={clearCart} />;
      case "upload-payment": return <UploadPaymentPage {...p} />;
      case "order-status": return <OrderStatusPage {...p} />;
      case "profile": return <ProfilePage {...p} onLogout={logout} />;
      case "notifications": return <NotificationsPage {...p} />;
      case "umkm-dashboard": return <UMKMDashboard {...p} />;
      case "umkm-products": return <UMKMProducts {...p} />;
      case "umkm-add-product": return <UMKMAddProduct {...p} />;
      case "umkm-promos": return <UMKMPromos {...p} />;
      case "umkm-payment-verify": return <UMKMPaymentVerify {...p} />;
      case "umkm-orders": return <UMKMOrders {...p} />;
      case "umkm-reports": return <UMKMReports {...p} />;
      case "umkm-statistics": return <UMKMStatistics {...p} />;
      case "admin-dashboard": return <AdminDashboard {...p} />;
      case "admin-users": return <AdminUsers {...p} />;
      case "admin-transactions": return <AdminTransactions {...p} />;
      case "admin-system": return <AdminSystem {...p} />;
      default: return <LandingPage {...p} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {showNav && <Navbar setPage={navigate} cartCount={cartItems.reduce((sum, item) => sum + item.qty, 0)} role={role} setRole={setRole} />}

      {isDash ? (
        <div className="flex min-h-screen">
          <Sidebar role={role} page={page} setPage={navigate} />
          <main className="flex-1 min-w-0 bg-muted/20 flex flex-col">
            {/* Dashboard topbar */}
            <div className="sticky top-0 z-40 bg-white border-b border-border h-16 flex items-center justify-between px-5 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("landing")} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm"><Tag size={13} className="text-white" /></div>
                  <span className="font-extrabold text-primary">DISKO</span>
                </button>
                <span className="text-border">|</span>
                <span className="text-sm text-muted-foreground font-medium capitalize hidden sm:inline">
                  {page.replace(/-/g, " ").replace(/umkm |admin /, "")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select value={role} onChange={e => { const r = e.target.value as Role; setRole(r); navigate(r === "umkm" ? "umkm-dashboard" : "admin-dashboard"); }}
                  className="bg-muted border border-border rounded-xl px-3 py-1.5 text-sm outline-none hidden sm:block">
                  <option value="umkm">UMKM Panel</option>
                  <option value="admin">Admin Panel</option>
                </select>
                <button onClick={logout}
                  className="w-9 h-9 border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors" title="Kembali ke User View">
                  <LogOut size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">{renderPage()}</div>
          </main>
        </div>
      ) : (
        renderPage()
      )}
    </div>
  );
}
