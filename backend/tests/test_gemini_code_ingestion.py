"""
test_gemini_code_ingestion.py

Regression test suite for:
1. Stripping markdown code fences pasted from Gemini/ChatGPT (```lang ... ```).
2. Normalization of CRLF and leading/trailing whitespace without altering internal code.
3. Preservation of internal backticks (e.g. JavaScript template literals, docstrings).
4. Refusal to arbitrarily alter user code or strip fences when not wrapping the entire code block.
5. Accurate string output comparison preserving internal spaces and case while ignoring trailing whitespace.
6. Driver generation and verdict accuracy across all supported languages.
"""

from app.services.driver_generator import (
    strip_outer_markdown_fences,
    clean_user_code,
)
from app.routes.submissions import prepare_dsa_source, _compare


class TestMarkdownFenceStripping:
    def test_python_gemini_fence(self):
        code = (
            "```python\n"
            "class Solution:\n"
            "    def twoSum(self, nums: List[int], target: int) -> List[int]:\n"
            "        seen = {}\n"
            "        for i, x in enumerate(nums):\n"
            "            if target - x in seen:\n"
            "                return [seen[target - x], i]\n"
            "            seen[x] = i\n"
            "        return []\n"
            "```"
        )
        expected = (
            "class Solution:\n"
            "    def twoSum(self, nums: List[int], target: int) -> List[int]:\n"
            "        seen = {}\n"
            "        for i, x in enumerate(nums):\n"
            "            if target - x in seen:\n"
            "                return [seen[target - x], i]\n"
            "            seen[x] = i\n"
            "        return []"
        )
        assert strip_outer_markdown_fences(code) == expected

    def test_cpp_gemini_fence_with_crlf(self):
        code = (
            "```cpp\r\n"
            "class Solution {\r\n"
            "public:\r\n"
            "    vector<int> twoSum(vector<int>& nums, int target) {\r\n"
            "        return {0, 1};\r\n"
            "    }\r\n"
            "};\r\n"
            "```"
        )
        expected = (
            "class Solution {\n"
            "public:\n"
            "    vector<int> twoSum(vector<int>& nums, int target) {\n"
            "        return {0, 1};\n"
            "    }\n"
            "};"
        )
        assert strip_outer_markdown_fences(code) == expected

    def test_java_gemini_fence_with_leading_trailing_whitespace(self):
        code = (
            "\n  \n```java\n"
            "class Solution {\n"
            "    public int[] twoSum(int[] nums, int target) {\n"
            "        return new int[]{0, 1};\n"
            "    }\n"
            "}\n"
            "```\n \n"
        )
        expected = (
            "class Solution {\n"
            "    public int[] twoSum(int[] nums, int target) {\n"
            "        return new int[]{0, 1};\n"
            "    }\n"
            "}"
        )
        assert strip_outer_markdown_fences(code) == expected

    def test_js_gemini_fence_preserves_template_literal_backticks(self):
        code = (
            "```javascript\n"
            "var greet = function(name) {\n"
            "    const msg = `Hello, ${name}!`;\n"
            "    return msg;\n"
            "};\n"
            "```"
        )
        expected = (
            "var greet = function(name) {\n"
            "    const msg = `Hello, ${name}!`;\n"
            "    return msg;\n"
            "};"
        )
        assert strip_outer_markdown_fences(code) == expected

    def test_fence_without_language_tag(self):
        code = (
            "```\n"
            "class Solution:\n"
            "    pass\n"
            "```"
        )
        assert strip_outer_markdown_fences(code) == "class Solution:\n    pass"

    def test_four_backtick_fence(self):
        code = (
            "````python\n"
            "class Solution:\n"
            "    pass\n"
            "````"
        )
        assert strip_outer_markdown_fences(code) == "class Solution:\n    pass"

    def test_code_without_fences_is_never_altered(self):
        plain_code = (
            "class Solution:\n"
            "    def twoSum(self, nums: List[int], target: int) -> List[int]:\n"
            "        return [0, 1]"
        )
        assert strip_outer_markdown_fences(plain_code) == plain_code

    def test_multiple_code_blocks_with_markdown_text_not_stripped(self):
        multi_block = (
            "```python\n"
            "def sol1(): pass\n"
            "```\n"
            "Here is another approach:\n"
            "```python\n"
            "def sol2(): pass\n"
            "```"
        )
        # Must not strip because fences do not clearly wrap the entire code as a single block
        assert strip_outer_markdown_fences(multi_block) == multi_block.replace("\r\n", "\n")

    def test_clean_user_code_integrates_fence_stripping(self):
        raw_code = (
            "```python\n"
            "class Solution:\n"
            "    def twoSum(self, nums, target):\n"
            "        return [0, 1]\n"
            "```"
        )
        cleaned = clean_user_code(raw_code, "python")
        assert "```" not in cleaned
        assert "class Solution:" in cleaned


class TestDriverGenerationWithPastedCode:
    def test_prepare_dsa_source_strips_gemini_fences(self):
        import base64
        code = (
            "```python\n"
            "class Solution:\n"
            "    def twoSum(self, nums: List[int], target: int) -> List[int]:\n"
            "        return [0, 1]\n"
            "```"
        )
        b64_code = base64.b64encode(code.encode("utf-8")).decode("utf-8")
        q_data = {
            "id": 1,
            "name": "Two Sum",
            "functionName": "twoSum",
            "parameters": [{"name": "nums", "type": "vector<int>"}, {"name": "target", "type": "int"}],
            "returnType": "vector<int>",
        }
        secured_b64, is_clean = prepare_dsa_source(
            source_code=b64_code,
            q_data=q_data,
            language_id=71,
            nonce="testnonce12345678",
        )
        assert is_clean is True
        decoded = base64.b64decode(secured_b64.encode("utf-8")).decode("utf-8")
        assert "```" not in decoded
        assert "class Solution:" in decoded
        assert "__AQ_testnonce12345678_START_" in decoded

    def test_cpp_driver_generation_with_crlf_and_fences(self):
        import base64
        code = (
            "```cpp\r\n"
            "class Solution {\r\n"
            "public:\r\n"
            "    vector<int> twoSum(vector<int>& nums, int target) {\r\n"
            "        return {0, 1};\r\n"
            "    }\r\n"
            "};\r\n"
            "```"
        )
        b64_code = base64.b64encode(code.encode("utf-8")).decode("utf-8")
        q_data = {
            "id": 1,
            "name": "Two Sum",
            "functionName": "twoSum",
            "parameters": [{"name": "nums", "type": "vector<int>"}, {"name": "target", "type": "int"}],
            "returnType": "vector<int>",
        }
        secured_b64, is_clean = prepare_dsa_source(
            source_code=b64_code,
            q_data=q_data,
            language_id=76,
            nonce="cppnonce12345678",
        )
        assert is_clean is True
        decoded = base64.b64decode(secured_b64.encode("utf-8")).decode("utf-8")
        assert "```" not in decoded
        assert "class Solution {" in decoded
        assert "\r" not in decoded


class TestStringOutputComparison:
    def test_string_trailing_whitespace_and_newlines_ignored(self):
        # Driver prints with newline/whitespace, expected has no newline
        assert _compare("BANC\n", "BANC", "ordered", return_type="string") is True
        assert _compare("BANC\r\n", "BANC", "ordered", return_type="string") is True
        assert _compare("BANC   \n", "BANC", "ordered", return_type="string") is True
        assert _compare("BANC", "BANC\n", "ordered", return_type="string") is True

    def test_string_meaningful_internal_spaces_strictly_preserved(self):
        # Meaningful internal spaces must not be collapsed
        assert _compare("blue is sky the\n", "blue is sky the", "ordered", return_type="string") is True
        assert _compare("blue   is sky the\n", "blue is sky the", "ordered", return_type="string") is False
        assert _compare("blue is sky the", "blue   is sky the", "ordered", return_type="string") is False

    def test_string_case_sensitivity_strictly_preserved(self):
        # Case must NOT be changed
        assert _compare("banc\n", "BANC", "ordered", return_type="string") is False
        assert _compare("Blue is sky the", "blue is sky the", "ordered", return_type="string") is False

    def test_string_any_of_comparison(self):
        # Longest Palindromic Substring expected: 'bab | aba'
        assert _compare("bab\n", "bab | aba", "any_of", return_type="string") is True
        assert _compare("aba\r\n", "bab | aba", "any_of", return_type="string") is True
        assert _compare("bb\n", "bab | aba", "any_of", return_type="string") is False

    def test_empty_string_outputs_match(self):
        assert _compare("", "", "ordered", return_type="string") is True
        assert _compare("\n", "", "ordered", return_type="string") is True
        assert _compare("   \n", "", "ordered", return_type="string") is True
        assert _compare("nonempty\n", "", "ordered", return_type="string") is False

    def test_non_string_outputs_retain_standard_normalization(self):
        # Numeric arrays: inter-element whitespace collapsed as usual
        assert _compare("0  1\n", "0 1", "ordered", return_type="vector<int>") is True
        assert _compare("1\n2\n3", "1 2 3", "ordered", return_type="vector<int>") is True
        assert _compare("1 0", "0 1", "unordered", return_type="vector<int>") is True
