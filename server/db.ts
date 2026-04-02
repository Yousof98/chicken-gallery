import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function initDB() {
  // Images table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      story TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Settings table (key-value store for site configuration)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Seed categories if empty
  const catCount = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (Number(catCount.rows[0].count) === 0) {
    const defaultCategories = ['بورتريه', 'كتاكيت', 'في الطبيعة', 'سلالات نادرة'];
    for (let i = 0; i < defaultCategories.length; i++) {
      await db.execute({
        sql: 'INSERT INTO categories (name, sort_order) VALUES (?, ?)',
        args: [defaultCategories[i], i],
      });
    }
    console.log('✅ Categories seeded.');
  }

  // Seed settings if empty
  const settingsCount = await db.execute('SELECT COUNT(*) as count FROM settings');
  if (Number(settingsCount.rows[0].count) === 0) {
    const defaultSettings: Record<string, string> = {
      admin_password: 'admin123',
      site_title: 'عالم الدجاج',
      site_subtitle: 'رحلة بصرية',
      site_description: 'من أعماق الغابات الاستوائية إلى المزارع الحديثة، رحلة تطور مذهلة لطيور ارتبطت بحياة الإنسان منذ آلاف السنين. اكتشف تنوع السلالات، سحر الألوان، وتفاصيل لم تلاحظها من قبل في هذه المجموعة الحصرية.',
      hero_image: 'https://images.unsplash.com/photo-1585110396000-c9fd4e4e325c?auto=format&fit=crop&w=1920&q=80',
      gallery_title: 'معرض الخلفيات',
      gallery_description: 'اختر خلفيتك المفضلة وحملها مجاناً. متوفرة بأبعاد تتناسب مع شاشات الكمبيوتر والهواتف الذكية.',
    };
    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.execute({
        sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
        args: [key, value],
      });
    }
    console.log('✅ Settings seeded.');
  }

  // Seed images if empty
  const imgCount = await db.execute('SELECT COUNT(*) as count FROM images');
  if (Number(imgCount.rows[0].count) === 0) {
    const seedImages = [
      { url: 'https://images.unsplash.com/photo-1548550023-2bf3c49b338c?auto=format&fit=crop&w=800&q=80', title: 'نظرة ثاقبة', category: 'بورتريه', story: 'ديك فخور يقف بشموخ، تعكس نظراته قوة وثقة في بيئته الطبيعية.' },
      { url: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=800&q=80', title: 'بداية الحياة', category: 'كتاكيت', story: 'كتاكيت صغيرة تستكشف العالم لأول مرة، في مشهد يبعث على الدفء والبراءة.' },
      { url: 'https://images.unsplash.com/photo-1563282963-356073809224?auto=format&fit=crop&w=1000&q=80', title: 'حرية المراعي', category: 'في الطبيعة', story: 'دجاجة تتجول بحرية بين الأعشاب الخضراء، تجسد الحياة الريفية الهادئة.' },
      { url: 'https://images.unsplash.com/photo-1604869515885-9d1078fd1488?auto=format&fit=crop&w=800&q=80', title: 'جمال نادر', category: 'سلالات نادرة', story: 'دجاجة السلكي (Silkie) بريشها الحريري الفريد، تبدو وكأنها مخلوق من قصة خيالية.' },
      { url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80', title: 'ألوان متوهجة', category: 'بورتريه', story: 'انعكاس ضوء الشمس على ريش الديك يبرز تدرجات لونية مذهلة وتفاصيل دقيقة.' },
      { url: 'https://images.unsplash.com/photo-1522277253043-46a782b40445?auto=format&fit=crop&w=1200&q=80', title: 'صباح المزرعة', category: 'في الطبيعة', story: 'مشهد صباحي هادئ حيث تبدأ الطيور يومها بالبحث عن الطعام في الحقول المفتوحة.' },
      { url: 'https://images.unsplash.com/photo-1590080825330-802c61141416?auto=format&fit=crop&w=800&q=80', title: 'فضول صغير', category: 'كتاكيت', story: 'كتكوت صغير ينظر بفضول نحو الكاميرا، يمثل البدايات الجديدة والطاقة البريئة.' },
      { url: 'https://images.unsplash.com/photo-1612144431180-2d672779556c?auto=format&fit=crop&w=1000&q=80', title: 'ملك المزرعة', category: 'سلالات نادرة', story: 'ديك ذو عرف كبير وريش كثيف، يقف كحارس للمكان بهيبة لا تخطئها العين.' },
      { url: 'https://images.unsplash.com/photo-1549471013-3364d7220b75?auto=format&fit=crop&w=800&q=80', title: 'تأمل هادئ', category: 'بورتريه', story: 'لحظة سكون وتأمل التقطت ببراعة، تظهر الجانب الهادئ من حياة هذه الطيور.' },
      { url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80', title: 'قطيع منسجم', category: 'في الطبيعة', story: 'مجموعة من الدجاج تتحرك بتناغم في بيئتها الطبيعية، صورة مثالية لخلفية الكمبيوتر.' },
      { url: 'https://images.unsplash.com/photo-1569396116180-210c1f852824?auto=format&fit=crop&w=800&q=80', title: 'أناقة الريش', category: 'سلالات نادرة', story: 'تفاصيل مذهلة لتداخل ألوان الريش، لوحة فنية طبيعية تنبض بالحياة.' },
      { url: 'https://images.unsplash.com/photo-1550081699-79c1e34d318e?auto=format&fit=crop&w=800&q=80', title: 'صداقة مبكرة', category: 'كتاكيت', story: 'تجمع لطيف يعكس الدفء والترابط بين الصغار في أيامهم الأولى.' },
    ];
    for (const img of seedImages) {
      await db.execute({
        sql: 'INSERT INTO images (url, title, category, story) VALUES (?, ?, ?, ?)',
        args: [img.url, img.title, img.category, img.story],
      });
    }
    console.log('✅ Images seeded.');
  }
}
