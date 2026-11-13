#!/bin/bash
# 7942 전체 시험: 기능을 고쳤을 때 올리기 전에 돌리기 (bash tests/full.sh)
cd "$(dirname "$0")"; ROOT="$(cd .. && pwd)"
pkill -f "http.server 880" ; pkill -f gasmock.js
(cd "$ROOT" && python3 -m http.server 8800 > /tmp/http.log 2>&1 &)
sleep 1
fail=0
python3 check.py || fail=1
run(){ name=$1; shift; out=$(timeout 200 "$@" 2>&1); code=$?; echo "$out" > /tmp/reg_$name.log
  if [ $code -ne 0 ] || echo "$out" | grep -qiE "FAIL|Traceback|Error:|bad': [1-9]|'bad': [1-9]"; then echo "FAIL $name (/tmp/reg_$name.log)"; fail=1; else echo "ok   $name"; fi; }
n=$(python3 tload.py | grep -c "ERR \[\]"); [ "$n" = "6" ] && echo "ok   pages-load" || { echo "FAIL pages-load ($n/6)"; fail=1; }
run tabs python3 ttabs.py
run student-strength python3 tstr.py
run seats python3 tseat.py
run seat-ai python3 tseatai.py
run strength-ai python3 tstrai.py
(node gasmock.js $ROOT/shell/Code.gs 8799 > /tmp/m1.log 2>&1 &); sleep 1.5
run friend-submit python3 tsubmit.py
grep -q "saved responses: 1" /tmp/reg_friend-submit.log || { echo "FAIL friend-submit (저장 안 됨)"; fail=1; }
pkill -f gasmock.js
(node gasmock.js $ROOT/shell/Code.gs 8799 > /tmp/m1.log 2>&1 &); (node gasmock.js $ROOT/registry/Code.gs 8798 > /tmp/m2.log 2>&1 &); sleep 1.5
run share-seed python3 tshare.py
run share-link python3 tshare2.py
pkill -f gasmock.js; pkill -f "http.server 880"
[ $fail = 0 ] && echo "ALL PASS" || echo "SOME FAILED"
