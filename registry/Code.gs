/**
 * 7942 친구사이 — 반 코드 등록소 (음악적체육인 계정에 하나만 둠)
 * 시트: 반코드 | 키 | 만든날 | 마지막사용
 * 반 코드(5자리 숫자) ↔ 각 선생님 껍데기 웹 앱 주소의 키만 저장합니다. 학생 정보는 저장하지 않습니다.
 */
var REG_SHEET = '반코드';

function sh_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(REG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(REG_SHEET);
    sh.getRange(1, 1, 1, 4).setValues([['반코드', '키', '만든날', '마지막사용']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
  }
  return sh;
}
function all_() {
  var v = sh_().getDataRange().getValues(); v.shift();
  return v.filter(function (r) { return r[0] !== ''; });
}
function validKey_(k) { return /^[A-Za-z0-9_-]{20,}$/.test(String(k || '')); }

/* 등록하려는 주소가 정말 7942 껍데기인지 확인 */
function checkShell_(key) {
  var res = UrlFetchApp.fetch('https://script.google.com/macros/s/' + key + '/exec', {
    method: 'post', contentType: 'text/plain', payload: JSON.stringify({ fn: 'ping', args: [] }), muteHttpExceptions: true, followRedirects: true
  });
  var j; try { j = JSON.parse(res.getContentText()); } catch (e) { j = null; }
  if (!j || !j.ok || !j.data || j.data.app !== '7942') throw new Error('7942 껍데기에 연결하지 못했어요. 웹 앱 배포의 액세스가 "모든 사용자"인지 확인해 주세요.');
}

function lookup(key) {
  if (!validKey_(key)) return '';
  var r = all_().filter(function (r) { return String(r[1]) === key; })[0];
  return r ? String(r[0]) : '';
}

function newCode_() {
  var used = {}; all_().forEach(function (r) { used[String(r[0])] = 1; });
  for (var i = 0; i < 1000; i++) {
    var c = String(10000 + Math.floor(Math.random() * 90000));
    if (used[c] || /^(\d)\1{4}$/.test(c) || '0123456789'.indexOf(c) >= 0 || '9876543210'.indexOf(c) >= 0) continue;
    return c;
  }
  throw new Error('반 코드를 만들 수 없어요.');
}

function register(key) {
  if (!validKey_(key)) throw new Error('주소가 올바르지 않아요.');
  var have = lookup(key); if (have) return have;
  checkShell_(key);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    have = lookup(key); if (have) return have;
    var c = newCode_();
    sh_().appendRow([c, key, new Date(), new Date()]);
    return c;
  } finally { lock.releaseLock(); }
}

function renew(key) {
  if (!validKey_(key)) throw new Error('주소가 올바르지 않아요.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sh_(), v = sh.getDataRange().getValues();
    for (var i = v.length - 1; i >= 1; i--) if (String(v[i][1]) === key) sh.deleteRow(i + 1);
  } finally { lock.releaseLock(); }
  return register(key);
}

function resolve(code) {
  var cache = CacheService.getScriptCache();
  var f = Number(cache.get('fails') || 0);
  if (f >= 60) throw new Error('잠시 뒤에 다시 해 보세요.');
  code = String(code || '').replace(/\D/g, '');
  var sh = sh_(), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]) === code) {
      if (!cache.get('used_' + code)) { sh.getRange(i + 1, 4).setValue(new Date()); cache.put('used_' + code, '1', 21600); }
      return String(v[i][1]);
    }
  }
  cache.put('fails', String(f + 1), 300);
  throw new Error('반 코드가 맞지 않아요. 선생님께 받은 5자리 숫자를 다시 확인해 주세요.');
}

var REG_API = { lookup: lookup, register: register, renew: renew, resolve: resolve, ping: function () { return { app: '7942-registry' }; } };

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = REG_API[req.fn];
    if (!fn) throw new Error('알 수 없는 요청이에요.');
    out = { ok: true, data: fn.apply(null, req.args || []) };
  } catch (err) { out = { ok: false, error: String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { sh_(); return ContentService.createTextOutput('7942 반 코드 등록소가 켜져 있어요.'); }
