import asyncio
from playwright.async_api import async_playwright
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for path in ['teacher.html?k=AKfycbzT5eAb4Cqg7kJAcs4D3ljv6Hr0lIhOxK9NsK0f2iMOe53EG7NWiKi9popvxzRT51Y3AA','teacher.html','teacher.html?demo','?k=AKfycbzT5eAb4Cqg7kJAcs4D3ljv6Hr0lIhOxK9NsK0f2iMOe53EG7NWiKi9popvxzRT51Y3AA','?demo','']:
            pg=await b.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.route('https://fonts.googleapis.com/**', lambda r: r.abort())
            await pg.goto('http://localhost:8800/'+path); await pg.wait_for_timeout(800)
            print(path[:30].ljust(30), 'text', len(await pg.inner_text('body')), 'url', pg.url[22:60], 'ERR', errs)
            await pg.close()
        await b.close()
asyncio.run(m())
