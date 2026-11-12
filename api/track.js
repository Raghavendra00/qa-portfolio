/* Collects analytics events into Supabase.
   Location comes from the edge network headers (coarse city/country) — the raw IP is never stored.
   Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY  */

function str(v, max) {
  if (v == null) return null;
  var s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}
function clampInt(v, min, max) {
  v = parseInt(v, 10);
  if (isNaN(v)) return null;
  return Math.max(min, Math.min(max, v));
}
function decode(v) { try { return v ? decodeURIComponent(v) : null; } catch (e) { return v || null; } }

function parseUA(ua) {
  ua = ua || '';
  var os = 'Unknown', browser = 'Unknown', device = 'Desktop';

  if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  if (/iPad|Tablet|PlayBook|Silk/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = 'Tablet';
  else if (/Mobile|iPhone|iPod|Windows Phone/.test(ua)) device = 'Mobile';

  return { os: os, browser: browser, device: device };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Same-origin guard
  var origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'forbidden' }); }
    catch (e) { return res.status(403).json({ error: 'forbidden' }); }
  }

  var url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return res.status(200).json({ ok: false, reason: 'not configured' });

  var b = req.body;
  try { if (typeof b === 'string') b = JSON.parse(b); } catch (e) { return res.status(400).json({ error: 'bad body' }); }
  if (!b || typeof b !== 'object') return res.status(400).json({ error: 'bad body' });

  var kind = b.t === 'dur' ? 'duration' : 'view';
  var h = req.headers;

  var row = {
    kind: kind,
    visitor_id: str(b.vid, 64),
    session_id: str(b.sid, 64),
    page_id: str(b.pid, 64),
    path: str(b.path, 300)
  };

  if (kind === 'view') {
    var d = parseUA(String(h['user-agent'] || ''));
    var sw = clampInt(b.sw, 0, 100000), sh = clampInt(b.sh, 0, 100000);
    row.referrer = str(b.ref, 300);
    row.country = str(h['x-vercel-ip-country'], 8);
    row.region = str(decode(h['x-vercel-ip-country-region']), 80);
    row.city = str(decode(h['x-vercel-ip-city']), 120);
    row.device = d.device;
    row.browser = d.browser;
    row.os = d.os;
    row.screen = (sw && sh) ? (sw + 'x' + sh) : null;
  } else {
    row.duration_ms = clampInt(b.dur, 0, 86400000);
  }

  try {
    var r = await fetch(url.replace(/\/$/, '') + '/rest/v1/analytics_events', {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify(row)
    });
    if (!r.ok) return res.status(200).json({ ok: false });
    return res.status(204).end();
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
};
