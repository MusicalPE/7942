/* 7942 성격 강점 — 학생 화면과 선생님 화면이 함께 쓰는 문항·점수·강점 카드
   성격 5요인(Big Five) 틀을 바탕으로, 공개 문항 은행(IPIP)의 내용을 초등학생 말로 새로 쓴 문항이에요.
   유형(꼬리표)을 붙이지 않고, 다섯 가지 힘이 얼마나 자랐는지를 막대로만 보여 줘요. */
var STR = (function () {
  var traits = [
    { k: 'E', name: '어울리는 힘', color: '#FF9F87', soft: '#FFE2DA', desc: '친구들과 함께할 때 힘이 나고, 먼저 다가가는 힘', grow: '아직 이야기를 많이 안 해 본 친구에게 하루 한마디 건네 보기' },
    { k: 'A', name: '배려하는 힘', color: '#5BBF95', soft: '#DDF3E9', desc: '친구 마음을 살피고 기꺼이 돕는 힘', grow: '친구가 말할 때 끝까지 들어 주고, 고맙다는 말 먼저 하기' },
    { k: 'C', name: '끝까지 하는 힘', color: '#E5B42E', soft: '#FFF1C9', desc: '맡은 일을 미루지 않고 끝까지 해내는 힘', grow: '오늘 할 일 세 가지를 적고 하나씩 지워 보기' },
    { k: 'S', name: '마음을 다스리는 힘', color: '#6FA3E0', soft: '#E1ECFA', desc: '속상하거나 화가 나도 마음을 가라앉히는 힘', grow: '화가 나거나 걱정될 때 숨을 크게 세 번 쉬고 마음에 이름 붙여 보기' },
    { k: 'O', name: '궁금해하는 힘', color: '#9C86E8', soft: '#E9E3FB', desc: '새로운 것을 배우고 상상하기를 즐기는 힘', grow: '궁금한 것 하나를 골라 책이나 영상으로 찾아보기' }
  ];
  // r:1 은 거꾸로 셈 (6 - 점수)
  var items = [
    { t: 'E', q: '새로 만난 친구에게 내가 먼저 말을 거는 편이에요.' },
    { t: 'A', q: '친구가 속상해 보이면 먼저 다가가요.' },
    { t: 'C', q: '숙제나 해야 할 일을 미루지 않고 해요.' },
    { t: 'S', q: '속상한 일이 있어도 금방 기분이 나아져요.' },
    { t: 'O', q: '새로운 것을 배우는 게 즐거워요.' },
    { t: 'E', q: '혼자 노는 것보다 여럿이 함께 노는 게 좋아요.' },
    { t: 'A', q: '친구가 도와 달라고 하면 기꺼이 도와줘요.' },
    { t: 'C', q: '한번 시작한 일은 끝까지 해요.' },
    { t: 'S', q: '작은 일에도 걱정이 많은 편이에요.', r: 1 },
    { t: 'O', q: '궁금한 것이 생기면 꼭 찾아봐요.' },
    { t: 'E', q: '친구들 앞에서 말하거나 발표하는 게 크게 어렵지 않아요.' },
    { t: 'A', q: '친구 생각이 나와 달라도 끝까지 들어 줘요.' },
    { t: 'C', q: '내 물건과 자리를 깔끔하게 정리해요.' },
    { t: 'S', q: '실수해도 다시 하면 된다고 생각해요.' },
    { t: 'O', q: '그리기, 만들기, 이야기 짓기처럼 상상하는 활동이 좋아요.' },
    { t: 'E', q: '쉬는 시간에는 조용히 혼자 있는 게 더 좋아요.', r: 1 },
    { t: 'A', q: '내 뜻대로 안 되면 친구에게 화를 내는 편이에요.', r: 1 },
    { t: 'C', q: '해야 할 일을 자주 깜빡해요.', r: 1 },
    { t: 'S', q: '화가 나면 마음을 가라앉히기 어려워요.', r: 1 },
    { t: 'O', q: '늘 하던 방법대로 하는 게 제일 편해요.', r: 1 }
  ];
  var scale = [[1, '전혀 아니에요'], [2, '아닌 편이에요'], [3, '보통이에요'], [4, '그런 편이에요'], [5, '아주 그래요']];
  var roles = ['앞에서 이끄는 사람', '아이디어를 내는 사람', '꼼꼼하게 정리하는 사람', '친구들을 응원하는 사람', '끝까지 확인하는 사람', '맡은 일을 조용히 해내는 사람'];

  function byK(k) { return traits.filter(function (t) { return t.k === k; })[0]; }
  function score(s) {
    if (!s || s.length < items.length) return null;
    var sum = {}, cnt = {};
    items.forEach(function (it, i) { var v = +s[i]; if (!(v >= 1 && v <= 5)) return; if (it.r) v = 6 - v; sum[it.t] = (sum[it.t] || 0) + v; cnt[it.t] = (cnt[it.t] || 0) + 1; });
    var out = {};
    traits.forEach(function (t) { out[t.k] = cnt[t.k] ? Math.round(sum[t.k] / cnt[t.k] * 100) / 100 : null; });
    return out;
  }
  function level(v) {
    if (v == null) return { n: 0, t: '-' };
    return v >= 4.25 ? { n: 4, t: '아주 강해요' } : v >= 3.5 ? { n: 3, t: '강해요' } : v >= 2.75 ? { n: 2, t: '보통이에요' } : { n: 1, t: '자라는 중이에요' };
  }
  function order(sc) { return traits.map(function (t) { return t.k; }).filter(function (k) { return sc && sc[k] != null; }).sort(function (a, b) { return sc[b] - sc[a]; }); }
  function pct(v) { return v == null ? 0 : Math.max(4, Math.round((v - 1) / 4 * 100)); }
  // 응답 한 줄에서 강점 자료 꺼내기 (서술형 첫 칸에 JSON 으로 담아 둠)
  function parse(r) {
    try { var j = JSON.parse(((r && r.answers) || [])[0] || ''); if (j && j.k === 'strength') { j.sc = score(j.s); return j; } } catch (e) {}
    return null;
  }
  function pack(s, rolesPicked, me) { return [JSON.stringify({ k: 'strength', v: 1, s: s, roles: rolesPicked || [], me: me || '' }), me || '']; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bars(sc) {
    return traits.map(function (t) { var v = sc[t.k], L = level(v);
      return '<div class="stb"><div class="stb-n">' + esc(t.name) + '</div><div class="stb-bar" style="background:' + t.soft + '"><i style="width:' + pct(v) + '%;background:' + t.color + '"></i></div><div class="stb-l">' + L.t + '</div></div>'; }).join('');
  }
  // 오각형 그림 (avg 를 주면 반 평균을 점선으로 함께)
  function radar(sc, avg, size) {
    size = size || 300; var c = size / 2, R = size * 0.30, n = traits.length;
    function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * Math.max(0, (v - 1)) / 4; return [c + r * Math.cos(a), c + r * Math.sin(a)]; }
    function poly(f) { return traits.map(function (t, i) { var p = pt(i, f(t)); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
    var g = '';
    for (var lv = 2; lv <= 5; lv++) g += '<polygon points="' + poly(function () { return lv; }) + '" fill="' + (lv === 5 ? '#FFFCF7' : 'none') + '" stroke="#E8DECF" stroke-width="1"/>';
    traits.forEach(function (t, i) { var p = pt(i, 5); g += '<line x1="' + c + '" y1="' + c + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#EFE5D6"/>'; });
    if (avg) g += '<polygon points="' + poly(function (t) { return avg[t.k] || 1; }) + '" fill="none" stroke="#A79C8F" stroke-width="1.6" stroke-dasharray="4 4"/>';
    g += '<polygon points="' + poly(function (t) { return sc[t.k]; }) + '" fill="#8FD3B6" fill-opacity="0.35" stroke="#3E9A7A" stroke-width="2.4" stroke-linejoin="round"/>';
    traits.forEach(function (t, i) { var p = pt(i, sc[t.k]); g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5" fill="' + t.color + '" stroke="#fff" stroke-width="2"/>'; });
    traits.forEach(function (t, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / n, lx = c + (R + 22) * Math.cos(a), ly = c + (R + 22) * Math.sin(a), anc = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle';
      if (Math.sin(a) < -0.9) ly -= 6;
      g += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anc + '" font-size="12.5" font-weight="700" fill="' + t.color + '">' + esc(t.name) + '</text>' +
        '<text x="' + lx.toFixed(1) + '" y="' + (ly + 15).toFixed(1) + '" text-anchor="' + anc + '" font-size="11.5" fill="#5E5750">' + (sc[t.k] == null ? '-' : sc[t.k].toFixed(1)) + ' · ' + ['-', '자라는 중', '보통', '강함', '아주 강함'][level(sc[t.k]).n] + '</text>'; });
    return '<svg class="stc-radar" viewBox="-40 -6 ' + (size + 80) + ' ' + (size + 16) + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>' +
      (avg ? '<div class="stc-leg"><span><i style="background:#3E9A7A"></i>이 학생</span><span><i class="dash"></i>반 평균</span></div>' : '');
  }
  // 학생에게 보여 주는 강점 카드
  function card(name, j, opt) {
    opt = opt || {};
    var sc = j.sc || score(j.s); if (!sc) return '';
    var o = order(sc), top = byK(o[0]), second = byK(o[1]), low = byK(o[o.length - 1]);
    return '<div class="stcard">' +
      '<div class="stc-head"><div class="stc-t">' + esc(name) + '의 강점 카드</div>' + (opt.round ? '<div class="stc-s">' + esc(opt.round) + '</div>' : '') + '</div>' +
      '<div class="stc-top" style="background:' + top.soft + '"><small>나의 가장 큰 힘</small><b style="color:' + top.color + '">' + esc(top.name) + '</b><span>' + esc(top.desc) + '</span></div>' +
      (opt.radar ? '<div class="stc-bars">' + radar(sc, opt.avg) + '</div>' : '<div class="stc-bars">' + bars(sc) + '</div>') +
      ((j.roles || []).length ? '<div class="stc-row"><small>모둠에서 맡고 싶은 역할</small><div>' + j.roles.map(function (r) { return '<span class="stc-chip">' + esc(r) + '</span>'; }).join('') + '</div></div>' : '') +
      (j.me ? '<div class="stc-row"><small>내가 자랑하고 싶은 나의 좋은 점</small><div class="stc-me">' + esc(j.me) + '</div></div>' : '') +
      '<div class="stc-row stc-grow"><small>' + esc(second.name) + '도 나의 힘이에요. 더 키워 볼 힘은 ' + esc(low.name) + '!</small><div>' + esc(low.grow) + '</div></div>' +
      '<div class="stc-foot">강점은 정해진 것이 아니라 자라는 거예요.</div></div>';
  }
  var css = '.stcard{background:#fff;border:2px solid #EFE5D6;border-radius:22px;padding:18px;max-width:420px;margin:0 auto;break-inside:avoid;page-break-inside:avoid;text-align:left}' +
    '.stc-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px}.stc-t{font-family:Jua,sans-serif;font-size:22px;color:#2E2A26}.stc-s{font-size:12px;color:#8A7F73}' +
    '.stc-top{border-radius:16px;padding:12px 14px;margin-bottom:12px;display:flex;flex-direction:column;gap:2px}.stc-top small{font-size:12px;color:#5E5750}.stc-top b{font-family:Jua,sans-serif;font-weight:400;font-size:26px}.stc-top span{font-size:13px;color:#5E5750}' +
    '.stb{display:grid;grid-template-columns:118px 1fr 92px;gap:8px;align-items:center;margin:6px 0}.stb-n{font-size:14px;font-weight:700;color:#3B3631}.stb-bar{height:14px;border-radius:999px;overflow:hidden}.stb-bar i{display:block;height:100%;border-radius:999px}.stb-l{font-size:12px;color:#5E5750;text-align:right}' +
    '.stc-row{margin-top:10px}.stc-row small{display:block;font-size:12px;color:#8A7F73;margin-bottom:3px}.stc-chip{display:inline-block;background:#F6EFE5;border-radius:999px;padding:3px 10px;font-size:13px;margin:2px 4px 2px 0}.stc-me{font-size:14px;line-height:1.5}' +
    '.stc-radar{display:block;width:100%;max-width:360px;margin:0 auto}.stc-leg{display:flex;justify-content:center;gap:14px;font-size:12px;color:#5E5750;margin-top:2px}.stc-leg i{display:inline-block;width:18px;height:0;border-top:3px solid #3E9A7A;vertical-align:middle;margin-right:4px}.stc-leg i.dash{border-top:2px dashed #A79C8F}' +
    '.stc-grow{background:#F7F3EC;border-radius:12px;padding:10px 12px}.stc-grow div{font-size:14px;line-height:1.5}.stc-foot{margin-top:10px;font-size:12px;color:#A79C8F;text-align:center}';
  try { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); } catch (e) {}
  return { traits: traits, items: items, scale: scale, roles: roles, byK: byK, score: score, level: level, order: order, pct: pct, parse: parse, pack: pack, bars: bars, radar: radar, card: card };
})();
