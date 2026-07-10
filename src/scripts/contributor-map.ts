import { el } from './utils';

declare const L: typeof import('leaflet');

interface MarkerData {
  lat: number;
  lng: number;
  total_works: number;
}

function initContributorMap() {
  const root = el('contributor-map');
  if (!root) return;

  const mapEl = el('map-canvas', root);
  if (!mapEl) return;

  const isMobile = window.innerWidth < 768;

  const map = L.map(mapEl, {
    center: [20, 10],
    zoom: 2,
    zoomControl: false,
    dragging: isMobile,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    zoomAnimation: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  const version = root.dataset.version || '';
  fetch(`/markers.json?v=${version}`)
    .then(res => res.json())
    .then((markers: MarkerData[]) => {
      markers.forEach(m => {
        L.circleMarker([m.lat, m.lng], {
          radius: 1,
          color: '#111',
          weight: 1,
          fillColor: '#111',
          fillOpacity: 0.75,
          interactive: false,
        }).addTo(map);
      });
    });

  setTimeout(() => map.invalidateSize(), 100);
}

initContributorMap();
