/* Admin dashboard logic. The password is kept only in sessionStorage and sent
   as the x-admin-key header — never placed in the URL. */
(function () {
  'use strict';

  var KEY = 'rk_admin_key';
  var login = document.getElementById('login');
  var dash = document.getElementById('dash');
  var form = document.getElementById('login-form');
  var pw = document.getElementById('pw');
  var loginError = document.getElementById('login-error');
  var timer = null;

  function getKey() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
  function setKey(v) { try { sessionStorage.setItem(KEY, v); } catch (e) {} }
  function clearKey() { try { sessionStorage.removeItem(KEY); } catch (e) {} }

  function showLogin(msg) {
    dash.hidden = true; login.hidden = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (msg) { loginError.textContent = msg; loginError.hidden = false; }
    pw.focus();
  }
  function showDash() { login.hidden = true; dash.hidden = false; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDur(ms) {
    ms = ms || 0; var s = Math.round(ms / 1000);
    if (s < 1) return '0s';
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return m + 'm ' + (r ? r + 's' : '').trim();
    var h = Math.floor(m / 60); return h + 'h ' + (m % 60) + 'm';
  }
  function fmtTime(ts) {
    try { return new Date(ts).toLocaleString(); } catch (e) { return ''; }
  }

  function bars(elId, items, valueFn, labelFn) {
    var el = document.getElementById(elId);
    if (!items || !items.length) { el.innerHTML = '<p class="empty">No data yet.</p>'; return; }
    var max = 0;
    items.forEach(function (it) { max = Math.max(max, valueFn(it)); });
    var html = '<div class="bars">';
    items.forEach(function (it) {
      var v = valueFn(it);
      var pct = max ? Math.max(3, Math.round((v / max) * 100)) : 3;
      html += '<div class="bar-row">' +
        '<span class="bar-label" title="' + esc(labelFn(it)) + '">' + esc(labelFn(it)) + '</span>' +
        '<span class="bar-val">' + esc(valueText(it)) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }
  // default value text = views; pages panel overrides with avg time
  var valueText = function (it) { return it.views + (it.views === 1 ? ' view' : ' views'); };

  function render(d) {
    document.getElementById('meta').textContent =
      'Updated ' + fmtTime(d.generatedAt) + ' · last ' + d.totals.views + ' page views';

    document.getElementById('tiles').innerHTML =
      tile(d.totals.views, 'Page views') +
      tile(d.totals.visitors, 'Unique visitors') +
      tile(d.totals.sessions, 'Sessions') +
      tile(fmtDur(d.totals.avgSessionMs), 'Avg. time on site');

    // pages: show views + avg time in the value
    valueText = function (it) { return it.views + ' views · ' + fmtDur(it.avgMs); };
    bars('pages', d.topPages, function (x) { return x.views; }, function (x) { return x.label; });
    valueText = function (it) { return it.views + (it.views === 1 ? ' view' : ' views'); };

    bars('countries', d.topCountries, function (x) { return x.views; }, function (x) { return x.label; });
    bars('cities', d.topCities, function (x) { return x.views; }, function (x) { return x.label; });
    bars('referrers', d.topReferrers, function (x) { return x.views; }, function (x) { return x.label; });
    bars('devices', d.devices, function (x) { return x.views; }, function (x) { return x.label; });
    bars('browsers', d.browsers, function (x) { return x.views; }, function (x) { return x.label; });

    var tb = document.querySelector('#sessions tbody');
    if (!d.recentSessions.length) {
      tb.innerHTML = '<tr><td colspan="7" class="empty">No visits recorded yet.</td></tr>';
      return;
    }
    tb.innerHTML = d.recentSessions.map(function (s) {
      var loc = [s.city, s.region, s.country].filter(Boolean).join(', ') || '—';
      var paths = {};
      s.pages.forEach(function (p) { paths[p.path] = (paths[p.path] || 0) + 1; });
      var pills = Object.keys(paths).map(function (p) {
        return '<span class="pill">' + esc(p) + (paths[p] > 1 ? ' ×' + paths[p] : '') + '</span>';
      }).join('');
      return '<tr>' +
        '<td>' + esc(fmtTime(s.last)) + '</td>' +
        '<td>' + esc(loc) + '</td>' +
        '<td>' + esc(s.device || '—') + '</td>' +
        '<td>' + esc(s.browser || '—') + '</td>' +
        '<td>' + esc(s.referrer || '(direct)') + '</td>' +
        '<td>' + pills + '</td>' +
        '<td class="num">' + esc(fmtDur(s.totalMs)) + '</td>' +
        '</tr>';
    }).join('');
  }

  function tile(n, l) {
    return '<div class="tile"><div class="n">' + esc(n) + '</div><div class="l">' + esc(l) + '</div></div>';
  }

  function load() {
    var key = getKey();
    if (!key) { showLogin(); return; }
    fetch('/api/admin', { headers: { 'x-admin-key': key } })
      .then(function (r) {
        if (r.status === 401) { clearKey(); showLogin('Wrong password.'); return null; }
        if (!r.ok) throw new Error('load failed');
        return r.json();
      })
      .then(function (d) {
        if (!d) return;
        showDash();
        render(d);
        if (!timer) timer = setInterval(load, 60000);
      })
      .catch(function () {
        document.getElementById('meta').textContent = 'Could not load data. Try Refresh.';
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var v = pw.value.trim();
    if (!v) return;
    setKey(v); pw.value = '';
    load();
  });
  document.getElementById('refresh').addEventListener('click', load);
  document.getElementById('logout').addEventListener('click', function () {
    clearKey(); showLogin();
  });

  load();
})();
