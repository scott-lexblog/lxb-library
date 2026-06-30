/** Format a number with US locale commas */
export function fmt(n: number): string {
  return new Intl.NumberFormat('en-US').format(n || 0);
}

/** Build a place name string from city/state/country */
export function placeName(m: { city?: string; state?: string; country?: string }): string {
  return [m.city, m.state, m.country].filter(Boolean).join(', ');
}

/** Query a single element by data attribute, scoped to a parent or document */
export function el<T extends HTMLElement>(attr: string, parent: Element | Document = document): T | null {
  return parent.querySelector<T>(`[data-${attr}]`);
}

/** Query all elements by data attribute */
export function els<T extends HTMLElement>(attr: string, parent: Element | Document = document): T[] {
  return Array.from(parent.querySelectorAll<T>(`[data-${attr}]`));
}
