import json, urllib.request, asyncio
def api(port,fn,*args):
    r=urllib.request.urlopen(urllib.request.Request(f'http://localhost:{port}/',data=json.dumps({'fn':fn,'args':list(args)}).encode()))
    j=json.loads(r.read())
    if not j['ok']: raise Exception(j['error'])
    return j['data']
KEY='AKfycbTESTSHELLKEY0123456789abcdefghijklmnopqrstuvwxyz'
tk=api(8799,'teacherLogin','0000')
ros=api(8799,'saveRoster',tk,[{'no':1,'name':'김하늘','gender':'여'},{'no':2,'name':'박도윤','gender':'남'},{'no':3,'name':'이서아','gender':'여'}])
ros=api(8799,'teacherInit',tk)['roster'] if 'roster' in api(8799,'teacherInit',tk) else None
init=api(8799,'teacherInit',tk); print('shell', init.get('shell'), 'keys', list(init.keys())[:6])
rs=api(8799,'createRound',tk,'성격 강점(11월)'); rid=rs[-1]['id']; st=rs[-1]['settings']; st['kind']='strength'
api(8799,'updateRound',tk,rid,{'settings':st})
for i,s in enumerate(init['roster']):
    lg=api(8799,'studentLogin',s['code'])
    ans=[json.dumps({'k':'strength','v':1,'s':[4,5,3,4,5,4,5,3,2,4,4,4,3,4,4,2,2,2,2,3],'roles':['아이디어를 내는 사람'],'me':'노래를 잘해요'},ensure_ascii=False),'노래를 잘해요']
    api(8799,'studentSubmit',lg['token'],{'answers':ans,'rel':{},'praise':[],'conflict':[],'message':''})
cc=api(8798,'register',KEY); print('class code', cc)
print('getCard bad:', end=' ')
try: api(8799,'getCard','zzzzzz')
except Exception as e: print(e)
json.dump({'KEY':KEY,'cc':cc},open('/tmp/share.json','w'))
