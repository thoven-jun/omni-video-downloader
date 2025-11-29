export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'twitch' | 'other';

export const detectPlatform = (url: string): Platform => {
  const domain = url.toLowerCase();
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
  if (domain.includes('instagram.com')) return 'instagram';
  if (domain.includes('tiktok.com')) return 'tiktok';
  if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
  if (domain.includes('twitch.tv')) return 'twitch';
  return 'other';
};

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // [수정] http, https 프로토콜을 사용하는 모든 URL을 허용
    // yt-dlp가 1000개 이상의 사이트를 지원하므로 굳이 막을 필요가 없음
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};