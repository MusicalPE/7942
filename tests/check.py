#!/usr/bin/env python3
# 7942 코드 검사 (단순 수정 때): 문법·괄호 짝, 없는 함수 부르기, 없는 단추 id, 판 번호
import re, subprocess, sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); R=os.path.dirname(HERE); T=HERE+'/chk_tmp'; os.makedirs(T,exist_ok=True); bad=[]
def rd(p): return open(os.path.join(R,p),encoding='utf8').read()
pages=['index.html','teacher.html','card.html']; files=[]
for p in pages:
    s=rd(p)
    for i,m in enumerate(re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',s,re.S)):
        f=f'{T}/{p}.{i}.js'; open(f,'w',encoding='utf8').write(m.group(1)); files.append((f,p))
    # 3) 단추 id: getElementById('글자') 가 가리키는 id 가 그 파일에 있는지
    ids=set(re.findall(r'''id=\\?["']([\w-]+)''',s))|set(re.findall(r'''\.id\s*=\s*['"]([\w-]+)''',s))
    for g in sorted(set(re.findall(r'''getElementById\('([\w-]+)'\)''',s))):
        # id 를 함수로 만들어 붙이는 곳(sel('ca') 같은)은 그 글자가 다른 데서도 쓰이면 있는 것으로 봄
        made=s.count("'"+g+"'")>s.count("getElementById('"+g+"')") and 'id="\'+' in s
        if g not in ids and not made: bad.append(f'{p}: id "{g}" 를 찾는데 그런 id 가 없어요')
    # 인라인 onclick 이 부르는 함수
    defs=set(re.findall(r'function\s+(\w+)\s*\(',s))
    for h in re.findall(r'''on(?:click|change|input)=\\?["']\s*(\w+)\(''',s):
        if h not in defs: bad.append(f'{p}: 단추가 부르는 함수 {h}() 가 없어요')
for p in ['strength.js','config.js','sw.js','shell/Code.gs','registry/Code.gs']:
    f=f'{T}/{p.replace("/","_")}.js'; open(f,'w',encoding='utf8').write(rd(p)); files.append((f,p))
# 1) 문법 (따옴표·괄호 짝 포함)
for f,p in files:
    r=subprocess.run(['node','-e',"new (require('vm').Script)(require('fs').readFileSync(process.argv[1],'utf8'))",f],capture_output=True,text=True)
    if r.returncode: bad.append(f'{p}: 문법 오류 — '+r.stderr.strip().split('\n')[4 if len(r.stderr.strip().split(chr(10)))>4 else -1][:120])
# 2) 없는 함수·변수 부르기 (eslint no-undef) — 처음 한 번은 검사 도구를 받아 옴
if not os.path.isdir(HERE+'/node_modules/eslint'): subprocess.run(['npm','i','-s'],cwd=HERE)
cfg=f'''const g=require("globals");
const own={{STR:"readonly",qrcode:"readonly",REGISTRY_URL:"readonly",AI_CONFIG:"readonly"}};
const gas={{}}; ["SpreadsheetApp","CacheService","PropertiesService","LockService","Utilities","ContentService","HtmlService","UrlFetchApp","ScriptApp","Session","Logger"].forEach(k=>gas[k]="readonly");
module.exports=[{{files:["**/*.js"],languageOptions:{{ecmaVersion:2022,sourceType:"script",globals:{{...g.browser,...g.serviceworker,...own,...gas}}}},rules:{{"no-undef":"error"}}}}];'''
open(HERE+'/eslint.config.js','w').write(cfg)
r=subprocess.run(['npx','eslint','--no-warn-ignored','-c',HERE+'/eslint.config.js','-f','json']+[f for f,_ in files],capture_output=True,text=True,cwd=HERE)
try:
    name=dict(files)
    for res in json.loads(r.stdout):
        for m in res['messages']:
            if m.get('ruleId')=='no-undef' or m.get('fatal'): bad.append(f"{name.get(res['filePath'],res['filePath'])}: {m['message']} (줄 {m['line']})")
except Exception as e: bad.append('eslint 실행 실패: '+(r.stderr or str(e))[:200])
# 4) 판 번호
v={p:re.search(r"APP_VER='([\d.]+)'",rd(p)).group(1) for p in ['index.html','teacher.html']}
if len(set(v.values()))>1: bad.append(f'판 번호가 달라요: {v}')
sv=re.search(r'SHELL_VER\s*=\s*(\d+)',rd('shell/Code.gs')).group(1); sl=re.search(r'SHELL_LATEST=(\d+)',rd('teacher.html')).group(1)
if sv!=sl: bad.append(f'껍데기 판이 달라요: Code.gs {sv}판, 선생님 화면 안내 {sl}판')
print('코드 검사:', '통과' if not bad else f'{len(bad)}건 걸림', f"(판 {sorted(set(v.values()))}, 껍데기 {sv}판)")
for b in bad: print('  -',b)
sys.exit(1 if bad else 0)
