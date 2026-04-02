import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, initDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH (password from Turso settings table)
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth', async (req, res) => {
  const { password } = req.body;
  try {
    const result = await db.execute({
      sql: "SELECT value FROM settings WHERE key = 'admin_password'",
      args: [],
    });
    const storedPassword = result.rows[0]?.value as string || 'admin123';
    if (password === storedPassword) {
      res.json({ success: true, token: 'authenticated' });
    } else {
      res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/settings', async (_req, res) => {
  try {
    const result = await db.execute('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key as string] = row.value as string;
    }
    // Don't expose password to public
    delete settings.admin_password;
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

// Admin-only: get all settings including password
app.get('/api/settings/all', async (_req, res) => {
  try {
    const result = await db.execute('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key as string] = row.value as string;
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching all settings:', error);
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

app.put('/api/settings', async (req, res) => {
  const settings: Record<string, string> = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        args: [key, value],
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/categories', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'فشل في جلب الأقسام' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم القسم مطلوب' });
  try {
    const maxOrder = await db.execute('SELECT MAX(sort_order) as max_order FROM categories');
    const nextOrder = (Number(maxOrder.rows[0].max_order) || 0) + 1;
    const result = await db.execute({
      sql: 'INSERT INTO categories (name, sort_order) VALUES (?, ?)',
      args: [name, nextOrder],
    });
    const newCat = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [result.lastInsertRowid!] });
    res.status(201).json(newCat.rows[0]);
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'هذا القسم موجود بالفعل' });
    }
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'فشل في إضافة القسم' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [Number(id)] });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'فشل في حذف القسم' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  IMAGES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/images', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM images ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'فشل في جلب الصور' });
  }
});

app.post('/api/images', async (req, res) => {
  const { url, title, category, story } = req.body;
  if (!url || !title || !category || !story) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  try {
    const result = await db.execute({
      sql: 'INSERT INTO images (url, title, category, story) VALUES (?, ?, ?, ?)',
      args: [url, title, category, story],
    });
    const newImage = await db.execute({ sql: 'SELECT * FROM images WHERE id = ?', args: [result.lastInsertRowid!] });
    res.status(201).json(newImage.rows[0]);
  } catch (error) {
    console.error('Error adding image:', error);
    res.status(500).json({ error: 'فشل في إضافة الصورة' });
  }
});

app.put('/api/images/:id', async (req, res) => {
  const { id } = req.params;
  const { url, title, category, story } = req.body;
  if (!url || !title || !category || !story) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  try {
    await db.execute({
      sql: 'UPDATE images SET url = ?, title = ?, category = ?, story = ? WHERE id = ?',
      args: [url, title, category, story, Number(id)],
    });
    const updated = await db.execute({ sql: 'SELECT * FROM images WHERE id = ?', args: [Number(id)] });
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: 'فشل في تعديل الصورة' });
  }
});

app.delete('/api/images/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({ sql: 'DELETE FROM images WHERE id = ?', args: [Number(id)] });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'فشل في حذف الصورة' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════════════════════
async function start() {
  try {
    await initDB();
    console.log('✅ Database initialized successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

start();
