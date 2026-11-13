import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import asyncio, json, urllib.request
from playwright.async_api import async_playwright
C=json.load(open('/tmp/share.json')); KEY=C['KEY']
REGURL=open(ROOT+'/config.js').read().split("REGISTRY_URL='")[1].split("'")[0] if "REGISTRY_URL='" in open(ROOT+'/config.js').read() else None
async def route(r):
    url=r.request.url; port=8798 if 'AKfycbyMtTZkspnQU8jaPJrW2kTmHVFgpOlho' in url else 8799
    body=r.request.post_data or ''
    resp=urllib.request.urlopen(urllib.request.Request(f'http://localhost:{port}/',data=body.encode()))
    await r.fulfill(status=200,body=resp.read(),headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'})
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); c=await b.new_context(viewport={'width':1300,'height':900}); errs=[]
        await c.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        await c.route('https://script.google.com/**', route)
        pg=await c.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8800/teacher.html?k='+KEY); await pg.wait_for_timeout(1500)
        await pg.fill('#pw','0000'); await pg.click('#lg'); await pg.wait_for_timeout(1200)
        print('shellVer', await pg.evaluate('T.shellVer'))
        await pg.click('.tabs button[data-t="strength"]'); await pg.wait_for_timeout(1200)
        await pg.locator('.str-tbl [data-card]').first.click(); await pg.wait_for_timeout(300)
        print('hint shown?', await pg.locator('#modalBox .str-share span[style*=B4482F]').count())
        await pg.fill('#shMsg','노래로 반을 밝혀 줘서 고마워요!')
        await pg.click('#shQR'); await pg.wait_for_timeout(1500)

        u=await pg.inner_text('#shQRbox .sub'); print('short url:', u, len(u))
        q=await c.new_page(); q.on('pageerror',lambda e: errs.append('card:'+str(e)))
        await q.goto(u); await q.wait_for_timeout(1500)
        print('card:', await q.inner_text('.stc-t'), '|', (await q.inner_text('.msg')).replace('\n',' '))
        # 같은 학생 다시 → 같은 토큰, 한마디만 바뀜
        await pg.fill('#shMsg',''); await pg.click('#shQR'); await pg.wait_for_timeout(1200)
        u2=(await pg.inner_text('#shQRbox .sub')); print('same token', u2==u)
        await q.goto(u2+'&x=1'); await q.wait_for_timeout(1200); print('msg removed', await q.locator('.msg').count()==0)
        # 일괄 QR
        await pg.evaluate("document.getElementById('modal').classList.add('hide')")
        async with c.expect_page() as np:
            await pg.click('#strQR')
        w=await np.value; await w.evaluate('window.print=function(){}'); await w.wait_for_timeout(2500)
        print('bulk qr', await w.locator('.c svg').count())
        # 반 코드 대신 k&t 형식
        tok=u.split('-')[-1]
        await q.goto(f'http://localhost:8800/card.html?k={KEY}&t={tok}'); await q.wait_for_timeout(1200); print('k&t:', await q.inner_text('.stc-t'))
        await q.goto('http://localhost:8800/card.html?c=47171-zzzzzz'); await q.wait_for_timeout(1200); print('bad:', (await q.inner_text('.err'))[:30])
        print('ERRS',errs); await b.close()
asyncio.run(main())
