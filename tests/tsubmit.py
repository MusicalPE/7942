import asyncio, json, urllib.request
from playwright.async_api import async_playwright
def api(fn,*args):
    j=json.loads(urllib.request.urlopen(urllib.request.Request('http://localhost:8799/',data=json.dumps({'fn':fn,'args':list(args)}).encode())).read())
    if not j['ok']: raise Exception(j['error'])
    return j['data']
KEY='AKfycbTESTSHELLKEY0123456789abcdefghijklmnopqrstuvwxyz'
tk=api('teacherLogin','0000')
api('saveRoster',tk,[{'no':1,'name':'김하늘','gender':'여'},{'no':2,'name':'박도윤','gender':'남'},{'no':3,'name':'이서아','gender':'여'},{'no':4,'name':'최민준','gender':'남'}])
init=api('teacherInit',tk); rs=api('createRound',tk,'1회차'); rid=rs[-1]['id']
code=init['roster'][0]['code']
async def route(r):
    resp=urllib.request.urlopen(urllib.request.Request('http://localhost:8799/',data=(r.request.post_data or '').encode()))
    await r.fulfill(status=200,body=resp.read(),headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'})
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); c=await b.new_context(viewport={'width':390,'height':844}); errs=[]
        await c.route('https://fonts.googleapis.com/**', lambda r: r.abort()); await c.route('https://script.google.com/**', route)
        pg=await c.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8800/?k='+KEY); await pg.wait_for_timeout(1200)
        ins=pg.locator('.codebox input')
        for i,ch in enumerate(code): await ins.nth(i).type(ch)
        await pg.wait_for_timeout(1200); await pg.click('#yesBtn'); await pg.wait_for_timeout(400)
        for i in range(await pg.locator('textarea[data-a]').count()): await pg.fill(f'textarea[data-a="{i}"]','좋아요 친구들')
        await pg.click('#nextBtn'); await pg.wait_for_timeout(300)
        rows=pg.locator('.friend')
        for r in range(await rows.count()): await rows.nth(r).locator('button').nth(r%3).click()
        for step in range(6):
            t=await pg.inner_text('#nextBtn')
            if t=='제출하기': break
            # 칭찬 단계면 고르기
            if await pg.locator('select[data-p="0"]').count():
                for k in range(await pg.locator('select[data-p]').count()):
                    await pg.select_option(f'select[data-p="{k}"]',index=1); await pg.fill(f'textarea[data-pr="{k}"]','잘 도와줘요')
            if await pg.locator('#msg').count(): await pg.fill('#msg','고맙습니다')
            await pg.click('#nextBtn'); await pg.wait_for_timeout(300)
            e=await pg.inner_text('#err')
            if e: print('step err', e)
        await pg.click('#nextBtn'); await pg.wait_for_timeout(300); await pg.click('#mYes'); await pg.wait_for_timeout(1500)
        print('result:', (await pg.inner_text('#app'))[:40].replace('\n',' '), errs)
        d=api('getRoundData',tk,rid); print('saved responses:', len(d['responses']), 'rel count', len(d['responses'][0]['rel']) if d['responses'] else 0)
        await b.close()
asyncio.run(main())
