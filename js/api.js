const WMApi = (() => {
  class ApiError extends Error { constructor(code, msg) { super(msg); this.code = code; } }

  async function getJson(url) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 10000);
    let res;
    try { res = await fetch(url, { signal: ctl.signal }); }
    catch (e) { throw new ApiError(e.name === 'AbortError' ? 'timeout' : 'network', 'Request failed'); }
    finally { clearTimeout(timer); }
    if (!res.ok) {
      const map = { 401: 'key', 404: 'notfound', 429: 'rate' };
      throw new ApiError(map[res.status] || 'http', `HTTP ${res.status}`);
    }
    try { return await res.json(); } catch { throw new ApiError('parse', 'Malformed JSON'); }
  }

  async function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(query)}`;
    const data = await getJson(url);
    if (!Array.isArray(data) || !data.length) throw new ApiError('notfound', 'No place found');
    const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new ApiError('parse', 'Bad coordinates');
    return { lat, lon, label: String(data[0].display_name || query) };
  }

  async function weather(lat, lon, key) {
    if (!key) throw new ApiError('key', 'Missing API key');
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(key)}&units=metric`;
    const d = await getJson(url);
    if (!d || !d.main || !Array.isArray(d.weather) || !d.weather[0] || typeof d.main.temp !== 'number')
      throw new ApiError('parse', 'Incomplete weather data');
    return d;
  }
  return { ApiError, geocode, weather };
})();
