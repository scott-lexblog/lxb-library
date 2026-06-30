export function shell(title: string, body: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/png" href="/favicon.png">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  @import url('/fonts.css') layer(fonts);
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Archivo", -apple-system, system-ui, sans-serif; font-size: 14px; color: #111; background: #fff; min-height: 100vh; display: flex; flex-direction: column; }
  main { flex: 1; }
  a { color: #0a5fcf; text-decoration: none; }
  a:hover { text-decoration: underline; }
  button { cursor: pointer; }

  .site-header { background: #0a0a0b; color: #fff; }
  .hdr-inner { max-width: 1240px; margin: 0 auto; padding: 0 32px; height: 74px; display: flex; align-items: center; gap: 32px; }
  .hdr-logo { display: flex; align-items: baseline; gap: 11px; text-decoration: none; white-space: nowrap; }
  .hdr-logo .mark { font-weight: 800; font-size: 27px; letter-spacing: -0.03em; color: #fff; line-height: 1; }
  .hdr-logo .lib { font-weight: 400; font-size: 20px; letter-spacing: -0.03em; color: rgba(255,255,255,0.58); line-height: 1; }
  .hdr-nav { display: flex; align-items: center; gap: 30px; margin-left: auto; }
  .hdr-nav a { color: rgba(255,255,255,0.82); font-size: 15px; font-weight: 500; text-decoration: none; }
  .hdr-nav a:hover { color: #fff; text-decoration: none; }
  .hdr-div { height: 1px; background: rgba(255,255,255,0.1); }
  .hdr-sub { max-width: 1240px; margin: 0 auto; padding: 0 32px; height: 48px; display: flex; align-items: stretch; gap: 34px; }
  .hdr-sub a { display: flex; align-items: center; font-size: 14.5px; font-weight: 600; letter-spacing: -0.02em; color: #fff; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .hdr-sub a:hover { text-decoration: none; }
  .hdr-sub .active { border-bottom-color: #fff; }
  .hdr-sub .muted { font-weight: 500; color: rgba(255,255,255,0.72); }

  .site-footer { font-size: 13px; color: #6b7280; }
  .ftr-inner { max-width: 1240px; margin: 0 auto; padding: 24px 32px; }

  ${adminCSS}
</style>
</head>
<body>
<header class="site-header">
  <div class="hdr-inner">
    <a href="/" class="hdr-logo">
      <span class="mark">LexBlog</span>
      <span class="lib">Library</span>
    </a>
    <nav class="hdr-nav">
      <a href="/about">About</a>
      <a href="/submit">Submit your publishing</a>
      <a href="/author-record">Author Record</a>
    </nav>
  </div>
  <div class="hdr-div"></div>
  <nav class="hdr-sub">
    <a href="/" class="active">Library</a>
    <a href="https://www.lexblog.com" class="muted">Publishing Platform</a>
  </nav>
</header>
<main>${body}</main>
<footer class="site-footer">
  <div class="ftr-inner">Copyright &copy; 2026, LexBlog, Inc. All Rights Reserved.</div>
</footer>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

const adminCSS = `
  .wrap { max-width: 960px; margin: 0 auto; padding: 24px 32px; }
  h1 { font-size: 22px; margin: 0 0 24px; }
  h2 { font-size: 18px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #eee; }
  th { background: #f5f5f5; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #666; }
  tr:hover td { background: #fafafa; }
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
  .badge-single { background: #e8f6ed; color: #1f8a3b; }
  .badge-feed { background: #e8f0fc; color: #2563eb; }
  .empty { padding: 40px; text-align: center; color: #888; }
  .detail { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 24px; }
  .field { margin-bottom: 16px; }
  .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #888; margin-bottom: 4px; }
  .field-value { font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .back { display: inline-block; margin-bottom: 16px; font-size: 13px; }
`;

export function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
