import { fmt, placeName, el } from './utils';

declare const L: typeof import('leaflet');

interface MarkerItem {
  organization: string;
  firm_label: string;
  works: number;
  archive_url?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
  domain?: string;
}

interface MarkerData {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  total_works: number;
  contributors: number;
  items: MarkerItem[];
  top_org: string;
}

function initContributorMap() {
  const root = el('contributor-map');
  if (!root) return;

  const mapEl = el('map-canvas', root);
  const pt = el('panel-title', root);
  const ps = el('panel-subtitle', root);
  const pb = el('panel-body', root);

  if (!mapEl || !pt || !ps || !pb) return;

  const map = L.map(mapEl, {
    center: [32, -18],
    zoom: 2,
    minZoom: 2,
    maxBounds: [[-75, -Infinity], [85, Infinity]],
    maxBoundsViscosity: 1.0,
    worldCopyJump: true,
    scrollWheelZoom: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  function renderPanel(m: MarkerData) {
    const place = placeName(m) || 'Contribution place';
    pt.textContent = place;
    ps.textContent =
      fmt(m.total_works) + ' preserved works from ' + m.contributors +
      ' contributor' + (m.contributors === 1 ? '' : 's') + ' represented here.';

    pb.innerHTML = '';
    const seen = new Set<string>();
    m.items.forEach(item => {
      if (seen.has(item.organization)) return;
      seen.add(item.organization);
      const d = document.createElement('div');
      d.className = 'row';
      const archive = item.archive_url
        ? '<a href="' + item.archive_url + '" target="_blank" rel="noopener">LexBlog archive</a>'
        : '';
      const domain = item.domain
        ? '<a href="https://' + item.domain + '" target="_blank" rel="noopener">' + item.domain + '</a>'
        : '';
      d.innerHTML =
        '<div class="f">' + item.organization + '</div>' +
        '<div class="m">' + fmt(item.works) + ' works preserved · ' +
        [item.label, domain, archive].filter(Boolean).join(' · ') + '</div>';
      pb.appendChild(d);
    });
  }

  function addMarkers(markers: MarkerData[]) {
    const maxWorks = Math.max(...markers.map(m => m.total_works));
    const radius = (w: number) => 5 + (Math.log10(w + 10) / Math.log10(maxWorks + 10)) * 20;
    const opacity = (w: number) => Math.max(0.28, Math.min(0.82, 0.26 + (Math.log10(w + 10) / Math.log10(maxWorks + 10)) * 0.56));

    // Sort largest first so big dots land first
    markers.sort((a, b) => b.total_works - a.total_works);

    const BATCH_SIZE = 30;
    const BATCH_DELAY = 60;

    function addBatch(startIndex: number) {
      const end = Math.min(startIndex + BATCH_SIZE, markers.length);
      for (let i = startIndex; i < end; i++) {
        const m = markers[i];
        const targetRadius = radius(m.total_works);
        const targetOpacity = opacity(m.total_works);

        const marker = L.circleMarker([m.lat, m.lng], {
          radius: 0,
          color: '#111',
          weight: 1,
          fillColor: '#111',
          fillOpacity: 0,
        }).addTo(map);

        // Grow-fade animation
        const duration = 400;
        const start = performance.now();
        function animate(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
          marker.setRadius(targetRadius * ease);
          marker.setStyle({ fillOpacity: targetOpacity * ease });
          if (t < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        marker.bindTooltip(placeName(m) + ' · ' + fmt(m.total_works) + ' works', { direction: 'top' });
        marker.on('click', () => renderPanel(m));
      }
      if (end < markers.length) {
        setTimeout(() => addBatch(end), BATCH_DELAY);
      }
    }

    addBatch(0);
  }

  // Fetch markers and render
  fetch('/markers.json')
    .then(res => res.json())
    .then((markers: MarkerData[]) => addMarkers(markers));

  setTimeout(() => map.invalidateSize(), 100);
}

initContributorMap();
