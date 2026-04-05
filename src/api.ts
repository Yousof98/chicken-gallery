// ─── Types ───────────────────────────────────────────────────────────────────
export interface ImageItem {
  id: number;
  url: string;
  title: string;
  category: string;
  story: string;
  likes?: number;
}

export interface CommentItem {
  id: number;
  image_id: number;
  parent_id: number | null;
  visitor_id: string | null;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
  is_admin?: number;
  is_banned?: number | boolean;
  image_title?: string; // only for admin view
}

export interface BanItem {
  id: number;
  visitor_id: string;
  author_name: string | null;
  expires_at: string | null;
  reason: string | null;
  created_at: string;
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
  maintenance_title?: string;
  maintenance_message?: string;
  maintenance_image?: string;
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
  async likeImage(id: number, action: 'like' | 'unlike' = 'like'): Promise<{ success: boolean; likes: number }> {
    const res = await fetch(`/api/images/${id}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    if (!res.ok) throw new Error('Failed to like image');
    return res.json();
  },

  // Comments
  async getComments(): Promise<CommentItem[]> {
    const res = await fetch('/api/comments');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  async getImageComments(imageId: number): Promise<CommentItem[]> {
    const res = await fetch(`/api/images/${imageId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  async addComment(imageId: number, data: { author_name: string; author_avatar?: string; content: string; is_admin?: boolean; parent_id?: number | null; visitor_id?: string | null }): Promise<CommentItem> {
    const res = await fetch(`/api/images/${imageId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },
  async updateComment(id: number, data: { author_name: string; author_avatar?: string; content: string }): Promise<CommentItem> {
    const res = await fetch(`/api/comments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  },
  async deleteComment(id: number): Promise<void> {
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete comment');
  },
  async deleteComments(ids: number[]): Promise<void> {
    const res = await fetch('/api/comments/delete-bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    if (!res.ok) throw new Error('Failed to delete comments');
  },

  // Auth
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

  // Bans
  async getBans(): Promise<BanItem[]> {
    const res = await fetch('/api/bans');
    if (!res.ok) throw new Error('Failed to fetch bans');
    return res.json();
  },
  async banUser(data: { visitor_id: string; author_name?: string; expires_at?: string | null; reason?: string }): Promise<void> {
    const res = await fetch('/api/bans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to ban user');
  },
  async unbanUser(visitorId: string): Promise<void> {
    const res = await fetch(`/api/bans/${encodeURIComponent(visitorId)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to unban user');
  },
};
