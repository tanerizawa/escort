const BASE_URL = 'https://areton.id';

export default async function sitemap() {
  // Static public pages
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/escorts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/safety`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/testimonials`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic escort profile pages
  let escortPages: typeof staticPages = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.areton.id/api'}/escorts?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const escorts = json?.data?.data || [];
      escortPages = escorts.map((escort: { id: string; updatedAt: string }) => ({
        url: `${BASE_URL}/escorts/${escort.id}`,
        lastModified: new Date(escort.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Silently skip if API is unavailable during build
  }

  // Dynamic blog article pages
  let articlePages: typeof staticPages = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.areton.id/api'}/articles?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const articles = json?.data?.data || json?.data || [];
      articlePages = articles.map((article: { slug: string; updatedAt: string }) => ({
        url: `${BASE_URL}/blog/${article.slug}`,
        lastModified: new Date(article.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Silently skip if API is unavailable during build
  }

  return [...staticPages, ...escortPages, ...articlePages];
}
