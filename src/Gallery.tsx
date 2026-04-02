import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { X, Image as ImageIcon, Quote, Download, Monitor, Smartphone, LayoutGrid, Maximize, ChevronDown, Loader2, Moon, Heart, Trophy, MessageSquare, User, Send, Clock, ShieldCheck, ArrowRight, ChevronRight } from 'lucide-react';
import { api, type ImageItem, type SiteSettings, type CategoryItem, type CommentItem } from './api';

// Visitor profile stored in localStorage
interface VisitorProfile { name: string; avatar: string; }
const PROFILE_KEY = 'chicken_gallery_visitor';

function getStoredProfile(): VisitorProfile | null {
  try { const s = localStorage.getItem(PROFILE_KEY); return s ? JSON.parse(s) : null; }
  catch { return null; }
}

export default function Gallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');
  const [deviceFilter, setDeviceFilter] = useState('الكل');
  const [mainView, setMainView] = useState<'wallpapers' | 'avatars'>('wallpapers');
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<Record<number, { w: number; h: number }>>({});
  const [likedImages, setLikedImages] = useState<number[]>(() => {
    try { const saved = localStorage.getItem('chicken_gallery_likes'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });

  // Comments Modal state
  const [commentsImage, setCommentsImage] = useState<ImageItem | null>(null);
  const [imageComments, setImageComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Visitor profile state
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfile | null>(() => getStoredProfile());
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: '', avatar: '' });
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => { localStorage.setItem('chicken_gallery_likes', JSON.stringify(likedImages)); }, [likedImages]);

  // Load comments when modal opens
  useEffect(() => {
    if (commentsImage) {
      setLoadingComments(true);
      api.getImageComments(commentsImage.id)
        .then(c => { setImageComments(c); setLoadingComments(false); })
        .catch(() => setLoadingComments(false));
    } else {
      setImageComments([]);
      setCommentDraft('');
    }
  }, [commentsImage]);

  // Scroll to bottom on new comment
  useEffect(() => {
    if (imageComments.length > 0) {
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [imageComments.length]);

  const { scrollYProgress, scrollY } = useScroll();
  const storyY = useTransform(scrollY, [0, 800], [0, 200]);
  const storyOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    Promise.all([api.getImages(), api.getCategories(), api.getSettings()])
      .then(([imgs, cats, sets]) => { setImages(imgs); setCategories(cats); setSettings(sets); setLoading(false); })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      api.getSettings()
        .then(newSets => setSettings(prev => JSON.stringify(prev) !== JSON.stringify(newSets) ? newSets : prev))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const isAvatar = (catName: string) => catName.includes('افتار') || catName.includes('أفتار');
  const viewCategories = categories.filter(c => mainView === 'avatars' ? isAvatar(c.name) : !isAvatar(c.name));
  const categoryNames = ['الكل', ...viewCategories.map(c => c.name)];

  const filteredImages = images.filter(img => {
    if (mainView === 'avatars' && !isAvatar(img.category)) return false;
    if (mainView === 'wallpapers' && isAvatar(img.category)) return false;
    const matchCategory = filter === 'الكل' || img.category === filter;
    let matchDevice = true;
    if (mainView === 'wallpapers' && deviceFilter !== 'الكل') {
      const dim = dimensions[img.id];
      if (dim) {
        const isDesktop = dim.w > dim.h;
        if (deviceFilter === 'كمبيوتر' && !isDesktop) matchDevice = false;
        if (deviceFilter === 'هاتف' && isDesktop) matchDevice = false;
      }
    }
    return matchCategory && matchDevice;
  });

  const handleLike = async (e: React.MouseEvent, imgId: number) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedImages.includes(imgId);
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    if (action === 'like') {
      setLikedImages(p => [...p, imgId]);
      setImages(p => p.map(img => img.id === imgId ? { ...img, likes: (img.likes || 0) + 1 } : img));
    } else {
      setLikedImages(p => p.filter(id => id !== imgId));
      setImages(p => p.map(img => img.id === imgId ? { ...img, likes: Math.max(0, (img.likes || 0) - 1) } : img));
    }
    try {
      const res = await api.likeImage(imgId, action);
      setImages(p => p.map(img => img.id === imgId ? { ...img, likes: res.likes } : img));
    } catch {
      if (action === 'like') {
        setLikedImages(p => p.filter(id => id !== imgId));
        setImages(p => p.map(img => img.id === imgId ? { ...img, likes: Math.max(0, (img.likes || 0) - 1) } : img));
      } else {
        setLikedImages(p => [...p, imgId]);
        setImages(p => p.map(img => img.id === imgId ? { ...img, likes: (img.likes || 0) + 1 } : img));
      }
    }
  };

  const topLikedImages = [...images]
    .filter(img => {
      if ((img.likes || 0) <= 0) return false;
      const isAvatarCat = img.category.includes('افتار') || img.category.includes('أفتار');
      return mainView === 'avatars' ? isAvatarCat : !isAvatarCat;
    })
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 5);

  const handleDownload = async (e: React.MouseEvent, img: ImageItem) => {
    e.stopPropagation();
    setIsDownloading(img.id);
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `wallpaper-${img.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch { window.open(img.url, '_blank'); } finally { setIsDownloading(null); }
  };

  const handleOpenComments = (e: React.MouseEvent, img: ImageItem) => {
    e.stopPropagation();
    setCommentsImage(img);
  };

  const handleSaveProfile = () => {
    if (!profileDraft.name.trim()) return;
    const profile = { name: profileDraft.name.trim(), avatar: profileDraft.avatar.trim() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setVisitorProfile(profile);
    setShowProfileSetup(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentsImage || !commentDraft.trim()) return;
    if (!visitorProfile) { setShowProfileSetup(true); return; }
    setSubmittingComment(true);
    try {
      const newComment = await api.addComment(commentsImage.id, {
        author_name: visitorProfile.name,
        author_avatar: visitorProfile.avatar || undefined,
        content: commentDraft.trim(),
      });
      setImageComments(p => [...p, newComment]);
      setCommentDraft('');
    } catch {
      alert('فشل إضافة التعليق. حاول مرة أخرى.');
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (commentsImage) setCommentsImage(null);
        else setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [commentsImage]);

  useEffect(() => {
    document.body.style.overflow = (selectedImage || commentsImage) ? 'hidden' : 'unset';
  }, [selectedImage, commentsImage]);

  if (loading || !settings) {
    return (
      <div dir="rtl" className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-zinc-400 text-lg font-medium">جاري تحميل المعرض...</p>
        </motion.div>
      </div>
    );
  }

  if (settings.maintenance_mode === 'true') {
    return (
      <div dir="rtl" className="min-h-[100dvh] bg-[#050505] text-zinc-50 font-sans flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-emerald-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-teal-900/20 rounded-full blur-[100px]" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-md text-center flex flex-col items-center gap-6">
          {settings.maintenance_image ? (
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
               <img src={settings.maintenance_image} alt="صيانة" className="w-32 h-32 md:w-48 md:h-48 object-contain rounded-3xl drop-shadow-2xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </motion.div>
          ) : (
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
              <Moon className="w-20 h-20 text-emerald-400 opacity-80" />
            </motion.div>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{settings.maintenance_title || 'الدجاجات نايمات! 🌙'}</h1>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-medium">{settings.maintenance_message || 'نحن في استراحة قصيرة للراحة وتجديد الطاقة. تو تعال بعدين يا صديقي!'}</p>
          <div className="mt-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-500 font-semibold backdrop-blur-sm">وضع وضعية النوم المُفعل</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#050505] text-zinc-50 font-sans selection:bg-white/20 relative overflow-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 to-white origin-left z-50" style={{ scaleX }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none z-10" />

      {/* Story Section */}
      <motion.section style={{ y: storyY, opacity: storyOpacity }} className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 md:px-12 overflow-hidden z-0">
        <div className="absolute inset-0 z-0">
          <img src={settings.hero_image} alt={settings.site_title} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/10 via-[#050505]/60 to-[#050505]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-8 mt-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs md:text-sm font-medium text-emerald-400 shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {settings.site_subtitle}
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-9xl font-bold tracking-tighter leading-[1.15] md:leading-[1.1]">
              قصة <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">{settings.site_title}</span>
            </h1>
            <p className="text-zinc-300 text-base sm:text-lg md:text-2xl leading-relaxed font-medium max-w-3xl mx-auto px-4 md:px-0">{settings.site_description}</p>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-zinc-500 z-10">
          <span className="text-xs font-medium tracking-widest uppercase">استكشف المعرض</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}><ChevronDown size={24} className="text-zinc-400" /></motion.div>
        </motion.div>
      </motion.section>

      {/* Gallery Intro */}
      <motion.header initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative pt-20 pb-8 md:pb-12 px-4 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center z-10 justify-center">
        <div className="flex flex-col items-center gap-4 md:gap-6 w-full mb-6 md:mb-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-teal-600">{settings.gallery_title}</span>
          </h2>
          <p className="text-zinc-400 text-base md:text-xl max-w-2xl leading-relaxed font-medium px-4 md:px-0">{settings.gallery_description}</p>
        </div>
        <div className="flex justify-center w-full mb-6 relative z-30">
          <div className="relative flex items-center p-1.5 md:p-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl">
            <button onClick={() => { setMainView('wallpapers'); setFilter('الكل'); setDeviceFilter('الكل'); }} className={`relative px-6 md:px-10 py-2.5 md:py-3.5 rounded-full text-sm md:text-base font-extrabold transition-all duration-500 z-10 ${mainView === 'wallpapers' ? 'text-emerald-950' : 'text-zinc-400 hover:text-white'}`}>
              {mainView === 'wallpapers' && <motion.div layoutId="activeMainView" className="absolute inset-0 bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)]" transition={{ type: "spring", bounce: 0.25, duration: 0.6 }} />}
              <span className="relative z-20 flex items-center gap-2">🏞️ الخلفيات</span>
            </button>
            <button onClick={() => { setMainView('avatars'); setFilter('الكل'); }} className={`relative px-6 md:px-10 py-2.5 md:py-3.5 rounded-full text-sm md:text-base font-extrabold transition-all duration-500 z-10 ${mainView === 'avatars' ? 'text-emerald-950' : 'text-zinc-400 hover:text-white'}`}>
              {mainView === 'avatars' && <motion.div layoutId="activeMainView" className="absolute inset-0 bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)]" transition={{ type: "spring", bounce: 0.25, duration: 0.6 }} />}
              <span className="relative z-20 flex items-center gap-2">🧑‍🎨 الافتارات</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Filters */}
      <div className="sticky top-4 md:top-6 z-30 flex flex-col items-center gap-2.5 md:gap-4 mb-8 md:mb-16 w-full overflow-hidden">
        {mainView === 'wallpapers' && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative flex items-center p-1 md:p-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl max-w-[90vw]">
            {[{ id: 'الكل', icon: LayoutGrid, label: 'الكل' }, { id: 'كمبيوتر', icon: Monitor, label: 'كمبيوتر' }, { id: 'هاتف', icon: Smartphone, label: 'هاتف' }].map(dev => (
              <button key={dev.id} onClick={() => setDeviceFilter(dev.id)} className={`relative px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-500 flex items-center gap-1 sm:gap-1.5 md:gap-2 ${deviceFilter === dev.id ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}>
                {deviceFilter === dev.id && <motion.div layoutId="activeDevice" className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <dev.icon size={14} className="relative z-10 md:w-4 md:h-4" /><span className="relative z-10">{dev.label}</span>
              </button>
            ))}
          </motion.div>
        )}
        <div className="w-full overflow-x-auto hide-scrollbar px-4 sm:px-8 snap-x snap-mandatory flex justify-start md:justify-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative flex items-center p-1 md:p-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl inline-flex mx-auto min-w-min">
            {categoryNames.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className="relative snap-center px-4 md:px-6 py-2 md:py-2.5 text-[11px] sm:text-xs md:text-sm font-semibold rounded-full transition-colors z-10 whitespace-nowrap">
                {filter === cat && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <span className={`relative z-20 transition-colors duration-300 ${filter === cat ? 'text-black' : 'text-zinc-400 hover:text-zinc-200'}`}>{cat}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Top 5 Most Liked */}
      <AnimatePresence mode="popLayout">
        {topLikedImages.length > 0 && filter === 'الكل' && deviceFilter === 'الكل' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full max-w-7xl mx-auto px-4 md:px-12 mb-8 md:mb-12 overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-2">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                <h3 className="text-lg md:text-xl font-bold text-white">الأكثر إعجاباً</h3>
              </div>
              <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-3 md:gap-5 pb-4 snap-x">
                {topLikedImages.map((img, index) => (
                  <motion.div key={'top-'+img.id} onClick={() => setSelectedImage(img)} className={`relative shrink-0 snap-start cursor-pointer overflow-hidden border border-white/10 shadow-xl group bg-zinc-900/50 ${mainView === 'wallpapers' ? 'w-40 md:w-56 aspect-[3/4] rounded-2xl md:rounded-3xl' : 'w-32 md:w-40 aspect-square rounded-[30%] md:rounded-[40%]'}`}>
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3 md:p-4">
                      {index === 0 && <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-[9px] md:text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-10"><Trophy size={10} className="md:w-3 md:h-3" /> المركز الأول</div>}
                      <div className={`flex items-end justify-between pointer-events-none mb-1 ${mainView === 'avatars' ? 'justify-center mx-auto' : ''}`}>
                        {mainView === 'wallpapers' && <div className="flex-1 min-w-0 pr-2"><h4 className="text-[11px] md:text-sm font-bold text-white line-clamp-1 drop-shadow-md">{img.title}</h4></div>}
                        <div className="flex items-center gap-1 text-rose-400 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md shadow-lg shrink-0">
                          <Heart size={10} className="md:w-3 md:h-3 fill-rose-400" /> <span className="text-[10px] md:text-xs font-bold leading-none">{img.likes}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Grid */}
      <main className="px-4 md:px-12 max-w-7xl mx-auto pb-20 md:pb-32 relative z-10">
        <motion.div layout className={mainView === 'wallpapers' ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"}>
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img, index) => (
              <motion.div layout initial={{ opacity: 0, y: 100, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-50px" }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.8, type: "spring", bounce: 0.3, delay: index % 4 * 0.1 }} key={img.id} className={`relative group overflow-hidden cursor-zoom-in break-inside-avoid bg-zinc-900/50 border border-white/5 shadow-2xl ${mainView === 'wallpapers' ? 'rounded-2xl md:rounded-3xl mb-4 md:mb-6' : 'rounded-[30%] md:rounded-[40%] w-full aspect-square'}`} onClick={() => setSelectedImage(img)}>
                <motion.img layoutId={`img-${img.id}`} src={img.url} alt={img.title} onLoad={(e) => { const t = e.target as HTMLImageElement; setDimensions(p => ({ ...p, [img.id]: { w: t.naturalWidth, h: t.naturalHeight } })); }} className={`w-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-110 md:group-hover:-rotate-1 brightness-90 md:brightness-100 ${mainView === 'wallpapers' ? 'h-auto md:group-hover:brightness-75' : 'h-full md:group-hover:brightness-75'}`} loading="lazy" />
                <div className={`absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none ${mainView === 'avatars' ? 'md:p-3' : ''}`}>
                  <div className={`translate-y-0 md:translate-y-6 md:group-hover:translate-y-0 transition-transform duration-500 flex flex-col justify-end h-full`}>
                    <div className={`flex justify-between items-end pointer-events-auto ${mainView === 'avatars' ? 'mb-1.5 justify-center' : 'mb-2'}`}>
                      {mainView === 'wallpapers' && (
                        <div>
                          <h3 className="text-sm md:text-lg font-bold text-white mb-1 drop-shadow-md">{img.title}</h3>
                          {dimensions[img.id] && (<div className="flex items-center gap-1 text-[9px] md:text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 backdrop-blur-md w-fit"><Maximize size={10} />{dimensions[img.id].w} × {dimensions[img.id].h}</div>)}
                        </div>
                      )}
                      <div className={`flex items-center gap-2 ${mainView === 'avatars' ? 'mx-auto' : ''}`}>
                        <button onClick={(e) => handleLike(e, img.id)} className={`flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg active:scale-95 ${mainView === 'avatars' ? 'px-2.5 py-1.5 md:p-2.5 scale-90 md:scale-100 rounded-full' : 'px-3 py-2 md:p-2.5 rounded-full'} ${likedImages.includes(img.id) ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-rose-500/80 text-white'}`} title="إعجاب">
                          <Heart size={15} className={`md:w-4 md:h-4 ${likedImages.includes(img.id) ? 'fill-white' : ''}`} />
                          {img.likes! > 0 && <span className="text-[10px] md:text-[11px] font-bold leading-none">{img.likes}</span>}
                        </button>
                        <button onClick={(e) => handleDownload(e, img)} className={`p-2 md:p-2.5 bg-white/10 hover:bg-emerald-500 text-white rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95 ${mainView === 'avatars' ? 'scale-90 md:scale-100' : ''}`} title="تحميل">
                          {isDownloading === img.id ? <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Download size={15} className="md:w-4 md:h-4" />}
                        </button>
                      </div>
                    </div>
                    {mainView === 'wallpapers' && <p className="text-[11px] md:text-xs font-medium text-zinc-300 line-clamp-2 md:line-clamp-3 leading-snug drop-shadow-md pointer-events-auto">{img.story}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filteredImages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-32 text-center flex flex-col items-center justify-center text-zinc-500">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><ImageIcon className="w-10 h-10 opacity-50" /></div>
            <p className="text-2xl font-medium text-zinc-400">لا توجد أعمال في هذه الفئة حالياً</p>
          </motion.div>
        )}
      </main>

      {/* ═══ LIGHTBOX ═══ */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-2xl p-3 md:p-8" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 md:top-6 md:right-6 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full backdrop-blur-xl border border-white/10 z-50 transition-all active:scale-95" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}>
              <X size={20} className="transition-transform duration-300 hover:rotate-90" />
            </button>

            <div className="relative w-full max-w-2xl flex flex-col items-center gap-4 max-h-[95dvh] overflow-y-auto hide-scrollbar pt-10 md:pt-0" onClick={(e) => e.stopPropagation()}>
              {/* Image */}
              <motion.img layoutId={`img-${selectedImage.id}`} src={selectedImage.url} alt={selectedImage.title} className="max-w-full max-h-[45dvh] md:max-h-[55vh] rounded-2xl shadow-2xl object-contain ring-1 ring-white/10 shrink-0" />

              {/* Info Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, type: "spring", bounce: 0.3 }} className="w-full bg-white/[0.05] backdrop-blur-2xl border border-white/10 p-4 md:p-5 rounded-2xl shadow-2xl">
                <div className="flex flex-col gap-3">
                  {/* Title & meta */}
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">{selectedImage.title}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-zinc-300">{selectedImage.category}</span>
                      {dimensions[selectedImage.id] && (<>
                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-300">{dimensions[selectedImage.id].w > dimensions[selectedImage.id].h ? 'كمبيوتر' : 'هاتف'}</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-mono text-zinc-300"><Maximize size={10} />{dimensions[selectedImage.id].w} × {dimensions[selectedImage.id].h}</span>
                      </>)}
                    </div>
                  </div>

                  {/* Story */}
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex gap-2 items-start">
                    <Quote className="w-4 h-4 text-zinc-500 shrink-0 rotate-180 mt-0.5" />
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">{selectedImage.story}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2.5">
                    {/* Like */}
                    <button onClick={(e) => handleLike(e, selectedImage.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${likedImages.includes(selectedImage.id) ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-white/10 hover:bg-rose-500/80 text-white border border-white/10'}`}>
                      <Heart size={16} className={likedImages.includes(selectedImage.id) ? 'fill-white' : ''} />
                      <span>{selectedImage.likes && selectedImage.likes > 0 ? selectedImage.likes : 'إعجاب'}</span>
                    </button>

                    {/* Comments button */}
                    <button onClick={(e) => handleOpenComments(e, selectedImage)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all shadow-lg active:scale-95">
                      <MessageSquare size={16} />
                      <span>التعليقات</span>
                      {/* comment count badge will come from parent but we show it later */}
                    </button>

                    {/* Download */}
                    <button onClick={(e) => handleDownload(e, selectedImage)} disabled={isDownloading === selectedImage.id} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-70 active:scale-95">
                      {isDownloading === selectedImage.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                      <span>{mainView === 'avatars' ? 'تحميل الأفتار' : 'تحميل الخلفية'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ COMMENTS MODAL ═══ */}
      <AnimatePresence>
        {commentsImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-xl" onClick={() => setCommentsImage(null)}>

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full md:max-w-xl bg-[#0a0a0a] border border-white/10 rounded-t-[28px] md:rounded-[28px] flex flex-col overflow-hidden shadow-2xl"
              style={{ maxHeight: '92dvh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with thumbnail */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] shrink-0 bg-[#0a0a0a]">
                <button onClick={() => setCommentsImage(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0 active:scale-95">
                  <ChevronRight size={18} className="text-zinc-300" />
                </button>
                <img src={commentsImage.url} alt={commentsImage.title} className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">{commentsImage.title}</h3>
                  <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    {loadingComments ? 'جاري التحميل...' : `${imageComments.length} تعليق`}
                  </p>
                </div>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                ) : imageComments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare className="w-14 h-14 text-zinc-800 mb-4" />
                    <p className="text-base font-bold text-zinc-400">لا تعليقات بعد</p>
                    <p className="text-sm text-zinc-600 mt-1">كن أول من يشارك رأيه!</p>
                  </div>
                ) : (
                  imageComments.map(comment => (
                    <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 p-3 rounded-2xl border transition-all ${comment.is_admin ? 'bg-emerald-950/25 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.08)]' : 'bg-white/[0.03] border-white/[0.05]'}`}>
                      <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border flex items-center justify-center bg-zinc-900 ${comment.is_admin ? 'border-emerald-500/40' : 'border-white/10'}`}>
                        {comment.author_avatar ? <img src={comment.author_avatar} alt={comment.author_name} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-zinc-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`font-extrabold text-[13px] ${comment.is_admin ? 'text-emerald-400' : 'text-zinc-100'}`}>{comment.author_name}</span>
                          {comment.is_admin === 1 && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <ShieldCheck size={9} /> مدير الموقع
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-600 flex items-center gap-0.5 mr-auto"><Clock size={9} />{new Date(comment.created_at).toLocaleDateString('ar-OM')}</span>
                        </div>
                        <p className={`text-[13px] leading-relaxed break-words ${comment.is_admin ? 'text-zinc-200' : 'text-zinc-400'}`}>{comment.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* ═══ Profile Setup (shown if no profile) ═══ */}
              <AnimatePresence>
                {showProfileSetup && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute inset-0 bg-[#0a0a0a] flex flex-col justify-center px-5 py-8 z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => setShowProfileSetup(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95">
                        <ArrowRight size={18} className="text-zinc-300" />
                      </button>
                      <div>
                        <h3 className="text-lg font-extrabold text-white">أخبرنا من أنت 👋</h3>
                        <p className="text-[12px] text-zinc-500 mt-0.5">يُحفظ مرة واحدة فقط في متصفحك</p>
                      </div>
                    </div>

                    {/* Avatar preview */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex items-center justify-center mb-3">
                        {profileDraft.avatar ? <img src={profileDraft.avatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} /> : <User className="w-8 h-8 text-zinc-500" />}
                      </div>
                      <p className="text-[11px] text-zinc-500">صورتك الشخصية (معاينة)</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 mb-1.5 block">الاسم الكريم *</label>
                        <input
                          type="text"
                          placeholder="أدخل اسمك..."
                          value={profileDraft.name}
                          onChange={(e) => setProfileDraft(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all placeholder:text-zinc-600 font-bold"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 mb-1.5 block">رابط صورتك الشخصية (اختياري)</label>
                        <input
                          type="url"
                          dir="ltr"
                          placeholder="https://..."
                          value={profileDraft.avatar}
                          onChange={(e) => setProfileDraft(p => ({ ...p, avatar: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all placeholder:text-zinc-600 placeholder:text-right"
                        />
                        <p className="text-[10px] text-zinc-600 mt-1.5 leading-snug">ارفع صورتك على <a href="https://imgbb.com" target="_blank" className="text-emerald-500 underline">ImgBB</a> وألصق الرابط هنا</p>
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={!profileDraft.name.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-extrabold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:active:scale-100 mt-2"
                      >
                        <Send size={16} /> حفظ والمتابعة للتعليق
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer: comment input */}
              <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-3">
                {visitorProfile ? (
                  <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {visitorProfile.avatar ? <img src={visitorProfile.avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder={`اكتب تعليقاً يا ${visitorProfile.name}...`}
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 pl-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all placeholder:text-zinc-600"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !commentDraft.trim()}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md shadow-emerald-500/20"
                      >
                        {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="-rotate-90" />}
                      </button>
                    </div>
                    <button type="button" onClick={() => { setProfileDraft({ name: visitorProfile.name, avatar: visitorProfile.avatar }); setShowProfileSetup(true); }} className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] transition-colors shrink-0" title="تعديل ملفك الشخصي">
                      <User size={16} className="text-zinc-400" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => { setProfileDraft({ name: '', avatar: '' }); setShowProfileSetup(true); }}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm hover:from-emerald-500/20 hover:to-teal-500/20 transition-all active:scale-[0.98]"
                  >
                    <User size={18} />
                    سجّل اسمك وأضف تعليقاً
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
