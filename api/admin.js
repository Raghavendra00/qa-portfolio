/* Password-protected admin data API for the analytics dashboard.
   Send the password in the "x-admin-key" header (never in the URL).
   Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD  */

const crypto = require('crypto');

function safeEqual(a, b) {
  a = Buffer.from(String(a || ''));
  b = Buffer.from(String(b || ''));
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch (e) { return false; }
}

function host(ref) {
  if (!ref) return '(direct)';
  try { return new URL(ref).hostname || '(direct)'; } catch (e) { return '(direct)'; }
}

function topList(map, limit) {
  return Object.keys(map)
    .map(function (k) { return map[k]; })
    .sort(function (x, y) { return y.views - x.views; })
    .slice(0, limit || 12);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  var pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.status(503).json({ error: 'Admin password not configured on the server.' });

  var given = req.headers['x-admin-key'] || '';
  if (!safeEqual(given, pass)) return res.status(401).json({ error: 'Unauthorized' });

  var url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Database not configured.' });

  var rows;
  try {
    var r = await fetch(url.replace(/\/$/, '') + '/rest/v1/analytics_events?select=*&order=created_at.desc&limit=20000', {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key },
      signal: AbortSignal.timeout(12000)
    });
    if (!r.ok) return res.status(502).json({ error: 'Database read failed.' });
    rows = await r.json();
  } catch (e) {
    return res.status(502).json({ error: 'Database read failed.' });
  }
  if (!Array.isArray(rows)) rows = [];

  var views = [], durByPid = {};
  for (var i = 0; i < rows.length; i++) {
    var e = rows[i];
    if (e.kind === 'view') views.push(e);
    else if (e.kind === 'duration') {
      var d = e.duration_ms || 0;
      if (!durByPid[e.page_id] || d > durByPid[e.page_id]) durByPid[e.page_id] = d;
    }
  }

  var sessions = {}, visitors = {}, pages = {}, countries = {}, cities = {}, referrers = {}, devices = {}, browsers = {};

  for (var j = 0; j < views.length; j++) {
    var v = views[j];
    var ms = durByPid[v.page_id] || 0;
    var t = new Date(v.created_at).getTime();
    if (v.visitor_id) visitors[v.visitor_id] = true;

    // per-page aggregate
    var pk = v.path || '/';
    if (!pages[pk]) pages[pk] = { key: pk, label: pk, views: 0, totalMs: 0, timed: 0 };
    pages[pk].views++; pages[pk].totalMs += ms; if (ms > 0) pages[pk].timed++;

    // location / device / referrer / browser
    var ck = v.country || '—';
    if (!countries[ck]) countries[ck] = { key: ck, label: ck, views: 0 };
    countries[ck].views++;

    var cityLabel = (v.city || 'Unknown') + (v.country ? ', ' + v.country : '');
    if (!cities[cityLabel]) cities[cityLabel] = { key: cityLabel, label: cityLabel, views: 0 };
    cities[cityLabel].views++;

    var rk = host(v.referrer);
    if (!referrers[rk]) referrers[rk] = { key: rk, label: rk, views: 0 };
    referrers[rk].views++;

    var dk = v.device || 'Unknown';
    if (!devices[dk]) devices[dk] = { key: dk, label: dk, views: 0 };
    devices[dk].views++;

    var bk = v.browser || 'Unknown';
    if (!browsers[bk]) browsers[bk] = { key: bk, label: bk, views: 0 };
    browsers[bk].views++;

    // session grouping
    var sk = v.session_id || v.page_id;
    if (!sessions[sk]) {
      sessions[sk] = {
        session_id: sk, visitor_id: v.visitor_id,
        first: t, last: t, totalMs: 0,
        country: v.country, city: v.city, region: v.region,
        device: v.device, browser: v.browser, os: v.os, screen: v.screen,
        referrer: host(v.referrer), pages: []
      };
    }
    var s = sessions[sk];
    if (t < s.first) { s.first = t; s.country = v.country; s.city = v.city; s.referrer = host(v.referrer); }
    if (t > s.last) s.last = t;
    s.totalMs += ms;
    s.pages.push({ path: pk, ms: ms, at: t });
  }

  var sessionArr = Object.keys(sessions).map(function (k) { return sessions[k]; });
  var totalSessionMs = 0, counted = 0;
  for (var m = 0; m < sessionArr.length; m++) { if (sessionArr[m].totalMs > 0) { totalSessionMs += sessionArr[m].totalMs; counted++; } }

  // finalize per-page avg
  var pageOut = Object.keys(pages).map(function (k) {
    var p = pages[k];
    p.avgMs = p.timed ? Math.round(p.totalMs / p.timed) : 0;
    return p;
  }).sort(function (a, b) { return b.views - a.views; });

  var recent = sessionArr.sort(function (a, b) { return b.last - a.last; }).slice(0, 100).map(function (s) {
    s.pages.sort(function (a, b) { return a.at - b.at; });
    return s;
  });

  return res.status(200).json({
    generatedAt: Date.now(),
    totals: {
      views: views.length,
      visitors: Object.keys(visitors).length,
      sessions: sessionArr.length,
      avgSessionMs: counted ? Math.round(totalSessionMs / counted) : 0
    },
    topPages: pageOut.slice(0, 15),
    topCountries: topList(countries, 12),
    topCities: topList(cities, 12),
    topReferrers: topList(referrers, 12),
    devices: topList(devices, 8),
    browsers: topList(browsers, 8),
    recentSessions: recent
  });
};
