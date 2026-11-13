import asyncio, json
from playwright.async_api import async_playwright
FONTCSS=''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        t=await b.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
        await t.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200,body=FONTCSS,headers={'Content-Type':'text/css','Access-Control-Allow-Origin':'*'}))
        q=await t.new_page(); q.on('pageerror',lambda e: errs.append(str(e)))
        await q.goto('http://localhost:8800/teacher.html?demo'); await q.wait_for_timeout(800)
        await q.fill('#pw','0000'); await q.click('#lg'); await q.wait_for_timeout(500)
        await q.click('.tabs button[data-t="seats"]'); await q.wait_for_timeout(300)
        for size,mode in [(2,'mix'),(2,'close'),(4,'mix'),(2,'even')]:
            await q.select_option('#szSel',str(size)); await q.wait_for_timeout(200)
            await q.check(f'input[name=sm][value={mode}]'); await q.click('#sGo'); await q.wait_for_timeout(300)
            # 검증: 금지 짝 없음, 모든 학생 한 번씩
            r=await q.evaluate("""(function(){var A=analyze(T.rid),o=T.seat,M=seatModel(A,o),ix={};M.studs.forEach(function(s,i){ix[s.id]=i});
              var bad=0,cnt=0,mo=0,sizes=[];o.res.groups.forEach(function(g){sizes.push(g.length);cnt+=g.length;for(var a=0;a<g.length;a++)for(var b=a+1;b<g.length;b++){var p=seatPairInfo(M,ix[g[a]],ix[g[b]]);if(p.cls==='bad')bad++;if(p.cls==='mo')mo++;}});
              var hard=0;for(var i=0;i<M.n;i++)for(var j=i+1;j<M.n;j++)if(M.hard[i][j])hard++;
              return {n:M.n,cnt:cnt,bad:bad,mo:mo,sizes:sizes.join(','),hardPairs:hard};})()""")
            print(size,mode,r)
            await q.screenshot(path=f'/tmp/7942shots/seat_{size}_{mode}.png',full_page=True)
        # 떼어 놓기 + 기억 + 다른 안 + 바꾸기
        await q.select_option('#szSel','2'); await q.check('input[name=sm][value=mix]'); await q.click('#sGo'); await q.wait_for_timeout(200)
        await q.click('#sKeep'); await q.wait_for_timeout(200); await q.click('#sAlt'); await q.wait_for_timeout(300)
        print('rep', await q.inner_text('.seat-sum'))
        n=q.locator('.snm'); await n.nth(0).click(); await q.locator('.snm').nth(3).click(); await q.wait_for_timeout(200)
        print('swap ok', await q.locator('.snm.pk').count())
        print('ERRS',errs); await b.close()
asyncio.run(main())
