"""
Unit and integration tests for AlgoQuest FastAPI Backend.
Uses standard library unittest + fastapi.testclient.TestClient.
"""

import os
import json
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.routes.submissions import _compare, _build_stdin, _load_test_data


class TestAlgoQuestBackend(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        """Verify health endpoint returns 200 and expected status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "algoquest-api")

    def test_openapi_schema(self):
        """Verify OpenAPI documentation and route coverage."""
        response = self.client.get("/openapi.json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        paths = data.get("paths", {})
        expected_endpoints = [
            "/health",
            "/api/submissions",
            "/api/user/all",
            "/api/progress",
            "/api/bookmarks",
            "/api/notes/{question_id}",
            "/api/editor/{question_id}",
            "/api/general-compiler/{language}",
            "/api/user/init",
        ]
        for ep in expected_endpoints:
            self.assertIn(ep, paths, f"Endpoint {ep} missing in OpenAPI paths")

    def test_test_cases_data_integrity(self):
        """Verify test_cases.json has all questions, samples, and hidden tests."""
        data = _load_test_data()
        self.assertGreaterEqual(len(data), 174, "Should have at least 174 questions")
        
        q1 = data.get("1")
        self.assertIsNotNone(q1, "Question 1 must exist")
        self.assertEqual(q1.get("name"), "Two Sum")
        self.assertGreater(len(q1.get("sampleTests", [])), 0)
        self.assertGreater(len(q1.get("hiddenTests", [])), 0)
        
        # Verify stdin and expectedRaw are populated
        sample0 = q1["sampleTests"][0]
        self.assertTrue(sample0.get("stdin"), "Sample test stdin must not be empty")
        self.assertTrue(sample0.get("expectedRaw"), "Sample test expectedRaw must not be empty")
        
        hidden0 = q1["hiddenTests"][0]
        self.assertTrue(hidden0.get("stdin"), "Hidden test stdin must not be empty")
        self.assertTrue(hidden0.get("expectedRaw"), "Hidden test expectedRaw must not be empty")

    def test_compare_ordered(self):
        """Verify ordered comparison logic."""
        self.assertTrue(_compare("1 2 3", "1 2 3", "ordered"))
        self.assertTrue(_compare("  1   2   3\n", "1 2 3", "ordered"))
        self.assertFalse(_compare("3 2 1", "1 2 3", "ordered"))

    def test_compare_unordered(self):
        """Verify unordered comparison logic."""
        self.assertTrue(_compare("0 1", "1 0", "unordered"))
        self.assertTrue(_compare("[1, 0]", "0 1", "unordered"))
        self.assertTrue(_compare("[3, 2, 4]", "2 4 3", "unordered"))
        self.assertFalse(_compare("1 2", "1 3", "unordered"))

    def test_compare_float(self):
        """Verify float comparison logic with epsilon tolerance."""
        self.assertTrue(_compare("2.00001", "2.00000", "float"))
        self.assertTrue(_compare("3.14159", "3.1415", "float"))
        self.assertFalse(_compare("2.1", "2.0", "float"))

    def test_compare_any_of(self):
        """Verify any_of comparison logic."""
        self.assertTrue(_compare("foo", "foo | bar | baz", "any_of"))
        self.assertTrue(_compare("bar", "foo | bar | baz", "any_of"))
        self.assertFalse(_compare("qux", "foo | bar | baz", "any_of"))

    def test_build_stdin(self):
        """Verify combined stdin format matches driver expectations: T\\n<tc1>..."""
        test_cases = [
            {"stdin": "3\n1 2 3\n"},
            {"stdin": "4\n4 5 6 7"},
        ]
        combined = _build_stdin(test_cases)
        expected = "2\n3\n1 2 3\n\n4\n4 5 6 7\n"
        self.assertEqual(combined, expected)

    def test_auth_protection_on_api_routes(self):
        """Verify that calling /api/ routes without Bearer token returns 401."""
        endpoints = [
            ("get", "/api/progress"),
            ("get", "/api/bookmarks"),
            ("get", "/api/user/all"),
            ("post", "/api/submissions"),
            ("post", "/api/user/init"),
        ]
        for method, path in endpoints:
            req_fn = getattr(self.client, method)
            res = req_fn(path)
            self.assertEqual(
                res.status_code,
                401,
                f"Expected 401 for unauthenticated request to {path}, got {res.status_code}",
            )

    def test_get_question_sample_tests(self):
        """Verify that GET /api/questions/{id}/sample-tests returns only public sample tests without auth."""
        res = self.client.get("/api/questions/1/sample-tests")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["question_id"], 1)
        self.assertGreater(len(data["sample_tests"]), 0)
        # Verify hidden tests are NOT returned and raw stdin is NOT exposed
        for sample in data["sample_tests"]:
            self.assertIn("index", sample)
            self.assertIn("input", sample)
            self.assertIn("expected", sample)
            self.assertNotIn("stdin", sample)
            self.assertNotIn("expectedRaw", sample)
            self.assertNotIn("hiddenTests", sample)



if __name__ == "__main__":
    unittest.main()
