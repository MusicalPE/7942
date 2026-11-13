import asyncio, json, re
from playwright.async_api import async_playwright
FONTCSS=''
SENT={}
async def gem(route, request):
    body=request.post_data or ''; SENT['b']=body
    txt=json.loads(body)['contents'][0]['parts'][0]['text']
    data=json.loads(txt.split('자료:\n',1)[1])
    gs=data['추천한_자리']
    out={"한줄평":"갈등 없이 새 친구를 만나는 고른 배치예요.",
      "짝별의견":[{"번호":g['번호'],"의견":g['학생'][0]+"이 "+g['학생'][1]+"와 함께 새로운 관계를 만들 수 있어요.","살펴볼점":"" if g['번호']%3 else "처음엔 어색할 수 있어요."} for g in gs],
      "바꿔볼만한곳":[{"내용":"짝 3의 "+gs[2]['학생'][0]+"와 짝 7의 "+gs[6]['학생'][1]+" 자리 바꾸기","까닭":"둘 다 활발해서 짝을 나누면 균형이 맞아요."}],
      "처음일주일살펴볼점":[gs[0]['학생'][0]+"가 짝과 잘 지내는지"],"학생들에게할말":"새 짝과 서로 좋은 점을 하나씩 찾아봐요."}
    await asyncio.sleep(1.2)
    await route.fulfill(status=200, body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(out,ensure_ascii=False)}]}}]}), headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'})
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        t=await b.new_context(viewport={'width':1440,'height':900})
        await t.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200,body=FONTCSS,headers={'Content-Type':'text/css','Access-Control-Allow-Origin':'*'}))
        await t.route('https://generativelanguage.googleapis.com/**', gem)
        q=await t.new_page(); q.on('pageerror',lambda e: errs.append(str(e)))
        await q.goto('http://localhost:8800/teacher.html?demo'); await q.wait_for_timeout(800)
        await q.fill('#pw','0000'); await q.click('#lg'); await q.wait_for_timeout(500)
        await q.evaluate("lsSet('7942_gemini_key','AIzaTEST')")
        await q.click('.tabs button[data-t="seats"]'); await q.click('#sGo'); await q.wait_for_timeout(300)
        await q.click('#seatAIGo'); await q.wait_for_timeout(400)
        print('running:', await q.inner_text('#seatAI'))
        # 탭 옮겼다 돌아오기
        await q.click('.tabs button[data-t="matrix"]'); await q.wait_for_timeout(1500)
        await q.click('.tabs button[data-t="seats"]'); await q.wait_for_timeout(300)
        print('done:', (await q.inner_text('#seatAI'))[:200].replace('\n',' | '))
        print('cards with AI', await q.locator('.sai').count())
        names=await q.evaluate("T.roster.map(function(s){return s.name})")
        body=SENT['b']; leak=[n for n in names if n in json.loads(body)['contents'][0]['parts'][0]['text']]
        print('name leak', leak, 'len', len(body))
        print('first card', (await q.locator('.seat').first.inner_text()).replace('\n',' | '))
        # 자리 바꾸면 의견 초기화
        await q.locator('.snm').nth(0).click(); await q.locator('.snm').nth(3).click(); await q.wait_for_timeout(200)
        print('after swap', (await q.inner_text('#seatAI'))[:40].replace('\n',' '), await q.locator('.sai').count())
        await q.screenshot(path='/tmp/7942shots/seat_ai.png', full_page=True)
        print('ERRS',errs); await b.close()
asyncio.run(main())
