interface Env {
  SUBMISSIONS: KVNamespace;
  TURNSTILE_SECRET_KEY: string;
}

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Parse form body
  let body: Record<string, unknown>;
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate Turnstile token
  const token = body['cf-turnstile-response'] as string;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing captcha token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Skip Turnstile verification in local dev (no secret key available)
  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });

    const turnstile: TurnstileResponse = await turnstileResult.json();
    if (!turnstile.success) {
      return new Response(JSON.stringify({ error: 'Captcha verification failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Build submission record
  const now = new Date();
  const id = `${now.toISOString()}_${crypto.randomUUID().slice(0, 8)}`;

  const submission = {
    id,
    submitted_at: now.toISOString(),
    type: body.type || 'single',
    first_name: body.first_name || '',
    last_name: body.last_name || '',
    email: body.email || '',
    firm: body.firm || '',
    post_title: body.post_title || '',
    post_content: body.post_content || '',
    feed_url: body.feed_url || '',
    description: body.description || '',
    categories: body.categories || [],
    tos_accepted: body.tos_accepted || false,
  };

  // Store in KV
  await env.SUBMISSIONS.put(`submission:${id}`, JSON.stringify(submission), {
    metadata: {
      email: submission.email,
      type: submission.type as string,
      submitted_at: submission.submitted_at,
    },
  });

  return new Response(JSON.stringify({ success: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
