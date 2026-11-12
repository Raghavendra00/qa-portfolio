/* Privacy-conscious visitor analytics for the portfolio.
   - No cookies, no exact GPS, no raw IP stored.
   - Coarse location (city/country) is derived server-side from the edge network.
   - Respects Do Not Track and a visitor "Decline" choice.
   Collected: page path, referrer source, time-on-page, device/browser/OS, screen size. */
(function () {
  'use strict';

  var ENDPOINT = '/api/track';
  var CHOICE_KEY = 'rk_analytics';   // 'ok' | 'off'
  var VID_KEY = 'rk_vid';            // pseudonymous visitor id (not personal)
  var SID_KEY = 'rk_sid';            // per-session id

  function readStore(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
  function writeStore(store, key, val) { try { store.setItem(key, val); } catch (e) {} }

  var declined = readStore(localStorage, CHOICE_KEY) === 'off';
  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';

  function rand() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }

  function ids() {
    var vid = readStore(localStorage, VID_KEY);
    if (!vid) { vid = rand(); writeStore(localStorage, VID_KEY, vid); }
    var sid = readStore(sessionStorage, SID_KEY);
    if (!sid) { sid = rand(); writeStore(sessionStorage, SID_KEY, sid); }
    return { vid: vid, sid: sid };
  }

  function send(payload, beacon) {
    try {
      var body = JSON.stringify(payload);
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  var me = null, pid = null, started = false;
  var activeMs = 0, segmentStart = 0, lastSent = -1;

  function externalReferrer() {
    var ref = document.referrer || '';
    try { if (ref && new URL(ref).host === location.host) return ''; } catch (e) {}
    return ref;
  }

  function accumulate() {
    if (segmentStart) { activeMs += Date.now() - segmentStart; segmentStart = 0; }
  }

  function flush(beacon) {
    accumulate();
    if (document.visibilityState === 'visible') segmentStart = Date.now();
    var dur = Math.round(activeMs);
    if (dur <= 0 || dur === lastSent) return;
    lastSent = dur;
    send({ t: 'dur', vid: me.vid, sid: me.sid, pid: pid, path: location.pathname || '/', dur: dur }, beacon);
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      if (!segmentStart) segmentStart = Date.now();
    } else {
      flush(true);
    }
  }

  function start() {
    if (started) return;
    started = true;
    me = ids();
    pid = rand();

    send({
      t: 'view',
      vid: me.vid, sid: me.sid, pid: pid,
      path: location.pathname || '/',
      ref: externalReferrer(),
      sw: screen.width || 0, sh: screen.height || 0
    }, false);

    segmentStart = (document.visibilityState === 'visible') ? Date.now() : 0;
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    window.addEventListener('pagehide', function () { flush(true); }, { passive: true });
    window.addEventListener('beforeunload', function () { flush(true); }, { passive: true });
    setInterval(function () { flush(true); }, 30000);
  }

  /* Dismissible privacy notice (shown once). */
  function notice() {
    if (readStore(localStorage, CHOICE_KEY)) return; // already chose
    var style = document.createElement('style');
    style.textContent =
      '.rk-privacy{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
      'background:#1c1c1c;color:#f4f4f4;border-radius:12px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.28);' +
      'font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
      '.rk-privacy p{margin:0 0 10px}' +
      '.rk-privacy a{color:#9ec5ff}' +
      '.rk-privacy-actions{display:flex;gap:8px;justify-content:flex-end}' +
      '.rk-privacy button{cursor:pointer;border:0;border-radius:8px;padding:8px 14px;font-weight:600;font-size:13px}' +
      '.rk-privacy button[data-a="ok"]{background:#9ec5ff;color:#0b2447}' +
      '.rk-privacy button[data-a="no"]{background:transparent;color:#cfcfcf;border:1px solid #555}' +
      '@media (prefers-reduced-motion:no-preference){.rk-privacy{animation:rkup .25s ease}}' +
      '@keyframes rkup{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}';
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'rk-privacy';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Privacy notice');
    bar.innerHTML =
      '<p>This site collects anonymous analytics — approximate location (city/country), pages viewed, ' +
      'time on page and device type — to understand how the portfolio is used. Your exact location and ' +
      'personal identity are not collected, and no photos or camera data are ever accessed.</p>' +
      '<div class="rk-privacy-actions">' +
      '<button type="button" data-a="no">Decline</button>' +
      '<button type="button" data-a="ok">Got it</button></div>';
    document.body.appendChild(bar);

    bar.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (!a) return;
      if (a === 'no') { writeStore(localStorage, CHOICE_KEY, 'off'); started = false; }
      else { writeStore(localStorage, CHOICE_KEY, 'ok'); }
      bar.remove();
    });
  }

  function init() {
    if (declined || dnt) return;  // honour opt-out and Do Not Track
    start();
    notice();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
