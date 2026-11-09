/**
 * 7942 친구사이 — 교우관계 설문 껍데기 (구글 시트 + 앱스 스크립트)
 * 화면: https://musicalpe.github.io/7942/
 * 만든이: 음악적체육인
 *
 * 이 코드는 저장·불러오기만 합니다. 화면과 분석은 GitHub에서 자동으로 최신판이 열립니다.
 *
 * 시트 구성(처음 실행할 때 자동으로 만들어짐)
 *  - 학생명단 : 학생ID | 번호 | 이름 | 성별 | 코드 | 상태
 *  - 회차     : 회차ID | 회차이름 | 만든날 | 상태 | 설정JSON
 *  - 응답     : 회차ID | 학생ID | 번호 | 이름 | 제출시각 | 서술형JSON | 관계JSON | 칭찬JSON | 사이JSON | 한마디
 */

var SH = { ROSTER: '학생명단', ROUNDS: '회차', RESP: '응답' };
var HEAD = {
  '학생명단': ['학생ID', '번호', '이름', '성별', '코드', '상태'],
  '회차': ['회차ID', '회차이름', '만든날', '상태', '설정JSON'],
  '응답': ['회차ID', '학생ID', '번호', '이름', '제출시각', '서술형JSON', '관계JSON', '칭찬JSON', '사이JSON', '한마디']
};
var DEFAULT_PW = '0000';

function defaultSettings_() {
  return {
    title: '우리반 친구들은?!',
    intro: '우리 반 친구들과 함께 지내면서 느낀 점을 솔직하게 써 보세요. 여러분이 쓴 내용은 선생님만 볼 수 있어요.',
    questions: [
      '우리 반은 "나"에게 어떤 반인가요?',
      '나는 우리 반 친구들에게 어떤 아이일까요?',
      '지금까지 지내면서 좋았던 점은?',
      '지금까지 지내면서 어려웠던 점은?',
      '우리 반에게 바라는 점은 무엇인가요?'
    ],
    requireAllRelations: true,
    relScale: 3,            // 3: ○△X / 5: 5점 척도
    praiseMode: 'gender',   // gender: 남·여 따로 / any: 성별 상관없이 / off: 묻지 않음
    praiseMale: 1,
    praiseFemale: 1,
    praiseAny: 2,
    praiseRequired: true,
    praiseQuestion: '이 친구가 친구 관계에서 칭찬받을 점은 무엇인가요? 이 친구와 친해지고 싶은 이유는?',
    conflictMax: 2,         // 0이면 묻지 않음
    conflictQuestion: '이 친구가 친구 관계에서 고쳐야 할 점은 무엇인가요? 이 친구와 사이가 좋지 않은 이유는?',
    askTeacherMessage: true
  };
}

var SHELL_VER = 2;   // 2판: 5단계 척도, 설정 전체를 학생 화면에 전달

/** 처음 한 번 편집기에서 [실행] — 권한을 받고 시트를 준비합니다 */
function start() {
  ensureSheets_();
  Logger.log('준비 끝! 이제 [배포] > [새 배포] > 웹 앱으로 배포하세요.');
}

/* ───────── 웹앱 진입 (API) ───────── */
var API = {
  ping: function () { return { app: '7942', shell: SHELL_VER }; },
  studentLogin: studentLogin, studentSubmit: studentSubmit,
  teacherLogin: teacherLogin, changePassword: changePassword, teacherInit: teacherInit,
  saveRoster: saveRoster, regenCodes: regenCodes, createRound: createRound, updateRound: updateRound,
  deleteRound: deleteRound, getRoundData: getRoundData, resetResponse: resetResponse, exportMatrix: exportMatrix
};

function doPost(e) {
  var out;
  try {
    ensureSheets_();
    var req = JSON.parse(e.postData.contents);
    var fn = API[req.fn];
    if (!fn) throw new Error('알 수 없는 요청이에요.');
    out = { ok: true, data: fn.apply(null, req.args || []) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

var TEACHER_PAGE = 'https://musicalpe.github.io/7942/teacher.html';

/** 껍데기 주소를 열면 7942 선생님 화면으로 넘어가면서 이 시트와 자동으로 연결 */
function doGet() {
  ensureSheets_();
  var url = String(ScriptApp.getService().getUrl() || '');
  var m = url.match(/\/s\/([A-Za-z0-9_-]+)\/(exec|dev)/);
  var target = TEACHER_PAGE + (m ? '?k=' + m[1] : '');
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
    '<body style="font-family:sans-serif;text-align:center;padding-top:60px;background:#f5f5f2;color:#24272c">' +
    '<div style="font-size:52px;font-weight:900;letter-spacing:4px;color:#2f6f5e">7942</div>' +
    '<div style="color:#6a6f77;letter-spacing:6px;margin-bottom:24px">친구사이</div>' +
    '<p>껍데기가 잘 연결되어 있어요. 선생님 화면으로 넘어갑니다.</p>' +
    '<p><a href="' + target + '" target="_top" style="display:inline-block;background:#2f6f5e;color:#fff;padding:14px 26px;border-radius:12px;text-decoration:none;font-weight:700">7942 선생님 화면 열기</a></p>' +
    '<p style="color:#888;font-size:13px">자동으로 넘어가지 않으면 위 단추를 눌러 주세요.</p>' +
    '<script>try{window.top.location.href=' + JSON.stringify(target) + ';}catch(e){}</script></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('7942 친구사이')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('7942')
    .addItem('처음 설정(시트 만들기)', 'setupFromMenu')
    .addToUi();
}
function setupFromMenu() {
  ensureSheets_();
  try { SpreadsheetApp.getUi().alert('시트가 준비됐어요. 배포 > 새 배포 > 웹 앱으로 배포한 뒤, 나온 주소를 https://musicalpe.github.io/7942/teacher.html 에 붙여 넣으세요. 처음 비밀번호는 0000 입니다.'); } catch (e) { Logger.log('시트가 준비됐어요.'); }
}

/* ───────── 공통 도구 ───────── */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheets_() {
  var ss = ss_();
  Object.keys(HEAD).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, HEAD[name].length).setValues([HEAD[name]]).setFontWeight('bold').setBackground('#eef2f7');
      sh.setFrozenRows(1);
      if (name === SH.ROSTER) sh.getRange('E:E').setNumberFormat('@');
    }
  });
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PW_HASH')) props.setProperty('PW_HASH', hash_(DEFAULT_PW));
}

function hash_(s) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'friends-salt::' + s, Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function rows_(name) {
  var sh = ss_().getSheetByName(name);
  var v = sh.getDataRange().getValues();
  v.shift();
  return v.filter(function (r) { return String(r[0]) !== ''; });
}

function readRoster_() {
  return rows_(SH.ROSTER).map(function (r) {
    return { id: String(r[0]), no: Number(r[1]) || 0, name: String(r[2]).trim(), gender: String(r[3]).trim(), code: String(r[4]).trim(), status: String(r[5] || '재학').trim() || '재학' };
  }).sort(function (a, b) { return a.no - b.no; });
}

function readRounds_() {
  return rows_(SH.ROUNDS).map(function (r) {
    var st = {};
    try { st = JSON.parse(r[4] || '{}'); } catch (e) {}
    return { id: String(r[0]), name: String(r[1]), created: fmtDate_(r[2]), status: String(r[3]), settings: mergeSettings_(st) };
  });
}

function mergeSettings_(st) {
  var d = defaultSettings_();
  Object.keys(st || {}).forEach(function (k) { d[k] = st[k]; });
  return d;
}

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '');
}

function readResponses_(rid) {
  return rows_(SH.RESP).filter(function (r) { return String(r[0]) === rid; }).map(function (r) {
    function j(x, d) { try { return JSON.parse(x || ''); } catch (e) { return d; } }
    return {
      rid: String(r[0]), sid: String(r[1]), no: r[2], name: String(r[3]),
      time: r[4] instanceof Date ? Utilities.formatDate(r[4], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : String(r[4]),
      answers: j(r[5], []), rel: j(r[6], {}), praise: j(r[7], []), conflict: j(r[8], []), message: String(r[9] || '')
    };
  });
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function newCode_(used) {
  for (var i = 0; i < 500; i++) {
    var c = ('000' + Math.floor(Math.random() * 10000)).slice(-4);
    if (used[c]) continue;
    if (/^(\d)\1{3}$/.test(c)) continue;               // 1111 같은 코드 제외
    if ('0123456789'.indexOf(c) >= 0 || '9876543210'.indexOf(c) >= 0) continue; // 1234, 4321 제외
    used[c] = true;
    return c;
  }
  throw new Error('코드를 만들 수 없어요.');
}

/* ───────── 학생 ───────── */
function studentLogin(code) {
  ensureSheets_();
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('fails') || 0);
  if (fails >= 30) throw new Error('잠시 뒤에 다시 해 보세요. (틀린 코드가 너무 많이 들어왔어요)');

  code = String(code || '').replace(/\D/g, '');
  var me = readRoster_().filter(function (s) { return s.code === code && s.status !== '전출'; })[0];
  if (!me) {
    cache.put('fails', String(fails + 1), 300);
    throw new Error('코드가 맞지 않아요. 선생님께 받은 4자리 숫자를 다시 확인해 주세요.');
  }
  var round = readRounds_().filter(function (r) { return r.status === '진행중'; })[0];
  if (!round) throw new Error('지금은 설문 기간이 아니에요. 선생님께 여쭤 보세요.');

  var submitted = readResponses_(round.id).some(function (r) { return r.sid === me.id; });
  var friends = readRoster_().filter(function (s) { return s.id !== me.id && s.status !== '전출'; })
    .map(function (s) { return { id: s.id, name: s.name, gender: s.gender }; });

  var token = Utilities.getUuid();
  cache.put('st_' + token, JSON.stringify({ sid: me.id, rid: round.id }), 7200);

  return {
    token: token, rid: round.id, name: me.name, roundName: round.name, submitted: submitted, friends: friends,
    settings: round.settings   // 설정에는 비밀이 없어서 통째로 보냄 (새 설정이 생겨도 껍데기를 안 바꿔도 되게)
  };
}

function studentSubmit(token, data) {
  var sess = CacheService.getScriptCache().get('st_' + token);
  if (!sess) throw new Error('들어온 지 오래되어 다시 코드를 넣어야 해요. (적은 내용은 이 기기에 남아 있어요)');
  sess = JSON.parse(sess);

  return withLock_(function () {
    var round = readRounds_().filter(function (r) { return r.id === sess.rid; })[0];
    if (!round || round.status !== '진행중') throw new Error('설문이 마감되었어요.');
    if (readResponses_(round.id).some(function (r) { return r.sid === sess.sid; })) throw new Error('이미 제출했어요.');

    var roster = readRoster_();
    var me = roster.filter(function (s) { return s.id === sess.sid; })[0];
    var valid = {};
    roster.forEach(function (s) { if (s.id !== me.id) valid[s.id] = s.name; });

    var rel = {};
    Object.keys(data.rel || {}).forEach(function (k) {
      var v = data.rel[k];
      if (valid[k] && /^(o|t|x|[1-5])$/.test(String(v))) rel[k] = String(v);
    });
    function picks(arr, max) {
      var seen = {};
      return (arr || []).filter(function (p) { return p && valid[p.id] && !seen[p.id] && (seen[p.id] = true); })
        .slice(0, max).map(function (p) { return { id: p.id, name: valid[p.id], slot: String(p.slot || ''), reason: String(p.reason || '').slice(0, 500) }; });
    }
    var answers = (data.answers || []).slice(0, 20).map(function (a) { return String(a || '').slice(0, 1000); });

    ss_().getSheetByName(SH.RESP).appendRow([
      round.id, me.id, me.no, me.name, new Date(),
      JSON.stringify(answers), JSON.stringify(rel),
      JSON.stringify(picks(data.praise, 10)), JSON.stringify(picks(data.conflict, 10)),
      String(data.message || '').slice(0, 1000)
    ]);
    CacheService.getScriptCache().remove('st_' + token);
    return true;
  });
}

/* ───────── 선생님 ───────── */
function checkT_(token) {
  if (!token || !CacheService.getScriptCache().get('tc_' + token)) throw new Error('다시 로그인해 주세요.');
}

function teacherLogin(pw) {
  ensureSheets_();
  var cache = CacheService.getScriptCache();
  var f = Number(cache.get('tfails') || 0);
  if (f >= 10) throw new Error('비밀번호가 여러 번 틀려 5분 동안 막혔어요.');
  if (hash_(String(pw || '')) !== PropertiesService.getScriptProperties().getProperty('PW_HASH')) {
    cache.put('tfails', String(f + 1), 300);
    throw new Error('비밀번호가 맞지 않아요.');
  }
  var token = Utilities.getUuid();
  cache.put('tc_' + token, '1', 21600);
  return token;
}

function changePassword(token, oldPw, newPw) {
  checkT_(token);
  var props = PropertiesService.getScriptProperties();
  if (hash_(String(oldPw)) !== props.getProperty('PW_HASH')) throw new Error('지금 비밀번호가 맞지 않아요.');
  if (String(newPw).length < 4) throw new Error('새 비밀번호는 4자 이상으로 해 주세요.');
  props.setProperty('PW_HASH', hash_(String(newPw)));
  return true;
}

function teacherInit(token) {
  checkT_(token);
  return {
    roster: readRoster_(),
    rounds: readRounds_(),
    url: ScriptApp.getService().getUrl(),
    shell: SHELL_VER,
    sheetUrl: ss_().getUrl(),
    defaultPw: PropertiesService.getScriptProperties().getProperty('PW_HASH') === hash_(DEFAULT_PW)
  };
}

/** rows: [{id?, no, name, gender, status}] — 명단 전체를 이 내용으로 바꿈(코드는 유지, 새 학생은 새 코드) */
function saveRoster(token, rows) {
  checkT_(token);
  return withLock_(function () {
    var old = {}; var used = {};
    readRoster_().forEach(function (s) { old[s.id] = s; used[s.code] = true; });
    var out = rows.filter(function (r) { return String(r.name || '').trim(); }).map(function (r) {
      var o = r.id && old[r.id];
      var id = o ? o.id : 'S' + Utilities.getUuid().slice(0, 8);
      var code = o && o.code ? o.code : newCode_(used);
      return [id, Number(r.no) || '', String(r.name).trim(), String(r.gender || '').trim(), code, String(r.status || '재학')];
    });
    var sh = ss_().getSheetByName(SH.ROSTER);
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 6).clearContent();
    if (out.length) {
      sh.getRange(2, 5, out.length, 1).setNumberFormat('@');
      sh.getRange(2, 1, out.length, 6).setValues(out);
    }
    return readRoster_();
  });
}

function regenCodes(token, ids) {
  checkT_(token);
  return withLock_(function () {
    var sh = ss_().getSheetByName(SH.ROSTER);
    var v = sh.getDataRange().getValues();
    var used = {};
    v.forEach(function (r, i) { if (i) used[String(r[4])] = true; });
    var target = {}; (ids || []).forEach(function (id) { target[id] = true; });
    for (var i = 1; i < v.length; i++) {
      if (!v[i][0]) continue;
      if (ids && !target[String(v[i][0])]) continue;
      sh.getRange(i + 1, 5).setNumberFormat('@').setValue(newCode_(used));
    }
    return readRoster_();
  });
}

function createRound(token, name) {
  checkT_(token);
  return withLock_(function () {
    var rounds = readRounds_();
    var prev = rounds[rounds.length - 1];
    var settings = prev ? prev.settings : defaultSettings_();
    var maxN = 0;
    rounds.forEach(function (r) { var n = Number(String(r.id).replace(/\D/g, '')); if (n > maxN) maxN = n; });
    var id = 'R' + (maxN + 1);
    var sh = ss_().getSheetByName(SH.ROUNDS);
    // 새 회차를 열면 다른 진행중 회차는 마감
    var v = sh.getDataRange().getValues();
    for (var i = 1; i < v.length; i++) if (v[i][3] === '진행중') sh.getRange(i + 1, 4).setValue('마감');
    sh.appendRow([id, String(name || (maxN + 1) + '회차'), new Date(), '진행중', JSON.stringify(settings)]);
    return readRounds_();
  });
}

function updateRound(token, rid, patch) {
  checkT_(token);
  return withLock_(function () {
    var sh = ss_().getSheetByName(SH.ROUNDS);
    var v = sh.getDataRange().getValues();
    for (var i = 1; i < v.length; i++) {
      if (String(v[i][0]) === rid) {
        if (patch.name != null) sh.getRange(i + 1, 2).setValue(String(patch.name));
        if (patch.status) sh.getRange(i + 1, 4).setValue(patch.status);
        if (patch.settings) sh.getRange(i + 1, 5).setValue(JSON.stringify(mergeSettings_(patch.settings)));
      } else if (patch.status === '진행중' && v[i][3] === '진행중') {
        sh.getRange(i + 1, 4).setValue('마감');
      }
    }
    return readRounds_();
  });
}

function deleteRound(token, rid) {
  checkT_(token);
  return withLock_(function () {
    [SH.RESP, SH.ROUNDS].forEach(function (name) {
      var sh = ss_().getSheetByName(name);
      var v = sh.getDataRange().getValues();
      for (var i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === rid) sh.deleteRow(i + 1);
    });
    return readRounds_();
  });
}

function getRoundData(token, rid) {
  checkT_(token);
  return { rid: rid, responses: readResponses_(rid) };
}

function resetResponse(token, rid, sid) {
  checkT_(token);
  return withLock_(function () {
    var sh = ss_().getSheetByName(SH.RESP);
    var v = sh.getDataRange().getValues();
    for (var i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === rid && String(v[i][1]) === sid) sh.deleteRow(i + 1);
    return readResponses_(rid);
  });
}

/** 원래 엑셀 분석표와 같은 모양의 시트를 만들어 줌 */
function exportMatrix(token, rid) {
  checkT_(token);
  var round = readRounds_().filter(function (r) { return r.id === rid; })[0];
  var roster = readRoster_().filter(function (s) { return s.status !== '전출'; });
  var resp = {}; readResponses_(rid).forEach(function (r) { resp[r.sid] = r; });
  function nv(v) { v = String(v || ''); return v === '5' || v === '4' ? 'o' : v === '3' ? 't' : v === '2' || v === '1' ? 'x' : v; }
  var n = roster.length;
  var name = ('분석표_' + round.name).slice(0, 90);
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (sh) sh.clear(); else sh = ss.insertSheet(name);

  var grid = [];
  grid.push([''].concat(roster.map(function (s) { return s.name; })).concat(['긍정성(준 ○)', '부정성(준 X)']));
  var bg = [];
  roster.forEach(function (a) {
    var r = resp[a.id];
    var row = [a.name], colors = ['#ffffff'], po = 0, ne = 0;
    roster.forEach(function (b) {
      var raw = r && r.rel[b.id], v = nv(raw);
      var back = nv(resp[b.id] && resp[b.id].rel[a.id]);
      var cell = a.id === b.id ? '' : /^[1-5]$/.test(String(raw || '')) ? Number(raw) : v === 'o' ? 'o' : v === 'x' ? 'x' : '';
      if (v === 'o') po++; if (v === 'x') ne++;
      var c = '#ffffff';
      if (a.id === b.id) c = '#d9d9d9';
      else if (v === 'o' && back === 'o') c = '#b7e1cd';
      else if (v === 'x' && back === 'x') c = '#f4c7c3';
      else if ((v === 'o' && back === 'x') || (v === 'x' && back === 'o')) c = '#fce8b2';
      row.push(cell); colors.push(c);
    });
    row.push(r ? po : ''); row.push(r ? ne : '');
    colors.push('#ffffff', '#ffffff');
    grid.push(row); bg.push(colors);
  });
  var oRow = ['○ 받은 수'], xRow = ['X 받은 수'], iRow = ['관심도'], lRow = ['호감도'];
  roster.forEach(function (b) {
    var o = 0, x = 0;
    roster.forEach(function (a) { var r = resp[a.id]; if (r && a.id !== b.id) { var v = nv(r.rel[b.id]); if (v === 'o') o++; if (v === 'x') x++; } });
    oRow.push(o); xRow.push(x); iRow.push(o + x); lRow.push(o - x);
  });
  [oRow, xRow, iRow, lRow].forEach(function (r) { r.push('', ''); grid.push(r); });

  sh.getRange(1, 1, grid.length, n + 3).setValues(grid);
  sh.getRange(2, 1, n, n + 3).setBackgrounds(bg);
  sh.getRange(1, 1, 1, n + 3).setFontWeight('bold').setVerticalText(true);
  sh.getRange(1, 1, grid.length, 1).setFontWeight('bold');
  sh.getRange(1, 2, grid.length, n + 2).setHorizontalAlignment('center');
  sh.setColumnWidths(2, n, 28);
  sh.setFrozenRows(1); sh.setFrozenColumns(1);
  sh.getRange(grid.length + 2, 1, 4, 1).setValues([['녹색: 서로 ○'], ['빨강: 서로 X'], ['노랑: 한쪽 ○, 한쪽 X'], ['가로줄 = 그 학생이 준 표시, 세로줄 = 받은 표시']]);
  return ss.getUrl() + '#gid=' + sh.getSheetId();
}
