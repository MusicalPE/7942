// Code.gs 를 가짜 구글 환경에서 돌리는 시험용 서버
const { execSync } = require('child_process');
const fs = require('fs'), vm = require('vm'), http = require('http'), crypto = require('crypto');

function makeSheet(name) {
  const sh = { name, data: [], id: Math.floor(Math.random() * 1e6) };
  const get = (r, c) => (sh.data[r - 1] && sh.data[r - 1][c - 1] !== undefined ? sh.data[r - 1][c - 1] : '');
  const set = (r, c, v) => { while (sh.data.length < r) sh.data.push([]); sh.data[r - 1][c - 1] = v; };
  const lastRow = () => { let n = sh.data.length; while (n > 0 && (sh.data[n - 1] || []).every(v => v === '' || v == null)) n--; return n; };
  const lastCol = () => Math.max(0, ...sh.data.map(r => r.length));
  function range(r, c, nr, nc) {
    nr = nr || 1; nc = nc || 1;
    const R = {
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => get(r + i, c + j))),
      setValues: (v) => { v.forEach((row, i) => row.forEach((x, j) => set(r + i, c + j, x))); return R; },
      setValue: (x) => { set(r, c, x); return R; },
      clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) set(r + i, c + j, ''); return R; },
    };
    ['setFontWeight', 'setBackground', 'setBackgrounds', 'setNumberFormat', 'setVerticalText', 'setHorizontalAlignment'].forEach(k => R[k] = () => R);
    return R;
  }
  Object.assign(sh, {
    getRange: (a, b, c, d) => typeof a === 'string' ? range(1, 5, 1, 1) : range(a, b, c, d),
    getDataRange: () => range(1, 1, Math.max(1, lastRow()), Math.max(1, lastCol())),
    getLastRow: lastRow,
    appendRow: (row) => { const r = lastRow() + 1; row.forEach((v, j) => set(r, j + 1, v)); },
    deleteRow: (r) => { sh.data.splice(r - 1, 1); },
    clear: () => { sh.data = []; },
    setFrozenRows: () => {}, setFrozenColumns: () => {}, setColumnWidths: () => {},
    getSheetId: () => sh.id,
  });
  return sh;
}
const sheets = {};
const ss = {
  getSheetByName: n => sheets[n] || null,
  insertSheet: n => (sheets[n] = makeSheet(n)),
  getUrl: () => 'https://docs.google.com/spreadsheets/d/TEST',
};
const props = {}, cache = {};
const ctx = {
  console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ({}) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ get: k => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; } }) },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)),
    getUuid: () => crypto.randomUUID(),
    formatDate: (d, tz, f) => d.toISOString().slice(0, f.length > 10 ? 16 : 10).replace('T', ' '),
  },
  Session: { getScriptTimeZone: () => 'Asia/Seoul' },
  ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TESTKEY/exec' }) },
  UrlFetchApp: { fetch: (url, o) => { const m = url.match(/\/s\/([^/]+)\/exec/); const port = m && m[1].indexOf('REG') >= 0 ? 8798 : 8799;
      const out = execSync(`curl -s -X POST --data-binary @- http://localhost:${port}/`, { input: o.payload }).toString();
      return { getContentText: () => out }; } },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8'), ctx);

http.createServer((req, res) => {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const out = req.method === 'POST' ? ctx.doPost({ postData: { contents: body } }) : ctx.doGet();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(out.s);
    if (req.method === 'POST') { try { const q = JSON.parse(body); const o = JSON.parse(out.s); console.log(q.fn, o.ok ? 'ok' : 'ERR ' + o.error); } catch (e) {} }
  });
}).listen(Number(process.argv[3]||8799), () => console.log('mock on', process.argv[3]||8799));
