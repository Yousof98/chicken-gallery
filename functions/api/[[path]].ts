import { createClient } from '@libsql/client/web';

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

export function getDB(env: Env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

export async function initDB(env: Env) {
  const db = getDB(env);
  await db.execute(`CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, story TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, sort_order INTEGER DEFAULT 0)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

  const catCount = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (Number(catCount.rows[0].count) === 0) {
    for (const [i, name] of ['بورتريه', 'كتاكيت', 'في الطبيعة', 'سلالات نادرة'].entries()) {
      await db.execute({ sql: 'INSERT INTO categories (name, sort_order) VALUES (?, ?)', args: [name, i] });
    }
  }

  const setCount = await db.execute('SELECT COUNT(*) as count FROM settings');
  if (Number(setCount.rows[0].count) === 0) {
    const defaults: Record<string, string> = {
      admin_password: 'admin123',
      site_title: 'عالم الدجاج',
      site_subtitle: 'رحلة بصرية',
      site_description: 'من أعماق الغابات الاستوائية إلى المزارع الحديثة، رحلة تطور مذهلة لطيور ارتبطت بحياة الإنسان منذ آلاف السنين.',
      hero_image: 'https://images.unsplash.com/photo-1585110396000-c9fd4e4e325c?auto=format&fit=crop&w=1920&q=80',
      gallery_title: 'معرض الخلفيات',
      gallery_description: 'اختر خلفيتك المفضلة وحملها مجاناً.',
    };
    for (const [key, value] of Object.entries(defaults)) {
      await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?)', args: [key, value] });
    }
  }

  const imgCount = await db.execute('SELECT COUNT(*) as count FROM images');
  if (Number(imgCount.rows[0].count) === 0) {
    const seeds = [
      { url: 'https://images.unsplash.com/photo-1548550023-2bf3c49b338c?auto=format&fit=crop&w=800&q=80', title: 'نظرة ثاقبة', category: 'بورتريه', story: 'ديك فخور يقف بشموخ.' },
      { url: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=800&q=80', title: 'بداية الحياة', category: 'كتاكيت', story: 'كتاكيت صغيرة تستكشف العالم.' },
      { url: 'https://images.unsplash.com/photo-1563282963-356073809224?auto=format&fit=crop&w=1000&q=80', title: 'حرية المراعي', category: 'في الطبيعة', story: 'دجاجة تتجول بحرية بين الأعشاب.' },
      { url: 'https://images.unsplash.com/photo-1604869515885-9d1078fd1488?auto=format&fit=crop&w=800&q=80', title: 'جمال نادر', category: 'سلالات نادرة', story: 'دجاجة السلكي بريشها الحريري.' },
      { url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80', title: 'ألوان متوهجة', category: 'بورتريه', story: 'انعكاس ضوء الشمس على ريش الديك.' },
      { url: 'https://images.unsplash.com/photo-1522277253043-46a782b40445?auto=format&fit=crop&w=1200&q=80', title: 'صباح المزرعة', category: 'في الطبيعة', story: 'مشهد صباحي هادئ في الحقول.' },
      { url: 'https://images.unsplash.com/photo-1590080825330-802c61141416?auto=format&fit=crop&w=800&q=80', title: 'فضول صغير', category: 'كتاكيت', story: 'كتكوت ينظر بفضول نحو الكاميرا.' },
      { url: 'https://images.unsplash.com/photo-1612144431180-2d672779556c?auto=format&fit=crop&w=1000&q=80', title: 'ملك المزرعة', category: 'سلالات نادرة', story: 'ديك ذو عرف كبير وريش كثيف.' },
      { url: 'https://images.unsplash.com/photo-1549471013-3364d7220b75?auto=format&fit=crop&w=800&q=80', title: 'تأمل هادئ', category: 'بورتريه', story: 'لحظة سكون وتأمل.' },
      { url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80', title: 'قطيع منسجم', category: 'في الطبيعة', story: 'مجموعة دجاج تتحرك بتناغم.' },
      { url: 'https://images.unsplash.com/photo-1569396116180-210c1f852824?auto=format&fit=crop&w=800&q=80', title: 'أناقة الريش', category: 'سلالات نادرة', story: 'تفاصيل مذهلة لتداخل ألوان الريش.' },
      { url: 'https://images.unsplash.com/photo-1550081699-79c1e34d318e?auto=format&fit=crop&w=800&q=80', title: 'صداقة مبكرة', category: 'كتاكيت', story: 'تجمع لطيف يعكس الدفء والترابط.' },
    ];
    for (const img of seeds) {
      await db.execute({ sql: 'INSERT INTO images (url, title, category, story) VALUES (?, ?, ?, ?)', args: [img.url, img.title, img.category, img.story] });
    }
  }
  return db;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

// ─── Unified API Handler ─────────────────────────────────────────────────────
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    const db = await initDB(env);

    // ── AUTH ──
    if (path === '/api/auth' && method === 'POST') {
      const { password } = await request.json() as any;
      const result = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'admin_password'", args: [] });
      const stored = (result.rows[0]?.value as string) || 'admin123';
      if (password === stored) return json({ success: true, token: 'authenticated' });
      return json({ success: false, message: 'كلمة المرور غير صحيحة' }, 401);
    }

    // ── SETTINGS (public) ──
    if (path === '/api/settings' && method === 'GET') {
      const result = await db.execute('SELECT key, value FROM settings');
      const settings: Record<string, string> = {};
      for (const row of result.rows) { settings[row.key as string] = row.value as string; }
      delete settings.admin_password;
      return json(settings);
    }

    // ── SETTINGS (all - admin) ──
    if (path === '/api/settings/all' && method === 'GET') {
      const result = await db.execute('SELECT key, value FROM settings');
      const settings: Record<string, string> = {};
      for (const row of result.rows) { settings[row.key as string] = row.value as string; }
      return json(settings);
    }

    // ── SETTINGS (update) ──
    if (path === '/api/settings' && method === 'PUT') {
      const body = await request.json() as Record<string, string>;
      for (const [key, value] of Object.entries(body)) {
        await db.execute({ sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', args: [key, value] });
      }
      return json({ success: true });
    }

    // ── CATEGORIES ──
    if (path === '/api/categories' && method === 'GET') {
      const result = await db.execute('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
      return json(result.rows);
    }
    if (path === '/api/categories' && method === 'POST') {
      const { name } = await request.json() as any;
      if (!name) return json({ error: 'اسم القسم مطلوب' }, 400);
      const max = await db.execute('SELECT MAX(sort_order) as m FROM categories');
      const next = (Number(max.rows[0].m) || 0) + 1;
      try {
        const r = await db.execute({ sql: 'INSERT INTO categories (name, sort_order) VALUES (?, ?)', args: [name, next] });
        const cat = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [r.lastInsertRowid!] });
        return json(cat.rows[0], 201);
      } catch (e: any) {
        if (e?.message?.includes('UNIQUE')) return json({ error: 'هذا القسم موجود بالفعل' }, 400);
        throw e;
      }
    }

    // ── CATEGORY DELETE ──
    const catMatch = path.match(/^\/api\/categories\/(\d+)$/);
    if (catMatch && method === 'DELETE') {
      await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [Number(catMatch[1])] });
      return json({ success: true });
    }

    // ── IMAGES ──
    if (path === '/api/images' && method === 'GET') {
      const result = await db.execute('SELECT * FROM images ORDER BY id DESC');
      return json(result.rows);
    }
    if (path === '/api/images' && method === 'POST') {
      const { url: imgUrl, title, category, story } = await request.json() as any;
      if (!imgUrl || !title || !category || !story) return json({ error: 'جميع الحقول مطلوبة' }, 400);
      const r = await db.execute({ sql: 'INSERT INTO images (url, title, category, story) VALUES (?, ?, ?, ?)', args: [imgUrl, title, category, story] });
      const img = await db.execute({ sql: 'SELECT * FROM images WHERE id = ?', args: [r.lastInsertRowid!] });
      return json(img.rows[0], 201);
    }

    // ── IMAGE UPDATE/DELETE ──
    const imgMatch = path.match(/^\/api\/images\/(\d+)$/);
    if (imgMatch) {
      const id = Number(imgMatch[1]);
      if (method === 'PUT') {
        const { url: imgUrl, title, category, story } = await request.json() as any;
        if (!imgUrl || !title || !category || !story) return json({ error: 'جميع الحقول مطلوبة' }, 400);
        await db.execute({ sql: 'UPDATE images SET url = ?, title = ?, category = ?, story = ? WHERE id = ?', args: [imgUrl, title, category, story, id] });
        const updated = await db.execute({ sql: 'SELECT * FROM images WHERE id = ?', args: [id] });
        return json(updated.rows[0]);
      }
      if (method === 'DELETE') {
        await db.execute({ sql: 'DELETE FROM images WHERE id = ?', args: [id] });
        return json({ success: true });
      }
    }

    return json({ error: 'Not found' }, 404);
  } catch (error: any) {
    console.error('API Error:', error);
    return json({ error: error?.message || 'Internal server error' }, 500);
  }
};
