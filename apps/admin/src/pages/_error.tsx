function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b1120', color: '#f5f5f5', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 200, margin: 0, color: '#c9a96e' }}>{statusCode || 'Error'}</h1>
        <p style={{ marginTop: 12, fontSize: 14, color: '#a0a8b8' }}>
          {statusCode === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan pada server'}
        </p>
        <a href="/dashboard" style={{ display: 'inline-block', marginTop: 24, padding: '10px 32px', border: '1px solid rgba(201,169,110,0.4)', color: '#c9a96e', textDecoration: 'none', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
