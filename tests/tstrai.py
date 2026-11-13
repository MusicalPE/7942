import asyncio, json
from playwright.async_api import async_playwright
FONTCSS=''
SENT=[]
async def gem(route, request):
    body=request.post_data or ''; txt=json.loads(body)['contents'][0]['parts'][0]['text']; SENT.append(txt)
    data=json.loads(txt.split('자료:\n',1)[1])
    if '분석할_학생' in data:
        me=data['분석할_학생']['학생']
        out={"한줄요약":me+"은 친구를 잘 챙기는 따뜻한 학생이에요.","강점풀이":"배려하는 힘이 가장 커요.","친구관계와함께":"서로 ○ 친구가 3명이에요.","교실에서살리기":["모둠 응원 역할","새 친구 도우미"],"키워줄힘":"끝까지 하는 힘을 작은 목표로 키워요.","상담때물어볼말":["요즘 모둠 활동은 어때?"],"학생에게해줄말":me+"이가 친구를 도와줄 때 반이 따뜻해져요."}
    else:
        out={"한줄요약":"배려가 강한 반이에요.","우리반의힘":"배려하는 힘 평균이 높아요.","모둠활동제안":["어울리는 힘이 강한 학생을 모둠마다 한 명씩"],"살펴볼학생":[{"학생":data['학생'][3]['학생'],"까닭":"마음을 다스리는 힘이 자라는 중이에요.","도움":"이야기를 들어 주세요."}],"학급활동제안":[{"활동":"강점 칭찬 릴레이","방법":"서로의 강점을 찾아 적어요."}]}
    await asyncio.sleep(1.0)
    await route.fulfill(status=200, body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(out,ensure_ascii=False)}]}}]}), headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'})
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        t=await b.new_context(viewport={'width':1300,'height':900})
        await t.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200,body=FONTCSS,headers={'Content-Type':'text/css','Access-Control-Allow-Origin':'*'}))
        await t.route('https://generativelanguage.googleapis.com/**', gem)
        q=await t.new_page(); q.on('pageerror',lambda e: errs.append(str(e)))
        await q.goto('http://localhost:8800/teacher.html?demo'); await q.wait_for_timeout(800)
        await q.fill('#pw','0000'); await q.click('#lg'); await q.wait_for_timeout(500)
        await q.evaluate("lsSet('7942_gemini_key','AIzaTEST')")
        await q.click('.tabs button[data-t="strength"]'); await q.wait_for_timeout(700)
        await q.click('#strAI_class .strAIRe'); await q.wait_for_timeout(300); print('class running:', await q.inner_text('#strAI_class'))
        await q.wait_for_timeout(1500); print('class done:', (await q.inner_text('#strAI_class'))[:160].replace('\n',' | '))
        await q.locator('.str-tbl [data-card]').nth(1).click(); await q.wait_for_timeout(300)
        await q.click('#modalBox .strAIRe'); await q.wait_for_timeout(1600)
        print('stu:', (await q.inner_text('#modalBox .str-ai'))[:200].replace('\n',' | '))
        await q.locator('#modalBox .str-ai').screenshot(path='/tmp/7942shots/str_ai.png')
        names=await q.evaluate("T.roster.map(function(s){return s.name})")
        print('leak', [n for t in SENT for n in names if n in t])
        # 다시 열면 저장된 해석이 바로 보이는지
        await q.evaluate("document.getElementById('modal').classList.add('hide')"); await q.locator('.str-tbl [data-card]').nth(1).click(); await q.wait_for_timeout(200)
        print('cached', await q.locator('#modalBox .str-say').count(), errs)
        await b.close()
asyncio.run(main())
