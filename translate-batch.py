#!/usr/bin/env python3
"""Batch translate quiz questions + options to Slovak."""

import json
import os
import sys
import time
import urllib.request
import urllib.error
import ssl

# Disable SSL verification (macOS Python issue)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

SB_URL = os.environ["SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OAI_KEY = os.environ["OPENAI_API_KEY"]

SB_HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}

def sb_get(path):
    url = f"{SB_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=SB_HEADERS)
    with urllib.request.urlopen(req, context=ctx) as resp:
        return json.loads(resp.read())

def sb_patch(table, row_id, data):
    url = f"{SB_URL}/rest/v1/{table}?id=eq.{row_id}"
    payload = json.dumps(data).encode()
    req = urllib.request.Request(url, data=payload, headers=SB_HEADERS, method="PATCH")
    try:
        urllib.request.urlopen(req, context=ctx)
    except urllib.error.HTTPError as e:
        print(f"  PATCH error {table} id={row_id}: {e.code}")

def translate(texts):
    prompt = (
        "Translate these English texts to Slovak (slovenčina). "
        "NEVER use Czech words. Return JSON: {\"translations\": [\"...\", ...]}\n\n"
        f"Texts:\n{json.dumps(texts, ensure_ascii=False)}"
    )
    body = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 4000,
        "response_format": {"type": "json_object"},
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {OAI_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, context=ctx) as resp:
        data = json.loads(resp.read())

    content = data["choices"][0]["message"]["content"]
    parsed = json.loads(content)

    if isinstance(parsed, list):
        return parsed
    if "translations" in parsed:
        return parsed["translations"]
    vals = list(parsed.values())
    if vals and isinstance(vals[0], list):
        return vals[0]
    return vals


def translate_questions():
    print("=== Translating Questions ===\n")
    total = 0

    while True:
        rows = sb_get("cb_quiz_questions?select=id,question_text&question_text_sk=is.null&order=id&limit=20")
        if not rows:
            break

        texts = [r["question_text"] for r in rows]
        try:
            translations = translate(texts)
        except Exception as e:
            print(f"  GPT error: {e}")
            break

        for i, row in enumerate(rows):
            if i >= len(translations):
                break
            sb_patch("cb_quiz_questions", row["id"], {"question_text_sk": translations[i]})

        total += len(rows)
        print(f"  Questions translated: {total}")
        time.sleep(0.3)

    print(f"\nDone: {total} questions.\n")


def translate_options():
    print("=== Translating Options ===\n")
    total = 0

    while True:
        rows = sb_get("cb_quiz_options?select=id,option_text&option_text_sk=is.null&order=id&limit=40")
        if not rows:
            break

        texts = [r["option_text"] for r in rows]
        try:
            translations = translate(texts)
        except Exception as e:
            print(f"  GPT error: {e}")
            break

        for i, row in enumerate(rows):
            if i >= len(translations):
                break
            sb_patch("cb_quiz_options", row["id"], {"option_text_sk": translations[i]})

        total += len(rows)
        print(f"  Options translated: {total}")
        time.sleep(0.3)

    print(f"\nDone: {total} options.\n")


if __name__ == "__main__":
    print("Batch SK Translation\n")
    translate_questions()
    translate_options()
    print("All translations complete!")
