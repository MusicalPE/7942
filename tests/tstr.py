import asyncio, json
from playwright.async_api import async_playwright
FONTCSS=''
async def fonts(ctx): await ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200,body=FONTCSS,headers={'Content-Type':'text/css','Access-Control-Allow-Origin':'*'}))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        # 학생
        m=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2); await fonts(m)
        pg=await m.new_page(); pg.on('pageerror',lambda e: errs.append('S:'+str(e)))
        await pg.goto('http://localhost:8800/?demo&str'); await pg.wait_for_timeout(800)
        ins=pg.locator('.codebox input')
        for i,c in enumerate('5821'): await ins.nth(i).type(c)
        await pg.wait_for_timeout(400); await pg.click('#yesBtn'); await pg.wait_for_timeout(300)
        await pg.click('#nextBtn'); print('err1:', await pg.inner_text('#err'))
        pat=[4,5,3,4,5,4,5,3,2,4]
        for i in range(10): await pg.locator(f'.lk[data-i="{i}"] button[data-v="{pat[i]}"]').click()
        await pg.screenshot(path='/tmp/7942shots/s_str1.png')
        await pg.click('#nextBtn'); await pg.wait_for_timeout(200)
        pat2=[4,4,3,4,4,2,2,2,2,3]
        for i in range(10): await pg.locator(f'.lk[data-i="{i+10}"] button[data-v="{pat2[i]}"]').click()
        await pg.click('#nextBtn'); await pg.wait_for_timeout(200)
        await pg.click('#nextBtn'); print('err3:', await pg.inner_text('#err'))
        await pg.click('.roles button >> nth=1'); await pg.click('.roles button >> nth=3'); await pg.click('.roles button >> nth=4'); print('err4:', await pg.inner_text('#err'))
        await pg.fill('#meT','친구들이 힘들 때 잘 들어 줘요'); await pg.screenshot(path='/tmp/7942shots/s_str2.png')
        await pg.click('#nextBtn'); await pg.wait_for_timeout(200); print('review:', (await pg.inner_text('.review'))[:80].replace('\n',' | '))
        await pg.click('#nextBtn'); await pg.wait_for_timeout(200); await pg.click('#mYes'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='/tmp/7942shots/s_str3.png', full_page=True)
        print('card:', await pg.locator('.stcard').count(), (await pg.inner_text('.stc-top'))[:40].replace('\n',' '))
        # 선생님
        t=await b.new_context(viewport={'width':1440,'height':900}); await fonts(t)
        q=await t.new_page(); q.on('pageerror',lambda e: errs.append('T:'+str(e)))
        await q.goto('http://localhost:8800/teacher.html?demo'); await q.wait_for_timeout(800)
        await q.fill('#pw','0000'); await q.click('#lg'); await q.wait_for_timeout(500)
        tabs=await q.locator('.tabs button').all_inner_texts(); print('tabs R2:', tabs)
        await q.click('.tabs button[data-t="strength"]'); await q.wait_for_timeout(800)
        print('strength h2:', (await q.locator('#view h2').first.inner_text()))
        print('notes:', await q.locator('#view .card:has(h2:has-text("함께 살펴볼")) li').count())
        await q.screenshot(path='/tmp/7942shots/t_str.png', full_page=True)
        await q.locator('th[data-k="E"]').click(); await q.wait_for_timeout(200)
        await q.locator('.str-tbl [data-card]').first.click(); await q.wait_for_timeout(200); print('modal card', await q.locator('#modalBox .stcard').count()); await q.evaluate("document.getElementById('modal').classList.add('hide')")
        # 짝 추천 + 강점
        await q.click('.tabs button[data-t="seats"]'); await q.wait_for_timeout(500)
        print('sstr', await q.locator('#sstr').count(), await q.is_checked('#sstr'))
        await q.select_option('#szSel','4'); await q.wait_for_timeout(200); await q.click('#sGo'); await q.wait_for_timeout(500)
        r=await q.evaluate("""(function(){var A=analyze(T.rid),o=T.seat,M=seatModel(A,o),ix={};M.studs.forEach(function(s,i){ix[s.id]=i});var bad=0;o.res.groups.forEach(function(g){for(var a=0;a<g.length;a++)for(var b=a+1;b<g.length;b++){if(seatPairInfo(M,ix[g[a]],ix[g[b]]).cls==='bad')bad++;}});
          var lowE=o.res.groups.filter(function(g){var e=g.map(function(id){return M.sv[ix[id]]}).filter(Boolean).map(function(j){return j.sc.E}); return e.length>1&&Math.max.apply(null,e)<3;}).length; return {bad:bad,lowEgroups:lowE,sv:!!M.sv}})()""")
        print('seats', r)
        rs=await q.locator('.sr li').all_inner_texts(); print('reasons sample', [x for x in rs if '어울리는' in x or '역할' in x][:3])
        # 학생별 보기
        await q.click('.tabs button[data-t="student"]'); await q.wait_for_timeout(500); print('student card', await q.locator('#view .stcard').count())
        # AI 자료에 강점
        pl=await q.evaluate("JSON.stringify(aiPayload(T.rid).data).indexOf('성격강점')>=0"); print('ai payload has strength', pl)
        # R3 고르기 → 탭 줄어듦
        await q.select_option('#rsel','R3'); await q.wait_for_timeout(600)
        print('tabs R3:', await q.locator('.tabs button').all_inner_texts(), 'cur', await q.evaluate('T.tab'))
        await q.click('.tabs button[data-t="settings"]'); await q.wait_for_timeout(300)
        await q.fill('#strTitle','우리 반 강점 찾기'); await q.click('#save'); await q.wait_for_timeout(500)
        print('kind kept', await q.evaluate("round('R3').settings.kind"), await q.evaluate("round('R3').settings.strTitle"))
        # 회차 비교: 교우관계 회차만
        await q.select_option('#rsel','R2'); await q.wait_for_timeout(500)
        await q.click('.tabs button[data-t="compare"]'); await q.wait_for_timeout(600)
        print('compare opts', await q.locator('#view select').first.locator('option').all_inner_texts())
        # 새 성격 강점 회차 만들기
        await q.click('#newR'); await q.wait_for_timeout(200); await q.check('input[name=rk][value=strength]'); print('name', await q.input_value('#rn'))
        await q.click('#modalBox .row button.main'); await q.wait_for_timeout(800)
        print('new kind', await q.evaluate("round().settings.kind"), await q.evaluate('T.tab'), 'friend settings kept', await q.evaluate("round().settings.questions.length"))
        await q.click('#newR'); await q.wait_for_timeout(200); await q.click('#modalBox .row button.main'); await q.wait_for_timeout(800)
        print('next friend kind', repr(await q.evaluate("round().settings.kind")), 'tabs', len(await q.locator('.tabs button').all_inner_texts()))
        print('ERRS', errs); await b.close()
asyncio.run(main())
