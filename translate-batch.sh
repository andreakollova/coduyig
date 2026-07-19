#!/bin/bash
# Batch translate quiz questions + options to Slovak
# Usage: OPENAI_API_KEY=sk-... bash translate-batch.sh

set -e

source .env 2>/dev/null || true

SB_URL="${SUPABASE_URL}/rest/v1"
SB_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
OAI="${OPENAI_API_KEY}"

if [ -z "$OAI" ]; then
  echo "ERROR: OPENAI_API_KEY not set. Run: OPENAI_API_KEY=sk-... bash translate-batch.sh"
  exit 1
fi

HEADERS=(-H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY" -H "Content-Type: application/json")
BATCH=20

translate_batch() {
  local json_array="$1"
  local result
  result=$(curl -s "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer $OAI" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "
import json, sys
texts = json.loads('''$json_array''')
prompt = 'Translate these English texts to Slovak (slovenčina). NEVER use Czech. Return JSON: {\"translations\": [\"...\", ...]}\n\nTexts:\n' + json.dumps(texts)
print(json.dumps({
  'model': 'gpt-4o-mini',
  'messages': [{'role': 'user', 'content': prompt}],
  'temperature': 0.2,
  'max_tokens': 4000,
  'response_format': {'type': 'json_object'}
}))
")")
  echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
content = data.get('choices', [{}])[0].get('message', {}).get('content', '{}')
parsed = json.loads(content)
if isinstance(parsed, list):
    print(json.dumps(parsed))
elif 'translations' in parsed:
    print(json.dumps(parsed['translations']))
else:
    vals = list(parsed.values())
    if vals and isinstance(vals[0], list):
        print(json.dumps(vals[0]))
    else:
        print(json.dumps(vals))
"
}

echo "=== Translating Questions ==="
total_q=0

while true; do
  # Fetch batch of untranslated questions
  batch=$(curl -s "$SB_URL/cb_quiz_questions?select=id,question_text&question_text_sk=is.null&order=id&limit=$BATCH" "${HEADERS[@]}")

  count=$(echo "$batch" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
  if [ "$count" = "0" ]; then
    echo "  All questions translated!"
    break
  fi

  # Extract texts
  texts=$(echo "$batch" | python3 -c "import sys,json; print(json.dumps([q['question_text'] for q in json.load(sys.stdin)]))")
  ids=$(echo "$batch" | python3 -c "import sys,json; print(json.dumps([q['id'] for q in json.load(sys.stdin)]))")

  # Translate
  translations=$(translate_batch "$texts")

  # Update each
  echo "$batch" | python3 -c "
import sys, json, urllib.request
ids = json.loads('$ids')
translations = json.loads('$(echo "$translations" | sed "s/'/'\\\\''/g")')
for i, qid in enumerate(ids):
    if i >= len(translations): break
    sk = translations[i]
    url = '${SB_URL}/cb_quiz_questions?id=eq.' + str(qid)
    data = json.dumps({'question_text_sk': sk}).encode()
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header('apikey', '${SB_KEY}')
    req.add_header('Authorization', 'Bearer ${SB_KEY}')
    req.add_header('Content-Type', 'application/json')
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f'  Error q={qid}: {e}')
" 2>/dev/null

  total_q=$((total_q + count))
  echo "  Questions translated: $total_q"
  sleep 0.5
done

echo ""
echo "=== Translating Options ==="
total_o=0

while true; do
  batch=$(curl -s "$SB_URL/cb_quiz_options?select=id,option_text&option_text_sk=is.null&order=id&limit=40" "${HEADERS[@]}")

  count=$(echo "$batch" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
  if [ "$count" = "0" ]; then
    echo "  All options translated!"
    break
  fi

  texts=$(echo "$batch" | python3 -c "import sys,json; print(json.dumps([o['option_text'] for o in json.load(sys.stdin)]))")
  ids=$(echo "$batch" | python3 -c "import sys,json; print(json.dumps([o['id'] for o in json.load(sys.stdin)]))")

  translations=$(translate_batch "$texts")

  echo "$batch" | python3 -c "
import sys, json, urllib.request
ids = json.loads('$ids')
translations = json.loads('$(echo "$translations" | sed "s/'/'\\\\''/g")')
for i, oid in enumerate(ids):
    if i >= len(translations): break
    sk = translations[i]
    url = '${SB_URL}/cb_quiz_options?id=eq.' + str(oid)
    data = json.dumps({'option_text_sk': sk}).encode()
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header('apikey', '${SB_KEY}')
    req.add_header('Authorization', 'Bearer ${SB_KEY}')
    req.add_header('Content-Type', 'application/json')
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f'  Error opt={oid}: {e}')
" 2>/dev/null

  total_o=$((total_o + count))
  echo "  Options translated: $total_o"
  sleep 0.5
done

echo ""
echo "=== DONE: $total_q questions + $total_o options translated ==="
