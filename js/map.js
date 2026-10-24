const WMMap = (() => {
  let map, marker;
  const pin = () => L.divIcon({ className: 'wm-pin', html: '<span></span>', iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -32] });
  return {
    init(id) {
      map = L.map(id, { zoomControl: true }).setView([15.5007, 32.5599], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      if ('ResizeObserver' in window) new ResizeObserver(() => map.invalidateSize()).observe(document.getElementById(id));
    },
    show(lat, lon, content) {
      if (marker) { map.removeLayer(marker); marker = null; }
      map.flyTo([lat, lon], Math.max(map.getZoom(), 10), { duration: 1.4 });
      marker = L.marker([lat, lon], { icon: pin(), keyboard: true, title: 'Selected location' }).addTo(map);
      marker.bindPopup(content, { minWidth: 220, className: 'wm-popup' });
      map.once('moveend', () => marker && marker.openPopup());
    },
    setPopup(content) { if (marker) marker.setPopupContent(content); }
  };
})();
