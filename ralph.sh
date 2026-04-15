#!/bin/bash
MAX_ITERATIONS=${1:-50}
COMPLETION_PROMISE=${2:-"COMPLETE"}
count=0

echo "=== Ralph Loop 시작: 최대 ${MAX_ITERATIONS}회, 완료 신호: '${COMPLETION_PROMISE}' ==="

while [ $count -lt $MAX_ITERATIONS ]; do
  count=$((count + 1))
  echo "=== Iteration $count / $MAX_ITERATIONS ==="
  
  output=$(cat PROMPT.md | claude -p)
  echo "$output"
  
  if echo "$output" | grep -q "$COMPLETION_PROMISE"; then
    echo "=== 완료! ($count 번째 iteration) ==="
    break
  fi
done

if [ $count -ge $MAX_ITERATIONS ]; then
  echo "=== 최대 횟수 도달 ($MAX_ITERATIONS회) ==="
fi