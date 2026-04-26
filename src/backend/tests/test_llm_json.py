import unittest

from pydantic import BaseModel

from app.services.llm_json import LLMJSONError, parse_json_response, validate_json_response


class ExamplePayload(BaseModel):
    name: str
    count: int


class LLMJSONTests(unittest.TestCase):
    def test_parse_strict_json_object(self):
        self.assertEqual(parse_json_response('{"ok": true}'), {"ok": True})

    def test_parse_fenced_json_fallback(self):
        self.assertEqual(parse_json_response('```json\n{"ok": true}\n```'), {"ok": True})

    def test_validate_schema(self):
        payload = validate_json_response('{"name": "tasks", "count": 3}', ExamplePayload)
        self.assertEqual(payload.name, "tasks")
        self.assertEqual(payload.count, 3)

    def test_reject_non_object_json(self):
        with self.assertRaises(LLMJSONError):
            parse_json_response("[1, 2, 3]")


if __name__ == "__main__":
    unittest.main()
