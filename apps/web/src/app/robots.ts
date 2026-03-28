export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/escorts', '/escorts/', '/about', '/how-it-works', '/faq', '/safety', '/contact'],
        disallow: ['/user/', '/escort/', '/api/', '/admin/'],
      },
    ],
    sitemap: 'https://areton.id/sitemap.xml',
  };
}
