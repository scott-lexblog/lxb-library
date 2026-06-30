import { el } from './utils';

declare global {
  interface Window {
    turnstile: {
      getResponse: (container?: string | HTMLElement) => string | undefined;
      reset: (container?: string | HTMLElement) => void;
    };
  }
}

function initSubmitForm() {
  const form = el<HTMLFormElement>('submit-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitBtn) return;

    // Get Turnstile token
    const token = window.turnstile?.getResponse();
    if (!token) {
      alert('Please complete the verification check.');
      return;
    }

    // Determine active tab
    const feedPanel = form.querySelector('[data-tab-panel="feed"]');
    const isFeed = feedPanel ? !feedPanel.classList.contains('hidden') : false;

    // Collect form data
    const data = new FormData(form);
    const categories: string[] = [];
    data.getAll('categories').forEach(v => categories.push(v as string));

    const payload: Record<string, unknown> = {
      'cf-turnstile-response': token,
      type: isFeed ? 'feed' : 'single',
      first_name: data.get('first_name'),
      last_name: data.get('last_name'),
      email: data.get('email'),
      firm: data.get('firm'),
      description: data.get('description'),
      categories,
      tos_accepted: !!data.get('tos'),
    };

    if (isFeed) {
      payload.feed_url = data.get('feed_url');
    } else {
      payload.post_title = data.get('post_title');
      payload.post_content = data.get('post_content');
    }

    // Submit
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        window.location.href = '/thank-you';
      } else {
        const err = await res.json().catch(() => ({ error: 'Submission failed' }));
        alert(err.error || 'Submission failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        window.turnstile?.reset();
      }
    } catch {
      alert('Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      window.turnstile?.reset();
    }
  });
}

initSubmitForm();
