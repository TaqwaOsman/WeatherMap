(() => {
  const $ = id => document.getElementById(id);
  const S = { unit: WMStorage.getUnit(), data: null, busy: false, retry: null };
  const key = () => (window.WEATHERMAP_CONFIG && window.WEATHERMAP_CONFIG.OWM_API_KEY) || WMStorage.getKey();
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const C = () => S.unit === 'c';
  const temp = c => C() ? `${Math.round(c)}°C` : `${Math.round(c * 9 / 5 + 32)}°F`;
  const speed = ms => C() ? `${(ms * 3.6).toFixed(1)} km/h` : `${(ms * 2.237).toFixed(1)} mph`;
  const dist = m => C() ? `${(m / 1000).toFixed(1)} km` : `${(m / 1609.34).toFixed(1)} mi`;
  const compass = d => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];
  const clock = (ts, tz, extra) => new Date((ts + tz) * 1000).toLocaleString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', ...extra });

  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200); }

  function showAlert(title, msg, withKey) {
    const a = $('alert'); a.replaceChildren(h('strong', null, title), h('span', null, msg));
    if (withKey) {
      const f = h('form'); const i = h('input'); i.type = 'password'; i.placeholder = 'Paste your OpenWeatherMap key'; i.setAttribute('aria-label', 'OpenWeatherMap API key'); i.autocomplete = 'off';
      const b = h('button', 'btn', 'Save key & retry'); b.type = 'submit';
      f.append(i, b);
      f.addEventListener('submit', e => { e.preventDefault(); const v = i.value.trim(); if (!v) return; WMStorage.setKey(v); a.hidden = true; if (S.retry) S.retry(); });
      a.append(f);
    }
    a.hidden = false;
  }
  const hideAlert = () => { $('alert').hidden = true; };

  function showError(e) {
    const m = {
      notfound: ['Place not found', 'Check the spelling or try a larger nearby city.'],
      network: ['No connection', 'The request could not be completed. Check your internet connection and try again.'],
      timeout: ['The server took too long', 'Try again in a moment.'],
      key: ['API key missing or invalid', 'Add a valid OpenWeatherMap key (new keys can take up to two hours to activate).'],
      rate: ['Rate limit reached', 'Too many requests. Wait a minute, then try again.'],
      parse: ['Unexpected response', 'The service returned data this app cannot read.']
    }[e && e.code] || ['Something went wrong', 'The weather service is unavailable right now. Try again later.'];
    if (!(e instanceof WMApi.ApiError)) console.error(e);
    showAlert(m[0], m[1], e && e.code === 'key');
  }

  function setBusy(on) {
    S.busy = on;
    $('goBtn').disabled = on; $('locBtn').disabled = on;
    $('goBtn').classList.toggle('busy', on);
    $('goLabel').textContent = on ? 'Loading…' : 'Get Weather';
    $('overview').classList.toggle('updating', on);
    $('status').textContent = on ? 'Finding location and reading the weather…' : '';
  }

  async function run(task, retry) {
    if (S.busy) return;
    S.retry = retry; hideAlert(); setBusy(true);
    try { render(await task()); }
    catch (e) { showError(e); }
    finally { setBusy(false); }
  }
  const search = q => run(async () => {
    const g = await WMApi.geocode(q);
    return { w: await WMApi.weather(g.lat, g.lon, key()), lat: g.lat, lon: g.lon };
  }, () => search(q));
  const byCoords = (lat, lon) => run(async () => ({ w: await WMApi.weather(lat, lon, key()), lat, lon }), () => byCoords(lat, lon));

  const place = () => { const { w, lat, lon } = S.data; return { name: w.name || 'Selected location', country: (w.sys && w.sys.country) || '', lat, lon }; };
  const title = p => p.country ? `${p.name}, ${p.country}` : p.name;
  const shareText = () => { const w = S.data.w; return `Weather in ${title(place())}: ${temp(w.main.temp)}, ${w.weather[0].description}. Shared from WeatherMap.`; };

  async function share() {
    if (!S.data) return;
    const text = shareText();
    try {
      if (navigator.share) { await navigator.share({ title: 'WeatherMap', text }); return; }
      await navigator.clipboard.writeText(text); toast('Weather summary copied to clipboard');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      const ta = h('textarea'); ta.value = text; ta.className = 'sr-only'; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove(); toast(ok ? 'Weather summary copied' : `Could not copy. Select this text: ${text}`);
    }
  }

  function popup() {
    const { w } = S.data, p = place(), box = h('div');
    const head = h('div', 'pop-h'), img = h('img'); img.src = `https://openweathermap.org/img/wn/${encodeURIComponent(w.weather[0].icon)}@2x.png`; img.alt = w.weather[0].description;
    const t = h('div'); t.append(h('b', null, title(p)), h('span', 'pop-t', temp(w.main.temp)));
    head.append(img, t);
    const ul = h('ul', 'pop-l');
    ul.append(h('li', null, w.weather[0].description));
    if (isNum(w.main.humidity)) ul.append(h('li', null, `Humidity ${w.main.humidity}%`));
    if (w.wind && isNum(w.wind.speed)) ul.append(h('li', null, `Wind ${speed(w.wind.speed)}`));
    if (w.clouds && isNum(w.clouds.all)) ul.append(h('li', null, `Clouds ${w.clouds.all}%`));
    const b = h('button', 'btn pop-b', 'Share'); b.type = 'button'; b.addEventListener('click', share);
    box.append(head, ul, b); return box;
  }

  function sky(w) {
    const g = w.weather[0], main = String(g.main || '');
    if (String(g.icon).endsWith('n')) return 'night';
    if (/Rain|Drizzle|Thunder/.test(main)) return 'rain';
    if (main === 'Snow') return 'snow';
    return main === 'Clear' ? 'clear' : 'clouds';
  }

  function renderCore(d) {
    if (d) S.data = d;
    if (!S.data) return;
    const { w, lat, lon } = S.data, m = w.main, p = place(), tz = isNum(w.timezone) ? w.timezone : 0;
    document.body.dataset.sky = sky(w);
    $('overview').hidden = false; $('empty').hidden = true;
    $('place').textContent = title(p);
    $('localtime').textContent = isNum(w.dt) ? `Local time ${clock(w.dt, tz, { weekday: 'short' })}` : '';
    $('temp').textContent = temp(m.temp);
    $('desc').textContent = w.weather[0].description;
    $('icon').src = `https://openweathermap.org/img/wn/${encodeURIComponent(w.weather[0].icon)}@2x.png`;
    $('icon').alt = w.weather[0].description;
    $('hilo').textContent = isNum(m.temp_min) && isNum(m.temp_max) ? `Low ${temp(m.temp_min)} · High ${temp(m.temp_max)}` : '';
    const tips = [];
    if (isNum(m.feels_like)) tips.push(`It feels like ${temp(m.feels_like)}`);
    if (isNum(m.humidity)) tips.push(m.humidity >= 70 ? 'the air is humid' : m.humidity <= 30 ? 'the air is dry' : 'humidity is moderate');
    if (w.wind && isNum(w.wind.speed)) tips.push(w.wind.speed >= 10 ? 'it is windy' : w.wind.speed < 3 ? 'the air is calm' : 'there is a light breeze');
    $('summary').textContent = tips.length ? tips.join(', ') + '.' : '';
    const rows = [
      ['Feels like', isNum(m.feels_like) && temp(m.feels_like)],
      ['Humidity', isNum(m.humidity) && `${m.humidity}%`],
      ['Wind', w.wind && isNum(w.wind.speed) && `${speed(w.wind.speed)}${isNum(w.wind.deg) ? ' ' + compass(w.wind.deg) : ''}`],
      ['Cloud cover', w.clouds && isNum(w.clouds.all) && `${w.clouds.all}%`],
      ['Pressure', isNum(m.pressure) && `${m.pressure} hPa`],
      ['Visibility', isNum(w.visibility) && dist(w.visibility)],
      ['Sunrise', w.sys && isNum(w.sys.sunrise) && clock(w.sys.sunrise, tz)],
      ['Sunset', w.sys && isNum(w.sys.sunset) && clock(w.sys.sunset, tz)]
    ].filter(r => r[1]);
    $('details').replaceChildren(...rows.map(r => { const c = h('div', 'mini'); c.append(h('span', null, r[0]), h('b', null, r[1])); return c; }));
    favState(); WMMap.show(lat, lon, popup());
  }

  function favState() {
    const on = S.data && WMStorage.isFav(place());
    $('favBtn').textContent = on ? '★ Saved' : '☆ Save'; $('favBtn').setAttribute('aria-pressed', String(!!on));
  }

  function chips(box, items, removable, emptyMsg) {
    if (!items.length) { box.replaceChildren(h('p', 'mute', emptyMsg)); return; }
    box.replaceChildren(...items.map(p => {
      const c = h('span', 'chip'), b = h('button', null, title(p)); b.type = 'button'; b.addEventListener('click', () => byCoords(p.lat, p.lon)); c.append(b);
      if (removable) { const x = h('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', `Remove ${title(p)} from favorites`); x.addEventListener('click', () => { WMStorage.removeFav(p); lists(); favState(); }); c.append(x); }
      return c;
    }));
  }
  function lists() {
    chips($('favs'), WMStorage.favorites(), true, 'No favorites yet. Search a place and press Save to keep it here.');
    chips($('recents'), WMStorage.recents(), false, 'Your last searches will appear here.');
  }

  function setUnit(u) {
    S.unit = u; WMStorage.setUnit(u);
    $('unitC').setAttribute('aria-pressed', String(u === 'c')); $('unitF').setAttribute('aria-pressed', String(u === 'f'));
    if (S.data) render();
  }

  // The persisted lists are updated after a successful render.
  function render(d) { renderCore(d); if (d) { WMStorage.addRecent(place()); lists(); favState(); } }

  function locate() {
    if (!('geolocation' in navigator)) return showAlert('Location unavailable', 'This browser does not support geolocation. Search by name instead.');
    hideAlert(); $('status').textContent = 'Waiting for location permission…';
    navigator.geolocation.getCurrentPosition(
      pos => byCoords(pos.coords.latitude, pos.coords.longitude),
      err => { $('status').textContent = ''; showAlert(err.code === 1 ? 'Location permission denied' : 'Could not get your location', err.code === 1 ? 'Allow location access in the browser, or search by name.' : 'Try again or search by name.'); },
      { timeout: 10000, maximumAge: 300000 });
  }

  document.addEventListener('DOMContentLoaded', () => {
    WMMap.init('map'); lists(); setUnit(S.unit);
    $('searchForm').addEventListener('submit', e => {
      e.preventDefault();
      const q = $('q').value.trim();
      if (!q) return showAlert('Enter a location', 'Type a city, address or landmark first.');
      search(q);
    });
    $('locBtn').addEventListener('click', locate);
    $('unitC').addEventListener('click', () => setUnit('c'));
    $('unitF').addEventListener('click', () => setUnit('f'));
    $('favBtn').addEventListener('click', () => { if (!S.data) return; const on = WMStorage.toggleFav(place()); lists(); favState(); toast(on ? 'Saved to favorites' : 'Removed from favorites'); });
  });
})();
