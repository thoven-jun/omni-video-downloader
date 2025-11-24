export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'unknown';

export const detectPlatform = (url: string): Platform => {
  const domain = url.toLowerCase();
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
  if (domain.includes('instagram.com')) return 'instagram';
  if (domain.includes('tiktok.com')) return 'tiktok';
  if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
  return 'unknown';
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return detectPlatform(url) !== 'unknown';
  } catch (e) {
    return false;
  }
};