// ─── Types ───────────────────────────────────────────────────────────────────
export interface ImageItem {
  id: number;
  url: string;
  title: string;
  category: string;
  story: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  sort_order: number;
}

export interface SiteSettings {
  site_title: string;
  site_subtitle: string;
  site_description: string;
  hero_image: string;
  gallery_title: string;
  gallery_description: string;
  maintenance_mode?: string;
  admin_password?: string;
}

// ─── API Helper ──────────────────────────────────────────────────────────────
export const api = {
  async getImages(): Promise<ImageItem[]> {
    const res = await fetch('/api/images');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  async addImage(data: Omit<ImageItem, 'id'>): Promise<ImageItem> {
    const res = await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to add');
    return res.json();
  },
  async updateImage(id: number, data: Omit<ImageItem, 'id'>): Promise<ImageItem> {
    const res = await fetch(`/api/images/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update');
    return res.json();
  },
  async deleteImage(id: number): Promise<void> {
    const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
  },
  async login(password: string): Promise<boolean> {
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await res.json() as { success: boolean };
    return data.success;
  },
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },
  async getAllSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/settings/all');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },
  async updateSettings(data: Record<string, string>): Promise<void> {
    const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update settings');
  },
  async getCategories(): Promise<CategoryItem[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },
  async addCategory(name: string): Promise<CategoryItem> {
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error); }
    return res.json();
  },
  async deleteCategory(id: number): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
  },
};
