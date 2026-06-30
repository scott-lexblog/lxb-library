import { shell, esc } from '../lib/layout';

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
      return shell('Submission Not Found', '<div class="wrap"><h2>Submission not found</h2><p><a href="/admin">Back to list</a></p></div>');
    }
    const submission = JSON.parse(value);
    return shell('Submission Detail – Admin', `<div class="wrap">${renderDetail(submission)}</div>`);
  }

  // List all submissions
  const list = await env.SUBMISSIONS.list<SubmissionMeta>({ prefix: 'submission:' });

  // Sort newest first
  const entries = list.keys.sort((a, b) => {
    const aDate = a.metadata?.submitted_at || a.name;
    const bDate = b.metadata?.submitted_at || b.name;
    return bDate.localeCompare(aDate);
  });

  return shell('Submissions – Admin', `<div class="wrap">${renderList(entries)}</div>`);
};

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
      <td>${esc(meta.email || '—')}</td>
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
      `<div class="field"><div class="field-label">${label}</div><div class="field-value">${esc(String(val))}</div></div>`
    ).join('');

  return `<a class="back" href="/admin">&larr; All submissions</a>
<h2>Submission Detail</h2>
<div class="detail">${html}</div>`;
}

interface KVNamespacedListKey<T> {
  name: string;
  metadata?: T;
}
