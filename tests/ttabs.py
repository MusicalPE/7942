# 모든 탭을 PC·휴대폰 크기로 열어 보고 오류가 없는지
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); bad=[]
        for vw in [(1440,900),(390,844)]:
            c=await b.new_context(viewport={'width':vw[0],'height':vw[1]})
            await c.route('https://fonts.googleapis.com/**', lambda r: r.abort())
            pg=await c.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:8800/teacher.html?demo'); await pg.wait_for_timeout(800)
            await pg.fill('#pw','0000'); await pg.click('#lg'); await pg.wait_for_timeout(500)
            for rid in ['R1','R2','R3']:
                await pg.select_option('#rsel',rid); await pg.wait_for_timeout(500)
                tabs=await pg.locator('.tabs button').evaluate_all('a=>a.map(x=>x.dataset.t)')
                for t in tabs:
                    await pg.click(f'.tabs button[data-t="{t}"]'); await pg.wait_for_timeout(500)
                    txt=await pg.inner_text('#view')
                    if len(txt.strip())<10: bad.append(f'{vw[0]} {rid} {t}: 빈 화면')
            if errs: bad.append(f'{vw[0]} 오류: {errs[:3]}')
            await c.close()
        print('TABS', 'PASS' if not bad else 'FAIL '+str(bad)); await b.close()
asyncio.run(main())
