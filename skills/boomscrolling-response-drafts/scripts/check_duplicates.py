#!/usr/bin/env python3
"""Offline lexical screen, not a semantic or plagiarism verdict.

Usage: python3 check_duplicates.py input.json
Input: {"candidates": [{"id": "A", "text": "..."}, ...], "history": ["..."]}
IDs must be unique. Supply history explicitly; [] means no history supplied.
Output goes to stdout; no files or network are touched. Exit: 0 no flags,
1 review flagged pairs, 2 invalid input. A pass never proves original ideas.
"""

import argparse
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher


def normalize(text):
    return " ".join(re.findall(r"\w+", unicodedata.normalize("NFKC", text).casefold()))


def validate(data):
    if not isinstance(data, dict):
        raise ValueError("Input must be a JSON object")
    candidates, history = data.get("candidates"), data.get("history")
    if not isinstance(candidates, list) or not candidates:
        raise ValueError("candidates must be a non-empty list")
    if not isinstance(history, list) or any(not isinstance(x, str) or not normalize(x) for x in history):
        raise ValueError("history must be an explicit list of non-empty text strings")
    seen = set()
    for item in candidates:
        if not isinstance(item, dict):
            raise ValueError("Each candidate must have an id and text")
        key, value = item.get("id"), item.get("text")
        if not isinstance(key, str) or not key.strip() or key in seen:
            raise ValueError("Candidate IDs must be non-empty unique strings")
        if not isinstance(value, str) or not normalize(value):
            raise ValueError("Each candidate needs non-empty text")
        seen.add(key)
    return candidates, history


def compare(left, right):
    a, b = normalize(left), normalize(right)
    if a == b:
        return "same-normalized-text"
    # Short phrases get exact-only checks to avoid flagging shared stock words.
    if min(len(a.split()), len(b.split())) < 6:
        return None
    ta, tb = set(a.split()), set(b.split())
    overlap = len(ta & tb) / len(ta | tb)
    similarity = SequenceMatcher(None, a, b, autojunk=False).ratio()
    if similarity >= 0.84 or overlap >= 0.75:
        return "similar-wording"
    return None


def screen(data):
    candidates, history = validate(data)
    flags = []
    comparisons = 0
    for index, candidate in enumerate(candidates):
        others = [(f"candidate:{x['id']}", x["text"]) for x in candidates[:index]]
        others += [(f"history:{i + 1}", text) for i, text in enumerate(history)]
        for target, text in others:
            comparisons += 1
            reason = compare(candidate["text"], text)
            if reason:
                flags.append({"candidate": candidate["id"], "against": target, "reason": reason})
    return {
        "status": "review-required" if flags else "no-lexical-flags",
        "candidates": len(candidates),
        "history_items": len(history),
        "history_coverage": "supplied-history-only" if history else "not-supplied",
        "comparisons": comparisons,
        "flags": flags,
        "limit": "Manual review of meaning and voice is still required. Unprovided history is not checked.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Path to a local JSON file")
    args = parser.parse_args()
    try:
        with open(args.input, encoding="utf-8") as source:
            result = screen(json.load(source))
    except (OSError, ValueError) as error:
        print(json.dumps({"error": str(error)}), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if result["flags"] else 0


if __name__ == "__main__":
    sys.exit(main())
