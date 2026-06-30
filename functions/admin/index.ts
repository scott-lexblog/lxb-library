interface Env {
  SUBMISSIONS: KVNamespace;
}

interface SubmissionMeta {
  email?: string;
  type?: string;
  submitted_at?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Single submission detail
  if (id) {
    const value = await env.SUBMISSIONS.get(id);
    if (!value) {
      return html('<h2>Submission not found</h2><p><a href="/admin">Back to list</a></p>');
    }
    const submission = JSON.parse(value);
    return html(renderDetail(submission));
  }

  // List all submissions
  const list = await env.SUBMISSIONS.list<SubmissionMeta>({ prefix: 'submission:' });

  // Sort newest first
  const entries = list.keys.sort((a, b) => {
    const aDate = a.metadata?.submitted_at || a.name;
    const bDate = b.metadata?.submitted_at || b.name;
    return bDate.localeCompare(aDate);
  });

  return html(renderList(entries));
};

function html(body: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Submissions – LexBlog Library Admin</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font-family: -apple-system, system-ui, sans-serif; font-size: 14px; color: #111; background: #f9f9f9; }
  .wrap { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 24px; }
  h2 { font-size: 18px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #eee; }
  th { background: #f5f5f5; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #666; }
  tr:hover td { background: #fafafa; }
  a { color: #0a5fcf; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
  .badge-single { background: #e8f6ed; color: #1f8a3b; }
  .badge-feed { background: #e8f0fc; color: #2563eb; }
  .empty { padding: 40px; text-align: center; color: #888; }
  .detail { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 24px; }
  .field { margin-bottom: 16px; }
  .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #888; margin-bottom: 4px; }
  .field-value { font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .back { display: inline-block; margin-bottom: 16px; font-size: 13px; }
</style>
</head>
<body>
<div class="wrap">${body}</div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function renderList(entries: KVNamespacedListKey<SubmissionMeta>[]): string {
  if (entries.length === 0) {
    return '<h1>Submissions</h1><div class="empty">No submissions yet.</div>';
  }

  const rows = entries.map(entry => {
    const meta = entry.metadata || {};
    const type = meta.type || 'single';
    const badgeClass = type === 'feed' ? 'badge-feed' : 'badge-single';
    const date = meta.submitted_at
      ? new Date(meta.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : '—';

    return `<tr>
      <td><a href="/admin?id=${encodeURIComponent(entry.name)}">${date}</a></td>
      <td>${escapeHtml(meta.email || '—')}</td>
      <td><span class="badge ${badgeClass}">${type}</span></td>
    </tr>`;
  }).join('');

  return `<h1>Submissions (${entries.length})</h1>
<table>
  <thead><tr><th>Date</th><th>Email</th><th>Type</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function renderDetail(s: Record<string, unknown>): string {
  const fields = [
    ['Type', s.type],
    ['Submitted', s.submitted_at ? new Date(s.submitted_at as string).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'medium' }) : '—'],
    ['Name', `${s.first_name || ''} ${s.last_name || ''}`.trim()],
    ['Email', s.email],
    ['Firm', s.firm],
    ['Post Title', s.post_title],
    ['Post Content', s.post_content],
    ['Feed URL', s.feed_url],
    ['Description', s.description],
    ['Categories', Array.isArray(s.categories) ? (s.categories as string[]).join(', ') : ''],
    ['TOS Accepted', s.tos_accepted ? 'Yes' : 'No'],
  ];

  const html = fields
    .filter(([, val]) => val)
    .map(([label, val]) =>
      `<div class="field"><div class="field-label">${label}</div><div class="field-value">${escapeHtml(String(val))}</div></div>`
    ).join('');

  return `<a class="back" href="/admin">&larr; All submissions</a>
<h2>Submission Detail</h2>
<div class="detail">${html}</div>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface KVNamespacedListKey<T> {
  name: string;
  metadata?: T;
}
