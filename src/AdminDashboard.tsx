import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Image as ImageIcon, Camera, LogOut, Plus, Pencil, Trash2, Search, Eye,
  BarChart3, FolderOpen, Save, ShieldCheck, AlertTriangle, CheckCircle2, Loader2,
  Settings, Tag, Lock, Menu, ChevronLeft, ImagePlus, Layers, RefreshCw
} from 'lucide-react';
import { api, type ImageItem, type CategoryItem, type SiteSettings } from './api';

type AdminTab = 'images' | 'avatars' | 'categories' | 'settings';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('images');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Image state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStory, setFormStory] = useState('');

  // Category state
  const [newCatName, setNewCatName] = useState('');
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<number | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [imgs, cats, sets] = await Promise.all([api.getImages(), api.getCategories(), api.getAllSettings()]);
      setImages(imgs); setCategories(cats); setSettings(sets); setSettingsForm(sets as any);
      if (cats.length > 0 && !formCategory) setFormCategory(cats[0].name);
    } catch { notify('error', 'فشل في تحميل البيانات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Image handlers ──
  const resetForm = () => { 
    setFormUrl(''); 
    setFormTitle(''); 
    
    // Default to the first category that matches the current tab type
    const validCategories = categories.filter(c => activeTab === 'avatars' ? isAvatar(c.name) : !isAvatar(c.name));
    setFormCategory(validCategories.length > 0 ? validCategories[0].name : '');
    
    setFormStory(''); 
    setEditingImage(null); 
  };
  const openAddModal = () => { resetForm(); setShowModal(true); };
  const openEditModal = (img: ImageItem) => { setEditingImage(img); setFormUrl(img.url); setFormTitle(img.title); setFormCategory(img.category); setFormStory(img.story); setShowModal(true); };

  const handleSave = async () => {
    if (!formUrl || !formTitle || !formCategory || !formStory) { notify('error', 'جميع الحقول مطلوبة'); return; }
    setSaving(true);
    try {
      if (editingImage) { await api.updateImage(editingImage.id, { url: formUrl, title: formTitle, category: formCategory, story: formStory }); notify('success', 'تم تعديل الصورة بنجاح ✨'); }
      else { await api.addImage({ url: formUrl, title: formTitle, category: formCategory, story: formStory }); notify('success', 'تم إضافة الصورة بنجاح ✨'); }
      setShowModal(false); resetForm(); fetchAll();
    } catch { notify('error', 'حدث خطأ أثناء الحفظ'); } finally { setSaving(false); }
  };

  const handleDeleteImage = async (id: number) => {
    try { await api.deleteImage(id); notify('success', 'تم حذف الصورة'); setDeleteConfirm(null); fetchAll(); }
    catch { notify('error', 'فشل في حذف الصورة'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('https://api.imgbb.com/1/upload?key=33cf12baa8c64bb847c81e49178e080b', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as any;
      if (data.success) {
        setFormUrl(data.data.url);
        notify('success', 'تم رفع الصورة بنجاح');
      } else {
        notify('error', 'فشل في رفع الصورة');
      }
    } catch {
      notify('error', 'خطأ في الاتصال بخادم الرفع');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Category handlers ──
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try { await api.addCategory(newCatName.trim()); notify('success', 'تم إضافة القسم ✨'); setNewCatName(''); fetchAll(); }
    catch (err: any) { notify('error', err.message || 'فشل في إضافة القسم'); }
  };

  const handleDeleteCategory = async (id: number) => {
    try { await api.deleteCategory(id); notify('success', 'تم حذف القسم'); setDeleteCatConfirm(null); fetchAll(); }
    catch { notify('error', 'فشل في حذف القسم'); }
  };

  // ── Settings handlers ──
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try { await api.updateSettings(settingsForm); notify('success', 'تم حفظ الإعدادات بنجاح ✨'); fetchAll(); }
    catch { notify('error', 'فشل في حفظ الإعدادات'); } finally { setSavingSettings(false); }
  };

  const isAvatar = (name: string) => name.includes('افتار') || name.includes('أفتار');
  const wallpaperImages = images.filter(img => !isAvatar(img.category));
  const avatarImages = images.filter(img => isAvatar(img.category));
  const activeImages = activeTab === 'avatars' ? avatarImages : activeTab === 'images' ? wallpaperImages : images;

  const filteredImages = activeImages.filter(img => {
    const matchSearch = !searchQuery || img.title.includes(searchQuery) || img.story.includes(searchQuery) || img.category.includes(searchQuery);
    const matchCategory = filterCategory === 'الكل' || img.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleLogout = () => { sessionStorage.removeItem('admin_auth'); onLogout(); };

  const tabs: { id: AdminTab; label: string; icon: any; desc: string }[] = [
    { id: 'images', label: 'الخلفيات', icon: ImageIcon, desc: 'إدارة صور وخلفيات المعرض' },
    { id: 'avatars', label: 'الافتارات', icon: ImagePlus, desc: 'إدارة الافتارات الدائرية' },
    { id: 'categories', label: 'الأقسام', icon: Layers, desc: 'إدارة التصنيفات' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, desc: 'إعدادات الموقع' },
  ];


  const switchTab = (tab: AdminTab) => { setActiveTab(tab); setMobileMenuOpen(false); };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-[100dvh] bg-[#060606] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-zinc-400 text-base font-medium">جاري تحميل لوحة التحكم...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#060606] text-zinc-50 font-sans">
      {/* ═══ NOTIFICATION ═══ */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-auto md:top-6 md:left-1/2 md:-translate-x-1/2 z-[100]"
          >
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-2xl shadow-2xl text-[13px] font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 shadow-emerald-500/10'
                : 'bg-red-500/10 border-red-500/20 text-red-300 shadow-red-500/10'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 bg-[#060606]/90 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] md:text-lg font-extrabold text-white tracking-tight">لوحة التحكم</h1>
              <p className="text-[10px] md:text-xs text-zinc-500 font-medium">إدارة شاملة من Turso</p>
            </div>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button onClick={() => { setLoading(true); fetchAll(); }} className="text-[12px] text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 rounded-xl border border-white/[0.06] font-medium group">
              <RefreshCw className="w-3.5 h-3.5 group-active:rotate-180 transition-transform duration-500" /> تحديث البيانات
            </button>
            <a href="/" className="text-[12px] text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 rounded-xl border border-white/[0.06] font-medium">
              <Eye className="w-3.5 h-3.5" /> عرض المعرض
            </a>
            <button onClick={handleLogout} className="text-[12px] text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5 bg-red-500/[0.06] hover:bg-red-500/[0.12] px-3.5 py-2 rounded-xl border border-red-500/10 font-medium">
              <LogOut className="w-3.5 h-3.5" /> خروج
            </button>
          </div>
          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 active:scale-95 transition-transform">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden border-t border-white/[0.04]">
              <div className="p-3 space-y-1.5">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-400 hover:bg-white/[0.04]'}`}>
                    <tab.icon className="w-4 h-4" />
                    <div className="text-right"><div className="text-[13px]">{tab.label}</div><div className="text-[10px] text-zinc-500">{tab.desc}</div></div>
                  </button>
                ))}
                <div className="pt-2 border-t border-white/[0.04] flex flex-wrap gap-2">
                  <button onClick={() => { setMobileMenuOpen(false); setLoading(true); fetchAll(); }} className="w-full text-center text-[12px] text-emerald-400 bg-emerald-500/[0.06] py-2.5 rounded-xl font-medium flex justify-center items-center gap-1.5 border border-emerald-500/10"><RefreshCw className="w-3 h-3" /> تحديث البيانات</button>
                  <a href="/" className="flex-1 text-center text-[12px] text-zinc-400 bg-white/[0.04] py-2.5 rounded-xl font-medium border border-white/[0.06]">عرض المعرض</a>
                  <button onClick={handleLogout} className="flex-1 text-center text-[12px] text-red-400 bg-red-500/[0.06] py-2.5 rounded-xl font-medium border border-red-500/10">خروج</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-8">
        {/* ═══ STATS ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: 'إجمالي الصور', value: images.length, icon: ImageIcon, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
            { label: 'الأقسام', value: categories.length, icon: FolderOpen, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
            { label: 'الخلفيات', value: wallpaperImages.length, icon: ImageIcon, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
            { label: 'الافتارات', value: avatarImages.length, icon: ImagePlus, gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/20' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white/[0.025] border border-white/[0.05] rounded-2xl md:rounded-[20px] p-4 md:p-5 hover:bg-white/[0.04] transition-colors group">
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-[14px] bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg ${stat.shadow} group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <p className="text-[22px] sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5 md:mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ═══ DESKTOP TABS ═══ */}
        <div className="hidden md:flex items-center gap-1.5 mb-7 p-1.5 bg-white/[0.025] border border-white/[0.05] rounded-2xl w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-[13px] font-semibold transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* ═══ IMAGES AND AVATARS TAB ═══ */}
        {(activeTab === 'images' || activeTab === 'avatars') && (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 mb-5 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن صورة..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl md:rounded-[14px] pr-10 pl-4 py-2.5 md:py-3 text-[13px] md:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/20 transition-all font-medium" />
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-xl md:rounded-[14px] px-3 md:px-4 py-2.5 md:py-3 text-[13px] md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer font-medium min-w-[100px]">
                  <option value="الكل">كل الأقسام</option>
                  {categories.filter(c => activeTab === 'avatars' ? isAvatar(c.name) : !isAvatar(c.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <button onClick={openAddModal} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-5 py-3 rounded-xl md:rounded-[14px] transition-all shadow-lg shadow-emerald-500/20 text-[13px] md:text-sm active:scale-[0.98]">
                <ImagePlus className="w-4 h-4" /> {activeTab === 'avatars' ? 'إضافة أفتار جديد' : 'إضافة صورة جديدة'}
              </button>
            </div>

            {/* Images grid */}
            {filteredImages.length === 0 ? (
              <div className="text-center py-16 md:py-20">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06]"><ImageIcon className="w-7 h-7 md:w-8 md:h-8 text-zinc-600" /></div>
                <p className="text-zinc-400 text-base font-semibold">لا توجد صور مطابقة</p>
                <p className="text-zinc-600 text-[12px] mt-1">جرب البحث بكلمات مختلفة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredImages.map((img, i) => (
                  <motion.div key={img.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group bg-white/[0.025] border border-white/[0.05] rounded-2xl md:rounded-[20px] overflow-hidden hover:border-white/[0.1] transition-all duration-300">
                    <div className="relative h-40 md:h-48 overflow-hidden">
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                        <div>
                          <h3 className="text-[13px] md:text-sm font-bold text-white drop-shadow-lg">{img.title}</h3>
                          <span className="text-[9px] md:text-[10px] text-emerald-300 bg-emerald-500/25 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1 inline-block font-semibold backdrop-blur-sm">{img.category}</span>
                        </div>
                        <span className="text-[9px] text-zinc-400 font-mono bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/[0.06]">#{img.id}</span>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4">
                      <p className="text-[11px] md:text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3.5 font-medium">{img.story}</p>
                      <AnimatePresence>
                        {deleteConfirm === img.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
                            <div className="bg-red-500/[0.08] border border-red-500/15 rounded-xl p-3 text-center">
                              <p className="text-[11px] md:text-xs text-red-300 mb-2.5 font-medium">هل أنت متأكد من حذف هذه الصورة؟</p>
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleDeleteImage(img.id)} className="text-[11px] md:text-xs bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold active:scale-95">نعم، حذف</button>
                                <button onClick={() => setDeleteConfirm(null)} className="text-[11px] md:text-xs bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg transition-colors font-medium active:scale-95">إلغاء</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(img)} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] md:text-xs font-semibold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl py-2.5 transition-all active:scale-[0.97]">
                          <Pencil className="w-3 h-3 md:w-3.5 md:h-3.5" /> تعديل
                        </button>
                        <button onClick={() => setDeleteConfirm(img.id)} className="flex items-center justify-center text-red-400 hover:text-red-300 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/10 rounded-xl p-2.5 transition-all active:scale-[0.95]">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ CATEGORIES TAB ═══ */}
        {activeTab === 'categories' && (
          <motion.div key="categories" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
            {/* Section header */}
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-extrabold text-white mb-1">إدارة الأقسام</h2>
              <p className="text-[12px] md:text-sm text-zinc-500 font-medium">أضف أو احذف تصنيفات المعرض</p>
              
              <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2 max-w-lg">
                <Tag className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] md:text-xs text-indigo-200">
                  <strong className="block text-indigo-300 font-bold mb-0.5">💡 تلميحة الأفتارات:</strong>
                  أي قسم يحتوي اسمه على كلمة <span className="bg-indigo-500/20 px-1 rounded text-white">"افتار"</span> أو <span className="bg-indigo-500/20 px-1 rounded text-white">"أفتار"</span> (مثل: "افتارات انمي")، سيتم عرضه تلقائياً في قسم "الافتارات" المنفصل بتصميم دائري في الموقع!
                </p>
              </div>
            </div>
            {/* Add category */}
            <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-6">
              <div className="relative flex-1">
                <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl md:rounded-[14px] pr-10 pl-4 py-3 md:py-3.5 text-[13px] md:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
              </div>
              <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-5 py-3 md:py-3.5 rounded-xl md:rounded-[14px] transition-all shadow-lg shadow-emerald-500/20 text-[13px] disabled:opacity-40 active:scale-[0.97]">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">إضافة</span>
              </button>
            </div>
            {/* Category list */}
            <div className="space-y-2.5">
              {categories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center justify-between bg-white/[0.025] border border-white/[0.05] rounded-xl md:rounded-2xl p-3.5 md:p-4 hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Tag className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[13px] md:text-sm font-semibold text-white">{cat.name}</span>
                      <div className="text-[10px] text-zinc-500 font-medium mt-0.5">{images.filter(img => img.category === cat.name).length} صورة</div>
                    </div>
                  </div>
                  {deleteCatConfirm === cat.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-[11px] bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold active:scale-95">حذف</button>
                      <button onClick={() => setDeleteCatConfirm(null)} className="text-[11px] bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg transition-colors font-medium active:scale-95">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteCatConfirm(cat.id)} className="text-red-400/60 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                  )}
                </motion.div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-12"><Layers className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500 text-sm font-medium">لا توجد أقسام بعد</p></div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeTab === 'settings' && settings && (
          <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-extrabold text-white mb-1">إعدادات الموقع</h2>
              <p className="text-[12px] md:text-sm text-zinc-500 font-medium">جميع الإعدادات محفوظة في Turso</p>
            </div>
            <div className="space-y-4">
              {[
                { key: 'site_title', label: 'عنوان الموقع', icon: Settings, placeholder: 'عنوان الموقع الرئيسي' },
                { key: 'site_subtitle', label: 'العنوان الفرعي', icon: Tag, placeholder: 'العنوان الفرعي' },
                { key: 'site_description', label: 'وصف الموقع', icon: Settings, textarea: true, placeholder: 'وصف تفصيلي للموقع' },
                { key: 'maintenance_mode', label: 'وضع وضعية النوم 🌙 (إغلاق الموقع مؤقتاً)', icon: Lock, type: 'checkbox' },
                { key: 'maintenance_title', label: 'عنوان شاشة النوم', icon: Tag, placeholder: 'مثال: الدجاجات نايمات! 🌙', condition: 'maintenance_mode' },
                { key: 'maintenance_message', label: 'رسالة وضع النوم', icon: Settings, textarea: true, placeholder: 'رسالة الزوار', condition: 'maintenance_mode' },
                { key: 'maintenance_image', label: 'صورة/GIF لوضع النوم', icon: ImageIcon, dir: 'ltr', placeholder: 'رابط صورة متحركة...', condition: 'maintenance_mode' },
                { key: 'hero_image', label: 'صورة الخلفية الرئيسية', icon: ImageIcon, dir: 'ltr', placeholder: 'https://...' },
                { key: 'gallery_title', label: 'عنوان المعرض', icon: Layers, placeholder: 'عنوان قسم المعرض' },
                { key: 'gallery_description', label: 'وصف المعرض', icon: Layers, textarea: true, placeholder: 'وصف قسم المعرض' },
                { key: 'admin_password', label: 'كلمة مرور الإدارة', icon: Lock, type: 'password', placeholder: '••••••••' },
              ].filter(f => !f.condition || settingsForm[f.condition] === 'true').map((field, i) => (
                <motion.div key={field.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/[0.025] border border-white/[0.05] rounded-2xl p-4 md:p-5 hover:border-white/[0.08] transition-colors">
                  <label className="flex items-center gap-2 text-[12px] md:text-[13px] text-zinc-300 mb-2.5 font-semibold">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <field.icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    {field.label}
                  </label>
                  {field.type === 'checkbox' ? (
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" checked={settingsForm[field.key] === 'true'} onChange={(e) => setSettingsForm(p => ({ ...p, [field.key]: e.target.checked ? 'true' : 'false' }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-white/[0.06] border border-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
                      <span className="mr-3 text-xs md:text-sm text-zinc-400 font-medium">تفعيل/إلغاء</span>
                    </label>
                  ) : field.textarea ? (
                    <textarea value={settingsForm[field.key] || ''} onChange={(e) => setSettingsForm(p => ({ ...p, [field.key]: e.target.value }))} rows={3} placeholder={field.placeholder} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] md:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-medium leading-relaxed" />
                  ) : (
                    <input type={field.type || 'text'} dir={field.dir as any || 'rtl'} value={settingsForm[field.key] || ''} onChange={(e) => setSettingsForm(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] md:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" />
                  )}
                  {/* Preview images */}
                  {(field.key === 'hero_image' || field.key === 'maintenance_image') && settingsForm[field.key] && (
                    <div className="mt-2.5 rounded-xl overflow-hidden border border-white/[0.06] h-24 md:h-32 bg-black/50 flex align-center justify-center">
                      <img src={settingsForm[field.key]} alt="معاينة" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </motion.div>
              ))}
              <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-[14px] md:text-[15px] disabled:opacity-50 active:scale-[0.98]">
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} حفظ جميع الإعدادات
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══ ADD/EDIT IMAGE MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/85 backdrop-blur-xl" onClick={() => { setShowModal(false); resetForm(); }}>
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className="w-full max-w-none md:max-w-lg bg-[#0d0d0d] border border-white/[0.06] border-b-0 md:border-b rounded-t-[32px] md:rounded-[24px] p-6 md:p-8 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.6)] max-h-[88vh] overflow-y-auto pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle for mobile */}
              <div className="md:hidden w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/15 flex items-center justify-center">
                    {editingImage ? <Pencil className="w-4 h-4 text-emerald-400" /> : <ImagePlus className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                    <h2 className="text-[15px] md:text-lg font-extrabold text-white">{editingImage ? 'تعديل الصورة' : 'صورة جديدة'}</h2>
                    <p className="text-[10px] md:text-xs text-zinc-500 font-medium">ستُحفظ مباشرة في Turso</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-zinc-500 hover:text-white p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all active:scale-95 border border-white/[0.06]">
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] md:text-xs text-zinc-400 mb-1.5 block font-semibold">رابط الصورة أو ارفع صورة</label>
                  <div className="flex gap-2">
                    <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" dir="ltr" />
                    <label className="flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white px-4 rounded-xl cursor-pointer transition-colors shrink-0">
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
                {formUrl && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden rounded-xl border border-white/[0.06]">
                    <img src={formUrl} alt="معاينة" className="w-full h-32 md:h-40 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </motion.div>
                )}
                <div>
                  <label className="text-[11px] md:text-xs text-zinc-400 mb-1.5 block font-semibold">العنوان</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="أدخل عنوان الصورة" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" />
                </div>
                <div>
                  <label className="text-[11px] md:text-xs text-zinc-400 mb-1.5 block font-semibold">القسم</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer font-medium">
                    {categories.filter(c => activeTab === 'avatars' ? isAvatar(c.name) : !isAvatar(c.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                  {categories.filter(c => activeTab === 'avatars' ? isAvatar(c.name) : !isAvatar(c.name)).length === 0 && (
                    <p className="text-[10px] text-amber-400 mt-1.5 font-medium">تنبيه: لا يوجد قسم مناسب متوفر. يرجى إضافة قسم {activeTab === 'avatars' ? 'يحتوي على كلمة "افتار"' : 'للخلفيات'} أولاً.</p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] md:text-xs text-zinc-400 mb-1.5 block font-semibold">القصة / الوصف</label>
                  <textarea value={formStory} onChange={(e) => setFormStory(e.target.value)} placeholder="أدخل وصف أو قصة للصورة" rows={3} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-medium" />
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-6">
                <button onClick={handleSave} disabled={saving || uploadingImage} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-[13px] md:text-sm active:scale-[0.98]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingImage ? 'حفظ التعديلات' : 'إضافة الصورة'}
                </button>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="px-5 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white font-semibold rounded-xl transition-all text-[13px] active:scale-[0.97]">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
