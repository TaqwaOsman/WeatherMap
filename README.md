# WeatherMap — Smart Weather Explorer
Advanced Web Technologies, Course Project 2. A pure front-end SPA: search a place, see it on a Leaflet/OpenStreetMap map, and read live weather from OpenWeatherMap. Live demo: _add your GitHub Pages URL_.

## Features
Nominatim geocoding → OpenWeatherMap current weather (sequential async/await with try/catch/finally) · animated map + custom marker + popup with Share button · °C/°F toggle · favorites and recent searches (localStorage) · browser geolocation · Web Share API with clipboard fallback · sky-based theme (clear, clouds, rain, snow, night) · loading, error and empty states · 70vh map on desktop · reduced-motion support.

## Stack
Semantic HTML5, CSS3, vanilla ES6+, Leaflet 1.9.4 (CDN), Google Font Manrope. No frameworks, jQuery or D3. No inline handlers or styles.

## Structure
```
index.html  css/style.css  assets/icons/logo.svg  .gitignore
js/config.example.js  js/config.js (git-ignored)  js/storage.js  js/api.js  js/map.js  js/app.js
```

## API key setup
1. Create a free account at openweathermap.org and copy your key (activation can take up to 2 hours).
2. Copy `js/config.example.js` to `js/config.js` and paste the key. `config.js` is git-ignored.
3. Alternative: leave it empty, open the app, and paste the key into the prompt that appears. It is stored only in your browser.

**Security:** a key used in browser code is visible to every visitor. Neither `.gitignore` nor a config file hides it on a deployed site. Use a free-tier key you can revoke, and never reuse a paid or personal key.

## Run locally
`python -m http.server 8000` in this folder, then open http://localhost:8000.

## Deploy to GitHub Pages
Push to GitHub → Settings → Pages → deploy from `main` / root. Because `config.js` is ignored, visitors will see the key prompt. If your instructor requires it to work on first load, commit `config.js` with a disposable key (understand the risk above).

## Known limitations
Nominatim has a 1 request/second usage policy (searches are user-triggered only). Current weather only, no forecast.

## Pre-submission checklist
- [ ] 10+ commits, Pages live  - [ ] No inline handlers/styles  - [ ] Search works without reload
- [ ] Map ≈70vh on desktop  - [ ] Share, favorites, recents work  - [ ] Errors tested (bad city, bad key, offline)
- [ ] Screenshots added below

## Screenshots
_Add later._

## Suggested commits
1. Add project skeleton and README 2. Add HTML structure 3. Add base styles and layout 4. Initialize Leaflet map 5. Add Nominatim geocoding 6. Add OpenWeatherMap fetch 7. Render overview and detail cards 8. Add marker and popup 9. Add loading and error states 10. Add favorites and recents 11. Add share and unit toggle 12. Polish responsive styles and docs
