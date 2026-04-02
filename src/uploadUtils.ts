// Shared ImgBB upload utility
const IMGBB_KEY = '33cf12baa8c64bb847c81e49178e080b';

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
  const data = await res.json() as any;
  if (data.success) return data.data.url as string;
  throw new Error('فشل رفع الصورة');
}
