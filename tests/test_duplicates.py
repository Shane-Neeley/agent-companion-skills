import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "skills/boomscrolling-response-drafts/scripts/check_duplicates.py"
spec = importlib.util.spec_from_file_location("duplicates", SCRIPT)
duplicates = importlib.util.module_from_spec(spec)
spec.loader.exec_module(duplicates)


class DuplicateChecks(unittest.TestCase):
    def test_unicode_case_and_punctuation_do_not_hide_copy(self):
        result = duplicates.screen({"candidates": [{"id": "A", "text": "ＣＡＦÉ repair!"}], "history": ["café REPAIR."]})
        self.assertEqual(result["flags"][0]["against"], "history:1")

    def test_small_word_change_is_flagged(self):
        a = "A tool shelf beside the repair table helps people fix things."
        b = "A tool shelf beside the repair table helps visitors fix things."
        self.assertIsNotNone(duplicates.compare(a, b))

    def test_reordered_copy_is_flagged(self):
        a = "Borrow tools at the library repair table to fix household items"
        b = "To fix household items borrow tools at the library repair table"
        self.assertEqual(duplicates.compare(a, b), "similar-wording")

    def test_distinct_contributions_and_no_history_are_disclosed(self):
        result = duplicates.screen({"candidates": [
            {"id": "A", "text": "A simple tally could show which tools visitors actually borrow."},
            {"id": "B", "text": "How will you keep the screwdriver from wandering home?"},
            {"id": "C", "text": "A labeled return spot might make this easier to maintain."},
        ], "history": []})
        self.assertFalse(result["flags"])
        self.assertEqual(result["comparisons"], 3)
        self.assertEqual(result["history_coverage"], "not-supplied")

    def test_short_shared_words_do_not_trigger_fuzzy_match(self):
        self.assertIsNone(duplicates.compare("Good question", "A good question"))
        self.assertEqual(duplicates.compare("Good question!", "good question"), "same-normalized-text")

    def test_every_candidate_is_compared_with_history(self):
        result = duplicates.screen({"candidates": [{"id": "A", "text": "First draft"}, {"id": "B", "text": "Second draft"}], "history": ["First draft", "Second draft"]})
        self.assertEqual(result["comparisons"], 5)
        self.assertEqual(len(result["flags"]), 2)

    def test_bad_inputs_fail_instead_of_silently_passing(self):
        for data in [None, {}, {"candidates": [], "history": []},
                     {"candidates": [{"id": "A", "text": "hi"}]},
                     {"candidates": [{"id": "A", "text": "!!!"}], "history": []},
                     {"candidates": [{"id": "A", "text": "one"}, {"id": "A", "text": "two"}], "history": []},
                     {"candidates": [{"id": "A", "text": "one"}], "history": [None]}]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                duplicates.screen(data)

    def test_cli_exit_codes_and_no_output_files(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "input.json"
            for text, expected in [("Same draft", 1), ("Different contribution", 0)]:
                path.write_text(json.dumps({"candidates": [{"id": "A", "text": text}], "history": ["Same draft"]}))
                result = subprocess.run([sys.executable, "-B", str(SCRIPT), str(path)], capture_output=True, text=True)
                self.assertEqual(result.returncode, expected, result.stderr)
                self.assertIn("status", json.loads(result.stdout))
            path.write_text("broken json")
            result = subprocess.run([sys.executable, "-B", str(SCRIPT), str(path)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(list(Path(directory).iterdir()), [path])


if __name__ == "__main__":
    unittest.main()
