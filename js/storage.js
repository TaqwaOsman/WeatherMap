const WMStorage = (() => {
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const list = k => { const v = read(k, []); return Array.isArray(v) ? v.filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) : []; };
  const id = p => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;
  return {
    id,
    favorites: () => list('wm_favs'),
    recents: () => list('wm_recent'),
    isFav: p => list('wm_favs').some(f => id(f) === id(p)),
    toggleFav(p) {
      const f = list('wm_favs'), has = f.some(x => id(x) === id(p));
      write('wm_favs', has ? f.filter(x => id(x) !== id(p)) : [...f, p]);
      return !has;
    },
    removeFav: p => write('wm_favs', list('wm_favs').filter(x => id(x) !== id(p))),
    addRecent(p) { write('wm_recent', [p, ...list('wm_recent').filter(x => id(x) !== id(p))].slice(0, 6)); },
    getUnit: () => (read('wm_unit', 'c') === 'f' ? 'f' : 'c'),
    setUnit: u => write('wm_unit', u),
    getKey: () => { const k = read('wm_key', ''); return typeof k === 'string' ? k : ''; },
    setKey: k => write('wm_key', k)
  };
})();
