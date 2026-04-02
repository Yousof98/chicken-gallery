import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { X, Image as ImageIcon, Quote, Download, Monitor, Smartphone, LayoutGrid, Maximize, ChevronDown, Loader2 } from 'lucide-react';
import { api, type ImageItem, type SiteSettings, type CategoryItem } from './api';

export default function Gallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');
  const [deviceFilter, setDeviceFilter] = useState('الكل');
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<Record<number, { w: number; h: number }>>({});

  const { scrollYProgress, scrollY } = useScroll();
  const storyY = useTransform(scrollY, [0, 800], [0, 200]);
  const storyOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    Promise.all([api.getImages(), api.getCategories(), api.getSettings()])
      .then(([imgs, cats, sets]) => { setImages(imgs); setCategories(cats); setSettings(sets); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categoryNames = ['الكل', ...categories.map(c => c.name)];

  const filteredImages = images.filter(img => {
    const matchCategory = filter === 'الكل' || img.category === filter;
    let matchDevice = true;
    if (deviceFilter !== 'الكل') {
      const dim = dimensions[img.id];
      if (dim) {
        const isDesktop = dim.w > dim.h;
        if (deviceFilter === 'كمبيوتر' && !isDesktop) matchDevice = false;
        if (deviceFilter === 'هاتف' && isDesktop) matchDevice = false;
      }
    }
    return matchCategory && matchDevice;
  });

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

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedImage(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { document.body.style.overflow = selectedImage ? 'hidden' : 'unset'; }, [selectedImage]);

  if (loading || !settings) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-zinc-400 text-lg font-medium">جاري تحميل المعرض...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#050505] text-zinc-50 font-sans selection:bg-white/20 relative overflow-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 to-white origin-left z-50" style={{ scaleX }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none z-10" />

      {/* Story Section - uses settings from Turso */}
      <motion.section style={{ y: storyY, opacity: storyOpacity }} className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-12 overflow-hidden z-0">
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
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[1.1]">
              قصة <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">{settings.site_title}</span>
            </h1>
            <p className="text-zinc-300 text-lg md:text-2xl leading-relaxed font-medium max-w-3xl mx-auto px-4 md:px-0">{settings.site_description}</p>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-zinc-500 z-10">
          <span className="text-xs font-medium tracking-widest uppercase">استكشف المعرض</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}><ChevronDown size={24} className="text-zinc-400" /></motion.div>
        </motion.div>
      </motion.section>

      {/* Gallery Intro - uses settings */}
      <motion.header initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative pt-20 pb-12 md:pb-16 px-4 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center z-10 justify-center">
        <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-teal-600">{settings.gallery_title}</span>
          </h2>
          <p className="text-zinc-400 text-base md:text-xl max-w-2xl leading-relaxed font-medium px-4 md:px-0">{settings.gallery_description}</p>
        </div>
      </motion.header>

      {/* Filters - categories from Turso */}
      <div className="sticky top-4 md:top-6 z-30 flex flex-col items-center gap-3 md:gap-4 mb-8 md:mb-16 px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative flex items-center p-1 md:p-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
          {[{ id: 'الكل', icon: LayoutGrid, label: 'الكل' }, { id: 'كمبيوتر', icon: Monitor, label: 'كمبيوتر' }, { id: 'هاتف', icon: Smartphone, label: 'هاتف' }].map(dev => (
            <button key={dev.id} onClick={() => setDeviceFilter(dev.id)} className={`relative px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-500 flex items-center gap-1.5 md:gap-2 ${deviceFilter === dev.id ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}>
              {deviceFilter === dev.id && <motion.div layoutId="activeDevice" className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <dev.icon size={16} className="relative z-10" /><span className="relative z-10">{dev.label}</span>
            </button>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative flex items-center p-1 md:p-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl overflow-x-auto max-w-full hide-scrollbar w-full md:w-auto justify-start md:justify-center">
          {categoryNames.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className="relative px-5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-full transition-colors z-10 whitespace-nowrap">
              {filter === cat && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <span className={`relative z-20 transition-colors duration-300 ${filter === cat ? 'text-black' : 'text-zinc-400 hover:text-zinc-200'}`}>{cat}</span>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Gallery Grid */}
      <main className="px-4 md:px-12 max-w-7xl mx-auto pb-20 md:pb-32 relative z-10">
        <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img, index) => (
              <motion.div layout initial={{ opacity: 0, y: 100, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-50px" }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.8, type: "spring", bounce: 0.3, delay: index % 4 * 0.1 }} key={img.id} className="relative group overflow-hidden rounded-2xl md:rounded-3xl cursor-zoom-in break-inside-avoid bg-zinc-900/50 border border-white/5 shadow-2xl mb-4 md:mb-6" onClick={() => setSelectedImage(img)}>
                <motion.img layoutId={`img-${img.id}`} src={img.url} alt={img.title} onLoad={(e) => { const t = e.target as HTMLImageElement; setDimensions(p => ({ ...p, [img.id]: { w: t.naturalWidth, h: t.naturalHeight } })); }} className="w-full h-auto object-cover transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-110 md:group-hover:-rotate-1 md:group-hover:brightness-50 brightness-75 md:brightness-100" loading="lazy" />
                <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
                  <div className="translate-y-0 md:translate-y-10 md:group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <div className="bg-black/60 md:bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-2xl">
                      <div className="flex justify-between items-start mb-1.5 md:mb-2">
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-white">{img.title}</h3>
                          {dimensions[img.id] && (<div className="flex items-center gap-1 mt-1 text-[9px] md:text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 md:px-2 py-0.5 rounded-md w-fit border border-emerald-500/20"><Maximize size={10} />{dimensions[img.id].w} × {dimensions[img.id].h}</div>)}
                        </div>
                        <button onClick={(e) => handleDownload(e, img)} className="p-1.5 md:p-2 bg-white/10 hover:bg-emerald-500/40 text-white rounded-full backdrop-blur-md transition-colors" title="تحميل الخلفية">
                          {isDownloading === img.id ? <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} className="md:w-4 md:h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] md:text-xs font-medium text-zinc-300 line-clamp-1 md:line-clamp-2 leading-relaxed">{img.story}</p>
                    </div>
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

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-2 md:p-8" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 md:top-8 md:right-8 text-zinc-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 md:p-3.5 rounded-full backdrop-blur-xl border border-white/10 z-50 group" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}><X size={20} className="md:w-6 md:h-6 group-hover:rotate-90 active:rotate-90 transition-transform duration-300" /></button>
            <div className="relative w-full max-w-6xl max-h-full flex flex-col items-center justify-center pt-12 md:pt-0" onClick={(e) => e.stopPropagation()}>
              <motion.img layoutId={`img-${selectedImage.id}`} src={selectedImage.url} alt={selectedImage.title} className="max-w-full max-h-[55vh] md:max-h-[75vh] rounded-xl md:rounded-2xl shadow-2xl object-contain ring-1 ring-white/10" />
              <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }} className="mt-3 md:mt-8 w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 p-3 md:p-6 rounded-xl md:rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 shadow-2xl">
                <div className="text-center md:text-right flex flex-col items-center md:items-start gap-2 md:gap-3 w-full md:w-auto">
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold text-white mb-1.5 md:mb-2">{selectedImage.title}</h3>
                    <div className="flex gap-1.5 md:gap-2 justify-center md:justify-start flex-wrap">
                      <span className="inline-block px-2 md:px-3 py-0.5 md:py-1 bg-white/10 rounded-full text-[10px] md:text-xs font-medium text-zinc-300">{selectedImage.category}</span>
                      {dimensions[selectedImage.id] && (<>
                        <span className="inline-block px-2 md:px-3 py-0.5 md:py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] md:text-xs font-medium text-emerald-300">{dimensions[selectedImage.id].w > dimensions[selectedImage.id].h ? 'كمبيوتر' : 'هاتف'}</span>
                        <span className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-white/10 border border-white/10 rounded-full text-[10px] md:text-xs font-medium text-zinc-300 font-mono"><Maximize size={10} className="md:w-3 md:h-3" />{dimensions[selectedImage.id].w} × {dimensions[selectedImage.id].h}</span>
                      </>)}
                    </div>
                  </div>
                  <button onClick={(e) => handleDownload(e, selectedImage)} disabled={isDownloading === selectedImage.id} className="flex items-center justify-center w-full md:w-auto gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg md:rounded-xl transition-colors font-bold text-xs md:text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-70 mt-1 md:mt-0">
                    {isDownloading === selectedImage.id ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} className="md:w-[18px] md:h-[18px]" />}
                    <span>تحميل الخلفية</span>
                  </button>
                </div>
                <div className="flex-1 text-xs md:text-sm font-medium text-zinc-300 bg-black/20 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 flex gap-2 md:gap-3 items-start w-full">
                  <Quote className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 shrink-0 rotate-180 mt-0.5" />
                  <p className="leading-relaxed text-[11px] md:text-base">{selectedImage.story}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
