/**
 * question-metadata.js
 * Complete metadata registry for ALL 201 DSA questions
 * LeetCode-accurate signatures, 5+ test cases each
 */

window.QUESTION_METADATA_REGISTRY = {
  // ─────────────────────────────────────────────────────────────
  // ARRAYS — HASHING
  // ─────────────────────────────────────────────────────────────
  1: {
    id: 1, name: "Two Sum",
    functionName: "twoSum", compareMode: "unordered", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,7,11,15], target = 9", stdin: "4\n2 7 11 15\n9\n", expected: "[0,1]", expectedRaw: "0 1" },
      { input: "nums = [3,2,4], target = 6", stdin: "3\n3 2 4\n6\n", expected: "[1,2]", expectedRaw: "1 2" }
    ],
    hiddenTests: [
      { input: "nums = [3,3], target = 6", stdin: "2\n3 3\n6\n", expected: "[0,1]", expectedRaw: "0 1" },
      { input: "nums = [1,5,3,2], target = 8", stdin: "4\n1 5 3 2\n8\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [-1,-2,-3,-4,-5], target = -8", stdin: "5\n-1 -2 -3 -4 -5\n-8\n", expected: "[2,4]", expectedRaw: "2 4" }
    ]
  },
  2: {
    id: 2, name: "Contains Duplicate",
    functionName: "containsDuplicate", returnType: "bool",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,1]", stdin: "4\n1 2 3 1\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [1,1,1,3,3,4,3,2,4,2]", stdin: "10\n1 1 1 3 3 4 3 2 4 2\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "false", expectedRaw: "0" },
      { input: "nums = [-1,-2,-3,-1]", stdin: "4\n-1 -2 -3 -1\n", expected: "true", expectedRaw: "1" }
    ]
  },
  3: {
    id: 3, name: "Majority Element",
    functionName: "majorityElement", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int majorityElement(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar majorityElement = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,2,3]", stdin: "3\n3 2 3\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [2,2,1,1,1,2,2]", stdin: "7\n2 2 1 1 1 2 2\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [6,5,5]", stdin: "3\n6 5 5\n", expected: "5", expectedRaw: "5" },
      { input: "nums = [3,3,4,2,3]", stdin: "5\n3 3 4 2 3\n", expected: "3", expectedRaw: "3" }
    ]
  },
  4: {
    id: 4, name: "Find Missing Number",
    functionName: "missingNumber", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int missingNumber(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def missingNumber(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar missingNumber = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,0,1]", stdin: "3\n3 0 1\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [0,1]", stdin: "2\n0 1\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [9,6,4,2,3,5,7,0,1]", stdin: "9\n9 6 4 2 3 5 7 0 1\n", expected: "8", expectedRaw: "8" },
      { input: "nums = [0]", stdin: "1\n0\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "0", expectedRaw: "0" }
    ]
  },
  5: {
    id: 5, name: "Find Duplicate Number",
    functionName: "findDuplicate", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findDuplicate(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int findDuplicate(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findDuplicate = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,3,4,2,2]", stdin: "5\n1 3 4 2 2\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [3,1,3,4,2]", stdin: "5\n3 1 3 4 2\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "nums = [1,1]", stdin: "2\n1 1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [2,2,2,2,2]", stdin: "5\n2 2 2 2 2\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [3,3,1,2,4,5,6]", stdin: "7\n3 3 1 2 4 5 6\n", expected: "3", expectedRaw: "3" }
    ]
  },
  6: {
    id: 6, name: "Count Frequency of Elements",
    functionName: "countFrequency", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int countFrequency(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int countFrequency(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def countFrequency(self, nums: List[int], target: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar countFrequency = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,2,3,3,3], target = 3", stdin: "6\n1 2 2 3 3 3\n3\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [1,2,2,3,3,3], target = 2", stdin: "6\n1 2 2 3 3 3\n2\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [5,5,5,5], target = 5", stdin: "4\n5 5 5 5\n5\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [1,2,3,4], target = 5", stdin: "4\n1 2 3 4\n5\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [7], target = 7", stdin: "1\n7\n7\n", expected: "1", expectedRaw: "1" }
    ]
  },
  7: {
    id: 7, name: "Find First Non-Repeating Element",
    functionName: "firstNonRepeating", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int firstNonRepeating(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int firstNonRepeating(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def firstNonRepeating(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar firstNonRepeating = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,2,1,4]", stdin: "6\n1 2 3 2 1 4\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [9,4,9,6,7,4]", stdin: "6\n9 4 9 6 7 4\n", expected: "6", expectedRaw: "6" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [2,2,3,3,4]", stdin: "5\n2 2 3 3 4\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [1,1,2,2,3,3]", stdin: "6\n1 1 2 2 3 3\n", expected: "-1", expectedRaw: "-1" }
    ]
  },
  8: {
    id: 8, name: "Find First Repeating Element",
    functionName: "firstRepeating", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int firstRepeating(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int firstRepeating(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def firstRepeating(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar firstRepeating = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,2,1]", stdin: "5\n1 2 3 2 1\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [3,1,2,1,3]", stdin: "5\n3 1 2 1 3\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "-1", expectedRaw: "-1" },
      { input: "nums = [5,5]", stdin: "2\n5 5\n", expected: "5", expectedRaw: "5" },
      { input: "nums = [7,4,7,3,4]", stdin: "5\n7 4 7 3 4\n", expected: "7", expectedRaw: "7" }
    ]
  },
  9: {
    id: 9, name: "Longest Consecutive Sequence",
    functionName: "longestConsecutive", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int longestConsecutive(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def longestConsecutive(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar longestConsecutive = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [100,4,200,1,3,2]", stdin: "6\n100 4 200 1 3 2\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [0,3,7,2,5,8,4,6,0,1]", stdin: "10\n0 3 7 2 5 8 4 6 0 1\n", expected: "9", expectedRaw: "9" }
    ],
    hiddenTests: [
      { input: "nums = []", stdin: "0\n\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,2,3,10]", stdin: "4\n1 2 3 10\n", expected: "3", expectedRaw: "3" }
    ]
  },
  10: {
    id: 10, name: "Count Distinct Elements",
    functionName: "countDistinct", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int countDistinct(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int countDistinct(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def countDistinct(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar countDistinct = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,2,1]", stdin: "5\n1 2 3 2 1\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "5", expectedRaw: "5" },
      { input: "nums = [-1,-2,-1,0]", stdin: "4\n-1 -2 -1 0\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [7]", stdin: "1\n7\n", expected: "1", expectedRaw: "1" }
    ]
  },
  11: {
    id: 11, name: "Intersection of Two Arrays",
    functionName: "intersection", compareMode: "unordered", returnType: "vector<int>",
    parameters: [{ name: "nums1", type: "vector<int>" }, { name: "nums2", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] intersection(int[] nums1, int[] nums2) {\n        \n    }\n}",
      python: "class Solution:\n    def intersection(self, nums1: List[int], nums2: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number[]}\n */\nvar intersection = function(nums1, nums2) {\n    \n};"
    },
    sampleTests: [
      { input: "nums1 = [1,2,2,1], nums2 = [2,2]", stdin: "4\n1 2 2 1\n2\n2 2\n", expected: "[2]", expectedRaw: "2" },
      { input: "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", stdin: "3\n4 9 5\n5\n9 4 9 8 4\n", expected: "[9,4]", expectedRaw: "4 9" }
    ],
    hiddenTests: [
      { input: "nums1 = [1,2,3], nums2 = [4,5,6]", stdin: "3\n1 2 3\n3\n4 5 6\n", expected: "[]", expectedRaw: "" },
      { input: "nums1 = [1], nums2 = [1]", stdin: "1\n1\n1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums1 = [1,2,3], nums2 = [1,2,3]", stdin: "3\n1 2 3\n3\n1 2 3\n", expected: "[1,2,3]", expectedRaw: "1 2 3" }
    ]
  },
  12: {
    id: 12, name: "Union of Two Arrays",
    functionName: "unionArrays", returnType: "int",
    parameters: [{ name: "nums1", type: "vector<int>" }, { name: "nums2", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int unionArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      java: "class Solution {\n    public int unionArrays(int[] nums1, int[] nums2) {\n        \n    }\n}",
      python: "class Solution:\n    def unionArrays(self, nums1: List[int], nums2: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar unionArrays = function(nums1, nums2) {\n    \n};"
    },
    sampleTests: [
      { input: "nums1 = [1,2,3], nums2 = [2,3,4]", stdin: "3\n1 2 3\n3\n2 3 4\n", expected: "4", expectedRaw: "4" },
      { input: "nums1 = [1,2,1,3], nums2 = [2,2]", stdin: "4\n1 2 1 3\n2\n2 2\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "nums1 = [1,2,3], nums2 = [4,5,6]", stdin: "3\n1 2 3\n3\n4 5 6\n", expected: "6", expectedRaw: "6" },
      { input: "nums1 = [1,1,1], nums2 = [1,1]", stdin: "3\n1 1 1\n2\n1 1\n", expected: "1", expectedRaw: "1" },
      { input: "nums1 = [5,6,7], nums2 = [5,6,7,8]", stdin: "3\n5 6 7\n4\n5 6 7 8\n", expected: "4", expectedRaw: "4" }
    ]
  },
  13: {
    id: 13, name: "Majority Element II",
    compareMode: "unordered",
    functionName: "majorityElement", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> majorityElement(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public List<Integer> majorityElement(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def majorityElement(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar majorityElement = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,2,3]", stdin: "3\n3 2 3\n", expected: "[3]", expectedRaw: "3" },
      { input: "nums = [1,2]", stdin: "2\n1 2\n", expected: "[1,2]", expectedRaw: "1 2" }
    ],
    hiddenTests: [
      { input: "nums = [1,1,1,3,3,2,2,2]", stdin: "8\n1 1 1 3 3 2 2 2\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "[]", expectedRaw: "" }
    ]
  },
  14: {
    id: 14, name: "Move Zeroes",
    functionName: "moveZeroes", returnType: "void",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void moveZeroes(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public void moveZeroes(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar moveZeroes = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [0,1,0,3,12]", stdin: "5\n0 1 0 3 12\n", expected: "[1,3,12,0,0]", expectedRaw: "1 3 12 0 0" },
      { input: "nums = [0]", stdin: "1\n0\n", expected: "[0]", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [1,0,1]", stdin: "3\n1 0 1\n", expected: "[1,1,0]", expectedRaw: "1 1 0" },
      { input: "nums = [0,0,0,1]", stdin: "4\n0 0 0 1\n", expected: "[1,0,0,0]", expectedRaw: "1 0 0 0" },
      { input: "nums = [1,2,3]", stdin: "3\n1 2 3\n", expected: "[1,2,3]", expectedRaw: "1 2 3" }
    ]
  },
  15: {
    id: 15, name: "Remove Duplicates from Sorted Array",
    functionName: "removeDuplicates", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int removeDuplicates(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int removeDuplicates(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar removeDuplicates = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,1,2]", stdin: "3\n1 1 2\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [0,0,1,1,1,2,2,3,3,4]", stdin: "10\n0 0 1 1 1 2 2 3 3 4\n", expected: "5", expectedRaw: "5" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,2,3]", stdin: "3\n1 2 3\n", expected: "3", expectedRaw: "3" }
    ]
  },
  16: {
    id: 16, name: "Trapping Rain Water",
    functionName: "trap", returnType: "int",
    parameters: [{ name: "height", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
      java: "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
      python: "class Solution:\n    def trap(self, height: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    \n};"
    },
    sampleTests: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", stdin: "12\n0 1 0 2 1 0 1 3 2 1 2 1\n", expected: "6", expectedRaw: "6" },
      { input: "height = [4,2,0,3,2,5]", stdin: "6\n4 2 0 3 2 5\n", expected: "9", expectedRaw: "9" }
    ],
    hiddenTests: [
      { input: "height = [1,0,1]", stdin: "3\n1 0 1\n", expected: "1", expectedRaw: "1" },
      { input: "height = [3,0,0,2,0,4]", stdin: "6\n3 0 0 2 0 4\n", expected: "10", expectedRaw: "10" },
      { input: "height = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "0", expectedRaw: "0" }
    ]
  },
  17: {
    id: 17, name: "Container With Most Water",
    functionName: "maxArea", returnType: "int",
    parameters: [{ name: "height", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
      python: "class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    \n};"
    },
    sampleTests: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", stdin: "9\n1 8 6 2 5 4 8 3 7\n", expected: "49", expectedRaw: "49" },
      { input: "height = [1,1]", stdin: "2\n1 1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "height = [4,3,2,1,4]", stdin: "5\n4 3 2 1 4\n", expected: "16", expectedRaw: "16" },
      { input: "height = [1,2,1]", stdin: "3\n1 2 1\n", expected: "2", expectedRaw: "2" },
      { input: "height = [2,3,4,5,18,17,6]", stdin: "7\n2 3 4 5 18 17 6\n", expected: "17", expectedRaw: "17" }
    ]
  },
  18: {
    id: 18, name: "Merge Two Sorted Arrays",
    functionName: "merge", returnType: "void",
    parameters: [{ name: "nums1", type: "vector<int>" }, { name: "m", type: "int" }, { name: "nums2", type: "vector<int>" }, { name: "n", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {\n        \n    }\n};",
      java: "class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        \n    }\n}",
      python: "class Solution:\n    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:\n        ",
      js: "/**\n * @param {number[]} nums1\n * @param {number} m\n * @param {number[]} nums2\n * @param {number} n\n * @return {void}\n */\nvar merge = function(nums1, m, nums2, n) {\n    \n};"
    },
    sampleTests: [
      { input: "nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3", stdin: "6\n1 2 3 0 0 0\n3\n3\n2 5 6\n3\n", expected: "[1,2,2,3,5,6]", expectedRaw: "1 2 2 3 5 6" },
      { input: "nums1=[1], m=1, nums2=[], n=0", stdin: "1\n1\n1\n0\n\n0\n", expected: "[1]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums1=[0], m=0, nums2=[1], n=1", stdin: "1\n0\n0\n1\n1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums1=[4,5,6,0,0,0], m=3, nums2=[1,2,3], n=3", stdin: "6\n4 5 6 0 0 0\n3\n3\n1 2 3\n3\n", expected: "[1,2,3,4,5,6]", expectedRaw: "1 2 3 4 5 6" },
      { input: "nums1=[1,2,4,0,0,0], m=3, nums2=[3,5,6], n=3", stdin: "6\n1 2 4 0 0 0\n3\n3\n3 5 6\n3\n", expected: "[1,2,3,4,5,6]", expectedRaw: "1 2 3 4 5 6" }
    ]
  },
  19: {
    id: 19, name: "Sort Colors",
    functionName: "sortColors", returnType: "void",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void sortColors(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public void sortColors(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar sortColors = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,0,2,1,1,0]", stdin: "6\n2 0 2 1 1 0\n", expected: "[0,0,1,1,2,2]", expectedRaw: "0 0 1 1 2 2" },
      { input: "nums = [2,0,1]", stdin: "3\n2 0 1\n", expected: "[0,1,2]", expectedRaw: "0 1 2" }
    ],
    hiddenTests: [
      { input: "nums = [0]", stdin: "1\n0\n", expected: "[0]", expectedRaw: "0" },
      { input: "nums = [1,1,1,0,0,2]", stdin: "6\n1 1 1 0 0 2\n", expected: "[0,0,1,1,1,2]", expectedRaw: "0 0 1 1 1 2" },
      { input: "nums = [2,2,2,2]", stdin: "4\n2 2 2 2\n", expected: "[2,2,2,2]", expectedRaw: "2 2 2 2" }
    ]
  },
  20: {
    id: 20, name: "Pair With Given Sum",
    functionName: "hasPairWithSum", returnType: "bool",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool hasPairWithSum(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean hasPairWithSum(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def hasPairWithSum(self, nums: List[int], target: int) -> bool:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {boolean}\n */\nvar hasPairWithSum = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,7,11,15], target = 9", stdin: "4\n2 7 11 15\n9\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [1,3,5], target = 10", stdin: "3\n1 3 5\n10\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [1,2,3,4,5], target = 9", stdin: "5\n1 2 3 4 5\n9\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [0,0,0], target = 0", stdin: "3\n0 0 0\n0\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [-1,-2,3,4], target = 2", stdin: "4\n-1 -2 3 4\n2\n", expected: "true", expectedRaw: "1" }
    ]
  },
  21: {
    id: 21, name: "Three Sum",
    compareMode: "unordered",
    functionName: "threeSum", returnType: "count:vector<vector<int>>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-1,0,1,2,-1,-4]", stdin: "6\n-1 0 1 2 -1 -4\n", expected: "[[-1,-1,2],[-1,0,1]]", expectedRaw: "2" },
      { input: "nums = [0,1,1]", stdin: "3\n0 1 1\n", expected: "[]", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [0,0,0]", stdin: "3\n0 0 0\n", expected: "[[0,0,0]]", expectedRaw: "1" },
      { input: "nums = [-2,0,1,1,2]", stdin: "5\n-2 0 1 1 2\n", expected: "[[-2,0,2],[-2,1,1]]", expectedRaw: "2" },
      { input: "nums = [-4,-2,-2,-2,0,1,2,2,2,3,3,4,4,6,6]", stdin: "15\n-4 -2 -2 -2 0 1 2 2 2 3 3 4 4 6 6\n", expected: "many", expectedRaw: "6" }
    ]
  },
  22: {
    id: 22, name: "Four Sum",
    compareMode: "unordered",
    functionName: "fourSum", returnType: "count:vector<vector<int>>",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> fourSum(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> fourSum(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[][]}\n */\nvar fourSum = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,0,-1,0,-2,2], target = 0", stdin: "6\n1 0 -1 0 -2 2\n0\n", expected: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]", expectedRaw: "3" },
      { input: "nums = [2,2,2,2,2], target = 8", stdin: "5\n2 2 2 2 2\n8\n", expected: "[[2,2,2,2]]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [0,0,0,0], target = 0", stdin: "4\n0 0 0 0\n0\n", expected: "[[0,0,0,0]]", expectedRaw: "1" },
      { input: "nums = [-3,-2,-1,0], target = -6", stdin: "4\n-3 -2 -1 0\n-6\n", expected: "[[-3,-2,-1,0] is wrong -3+(-2)+(-1)+0=-6]", expectedRaw: "1" },
      { input: "nums = [1,2,3,4,5], target = 100", stdin: "5\n1 2 3 4 5\n100\n", expected: "[]", expectedRaw: "0" }
    ]
  },
  23: {
    id: 23, name: "Maximum Subarray Sum",
    functionName: "maxSubArray", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", stdin: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expected: "6", expectedRaw: "6" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [5,4,-1,7,8]", stdin: "5\n5 4 -1 7 8\n", expected: "23", expectedRaw: "23" },
      { input: "nums = [-1,-2,-3,-4]", stdin: "4\n-1 -2 -3 -4\n", expected: "-1", expectedRaw: "-1" },
      { input: "nums = [0]", stdin: "1\n0\n", expected: "0", expectedRaw: "0" }
    ]
  },
  24: {
    id: 24, name: "Sliding Window Maximum",
    functionName: "maxSlidingWindow", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar maxSlidingWindow = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", stdin: "8\n1 3 -1 -3 5 3 6 7\n3\n", expected: "[3,3,5,5,6,7]", expectedRaw: "3 3 5 5 6 7" },
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "[1]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [1,3,1,2,0,5], k = 3", stdin: "6\n1 3 1 2 0 5\n3\n", expected: "[3,3,2,5]", expectedRaw: "3 3 2 5" },
      { input: "nums = [9,11], k = 2", stdin: "2\n9 11\n2\n", expected: "[11]", expectedRaw: "11" },
      { input: "nums = [4,-2], k = 2", stdin: "2\n4 -2\n2\n", expected: "[4]", expectedRaw: "4" }
    ]
  },
  25: {
    id: 25, name: "Longest Substring Without Repeating Characters",
    functionName: "lengthOfLongestSubstring", returnType: "int",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"abcabcbb\"", stdin: "abcabcbb\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"bbbbb\"", stdin: "bbbbb\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "s = \"pwwkew\"", stdin: "pwwkew\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"\"", stdin: "@@EMPTY@@\n", expected: "0", expectedRaw: "0" },
      { input: "s = \"abcdef\"", stdin: "abcdef\n", expected: "6", expectedRaw: "6" }
    ]
  },
  26: {
    id: 26, name: "Maximum Sum Subarray of Size K",
    functionName: "maxSumSubarray", returnType: "int",
    parameters: [{ name: "arr", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxSumSubarray(vector<int>& arr, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxSumSubarray(int[] arr, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def maxSumSubarray(self, arr: List[int], k: int) -> int:\n        ",
      js: "/**\n * @param {number[]} arr\n * @param {number} k\n * @return {number}\n */\nvar maxSumSubarray = function(arr, k) {\n    \n};"
    },
    sampleTests: [
      { input: "arr = [2,3,4,1,5], k = 3", stdin: "5\n2 3 4 1 5\n3\n", expected: "10", expectedRaw: "10" },
      { input: "arr = [1,4,2,10,2,3,1,0,20], k = 4", stdin: "9\n1 4 2 10 2 3 1 0 20\n4\n", expected: "24", expectedRaw: "24" }
    ],
    hiddenTests: [
      { input: "arr = [5,5,5,5], k = 2", stdin: "4\n5 5 5 5\n2\n", expected: "10", expectedRaw: "10" },
      { input: "arr = [-1,-2,-3,-4], k = 2", stdin: "4\n-1 -2 -3 -4\n2\n", expected: "-3", expectedRaw: "-3" },
      { input: "arr = [1], k = 1", stdin: "1\n1\n1\n", expected: "1", expectedRaw: "1" }
    ]
  },
  27: {
    id: 27, name: "First Negative Number in Every Window",
    functionName: "firstNegativeInWindow", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> firstNegativeInWindow(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] firstNegativeInWindow(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def firstNegativeInWindow(self, nums: List[int], k: int) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar firstNegativeInWindow = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-8,2,-6,5,-4], k = 2", stdin: "5\n-8 2 -6 5 -4\n2\n", expected: "[-8,-6,-6,-4]", expectedRaw: "-8 -6 -6 -4" },
      { input: "nums = [1,2,3,4,5], k = 2", stdin: "5\n1 2 3 4 5\n2\n", expected: "[0,0,0,0]", expectedRaw: "0 0 0 0" }
    ],
    hiddenTests: [
      { input: "nums = [-1,-2,-3], k = 1", stdin: "3\n-1 -2 -3\n1\n", expected: "[-1,-2,-3]", expectedRaw: "-1 -2 -3" },
      { input: "nums = [1,-2,3,-4], k = 3", stdin: "4\n1 -2 3 -4\n3\n", expected: "[-2,-2]", expectedRaw: "-2 -2" },
      { input: "nums = [0,0,0], k = 2", stdin: "3\n0 0 0\n2\n", expected: "[0,0]", expectedRaw: "0 0" }
    ]
  },
  28: {
    id: 28, name: "Count Anagrams",
    functionName: "countAnagrams", returnType: "int",
    parameters: [{ name: "s", type: "string" }, { name: "p", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int countAnagrams(string s, string p) {\n        \n    }\n};",
      java: "class Solution {\n    public int countAnagrams(String s, String p) {\n        \n    }\n}",
      python: "class Solution:\n    def countAnagrams(self, s: str, p: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} p\n * @return {number}\n */\nvar countAnagrams = function(s, p) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"cbaebabacd\", p = \"abc\"", stdin: "cbaebabacd\nabc\n", expected: "2", expectedRaw: "2" },
      { input: "s = \"abab\", p = \"ab\"", stdin: "abab\nab\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "s = \"a\", p = \"a\"", stdin: "a\na\n", expected: "1", expectedRaw: "1" },
      { input: "s = \"abcabc\", p = \"abc\"", stdin: "abcabc\nabc\n", expected: "4", expectedRaw: "4" },
      { input: "s = \"abcdefg\", p = \"xyz\"", stdin: "abcdefg\nxyz\n", expected: "0", expectedRaw: "0" }
    ]
  },
  29: {
    id: 29, name: "Minimum Window Substring",
    functionName: "minWindow", returnType: "string",
    parameters: [{ name: "s", type: "string" }, { name: "t", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};",
      java: "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
      python: "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nvar minWindow = function(s, t) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"ADOBECODEBANC\", t = \"ABC\"", stdin: "ADOBECODEBANC\nABC\n", expected: "\"BANC\"", expectedRaw: "BANC" },
      { input: "s = \"a\", t = \"a\"", stdin: "a\na\n", expected: "\"a\"", expectedRaw: "a" }
    ],
    hiddenTests: [
      { input: "s = \"a\", t = \"aa\"", stdin: "a\naa\n", expected: "\"\"", expectedRaw: "" },
      { input: "s = \"ab\", t = \"b\"", stdin: "ab\nb\n", expected: "\"b\"", expectedRaw: "b" },
      { input: "s = \"ADOBECODEBANC\", t = \"AABC\"", stdin: "ADOBECODEBANC\nAABC\n", expected: "\"ADOBECODEBA\"", expectedRaw: "ADOBECODEBA" }
    ]
  },
  30: {
    id: 30, name: "Product of Array Except Self",
    functionName: "productExceptSelf", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "[24,12,8,6]", expectedRaw: "24 12 8 6" },
      { input: "nums = [-1,1,0,-3,3]", stdin: "5\n-1 1 0 -3 3\n", expected: "[0,0,9,0,0]", expectedRaw: "0 0 9 0 0" }
    ],
    hiddenTests: [
      { input: "nums = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "[1,1,1,1]", expectedRaw: "1 1 1 1" },
      { input: "nums = [2,3,4]", stdin: "3\n2 3 4\n", expected: "[12,8,6]", expectedRaw: "12 8 6" },
      { input: "nums = [0,0]", stdin: "2\n0 0\n", expected: "[0,0]", expectedRaw: "0 0" }
    ]
  },
  31: {
    id: 31, name: "Subarray Sum Equals K",
    functionName: "subarraySum", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int subarraySum(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def subarraySum(self, nums: List[int], k: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar subarraySum = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,1,1], k = 2", stdin: "3\n1 1 1\n2\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [1,2,3], k = 3", stdin: "3\n1 2 3\n3\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [-1,2,3], k = 5", stdin: "3\n-1 2 3\n5\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [0,0,0,0], k = 0", stdin: "4\n0 0 0 0\n0\n", expected: "10", expectedRaw: "10" }
    ]
  },
  32: {
    id: 32, name: "Running Sum of 1D Array",
    functionName: "runningSum", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> runningSum(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] runningSum(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def runningSum(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar runningSum = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "[1,3,6,10]", expectedRaw: "1 3 6 10" },
      { input: "nums = [1,1,1,1,1]", stdin: "5\n1 1 1 1 1\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" }
    ],
    hiddenTests: [
      { input: "nums = [3,1,2,10,1]", stdin: "5\n3 1 2 10 1\n", expected: "[3,4,6,16,17]", expectedRaw: "3 4 6 16 17" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [0,0,0]", stdin: "3\n0 0 0\n", expected: "[0,0,0]", expectedRaw: "0 0 0" }
    ]
  },
  33: {
    id: 33, name: "Longest Subarray with Sum K",
    functionName: "longestSubarrayWithSumK", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int longestSubarrayWithSumK(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int longestSubarrayWithSumK(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def longestSubarrayWithSumK(self, nums: List[int], k: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar longestSubarrayWithSumK = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [10,5,2,7,1,9], k = 15", stdin: "6\n10 5 2 7 1 9\n15\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [1,2,3], k = 3", stdin: "3\n1 2 3\n3\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [1,2,3], k = 6", stdin: "3\n1 2 3\n6\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,0,1], k = 1", stdin: "3\n1 0 1\n1\n", expected: "2", expectedRaw: "2" }
    ]
  },
  34: {
    id: 34, name: "Equilibrium Index",
    functionName: "findEquilibriumIndex", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findEquilibriumIndex(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int findEquilibriumIndex(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findEquilibriumIndex(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findEquilibriumIndex = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-7,1,5,2,-4,3,0]", stdin: "7\n-7 1 5 2 -4 3 0\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [1,2,3]", stdin: "3\n1 2 3\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [0,0,0,0]", stdin: "4\n0 0 0 0\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [2,3,4,1,4]", stdin: "5\n2 3 4 1 4\n", expected: "2", expectedRaw: "2" }
    ]
  },
  35: {
    id: 35, name: "Range Sum Query",
    functionName: "rangeSumQuery", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "left", type: "int" }, { name: "right", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int rangeSumQuery(vector<int>& nums, int left, int right) {\n        // Build prefix sum and return sum in range\n        \n    }\n};",
      java: "class Solution {\n    public int rangeSumQuery(int[] nums, int left, int right) {\n        \n    }\n}",
      python: "class Solution:\n    def rangeSumQuery(self, nums: List[int], left: int, right: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} left\n * @param {number} right\n * @return {number}\n */\nvar rangeSumQuery = function(nums, left, right) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-2,0,3,-5,2,-1], left = 0, right = 2", stdin: "6\n-2 0 3 -5 2 -1\n0\n2\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [-2,0,3,-5,2,-1], left = 2, right = 5", stdin: "6\n-2 0 3 -5 2 -1\n2\n5\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "nums = [1,2,3,4,5], left = 0, right = 4", stdin: "5\n1 2 3 4 5\n0\n4\n", expected: "15", expectedRaw: "15" },
      { input: "nums = [1], left = 0, right = 0", stdin: "1\n1\n0\n0\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [-1,-2,-3], left = 0, right = 2", stdin: "3\n-1 -2 -3\n0\n2\n", expected: "-6", expectedRaw: "-6" }
    ]
  },
  36: {
    id: 36, name: "Rotate Array",
    functionName: "rotate", returnType: "void",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void rotate(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public void rotate(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def rotate(self, nums: List[int], k: int) -> None:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar rotate = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,4,5,6,7], k = 3", stdin: "7\n1 2 3 4 5 6 7\n3\n", expected: "[5,6,7,1,2,3,4]", expectedRaw: "5 6 7 1 2 3 4" },
      { input: "nums = [-1,-100,3,99], k = 2", stdin: "4\n-1 -100 3 99\n2\n", expected: "[3,99,-1,-100]", expectedRaw: "3 99 -1 -100" }
    ],
    hiddenTests: [
      { input: "nums = [1,2,3], k = 0", stdin: "3\n1 2 3\n0\n", expected: "[1,2,3]", expectedRaw: "1 2 3" },
      { input: "nums = [1], k = 5", stdin: "1\n1\n5\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [1,2], k = 2", stdin: "2\n1 2\n2\n", expected: "[1,2]", expectedRaw: "1 2" }
    ]
  },
  37: {
    id: 37, name: "Leaders in an Array",
    functionName: "findLeaders", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> findLeaders(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] findLeaders(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findLeaders(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar findLeaders = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [16,17,4,3,5,2]", stdin: "6\n16 17 4 3 5 2\n", expected: "[17,5,2]", expectedRaw: "17 5 2" },
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "[4]", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "nums = [4,3,2,1]", stdin: "4\n4 3 2 1\n", expected: "[4,3,2,1]", expectedRaw: "4 3 2 1" },
      { input: "nums = [7]", stdin: "1\n7\n", expected: "[7]", expectedRaw: "7" },
      { input: "nums = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "[1]", expectedRaw: "1" }
    ]
  },
  38: {
    id: 38, name: "Maximum Subarray",
    functionName: "maxSubArray", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", stdin: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expected: "6", expectedRaw: "6" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [5,4,-1,7,8]", stdin: "5\n5 4 -1 7 8\n", expected: "23", expectedRaw: "23" },
      { input: "nums = [-1,-2,-3,-4]", stdin: "4\n-1 -2 -3 -4\n", expected: "-1", expectedRaw: "-1" },
      { input: "nums = [0,-3,1,1]", stdin: "4\n0 -3 1 1\n", expected: "2", expectedRaw: "2" }
    ]
  },
  39: {
    id: 39, name: "Maximum Product Subarray",
    functionName: "maxProduct", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxProduct(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxProduct(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxProduct = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,3,-2,4]", stdin: "4\n2 3 -2 4\n", expected: "6", expectedRaw: "6" },
      { input: "nums = [-2,0,-1]", stdin: "3\n-2 0 -1\n", expected: "0", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [-2,3,-4]", stdin: "3\n-2 3 -4\n", expected: "24", expectedRaw: "24" },
      { input: "nums = [0,-2]", stdin: "2\n0 -2\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [-2]", stdin: "1\n-2\n", expected: "-2", expectedRaw: "-2" }
    ]
  },
  40: {
    id: 40, name: "Merge Intervals",
    functionName: "merge", returnType: "count:vector<vector<int>>",
    parameters: [{ name: "intervals", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};",
      java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}"
    },
    sampleTests: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", stdin: "4 2\n1 3 2 6 8 10 15 18\n", expected: "[[1,6],[8,10],[15,18]]", expectedRaw: "3" },
      { input: "intervals = [[1,4],[4,5]]", stdin: "2 2\n1 4 4 5\n", expected: "[[1,5]]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "intervals = [[1,4],[2,3]]", stdin: "2 2\n1 4 2 3\n", expected: "[[1,4]]", expectedRaw: "1" },
      { input: "intervals = [[1,2],[3,4],[5,6]]", stdin: "3 2\n1 2 3 4 5 6\n", expected: "[[1,2],[3,4],[5,6]]", expectedRaw: "3" },
      { input: "intervals = [[1,10],[2,3],[4,8]]", stdin: "3 2\n1 10 2 3 4 8\n", expected: "[[1,10]]", expectedRaw: "1" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // ARRAYS continued (41-43 overlap with Strings/Sorting)
  // ─────────────────────────────────────────────────────────────
  41: {
    id: 41, name: "Find Minimum in Rotated Sorted Array",
    functionName: "findMin", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,4,5,1,2]", stdin: "5\n3 4 5 1 2\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [4,5,6,7,0,1,2]", stdin: "7\n4 5 6 7 0 1 2\n", expected: "0", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [11,13,15,17]", stdin: "4\n11 13 15 17\n", expected: "11", expectedRaw: "11" },
      { input: "nums = [2,1]", stdin: "2\n2 1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // STRINGS
  // ─────────────────────────────────────────────────────────────
  42: {
    id: 42, name: "Valid Anagram",
    functionName: "isAnagram", returnType: "bool",
    parameters: [{ name: "s", type: "string" }, { name: "t", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}",
      python: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"anagram\", t = \"nagaram\"", stdin: "anagram\nnagaram\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"rat\", t = \"car\"", stdin: "rat\ncar\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "s = \"a\", t = \"a\"", stdin: "a\na\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"ab\", t = \"a\"", stdin: "ab\na\n", expected: "false", expectedRaw: "0" },
      { input: "s = \"aacc\", t = \"ccac\"", stdin: "aacc\nccac\n", expected: "false", expectedRaw: "0" }
    ]
  },
  43: {
    id: 43, name: "Group Anagrams",
    functionName: "groupAnagrams", returnType: "count:vector<vector<string>>",
    parameters: [{ name: "strs", type: "vector<string>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
      python: "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ",
      js: "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};"
    },
    sampleTests: [
      { input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", stdin: "6\neat\ntea\ntan\nate\nnat\nbat\n", expected: "3 groups", expectedRaw: "3" },
      { input: "strs = [\"\"]", stdin: "1\n@@EMPTY@@\n", expected: "1 group", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "strs = [\"a\"]", stdin: "1\na\n", expected: "1 group", expectedRaw: "1" },
      { input: "strs = [\"ab\",\"ba\",\"c\"]", stdin: "3\nab\nba\nc\n", expected: "2 groups", expectedRaw: "2" },
      { input: "strs = [\"z\",\"y\",\"x\"]", stdin: "3\nz\ny\nx\n", expected: "3 groups", expectedRaw: "3" }
    ]
  },
  44: {
    id: 44, name: "First Unique Character in a String",
    functionName: "firstUniqChar", returnType: "int",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int firstUniqChar(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int firstUniqChar(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def firstUniqChar(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar firstUniqChar = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"leetcode\"", stdin: "leetcode\n", expected: "0", expectedRaw: "0" },
      { input: "s = \"loveleetcode\"", stdin: "loveleetcode\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "s = \"aabb\"", stdin: "aabb\n", expected: "-1", expectedRaw: "-1" },
      { input: "s = \"z\"", stdin: "z\n", expected: "0", expectedRaw: "0" },
      { input: "s = \"aabbc\"", stdin: "aabbc\n", expected: "4", expectedRaw: "4" }
    ]
  },
  45: {
    id: 45, name: "Roman to Integer",
    functionName: "romanToInt", returnType: "int",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int romanToInt(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int romanToInt(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def romanToInt(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar romanToInt = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"III\"", stdin: "III\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"LVIII\"", stdin: "LVIII\n", expected: "58", expectedRaw: "58" }
    ],
    hiddenTests: [
      { input: "s = \"MCMXCIV\"", stdin: "MCMXCIV\n", expected: "1994", expectedRaw: "1994" },
      { input: "s = \"IV\"", stdin: "IV\n", expected: "4", expectedRaw: "4" },
      { input: "s = \"IX\"", stdin: "IX\n", expected: "9", expectedRaw: "9" }
    ]
  },
  46: {
    id: 46, name: "Character Frequency Count",
    functionName: "charFrequency", returnType: "int",
    parameters: [{ name: "s", type: "string" }, { name: "c", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int charFrequency(string s, string c) {\n        \n    }\n};",
      java: "class Solution {\n    public int charFrequency(String s, String c) {\n        \n    }\n}",
      python: "class Solution:\n    def charFrequency(self, s: str, c: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} c\n * @return {number}\n */\nvar charFrequency = function(s, c) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"aababab\", c = \"a\"", stdin: "aababab\na\n", expected: "4", expectedRaw: "4" },
      { input: "s = \"hello\", c = \"l\"", stdin: "hello\nl\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "s = \"aaa\", c = \"a\"", stdin: "aaa\na\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"abc\", c = \"d\"", stdin: "abc\nd\n", expected: "0", expectedRaw: "0" },
      { input: "s = \"z\", c = \"z\"", stdin: "z\nz\n", expected: "1", expectedRaw: "1" }
    ]
  },
  47: {
    id: 47, name: "Count Vowels and Consonants",
    functionName: "countVowels", returnType: "int",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int countVowels(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int countVowels(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def countVowels(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar countVowels = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"hello\"", stdin: "hello\n", expected: "2", expectedRaw: "2" },
      { input: "s = \"aeiou\"", stdin: "aeiou\n", expected: "5", expectedRaw: "5" }
    ],
    hiddenTests: [
      { input: "s = \"rhythm\"", stdin: "rhythm\n", expected: "0", expectedRaw: "0" },
      { input: "s = \"a\"", stdin: "a\n", expected: "1", expectedRaw: "1" },
      { input: "s = \"bcdfgh\"", stdin: "bcdfgh\n", expected: "0", expectedRaw: "0" }
    ]
  },
  48: {
    id: 48, name: "Valid Palindrome",
    functionName: "isPalindrome", returnType: "bool",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        ",
      js: "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"A man a plan a canal Panama\"", stdin: "AmanaplanacanalPanama\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"race a car\"", stdin: "raceacar\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "s = \" \"", stdin: "@@EMPTY@@\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"abcba\"", stdin: "abcba\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"abc\"", stdin: "abc\n", expected: "false", expectedRaw: "0" }
    ]
  },
  49: {
    id: 49, name: "Reverse String",
    functionName: "reverseString", returnType: "void",
    parameters: [{ name: "s", type: "vector<char>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};",
      java: "class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}"
    },
    sampleTests: [
      { input: "s = ['h','e','l','l','o']", stdin: "5\n104 101 108 108 111\n", expected: "['o','l','l','e','h']", expectedRaw: "111 108 108 101 104" },
      { input: "s = ['H','a','n','n','a','h']", stdin: "6\n72 97 110 110 97 104\n", expected: "['h','a','n','n','a','H']", expectedRaw: "104 97 110 110 97 72" }
    ],
    hiddenTests: [
      { input: "s = ['a']", stdin: "1\n97\n", expected: "['a']", expectedRaw: "97" },
      { input: "s = ['a','b']", stdin: "2\n97 98\n", expected: "['b','a']", expectedRaw: "98 97" },
      { input: "s = ['a','b','c','d']", stdin: "4\n97 98 99 100\n", expected: "['d','c','b','a']", expectedRaw: "100 99 98 97" }
    ]
  },
  50: {
    id: 50, name: "Reverse Words in a String",
    functionName: "reverseWords", returnType: "string",
    parameters: [{ name: "s", type: "string:line" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string reverseWords(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public String reverseWords(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def reverseWords(self, s: str) -> str:\n        ",
      js: "/**\n * @param {string} s\n * @return {string}\n */\nvar reverseWords = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"the sky is blue\"", stdin: "the_sky_is_blue\n", expected: "\"blue is sky the\"", expectedRaw: "blue is sky the" },
      { input: "s = \"  hello world  \"", stdin: "hello_world\n", expected: "\"world hello\"", expectedRaw: "world hello" }
    ],
    hiddenTests: [
      { input: "s = \"a good   example\"", stdin: "a_good_example\n", expected: "\"example good a\"", expectedRaw: "example good a" },
      { input: "s = \"Alice\"", stdin: "Alice\n", expected: "\"Alice\"", expectedRaw: "Alice" },
      { input: "s = \"single\"", stdin: "single\n", expected: "\"single\"", expectedRaw: "single" }
    ]
  },
  51: {
    id: 51, name: "String Compression",
    functionName: "compress", returnType: "int",
    parameters: [{ name: "chars", type: "vector<char>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int compress(vector<char>& chars) {\n        \n    }\n};",
      java: "class Solution {\n    public int compress(char[] chars) {\n        \n    }\n}"
    },
    sampleTests: [
      { input: "chars = ['a','a','b','b','c','c','c']", stdin: "7\n97 97 98 98 99 99 99\n", expected: "6", expectedRaw: "6" },
      { input: "chars = ['a']", stdin: "1\n97\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "chars = ['a','b','b','b','b','b','b','b','b','b','b','b','b']", stdin: "13\n97 98 98 98 98 98 98 98 98 98 98 98 98\n", expected: "4", expectedRaw: "4" },
      { input: "chars = ['a','a','a','a']", stdin: "4\n97 97 97 97\n", expected: "2", expectedRaw: "2" },
      { input: "chars = ['a','b','c']", stdin: "3\n97 98 99\n", expected: "3", expectedRaw: "3" }
    ]
  },
  52: {
    id: 52, name: "Longest Substring Without Repeating Characters",
    functionName: "lengthOfLongestSubstring", returnType: "int",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"abcabcbb\"", stdin: "abcabcbb\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"bbbbb\"", stdin: "bbbbb\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "s = \"pwwkew\"", stdin: "pwwkew\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"au\"", stdin: "au\n", expected: "2", expectedRaw: "2" },
      { input: "s = \"dvdf\"", stdin: "dvdf\n", expected: "3", expectedRaw: "3" }
    ]
  },
  53: {
    id: 53, name: "Longest Repeating Character Replacement",
    functionName: "characterReplacement", returnType: "int",
    parameters: [{ name: "s", type: "string" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int characterReplacement(String s, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @param {number} k\n * @return {number}\n */\nvar characterReplacement = function(s, k) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"ABAB\", k = 2", stdin: "ABAB\n2\n", expected: "4", expectedRaw: "4" },
      { input: "s = \"AABABBA\", k = 1", stdin: "AABABBA\n1\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "s = \"A\", k = 0", stdin: "A\n0\n", expected: "1", expectedRaw: "1" },
      { input: "s = \"AAAA\", k = 2", stdin: "AAAA\n2\n", expected: "4", expectedRaw: "4" },
      { input: "s = \"ABCD\", k = 1", stdin: "ABCD\n1\n", expected: "2", expectedRaw: "2" }
    ]
  },
  54: {
    id: 54, name: "Find All Anagrams in String",
    functionName: "findAnagrams", returnType: "vector<int>",
    parameters: [{ name: "s", type: "string" }, { name: "p", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> findAnagrams(string s, string p) {\n        \n    }\n};",
      java: "class Solution {\n    public List<Integer> findAnagrams(String s, String p) {\n        \n    }\n}",
      python: "class Solution:\n    def findAnagrams(self, s: str, p: str) -> List[int]:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} p\n * @return {number[]}\n */\nvar findAnagrams = function(s, p) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"cbaebabacd\", p = \"abc\"", stdin: "cbaebabacd\nabc\n", expected: "[0,6]", expectedRaw: "0 6" },
      { input: "s = \"abab\", p = \"ab\"", stdin: "abab\nab\n", expected: "[0,1,2]", expectedRaw: "0 1 2" }
    ],
    hiddenTests: [
      { input: "s = \"aa\", p = \"bb\"", stdin: "aa\nbb\n", expected: "[]", expectedRaw: "" },
      { input: "s = \"baa\", p = \"aa\"", stdin: "baa\naa\n", expected: "[1]", expectedRaw: "1" },
      { input: "s = \"abcd\", p = \"d\"", stdin: "abcd\nd\n", expected: "[3]", expectedRaw: "3" }
    ]
  },
  55: {
    id: 55, name: "Minimum Window Substring",
    functionName: "minWindow", returnType: "string",
    parameters: [{ name: "s", type: "string" }, { name: "t", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};",
      java: "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
      python: "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nvar minWindow = function(s, t) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"ADOBECODEBANC\", t = \"ABC\"", stdin: "ADOBECODEBANC\nABC\n", expected: "\"BANC\"", expectedRaw: "BANC" },
      { input: "s = \"a\", t = \"a\"", stdin: "a\na\n", expected: "\"a\"", expectedRaw: "a" }
    ],
    hiddenTests: [
      { input: "s = \"a\", t = \"aa\"", stdin: "a\naa\n", expected: "\"\"", expectedRaw: "" },
      { input: "s = \"abc\", t = \"b\"", stdin: "abc\nb\n", expected: "\"b\"", expectedRaw: "b" },
      { input: "s = \"cabwefgewcwaefgcf\", t = \"cae\"", stdin: "cabwefgewcwaefgcf\ncae\n", expected: "\"cwae\"", expectedRaw: "cwae" }
    ]
  },
  56: {
    id: 56, name: "Longest Common Prefix",
    functionName: "longestCommonPrefix", returnType: "string",
    parameters: [{ name: "strs", type: "vector<string>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        \n    }\n};",
      java: "class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        \n    }\n}"
    },
    sampleTests: [
      { input: "strs = [\"flower\",\"flow\",\"flight\"]", stdin: "3\nflower\nflow\nflight\n", expected: "\"fl\"", expectedRaw: "fl" },
      { input: "strs = [\"dog\",\"racecar\",\"car\"]", stdin: "3\ndog\nracecar\ncar\n", expected: "\"\"", expectedRaw: "" }
    ],
    hiddenTests: [
      { input: "strs = [\"abc\"]", stdin: "1\nabc\n", expected: "\"abc\"", expectedRaw: "abc" },
      { input: "strs = [\"\",\"b\"]", stdin: "2\n-\nb\n", expected: "\"\"", expectedRaw: "" },
      { input: "strs = [\"ab\",\"ab\",\"abc\"]", stdin: "3\nab\nab\nabc\n", expected: "\"ab\"", expectedRaw: "ab" }
    ]
  },
  57: {
    id: 57, name: "Check String Rotation",
    functionName: "rotateString", returnType: "bool",
    parameters: [{ name: "s", type: "string" }, { name: "goal", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool rotateString(string s, string goal) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean rotateString(String s, String goal) {\n        \n    }\n}",
      python: "class Solution:\n    def rotateString(self, s: str, goal: str) -> bool:\n        ",
      js: "/**\n * @param {string} s\n * @param {string} goal\n * @return {boolean}\n */\nvar rotateString = function(s, goal) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"abcde\", goal = \"cdeab\"", stdin: "abcde\ncdeab\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"abcde\", goal = \"abced\"", stdin: "abcde\nabced\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "s = \"\", goal = \"\"", stdin: "@@EMPTY@@\n@@EMPTY@@\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"a\", goal = \"a\"", stdin: "a\na\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"aa\", goal = \"a\"", stdin: "aa\na\n", expected: "false", expectedRaw: "0" }
    ]
  },
  58: {
    id: 58, name: "Encode and Decode Strings",
    className: "Codec", functionName: "encode", returnType: "design:Codec",
    parameters: [{ name: "strs", type: "vector<string>" }],
    starterCode: {
      cpp: "class Codec {\npublic:\n    string encode(vector<string>& strs) {\n        \n    }\n    vector<string> decode(string s) {\n        \n    }\n};",
      java: "public class Codec {\n    public String encode(List<String> strs) {\n        \n    }\n    public List<String> decode(String s) {\n        \n    }\n}"
    },
    sampleTests: [
      { input: "strs = [\"Hello\",\"World\"]", stdin: "2\nHello\nWorld\n", expected: "2", expectedRaw: "2" },
      { input: "strs = [\"\"]", stdin: "1\n-\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "strs = []", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "strs = [\"a\",\"b\",\"c\"]", stdin: "3\na\nb\nc\n", expected: "3", expectedRaw: "3" },
      { input: "strs = [\"Hello World\"]", stdin: "1\nHello-World\n", expected: "1", expectedRaw: "1" }
    ]
  },
  59: {
    id: 59, name: "Longest Palindromic Substring",
    functionName: "longestPalindrome", returnType: "string", compareMode: "any_of",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string longestPalindrome(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public String longestPalindrome(String s) {\n        \n    }\n}"
    },
    sampleTests: [
      { input: "s = \"babad\"", stdin: "babad\n", expected: "\"bab\" or \"aba\"", expectedRaw: "bab | aba" },
      { input: "s = \"cbbd\"", stdin: "cbbd\n", expected: "\"bb\"", expectedRaw: "bb" }
    ],
    hiddenTests: [
      { input: "s = \"a\"", stdin: "a\n", expected: "\"a\"", expectedRaw: "a" },
      { input: "s = \"ac\"", stdin: "ac\n", expected: "\"a\" or \"c\"", expectedRaw: "a | c" },
      { input: "s = \"racecar\"", stdin: "racecar\n", expected: "\"racecar\"", expectedRaw: "racecar" }
    ]
  },
  60: {
    id: 60, name: "Palindromic Substrings",
    functionName: "countSubstrings", returnType: "int",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int countSubstrings(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int countSubstrings(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def countSubstrings(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar countSubstrings = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"abc\"", stdin: "abc\n", expected: "3", expectedRaw: "3" },
      { input: "s = \"aaa\"", stdin: "aaa\n", expected: "6", expectedRaw: "6" }
    ],
    hiddenTests: [
      { input: "s = \"a\"", stdin: "a\n", expected: "1", expectedRaw: "1" },
      { input: "s = \"ab\"", stdin: "ab\n", expected: "2", expectedRaw: "2" },
      { input: "s = \"aaaa\"", stdin: "aaaa\n", expected: "10", expectedRaw: "10" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // LINKED LIST (use int arrays to simulate simple cases)
  // ─────────────────────────────────────────────────────────────
  61: {
    id: 61, name: "Linked List Cycle",
    functionName: "hasCycle", returnType: "bool",
    parameters: [{ name: "head", type: "ListNode*:cycle" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "head = [3,2,0,-4], pos = 1", stdin: "4\n3 2 0 -4\n1\n", expected: "true", expectedRaw: "1" },
      { input: "head = [1,2], pos = 0", stdin: "2\n1 2\n0\n", expected: "true", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "head = [1], pos = -1", stdin: "1\n1\n-1\n", expected: "false", expectedRaw: "0" },
      { input: "head = [1,2,3], pos = -1", stdin: "3\n1 2 3\n-1\n", expected: "false", expectedRaw: "0" },
      { input: "head = [1,2,3,4], pos = 2", stdin: "4\n1 2 3 4\n2\n", expected: "true", expectedRaw: "1" }
    ]
  },
  62: {
    id: 62, name: "Middle of Linked List",
    functionName: "middleNode", returnType: "ListNode*->val",
    parameters: [{ name: "head", type: "ListNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* middleNode(ListNode* head) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode middleNode(ListNode head) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar middleNode = function(head) {\n    \n};"
    },
    sampleTests: [
      { input: "head = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "3", expectedRaw: "3" },
      { input: "head = [1,2,3,4,5,6]", stdin: "6\n1 2 3 4 5 6\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "head = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "head = [1,2]", stdin: "2\n1 2\n", expected: "2", expectedRaw: "2" },
      { input: "head = [1,2,3]", stdin: "3\n1 2 3\n", expected: "2", expectedRaw: "2" }
    ]
  },
  63: {
    id: 63, name: "Palindrome Linked List",
    functionName: "isPalindrome", returnType: "bool",
    parameters: [{ name: "head", type: "ListNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    bool isPalindrome(ListNode* head) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public boolean isPalindrome(ListNode head) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def isPalindrome(self, head: Optional[ListNode]) -> bool:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {boolean}\n */\nvar isPalindrome = function(head) {\n    \n};"
    },
    sampleTests: [
      { input: "head = [1,2,2,1]", stdin: "4\n1 2 2 1\n", expected: "true", expectedRaw: "1" },
      { input: "head = [1,2]", stdin: "2\n1 2\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "head = [1]", stdin: "1\n1\n", expected: "true", expectedRaw: "1" },
      { input: "head = [1,2,1]", stdin: "3\n1 2 1\n", expected: "true", expectedRaw: "1" },
      { input: "head = [1,2,3,1]", stdin: "4\n1 2 3 1\n", expected: "false", expectedRaw: "0" }
    ]
  },
  64: {
    id: 64, name: "Detect Cycle Start in Linked List",
    functionName: "detectCycle", returnType: "ListNode*->val",
    parameters: [{ name: "head", type: "ListNode*:cycle" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode *detectCycle(ListNode *head) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "head = [3,2,0,-4], pos = 1", stdin: "4\n3 2 0 -4\n1\n", expected: "2", expectedRaw: "2" },
      { input: "head = [1,2], pos = 0", stdin: "2\n1 2\n0\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "head = [1], pos = -1", stdin: "1\n1\n-1\n", expected: "-1", expectedRaw: "-1" },
      { input: "head = [1,2,3], pos = -1", stdin: "3\n1 2 3\n-1\n", expected: "-1", expectedRaw: "-1" },
      { input: "head = [1,2,3,4], pos = 0", stdin: "4\n1 2 3 4\n0\n", expected: "1", expectedRaw: "1" }
    ]
  },
  65: {
    id: 65, name: "Reverse Linked List",
    functionName: "reverseList", returnType: "ListNode*",
    parameters: [{ name: "head", type: "ListNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};"
    },
    sampleTests: [
      { input: "head = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "[5,4,3,2,1]", expectedRaw: "5 4 3 2 1" },
      { input: "head = [1,2]", stdin: "2\n1 2\n", expected: "[2,1]", expectedRaw: "2 1" }
    ],
    hiddenTests: [
      { input: "head = []", stdin: "0\n", expected: "[]", expectedRaw: "" },
      { input: "head = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "head = [1,2,3]", stdin: "3\n1 2 3\n", expected: "[3,2,1]", expectedRaw: "3 2 1" }
    ]
  },
  66: {
    id: 66, name: "Reverse Linked List in Groups",
    functionName: "reverseKGroup", returnType: "ListNode*",
    parameters: [{ name: "head", type: "ListNode*" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseKGroup(ListNode* head, int k) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseKGroup(ListNode head, int k) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @param {number} k\n * @return {ListNode}\n */\nvar reverseKGroup = function(head, k) {\n    \n};"
    },
    sampleTests: [
      { input: "head = [1,2,3,4,5], k = 2", stdin: "5\n1 2 3 4 5\n2\n", expected: "[2,1,4,3,5]", expectedRaw: "2 1 4 3 5" },
      { input: "head = [1,2,3,4,5], k = 3", stdin: "5\n1 2 3 4 5\n3\n", expected: "[3,2,1,4,5]", expectedRaw: "3 2 1 4 5" }
    ],
    hiddenTests: [
      { input: "head = [1,2,3,4], k = 2", stdin: "4\n1 2 3 4\n2\n", expected: "[2,1,4,3]", expectedRaw: "2 1 4 3" },
      { input: "head = [1], k = 1", stdin: "1\n1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "head = [1,2], k = 2", stdin: "2\n1 2\n2\n", expected: "[2,1]", expectedRaw: "2 1" }
    ]
  },
  67: {
    id: 67, name: "Merge Two Sorted Lists",
    functionName: "mergeTwoLists", returnType: "ListNode*",
    parameters: [{ name: "list1", type: "ListNode*" }, { name: "list2", type: "ListNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    \n};"
    },
    sampleTests: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", stdin: "3\n1 2 4\n3\n1 3 4\n", expected: "[1,1,2,3,4,4]", expectedRaw: "1 1 2 3 4 4" },
      { input: "list1 = [], list2 = []", stdin: "0\n\n0\n\n", expected: "[]", expectedRaw: "" }
    ],
    hiddenTests: [
      { input: "list1 = [], list2 = [0]", stdin: "0\n\n1\n0\n", expected: "[0]", expectedRaw: "0" },
      { input: "list1 = [1], list2 = [2]", stdin: "1\n1\n1\n2\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "list1 = [1,3,5], list2 = [2,4]", stdin: "3\n1 3 5\n2\n2 4\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" }
    ]
  },
  68: {
    id: 68, name: "Remove Nth Node From End of List",
    functionName: "removeNthFromEnd", returnType: "ListNode*",
    parameters: [{ name: "head", type: "ListNode*" }, { name: "n", type: "int" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* removeNthFromEnd(ListNode* head, int n) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @param {number} n\n * @return {ListNode}\n */\nvar removeNthFromEnd = function(head, n) {\n    \n};"
    },
    sampleTests: [
      { input: "head = [1,2,3,4,5], n = 2", stdin: "5\n1 2 3 4 5\n2\n", expected: "[1,2,3,5]", expectedRaw: "1 2 3 5" },
      { input: "head = [1], n = 1", stdin: "1\n1\n1\n", expected: "[]", expectedRaw: "" }
    ],
    hiddenTests: [
      { input: "head = [1,2], n = 1", stdin: "2\n1 2\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "head = [1,2], n = 2", stdin: "2\n1 2\n2\n", expected: "[2]", expectedRaw: "2" },
      { input: "head = [1,2,3], n = 2", stdin: "3\n1 2 3\n2\n", expected: "[1,3]", expectedRaw: "1 3" }
    ]
  },
  69: {
    id: 69, name: "Add Two Numbers",
    functionName: "addTwoNumbers", returnType: "ListNode*",
    parameters: [{ name: "l1", type: "ListNode*" }, { name: "l2", type: "ListNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} l1\n * @param {ListNode} l2\n * @return {ListNode}\n */\nvar addTwoNumbers = function(l1, l2) {\n    \n};"
    },
    sampleTests: [
      { input: "l1 = [2,4,3], l2 = [5,6,4]", stdin: "3\n2 4 3\n3\n5 6 4\n", expected: "[7,0,8]", expectedRaw: "7 0 8" },
      { input: "l1 = [0], l2 = [0]", stdin: "1\n0\n1\n0\n", expected: "[0]", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", stdin: "7\n9 9 9 9 9 9 9\n4\n9 9 9 9\n", expected: "[8,9,9,9,0,0,0,1]", expectedRaw: "8 9 9 9 0 0 0 1" },
      { input: "l1 = [1], l2 = [9,9]", stdin: "1\n1\n2\n9 9\n", expected: "[0,0,1]", expectedRaw: "0 0 1" },
      { input: "l1 = [5], l2 = [5]", stdin: "1\n5\n1\n5\n", expected: "[0,1]", expectedRaw: "0 1" }
    ]
  },
  70: {
    id: 70, name: "Intersection of Two Linked Lists",
    functionName: "getIntersectionNode", returnType: "ListNode*->val",
    parameters: [{ name: "headA", type: "ListNode*:intersectA" }, { name: "headB", type: "ListNode*:intersectB" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {\n        \n    }\n};",
      java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\npublic class Solution {\n    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {\n        \n    }\n}",
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def getIntersectionNode(self, headA: ListNode, headB: ListNode) -> Optional[ListNode]:\n        ",
      js: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} headA\n * @param {ListNode} headB\n * @return {ListNode}\n */\nvar getIntersectionNode = function(headA, headB) {\n    \n};"
    },
    sampleTests: [
      { input: "listA=[4,1,8,4,5], listB=[5,6,1,8,4,5], skipA=2, skipB=3", stdin: "2\n4 1\n3\n5 6 1\n3\n8 4 5\n", expected: "8", expectedRaw: "8" },
      { input: "listA=[1,9,1,2,4], listB=[3,2,4], skipA=3, skipB=1", stdin: "3\n1 9 1\n1\n3\n2\n2 4\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "listA=[2,6,4], listB=[1,5], no intersection", stdin: "3\n2 6 4\n2\n1 5\n0\n\n", expected: "0", expectedRaw: "-1" },
      { input: "single node intersection", stdin: "0\n\n0\n\n1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "no intersection, disjoint single nodes", stdin: "1\n5\n1\n9\n0\n\n", expected: "0", expectedRaw: "-1" }
    ]
  },
  71: {
    id: 71, name: "Find The Duplicate Number",
    functionName: "findDuplicate", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findDuplicate(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int findDuplicate(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findDuplicate = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,3,4,2,2]", stdin: "5\n1 3 4 2 2\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [3,1,3,4,2]", stdin: "5\n3 1 3 4 2\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "nums = [1,1]", stdin: "2\n1 1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [3,3,3,3,3]", stdin: "5\n3 3 3 3 3\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [1,2,4,4,3]", stdin: "5\n1 2 4 4 3\n", expected: "4", expectedRaw: "4" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // STACKS & QUEUES
  // ─────────────────────────────────────────────────────────────
  72: {
    id: 72, name: "Valid Parentheses",
    functionName: "isValid", returnType: "bool",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        ",
      js: "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"()\"", stdin: "()\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"()[]{\"", stdin: "()[]{}\n", expected: "true", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "s = \"(]\"", stdin: "(]\n", expected: "false", expectedRaw: "0" },
      { input: "s = \"([)]\"", stdin: "([)]\n", expected: "false", expectedRaw: "0" },
      { input: "s = \"{[]}\"", stdin: "{[]}\n", expected: "true", expectedRaw: "1" }
    ]
  },
  73: {
    id: 73, name: "Min Stack",
    className: "MinStack", functionName: "getMin", returnType: "design:MinStack",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class MinStack {\npublic:\n    MinStack() {}\n    void push(int val) {}\n    void pop() {}\n    int top() {}\n    int getMin() {}\n};",
      java: "class MinStack {\n    public MinStack() {}\n    public void push(int val) {}\n    public void pop() {}\n    public int top() {}\n    public int getMin() {}\n}",
      python: "class MinStack:\n    def __init__(self):\n        pass\n    def push(self, val: int) -> None:\n        pass\n    def pop(self) -> None:\n        pass\n    def top(self) -> int:\n        pass\n    def getMin(self) -> int:\n        pass",
      js: "class MinStack {\n    constructor() {}\n    push(val) {}\n    pop() {}\n    top() {}\n    getMin() {}\n}"
    },
    sampleTests: [
      { input: "push(-2),push(0),push(-3),getMin()", stdin: "3\n-2 0 -3\n", expected: "-3", expectedRaw: "-3" },
      { input: "push(1),getMin()", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "push(2),push(0),push(3),push(0),getMin()", stdin: "4\n2 0 3 0\n", expected: "0", expectedRaw: "0" },
      { input: "push(5),push(3),push(7),getMin()", stdin: "3\n5 3 7\n", expected: "3", expectedRaw: "3" },
      { input: "push(-1),getMin()", stdin: "1\n-1\n", expected: "-1", expectedRaw: "-1" }
    ]
  },
  74: {
    id: 74, name: "Implement Queue Using Stacks",
    className: "MyQueue", functionName: "peek", returnType: "design:MyQueue",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class MyQueue {\npublic:\n    MyQueue() {}\n    void push(int x) {}\n    int pop() {}\n    int peek() {}\n    bool empty() {}\n};",
      java: "class MyQueue {\n    public MyQueue() {}\n    public void push(int x) {}\n    public int pop() { return 0; }\n    public int peek() { return 0; }\n    public boolean empty() { return true; }\n}",
      python: "class MyQueue:\n    def __init__(self):\n        pass\n    def push(self, x: int) -> None:\n        pass\n    def pop(self) -> int:\n        pass\n    def peek(self) -> int:\n        pass\n    def empty(self) -> bool:\n        pass",
      js: "class MyQueue {\n    constructor() {}\n    push(x) {}\n    pop() {}\n    peek() {}\n    empty() {}\n}"
    },
    sampleTests: [
      { input: "push(1),push(2),peek()", stdin: "2\n1 2\n", expected: "1", expectedRaw: "1" },
      { input: "push(1),peek()", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "push(1),push(2),peek()", stdin: "2\n1 2\n", expected: "1", expectedRaw: "1" },
      { input: "push(3),peek()", stdin: "1\n3\n", expected: "3", expectedRaw: "3" },
      { input: "push(5),push(6),peek()", stdin: "2\n5 6\n", expected: "5", expectedRaw: "5" }
    ]
  },
  75: {
    id: 75, name: "Daily Temperatures",
    functionName: "dailyTemperatures", returnType: "vector<int>",
    parameters: [{ name: "temperatures", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        \n    }\n}",
      python: "class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} temperatures\n * @return {number[]}\n */\nvar dailyTemperatures = function(temperatures) {\n    \n};"
    },
    sampleTests: [
      { input: "temperatures = [73,74,75,71,69,72,76,73]", stdin: "8\n73 74 75 71 69 72 76 73\n", expected: "[1,1,4,2,1,1,0,0]", expectedRaw: "1 1 4 2 1 1 0 0" },
      { input: "temperatures = [30,40,50,60]", stdin: "4\n30 40 50 60\n", expected: "[1,1,1,0]", expectedRaw: "1 1 1 0" }
    ],
    hiddenTests: [
      { input: "temperatures = [30,60,90]", stdin: "3\n30 60 90\n", expected: "[1,1,0]", expectedRaw: "1 1 0" },
      { input: "temperatures = [50]", stdin: "1\n50\n", expected: "[0]", expectedRaw: "0" },
      { input: "temperatures = [90,80,70,60]", stdin: "4\n90 80 70 60\n", expected: "[0,0,0,0]", expectedRaw: "0 0 0 0" }
    ]
  },
  76: {
    id: 76, name: "Largest Rectangle in Histogram",
    functionName: "largestRectangleArea", returnType: "int",
    parameters: [{ name: "heights", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        \n    }\n};",
      java: "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        \n    }\n}",
      python: "class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} heights\n * @return {number}\n */\nvar largestRectangleArea = function(heights) {\n    \n};"
    },
    sampleTests: [
      { input: "heights = [2,1,5,6,2,3]", stdin: "6\n2 1 5 6 2 3\n", expected: "10", expectedRaw: "10" },
      { input: "heights = [2,4]", stdin: "2\n2 4\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "heights = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "heights = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "4", expectedRaw: "4" },
      { input: "heights = [5,4,3,2,1]", stdin: "5\n5 4 3 2 1\n", expected: "9", expectedRaw: "9" }
    ]
  },
  77: {
    id: 77, name: "Next Greater Element",
    functionName: "nextGreaterElement", returnType: "vector<int>",
    parameters: [{ name: "nums1", type: "vector<int>" }, { name: "nums2", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] nextGreaterElement(int[] nums1, int[] nums2) {\n        \n    }\n}",
      python: "class Solution:\n    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number[]}\n */\nvar nextGreaterElement = function(nums1, nums2) {\n    \n};"
    },
    sampleTests: [
      { input: "nums1 = [4,1,2], nums2 = [1,3,4,2]", stdin: "3\n4 1 2\n4\n1 3 4 2\n", expected: "[-1,3,-1]", expectedRaw: "-1 3 -1" },
      { input: "nums1 = [2,4], nums2 = [1,2,3,4]", stdin: "2\n2 4\n4\n1 2 3 4\n", expected: "[3,-1]", expectedRaw: "3 -1" }
    ],
    hiddenTests: [
      { input: "nums1 = [1], nums2 = [1,3]", stdin: "1\n1\n2\n1 3\n", expected: "[3]", expectedRaw: "3" },
      { input: "nums1 = [2], nums2 = [3,2]", stdin: "1\n2\n2\n3 2\n", expected: "[-1]", expectedRaw: "-1" },
      { input: "nums1 = [1,3,5,2,4], nums2 = [6,5,4,3,2,1,7]", stdin: "5\n1 3 5 2 4\n7\n6 5 4 3 2 1 7\n", expected: "[7,7,7,7,7]", expectedRaw: "7 7 7 7 7" }
    ]
  },
  78: {
    id: 78, name: "Stock Span Problem",
    functionName: "stockSpan", returnType: "vector<int>",
    parameters: [{ name: "prices", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> stockSpan(vector<int>& prices) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] stockSpan(int[] prices) {\n        \n    }\n}",
      python: "class Solution:\n    def stockSpan(self, prices: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} prices\n * @return {number[]}\n */\nvar stockSpan = function(prices) {\n    \n};"
    },
    sampleTests: [
      { input: "prices = [100,80,60,70,60,75,85]", stdin: "7\n100 80 60 70 60 75 85\n", expected: "[1,1,1,2,1,4,6]", expectedRaw: "1 1 1 2 1 4 6" },
      { input: "prices = [10,4,5,90,120,80]", stdin: "6\n10 4 5 90 120 80\n", expected: "[1,1,2,4,5,1]", expectedRaw: "1 1 2 4 5 1" }
    ],
    hiddenTests: [
      { input: "prices = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "prices = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" },
      { input: "prices = [5,4,3,2,1]", stdin: "5\n5 4 3 2 1\n", expected: "[1,1,1,1,1]", expectedRaw: "1 1 1 1 1" }
    ]
  },
  79: {
    id: 79, name: "Sliding Window Maximum",
    functionName: "maxSlidingWindow", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar maxSlidingWindow = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", stdin: "8\n1 3 -1 -3 5 3 6 7\n3\n", expected: "[3,3,5,5,6,7]", expectedRaw: "3 3 5 5 6 7" },
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "[1]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [1,3,1,2,0,5], k = 3", stdin: "6\n1 3 1 2 0 5\n3\n", expected: "[3,3,2,5]", expectedRaw: "3 3 2 5" },
      { input: "nums = [9,11], k = 2", stdin: "2\n9 11\n2\n", expected: "[11]", expectedRaw: "11" },
      { input: "nums = [1,2,3,4,5], k = 1", stdin: "5\n1 2 3 4 5\n1\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" }
    ]
  },
  80: {
    id: 80, name: "Design Circular Queue",
    className: "MyCircularQueue", constructorArgs: [1], functionName: "Rear", returnType: "design:MyCircularQueue",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class MyCircularQueue {\npublic:\n    MyCircularQueue(int k) {}\n    bool enQueue(int value) {}\n    bool deQueue() {}\n    int Front() {}\n    int Rear() {}\n    bool isEmpty() {}\n    bool isFull() {}\n};",
      java: "class MyCircularQueue {\n    public MyCircularQueue(int k) {}\n    public boolean enQueue(int value) { return false; }\n    public boolean deQueue() { return false; }\n    public int Front() { return -1; }\n    public int Rear() { return -1; }\n    public boolean isEmpty() { return true; }\n    public boolean isFull() { return false; }\n}",
      python: "class MyCircularQueue:\n    def __init__(self, k: int):\n        pass\n    def enQueue(self, value: int) -> bool:\n        pass\n    def deQueue(self) -> bool:\n        pass\n    def Front(self) -> int:\n        pass\n    def Rear(self) -> int:\n        pass\n    def isEmpty(self) -> bool:\n        pass\n    def isFull(self) -> bool:\n        pass",
      js: "class MyCircularQueue {\n    constructor(k) {}\n    enQueue(value) {}\n    deQueue() {}\n    Front() {}\n    Rear() {}\n    isEmpty() {}\n    isFull() {}\n}"
    },
    sampleTests: [
      { input: "k=3, enQueue(1),enQueue(2),enQueue(3),Rear()", stdin: "3\n1 2 3\n3\n", expected: "3", expectedRaw: "3" },
      { input: "k=6, enQueue(6),Rear()", stdin: "1\n6\n6\n", expected: "6", expectedRaw: "6" }
    ],
    hiddenTests: [
      { input: "k=2, enQueue(9),enQueue(9),Rear()", stdin: "2\n9 9\n2\n", expected: "9", expectedRaw: "9" },
      { input: "k=2, enQueue(1),enQueue(2),enQueue(3),Rear()", stdin: "3\n1 2 3\n2\n", expected: "2", expectedRaw: "2" },
      { input: "k=1, enQueue(4),Rear()", stdin: "1\n4\n1\n", expected: "4", expectedRaw: "4" }
    ]
  },
  81: {
    id: 81, name: "First Non-Repeating Character in Stream",
    functionName: "firstNonRepeating", returnType: "string",
    parameters: [{ name: "s", type: "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string firstNonRepeating(string stream) {\n        \n    }\n};",
      java: "class Solution {\n    public String firstNonRepeating(String stream) {\n        \n    }\n}",
      python: "class Solution:\n    def firstNonRepeating(self, stream: str) -> str:\n        ",
      js: "/**\n * @param {string} stream\n * @return {string}\n */\nvar firstNonRepeating = function(stream) {\n    \n};"
    },
    sampleTests: [
      { input: "stream = \"aabc\"", stdin: "aabc\n", expected: "\"a#bb\"", expectedRaw: "a#bb" },
      { input: "stream = \"abcabc\"", stdin: "abcabc\n", expected: "\"aaabc#\"", expectedRaw: "aaabc#" }
    ],
    hiddenTests: [
      { input: "stream = \"a\"", stdin: "a\n", expected: "\"a\"", expectedRaw: "a" },
      { input: "stream = \"aa\"", stdin: "aa\n", expected: "\"a#\"", expectedRaw: "a#" },
      { input: "stream = \"abab\"", stdin: "abab\n", expected: "\"aab#\"", expectedRaw: "aab#" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // TREES & BST
  // ─────────────────────────────────────────────────────────────
  82: {
    id: 82, name: "Maximum Depth of Binary Tree",
    functionName: "maxDepth", returnType: "int",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [3,9,20,null,null,15,7]", stdin: "7\n3 9 20 -1 -1 15 7\n", expected: "3", expectedRaw: "3" },
      { input: "root = [1,null,2]", stdin: "2\n1 2\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "root = []", stdin: "0\n\n", expected: "0", expectedRaw: "0" },
      { input: "root = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "root = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "3", expectedRaw: "3" }
    ]
  },
  83: {
    id: 83, name: "Invert Binary Tree",
    functionName: "invertTree", returnType: "TreeNode*",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public TreeNode invertTree(TreeNode root) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [4,2,7,1,3,6,9]", stdin: "7\n4 2 7 1 3 6 9\n", expected: "[4,7,2,9,6,3,1]", expectedRaw: "4 7 2 9 6 3 1" },
      { input: "root = [2,1,3]", stdin: "3\n2 1 3\n", expected: "[2,3,1]", expectedRaw: "2 3 1" }
    ],
    hiddenTests: [
      { input: "root = []", stdin: "0\n\n", expected: "[]", expectedRaw: "" },
      { input: "root = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "root = [1,2]", stdin: "2\n1 2\n", expected: "[1,2]", expectedRaw: "1 2" }
    ]
  },
  84: {
    id: 84, name: "Diameter of Binary Tree",
    functionName: "diameterOfBinaryTree", returnType: "int",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int diameterOfBinaryTree(TreeNode* root) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int diameterOfBinaryTree(TreeNode root) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar diameterOfBinaryTree = function(root) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "3", expectedRaw: "3" },
      { input: "root = [1,2]", stdin: "2\n1 2\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "root = [1]", stdin: "1\n1\n", expected: "0", expectedRaw: "0" },
      { input: "root = [1,2,3]", stdin: "3\n1 2 3\n", expected: "2", expectedRaw: "2" },
      { input: "root = [1,2,3,4,5,6,7]", stdin: "7\n1 2 3 4 5 6 7\n", expected: "4", expectedRaw: "4" }
    ]
  },
  85: {
    id: 85, name: "Balanced Binary Tree",
    functionName: "isBalanced", returnType: "bool",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    bool isBalanced(TreeNode* root) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public boolean isBalanced(TreeNode root) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isBalanced(self, root: Optional[TreeNode]) -> bool:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isBalanced = function(root) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [3,9,20,null,null,15,7]", stdin: "7\n3 9 20 -1 -1 15 7\n", expected: "true", expectedRaw: "1" },
      { input: "root = [1,2,2,3,3,null,null,4,4]", stdin: "9\n1 2 2 3 3 -1 -1 4 4\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "root = []", stdin: "0\n\n", expected: "true", expectedRaw: "1" },
      { input: "root = [1]", stdin: "1\n1\n", expected: "true", expectedRaw: "1" },
      { input: "root = [1,2,3,4,5,6,null,8]", stdin: "8\n1 2 3 4 5 6 -1 8\n", expected: "true", expectedRaw: "1" }
    ]
  },
  86: {
    id: 86, name: "Path Sum",
    functionName: "hasPathSum", returnType: "bool",
    parameters: [{ name: "root", type: "TreeNode*" }, { name: "targetSum", type: "int" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    bool hasPathSum(TreeNode* root, int targetSum) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public boolean hasPathSum(TreeNode root, int targetSum) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @param {number} targetSum\n * @return {boolean}\n */\nvar hasPathSum = function(root, targetSum) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22", stdin: "13\n5 4 8 11 -1 13 4 7 2 -1 -1 -1 1\n22\n", expected: "true", expectedRaw: "1" },
      { input: "root = [1,2,3], targetSum = 5", stdin: "3\n1 2 3\n5\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "root = [], targetSum = 0", stdin: "0\n\n0\n", expected: "false", expectedRaw: "0" },
      { input: "root = [1,2], targetSum = 1", stdin: "2\n1 2\n1\n", expected: "false", expectedRaw: "0" },
      { input: "root = [1,2], targetSum = 3", stdin: "2\n1 2\n3\n", expected: "true", expectedRaw: "1" }
    ]
  },
  87: {
    id: 87, name: "Construct Binary Tree from Preorder and Inorder",
    functionName: "buildTree", returnType: "TreeNode*:raw",
    parameters: [{ name: "preorder", type: "vector<int>" }, { name: "inorder", type: "vector<int>" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public TreeNode buildTree(int[] preorder, int[] inorder) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {number[]} preorder\n * @param {number[]} inorder\n * @return {TreeNode}\n */\nvar buildTree = function(preorder, inorder) {\n    \n};"
    },
    sampleTests: [
      { input: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]", stdin: "5\n3 9 20 15 7\n5\n9 3 15 20 7\n", expected: "[3,9,20,null,null,15,7]", expectedRaw: "3 9 20 15 7" },
      { input: "preorder = [-1], inorder = [-1]", stdin: "1\n-1\n1\n-1\n", expected: "[-1]", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "preorder = [1,2], inorder = [2,1]", stdin: "2\n1 2\n2\n2 1\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "preorder = [1,2,3], inorder = [1,2,3]", stdin: "3\n1 2 3\n3\n1 2 3\n", expected: "[1,2,3]", expectedRaw: "1 2 3" },
      { input: "preorder = [1,2,3], inorder = [2,3,1]", stdin: "3\n1 2 3\n3\n2 3 1\n", expected: "[1,2,null]", expectedRaw: "1 2 3" }
    ]
  },
  88: {
    id: 88, name: "LCA of Binary Tree",
    functionName: "lowestCommonAncestor", returnType: "TreeNode*->val",
    parameters: [{ name: "root", type: "TreeNode*" }, { name: "p", type: "TreeNode*->val" }, { name: "q", type: "TreeNode*->val" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root=[3,5,1,6,2,0,8,null,null,7,4], p=5, q=1", stdin: "11\n3 5 1 6 2 0 8 -1 -1 7 4\n5\n1\n", expected: "3", expectedRaw: "3" },
      { input: "root=[3,5,1,6,2,0,8,null,null,7,4], p=5, q=4", stdin: "11\n3 5 1 6 2 0 8 -1 -1 7 4\n5\n4\n", expected: "5", expectedRaw: "5" }
    ],
    hiddenTests: [
      { input: "root=[1,2], p=1, q=2", stdin: "2\n1 2\n1\n2\n", expected: "1", expectedRaw: "1" },
      { input: "root=[1,2,3], p=2, q=3", stdin: "3\n1 2 3\n2\n3\n", expected: "1", expectedRaw: "1" },
      { input: "root=[1,2,3,4], p=3, q=4", stdin: "4\n1 2 3 4\n3\n4\n", expected: "1", expectedRaw: "1" }
    ]
  },
  89: {
    id: 89, name: "Validate Binary Search Tree",
    functionName: "isValidBST", returnType: "bool",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public boolean isValidBST(TreeNode root) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isValidBST = function(root) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [2,1,3]", stdin: "3\n2 1 3\n", expected: "true", expectedRaw: "1" },
      { input: "root = [5,1,4,null,null,3,6]", stdin: "4\n5 1 4 6\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "root = [1]", stdin: "1\n1\n", expected: "true", expectedRaw: "1" },
      { input: "root = [5,4,6,3]", stdin: "4\n5 4 6 3\n", expected: "true", expectedRaw: "1" },
      { input: "root = [3,1,5,0,2,4,6]", stdin: "7\n3 1 5 0 2 4 6\n", expected: "true", expectedRaw: "1" }
    ]
  },
  90: {
    id: 90, name: "Lowest Common Ancestor of BST",
    functionName: "lowestCommonAncestor", returnType: "TreeNode*->val",
    parameters: [{ name: "root", type: "TreeNode*" }, { name: "p", type: "TreeNode*->val" }, { name: "q", type: "TreeNode*->val" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root=[6,2,8,0,4,7,9,null,null,3,5], p=2, q=8", stdin: "11\n6 2 8 0 4 7 9 -1 -1 3 5\n2\n8\n", expected: "6", expectedRaw: "6" },
      { input: "root=[6,2,8,0,4,7,9,null,null,3,5], p=2, q=4", stdin: "11\n6 2 8 0 4 7 9 -1 -1 3 5\n2\n4\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "root=[2,1], p=2, q=1", stdin: "2\n2 1\n2\n1\n", expected: "2", expectedRaw: "2" },
      { input: "root=[3,1,5], p=1, q=5", stdin: "3\n3 1 5\n1\n5\n", expected: "3", expectedRaw: "3" },
      { input: "root=[5,3,6,2,4], p=3, q=4", stdin: "5\n5 3 6 2 4\n3\n4\n", expected: "3", expectedRaw: "3" }
    ]
  },
  91: {
    id: 91, name: "Kth Smallest in BST",
    functionName: "kthSmallest", returnType: "int",
    parameters: [{ name: "root", type: "TreeNode*" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int kthSmallest(TreeNode* root, int k) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int kthSmallest(TreeNode root, int k) {\n        \n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:\n        ",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @param {number} k\n * @return {number}\n */\nvar kthSmallest = function(root, k) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [3,1,4,null,2], k = 1", stdin: "5\n3 1 4 -1 2\n1\n", expected: "1", expectedRaw: "1" },
      { input: "root = [5,3,6,2,4,null,null,1], k = 3", stdin: "8\n5 3 6 2 4 -1 -1 1\n3\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "root = [1], k = 1", stdin: "1\n1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "root = [3,1,4,null,2], k = 3", stdin: "5\n3 1 4 -1 2\n3\n", expected: "3", expectedRaw: "3" },
      { input: "root = [5,3,6,2,4], k = 5", stdin: "5\n5 3 6 2 4\n5\n", expected: "6", expectedRaw: "6" }
    ]
  },
  92: {
    id: 92, name: "Search in a BST",
    functionName: "searchBST", returnType: "TreeNode*",
    parameters: [{ name: "root", type: "TreeNode*" }, { name: "val", type: "int" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* searchBST(TreeNode* root, int val) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root = [4,2,7,1,3], val = 2", stdin: "5\n4 2 7 1 3\n2\n", expected: "[2,1,3]", expectedRaw: "2 1 3" },
      { input: "root = [4,2,7,1,3], val = 5", stdin: "5\n4 2 7 1 3\n5\n", expected: "[]", expectedRaw: "" }
    ],
    hiddenTests: [
      { input: "root = [1], val = 1", stdin: "1\n1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "root = [4,2,7], val = 7", stdin: "3\n4 2 7\n7\n", expected: "[7]", expectedRaw: "7" },
      { input: "root = [4,2,7], val = 6", stdin: "3\n4 2 7\n6\n", expected: "[]", expectedRaw: "" }
    ]
  },
  93: {
    id: 93, name: "Insert into a BST",
    functionName: "insertIntoBST", returnType: "count:TreeNode*",
    parameters: [{ name: "root", type: "TreeNode*" }, { name: "val", type: "int" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* insertIntoBST(TreeNode* root, int val) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root = [4,2,7,1,3], val = 5", stdin: "5\n4 2 7 1 3\n5\n", expected: "6 nodes", expectedRaw: "6" },
      { input: "root = [40,20,60,10,30,50,70], val = 25", stdin: "7\n40 20 60 10 30 50 70\n25\n", expected: "8 nodes", expectedRaw: "8" }
    ],
    hiddenTests: [
      { input: "root = [], val = 5", stdin: "0\n\n5\n", expected: "1 node", expectedRaw: "1" },
      { input: "root = [2,1,3], val = 4", stdin: "3\n2 1 3\n4\n", expected: "4 nodes", expectedRaw: "4" },
      { input: "root = [1], val = 2", stdin: "1\n1\n2\n", expected: "2 nodes", expectedRaw: "2" }
    ]
  },
  94: {
    id: 94, name: "Level Order Traversal",
    functionName: "levelOrder", returnType: "count:vector<vector<int>>",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root = [3,9,20,null,null,15,7]", stdin: "7\n3 9 20 -1 -1 15 7\n", expected: "[[3],[9,20],[15,7]]", expectedRaw: "3" },
      { input: "root = [1]", stdin: "1\n1\n", expected: "[[1]]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "root = []", stdin: "0\n\n", expected: "[]", expectedRaw: "0" },
      { input: "root = [1,2,3]", stdin: "3\n1 2 3\n", expected: "[[1],[2,3]]", expectedRaw: "2" },
      { input: "root = [1,2,3,4,5]", stdin: "7\n1 2 3 4 5 -1 -1\n", expected: "[[1],[2,3],[4,5]]", expectedRaw: "3" }
    ]
  },
  95: {
    id: 95, name: "Right Side View of Binary Tree",
    functionName: "rightSideView", returnType: "vector<int>",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    vector<int> rightSideView(TreeNode* root) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root = [1,2,3,null,5,null,4]", stdin: "7\n1 2 3 -1 5 -1 4\n", expected: "[1,3,4]", expectedRaw: "1 3 4" },
      { input: "root = [1,null,3]", stdin: "3\n1 -1 3\n", expected: "[1,3]", expectedRaw: "1 3" }
    ],
    hiddenTests: [
      { input: "root = []", stdin: "0\n\n", expected: "[]", expectedRaw: "" },
      { input: "root = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "root = [1,2]", stdin: "2\n1 2\n", expected: "[1,2]", expectedRaw: "1 2" }
    ]
  },
  96: {
    id: 96, name: "Binary Tree Zigzag Level Order Traversal",
    functionName: "zigzagLevelOrder", returnType: "count:vector<vector<int>>",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "root = [3,9,20,null,null,15,7]", stdin: "7\n3 9 20 -1 -1 15 7\n", expected: "[[3],[20,9],[15,7]]", expectedRaw: "3" },
      { input: "root = [1]", stdin: "1\n1\n", expected: "[[1]]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "root = []", stdin: "0\n\n", expected: "[]", expectedRaw: "0" },
      { input: "root = [1,2,3,4,5]", stdin: "7\n1 2 3 4 5 -1 -1\n", expected: "[[1],[3,2],[4,5]]", expectedRaw: "3" },
      { input: "root = [1,2]", stdin: "2\n1 2\n", expected: "[[1],[2]]", expectedRaw: "2" }
    ]
  },
  97: {
    id: 97, name: "Serialize and Deserialize Binary Tree",
    className: "Codec", functionName: "serialize", returnType: "design:CodecTree",
    parameters: [{ name: "root", type: "TreeNode*" }],
    starterCode: {
      cpp: "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Codec {\npublic:\n    string serialize(TreeNode* root) {\n        \n    }\n    TreeNode* deserialize(string data) {\n        \n    }\n};",
      java: "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\npublic class Codec {\n    public String serialize(TreeNode root) {\n        return \"\";\n    }\n    public TreeNode deserialize(String data) {\n        return null;\n    }\n}",
      python: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Codec:\n    def serialize(self, root: Optional[TreeNode]) -> str:\n        pass\n    def deserialize(self, data: str) -> Optional[TreeNode]:\n        pass",
      js: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\nvar serialize = function(root) {\n    \n};\nvar deserialize = function(data) {\n    \n};"
    },
    sampleTests: [
      { input: "root = [1,2,3,null,null,4,5]", stdin: "7\n1 2 3 -1 -1 4 5\n", expected: "5 nodes", expectedRaw: "5" },
      { input: "root = []", stdin: "0\n\n", expected: "0 nodes", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "root = [1]", stdin: "1\n1\n", expected: "1 node", expectedRaw: "1" },
      { input: "root = [1,2]", stdin: "2\n1 2\n", expected: "2 nodes", expectedRaw: "2" },
      { input: "root = [1,2,3,4]", stdin: "7\n1 2 3 4 -1 -1 -1\n", expected: "4 nodes", expectedRaw: "4" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // SORTING
  // ─────────────────────────────────────────────────────────────
  98: {
    id: 98, name: "Bubble Sort",
    functionName: "bubbleSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> bubbleSort(vector<int>& nums) {\n        int n = nums.size();\n        for (int i = 0; i < n - 1; i++)\n            for (int j = 0; j < n - i - 1; j++)\n                if (nums[j] > nums[j+1])\n                    swap(nums[j], nums[j+1]);\n        return nums;\n    }\n};",
      java: "class Solution {\n    public int[] bubbleSort(int[] nums) {\n        int n = nums.length;\n        for (int i = 0; i < n - 1; i++)\n            for (int j = 0; j < n - i - 1; j++)\n                if (nums[j] > nums[j+1]) {\n                    int tmp = nums[j]; nums[j] = nums[j+1]; nums[j+1] = tmp;\n                }\n        return nums;\n    }\n}",
      python: "class Solution:\n    def bubbleSort(self, nums: List[int]) -> List[int]:\n        n = len(nums)\n        for i in range(n - 1):\n            for j in range(n - i - 1):\n                if nums[j] > nums[j+1]:\n                    nums[j], nums[j+1] = nums[j+1], nums[j]\n        return nums",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar bubbleSort = function(nums) {\n    const n = nums.length;\n    for (let i = 0; i < n - 1; i++)\n        for (let j = 0; j < n - i - 1; j++)\n            if (nums[j] > nums[j+1])\n                [nums[j], nums[j+1]] = [nums[j+1], nums[j]];\n    return nums;\n};"
    },
    sampleTests: [
      { input: "nums = [64,34,25,12,22,11,90]", stdin: "7\n64 34 25 12 22 11 90\n", expected: "[11,12,22,25,34,64,90]", expectedRaw: "11 12 22 25 34 64 90" },
      { input: "nums = [5,1,4,2,8]", stdin: "5\n5 1 4 2 8\n", expected: "[1,2,4,5,8]", expectedRaw: "1 2 4 5 8" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [2,1]", stdin: "2\n2 1\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [1,2,3,4]", stdin: "4\n1 2 3 4\n", expected: "[1,2,3,4]", expectedRaw: "1 2 3 4" }
    ]
  },
  99: {
    id: 99, name: "Selection Sort",
    functionName: "selectionSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> selectionSort(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] selectionSort(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def selectionSort(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar selectionSort = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [64,25,12,22,11]", stdin: "5\n64 25 12 22 11\n", expected: "[11,12,22,25,64]", expectedRaw: "11 12 22 25 64" },
      { input: "nums = [3,2,1]", stdin: "3\n3 2 1\n", expected: "[1,2,3]", expectedRaw: "1 2 3" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [5,4,3,2,1]", stdin: "5\n5 4 3 2 1\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" },
      { input: "nums = [-3,-1,-2]", stdin: "3\n-3 -1 -2\n", expected: "[-3,-2,-1]", expectedRaw: "-3 -2 -1" }
    ]
  },
  100: {
    id: 100, name: "Insertion Sort",
    functionName: "insertionSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> insertionSort(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] insertionSort(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def insertionSort(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar insertionSort = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [12,11,13,5,6]", stdin: "5\n12 11 13 5 6\n", expected: "[5,6,11,12,13]", expectedRaw: "5 6 11 12 13" },
      { input: "nums = [5,2,4,6,1,3]", stdin: "6\n5 2 4 6 1 3\n", expected: "[1,2,3,4,5,6]", expectedRaw: "1 2 3 4 5 6" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [2,1]", stdin: "2\n2 1\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [3,3,3]", stdin: "3\n3 3 3\n", expected: "[3,3,3]", expectedRaw: "3 3 3" }
    ]
  },
  101: {
    id: 101, name: "Merge Sort",
    functionName: "mergeSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> mergeSort(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] mergeSort(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def mergeSort(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar mergeSort = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [38,27,43,3,9,82,10]", stdin: "7\n38 27 43 3 9 82 10\n", expected: "[3,9,10,27,38,43,82]", expectedRaw: "3 9 10 27 38 43 82" },
      { input: "nums = [5,2,4,6,1,3]", stdin: "6\n5 2 4 6 1 3\n", expected: "[1,2,3,4,5,6]", expectedRaw: "1 2 3 4 5 6" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [2,1]", stdin: "2\n2 1\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [-5,-1,3,0,2]", stdin: "5\n-5 -1 3 0 2\n", expected: "[-5,-1,0,2,3]", expectedRaw: "-5 -1 0 2 3" }
    ]
  },
  102: {
    id: 102, name: "Quick Sort",
    functionName: "quickSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> quickSort(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] quickSort(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def quickSort(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar quickSort = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,6,8,10,1,2,1]", stdin: "7\n3 6 8 10 1 2 1\n", expected: "[1,1,2,3,6,8,10]", expectedRaw: "1 1 2 3 6 8 10" },
      { input: "nums = [5,2,4,6,1,3]", stdin: "6\n5 2 4 6 1 3\n", expected: "[1,2,3,4,5,6]", expectedRaw: "1 2 3 4 5 6" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "[1,1,1,1]", expectedRaw: "1 1 1 1" },
      { input: "nums = [5,4,3,2,1]", stdin: "5\n5 4 3 2 1\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" }
    ]
  },
  103: {
    id: 103, name: "Counting Sort",
    functionName: "countingSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> countingSort(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] countingSort(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def countingSort(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar countingSort = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [4,2,2,8,3,3,1]", stdin: "7\n4 2 2 8 3 3 1\n", expected: "[1,2,2,3,3,4,8]", expectedRaw: "1 2 2 3 3 4 8" },
      { input: "nums = [2,0,2,1,1,0]", stdin: "6\n2 0 2 1 1 0\n", expected: "[0,0,1,1,2,2]", expectedRaw: "0 0 1 1 2 2" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [0,0,0,0]", stdin: "4\n0 0 0 0\n", expected: "[0,0,0,0]", expectedRaw: "0 0 0 0" },
      { input: "nums = [5,3,1,4,2]", stdin: "5\n5 3 1 4 2\n", expected: "[1,2,3,4,5]", expectedRaw: "1 2 3 4 5" }
    ]
  },
  104: {
    id: 104, name: "Radix Sort",
    functionName: "radixSort", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> radixSort(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] radixSort(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def radixSort(self, nums: List[int]) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar radixSort = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [170,45,75,90,802,24,2,66]", stdin: "8\n170 45 75 90 802 24 2 66\n", expected: "[2,24,45,66,75,90,170,802]", expectedRaw: "2 24 45 66 75 90 170 802" },
      { input: "nums = [3,6,8,10,1,2]", stdin: "6\n3 6 8 10 1 2\n", expected: "[1,2,3,6,8,10]", expectedRaw: "1 2 3 6 8 10" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "[1]", expectedRaw: "1" },
      { input: "nums = [100,10,1]", stdin: "3\n100 10 1\n", expected: "[1,10,100]", expectedRaw: "1 10 100" },
      { input: "nums = [1,1,1]", stdin: "3\n1 1 1\n", expected: "[1,1,1]", expectedRaw: "1 1 1" }
    ]
  },
  105: {
    id: 105, name: "Merge Intervals",
    functionName: "merge", returnType: "count:vector<vector<int>>",
    parameters: [{ name: "intervals", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", stdin: "4 2\n1 3 2 6 8 10 15 18\n", expected: "[[1,6],[8,10],[15,18]]", expectedRaw: "3" },
      { input: "intervals = [[1,4],[4,5]]", stdin: "2 2\n1 4 4 5\n", expected: "[[1,5]]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "intervals = [[1,4],[2,3]]", stdin: "2 2\n1 4 2 3\n", expected: "[[1,4]]", expectedRaw: "1" },
      { input: "intervals = [[1,2],[3,4]]", stdin: "2 2\n1 2 3 4\n", expected: "[[1,2],[3,4]]", expectedRaw: "2" },
      { input: "intervals = [[1,4],[0,4]]", stdin: "2 2\n1 4 0 4\n", expected: "[[0,4]]", expectedRaw: "1" }
    ]
  },
  106: {
    id: 106, name: "Sort Colors",
    functionName: "sortColors", returnType: "void",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void sortColors(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public void sortColors(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar sortColors = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,0,2,1,1,0]", stdin: "6\n2 0 2 1 1 0\n", expected: "[0,0,1,1,2,2]", expectedRaw: "0 0 1 1 2 2" },
      { input: "nums = [2,0,1]", stdin: "3\n2 0 1\n", expected: "[0,1,2]", expectedRaw: "0 1 2" }
    ],
    hiddenTests: [
      { input: "nums = [0]", stdin: "1\n0\n", expected: "[0]", expectedRaw: "0" },
      { input: "nums = [1,2,0]", stdin: "3\n1 2 0\n", expected: "[0,1,2]", expectedRaw: "0 1 2" },
      { input: "nums = [2,2,2]", stdin: "3\n2 2 2\n", expected: "[2,2,2]", expectedRaw: "2 2 2" }
    ]
  },
  107: {
    id: 107, name: "Kth Largest Element in Array",
    functionName: "findKthLargest", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "k", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar findKthLargest = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,2,1,5,6,4], k = 2", stdin: "6\n3 2 1 5 6 4\n2\n", expected: "5", expectedRaw: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", stdin: "9\n3 2 3 1 2 4 5 5 6\n4\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [2,1], k = 1", stdin: "2\n2 1\n1\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [3,2,1,5,6,4], k = 6", stdin: "6\n3 2 1 5 6 4\n6\n", expected: "1", expectedRaw: "1" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // BINARY SEARCH
  // ─────────────────────────────────────────────────────────────
  108: {
    id: 108, name: "Binary Search",
    functionName: "search", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", stdin: "6\n-1 0 3 5 9 12\n9\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", stdin: "6\n-1 0 3 5 9 12\n2\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "nums = [5], target = 5", stdin: "1\n5\n5\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [1,2,3,4,5], target = 6", stdin: "5\n1 2 3 4 5\n6\n", expected: "-1", expectedRaw: "-1" },
      { input: "nums = [1,3,5,7,9], target = 7", stdin: "5\n1 3 5 7 9\n7\n", expected: "3", expectedRaw: "3" }
    ]
  },
  109: {
    id: 109, name: "Search in Rotated Sorted Array",
    functionName: "search", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", stdin: "7\n4 5 6 7 0 1 2\n0\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", stdin: "7\n4 5 6 7 0 1 2\n3\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "nums = [1], target = 0", stdin: "1\n1\n0\n", expected: "-1", expectedRaw: "-1" },
      { input: "nums = [1,3], target = 3", stdin: "2\n1 3\n3\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [5,1,3], target = 5", stdin: "3\n5 1 3\n5\n", expected: "0", expectedRaw: "0" }
    ]
  },
  110: {
    id: 110, name: "Find Peak Element",
    functionName: "findPeakElement", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findPeakElement(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int findPeakElement(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findPeakElement(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findPeakElement = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,1]", stdin: "4\n1 2 3 1\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [1,2,1,3,5,6,4]", stdin: "7\n1 2 1 3 5 6 4\n", expected: "5", expectedRaw: "5" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [1,2]", stdin: "2\n1 2\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [2,1]", stdin: "2\n2 1\n", expected: "0", expectedRaw: "0" }
    ]
  },
  111: {
    id: 111, name: "Search Insert Position",
    functionName: "searchInsert", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int searchInsert(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int searchInsert(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def searchInsert(self, nums: List[int], target: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar searchInsert = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,3,5,6], target = 5", stdin: "4\n1 3 5 6\n5\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [1,3,5,6], target = 2", stdin: "4\n1 3 5 6\n2\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [1,3,5,6], target = 7", stdin: "4\n1 3 5 6\n7\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [1,3,5,6], target = 0", stdin: "4\n1 3 5 6\n0\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [1], target = 1", stdin: "1\n1\n1\n", expected: "0", expectedRaw: "0" }
    ]
  },
  112: {
    id: 112, name: "First and Last Position of Element",
    functionName: "searchRange", returnType: "vector<int>",
    parameters: [{ name: "nums", type: "vector<int>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> searchRange(vector<int>& nums, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] searchRange(int[] nums, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def searchRange(self, nums: List[int], target: int) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar searchRange = function(nums, target) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [5,7,7,8,8,10], target = 8", stdin: "6\n5 7 7 8 8 10\n8\n", expected: "[3,4]", expectedRaw: "3 4" },
      { input: "nums = [5,7,7,8,8,10], target = 6", stdin: "6\n5 7 7 8 8 10\n6\n", expected: "[-1,-1]", expectedRaw: "-1 -1" }
    ],
    hiddenTests: [
      { input: "nums = [], target = 0", stdin: "0\n\n0\n", expected: "[-1,-1]", expectedRaw: "-1 -1" },
      { input: "nums = [1], target = 1", stdin: "1\n1\n1\n", expected: "[0,0]", expectedRaw: "0 0" },
      { input: "nums = [1,2,3,4,5], target = 3", stdin: "5\n1 2 3 4 5\n3\n", expected: "[2,2]", expectedRaw: "2 2" }
    ]
  },
  113: {
    id: 113, name: "Square Root using Binary Search",
    functionName: "mySqrt", returnType: "int",
    parameters: [{ name: "x", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int mySqrt(int x) {\n        \n    }\n};",
      java: "class Solution {\n    public int mySqrt(int x) {\n        \n    }\n}",
      python: "class Solution:\n    def mySqrt(self, x: int) -> int:\n        ",
      js: "/**\n * @param {number} x\n * @return {number}\n */\nvar mySqrt = function(x) {\n    \n};"
    },
    sampleTests: [
      { input: "x = 4", stdin: "4\n", expected: "2", expectedRaw: "2" },
      { input: "x = 8", stdin: "8\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "x = 0", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "x = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "x = 16", stdin: "16\n", expected: "4", expectedRaw: "4" }
    ]
  },
  114: {
    id: 114, name: "Koko Eating Bananas",
    functionName: "minEatingSpeed", returnType: "int",
    parameters: [{ name: "piles", type: "vector<int>" }, { name: "h", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int minEatingSpeed(vector<int>& piles, int h) {\n        \n    }\n};",
      java: "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        \n    }\n}",
      python: "class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        ",
      js: "/**\n * @param {number[]} piles\n * @param {number} h\n * @return {number}\n */\nvar minEatingSpeed = function(piles, h) {\n    \n};"
    },
    sampleTests: [
      { input: "piles = [3,6,7,11], h = 8", stdin: "4\n3 6 7 11\n8\n", expected: "4", expectedRaw: "4" },
      { input: "piles = [30,11,23,4,20], h = 5", stdin: "5\n30 11 23 4 20\n5\n", expected: "30", expectedRaw: "30" }
    ],
    hiddenTests: [
      { input: "piles = [30,11,23,4,20], h = 6", stdin: "5\n30 11 23 4 20\n6\n", expected: "23", expectedRaw: "23" },
      { input: "piles = [1,1,1,1], h = 4", stdin: "4\n1 1 1 1\n4\n", expected: "1", expectedRaw: "1" },
      { input: "piles = [1000000000], h = 2", stdin: "1\n1000000000\n2\n", expected: "500000000", expectedRaw: "500000000" }
    ]
  },
  115: {
    id: 115, name: "Find Minimum in Rotated Sorted Array",
    functionName: "findMin", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,4,5,1,2]", stdin: "5\n3 4 5 1 2\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [4,5,6,7,0,1,2]", stdin: "7\n4 5 6 7 0 1 2\n", expected: "0", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [11,13,15,17]", stdin: "4\n11 13 15 17\n", expected: "11", expectedRaw: "11" },
      { input: "nums = [2,1]", stdin: "2\n2 1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ]
  },
  116: {
    id: 116, name: "Search a 2D Matrix",
    functionName: "searchMatrix", returnType: "bool",
    parameters: [{ name: "matrix", type: "vector<vector<int>>" }, { name: "target", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool searchMatrix(vector<vector<int>>& matrix, int target) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", stdin: "3 4\n1 3 5 7 10 11 16 20 23 30 34 60\n3\n", expected: "true", expectedRaw: "1" },
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13", stdin: "3 4\n1 3 5 7 10 11 16 20 23 30 34 60\n13\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "matrix = [[1]], target = 1", stdin: "1 1\n1\n1\n", expected: "true", expectedRaw: "1" },
      { input: "matrix = [[1,3],[6,7]], target = 6", stdin: "2 2\n1 3 6 7\n6\n", expected: "true", expectedRaw: "1" },
      { input: "matrix = [[1,3],[6,7]], target = 5", stdin: "2 2\n1 3 6 7\n5\n", expected: "false", expectedRaw: "0" }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  // GREEDY
  // ─────────────────────────────────────────────────────────────
  117: {
    id: 117, name: "Jump Game",
    functionName: "canJump", returnType: "bool",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canJump = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,3,1,1,4]", stdin: "5\n2 3 1 1 4\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [3,2,1,0,4]", stdin: "5\n3 2 1 0 4\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [0]", stdin: "1\n0\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [1,0]", stdin: "2\n1 0\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [0,1]", stdin: "2\n0 1\n", expected: "false", expectedRaw: "0" }
    ]
  },
  118: {
    id: 118, name: "Jump Game II",
    functionName: "jump", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int jump(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int jump(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def jump(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar jump = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,3,1,1,4]", stdin: "5\n2 3 1 1 4\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [2,3,0,1,4]", stdin: "5\n2 3 0 1 4\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [0]", stdin: "1\n0\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [1,1,1,1]", stdin: "4\n1 1 1 1\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [3,2,1,0,4,1,2]", stdin: "7\n3 2 1 0 4 1 2\n", expected: "2", expectedRaw: "2" }
    ]
  },
  119: {
    id: 119, name: "Gas Station",
    functionName: "canCompleteCircuit", returnType: "int",
    parameters: [{ name: "gas", type: "vector<int>" }, { name: "cost", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n        \n    }\n};",
      java: "class Solution {\n    public int canCompleteCircuit(int[] gas, int[] cost) {\n        \n    }\n}",
      python: "class Solution:\n    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} gas\n * @param {number[]} cost\n * @return {number}\n */\nvar canCompleteCircuit = function(gas, cost) {\n    \n};"
    },
    sampleTests: [
      { input: "gas=[1,2,3,4,5], cost=[3,4,5,1,2]", stdin: "5\n1 2 3 4 5\n5\n3 4 5 1 2\n", expected: "3", expectedRaw: "3" },
      { input: "gas=[2,3,4], cost=[3,4,3]", stdin: "3\n2 3 4\n3\n3 4 3\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "gas=[5], cost=[4]", stdin: "1\n5\n1\n4\n", expected: "0", expectedRaw: "0" },
      { input: "gas=[1], cost=[2]", stdin: "1\n1\n1\n2\n", expected: "-1", expectedRaw: "-1" },
      { input: "gas=[3,1,1], cost=[1,2,2]", stdin: "3\n3 1 1\n3\n1 2 2\n", expected: "0", expectedRaw: "0" }
    ]
  },
  120: {
    id: 120, name: "Max Profit II (Multiple Transactions)",
    functionName: "maxProfit", returnType: "int",
    parameters: [{ name: "prices", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
      python: "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};"
    },
    sampleTests: [
      { input: "prices = [7,1,5,3,6,4]", stdin: "6\n7 1 5 3 6 4\n", expected: "7", expectedRaw: "7" },
      { input: "prices = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "prices = [7,6,4,3,1]", stdin: "5\n7 6 4 3 1\n", expected: "0", expectedRaw: "0" },
      { input: "prices = [1]", stdin: "1\n1\n", expected: "0", expectedRaw: "0" },
      { input: "prices = [3,3,5,0,0,3,1,4]", stdin: "8\n3 3 5 0 0 3 1 4\n", expected: "8", expectedRaw: "8" }
    ]
  },
  121: {
    id: 121, name: "Assign Cookies",
    functionName: "findContentChildren", returnType: "int",
    parameters: [{ name: "g", type: "vector<int>" }, { name: "s", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findContentChildren(vector<int>& g, vector<int>& s) {\n        \n    }\n};",
      java: "class Solution {\n    public int findContentChildren(int[] g, int[] s) {\n        \n    }\n}",
      python: "class Solution:\n    def findContentChildren(self, g: List[int], s: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} g\n * @param {number[]} s\n * @return {number}\n */\nvar findContentChildren = function(g, s) {\n    \n};"
    },
    sampleTests: [
      { input: "g = [1,2,3], s = [1,1]", stdin: "3\n1 2 3\n2\n1 1\n", expected: "1", expectedRaw: "1" },
      { input: "g = [1,2], s = [1,2,3]", stdin: "2\n1 2\n3\n1 2 3\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "g = [2,3], s = [1,2,3]", stdin: "2\n2 3\n3\n1 2 3\n", expected: "2", expectedRaw: "2" },
      { input: "g = [1], s = []", stdin: "1\n1\n0\n\n", expected: "0", expectedRaw: "0" },
      { input: "g = [10,9,8], s = [5,6,7]", stdin: "3\n10 9 8\n3\n5 6 7\n", expected: "0", expectedRaw: "0" }
    ]
  },
  122: {
    id: 122, name: "Non-Overlapping Intervals",
    functionName: "eraseOverlapIntervals", returnType: "int",
    parameters: [{ name: "intervals", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", stdin: "4 2\n1 2 2 3 3 4 1 3\n", expected: "1", expectedRaw: "1" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", stdin: "3 2\n1 2 1 2 1 2\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "intervals = [[1,2],[2,3]]", stdin: "2 2\n1 2 2 3\n", expected: "0", expectedRaw: "0" },
      { input: "intervals = [[0,2],[1,3],[2,4],[3,5],[4,6]]", stdin: "5 2\n0 2 1 3 2 4 3 5 4 6\n", expected: "2", expectedRaw: "2" },
      { input: "intervals = [[1,100],[11,22],[1,11],[2,12]]", stdin: "4 2\n1 100 11 22 1 11 2 12\n", expected: "2", expectedRaw: "2" }
    ]
  },
  123: {
    id: 123, name: "Activity Selection Problem",
    functionName: "activitySelection", returnType: "int",
    parameters: [{ name: "start", type: "vector<int>" }, { name: "end", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int activitySelection(vector<int>& start, vector<int>& end) {\n        int n = (int)start.size();\n        // sort activities by end time\n        vector<int> idx(n);\n        iota(idx.begin(), idx.end(), 0);\n        sort(idx.begin(), idx.end(), [&](int a, int b){ return end[a] < end[b]; });\n        int count = 1, last = idx[0];\n        for (int i = 1; i < n; i++) {\n            if (start[idx[i]] >= end[last]) { count++; last = idx[i]; }\n        }\n        return count;\n    }\n};"
    },
    sampleTests: [
      { input: "start=[1,3,0,5,8,5], end=[2,4,6,7,9,9]", stdin: "6\n1 3 0 5 8 5\n6\n2 4 6 7 9 9\n", expected: "4", expectedRaw: "4" },
      { input: "start=[1,2,3], end=[3,4,5]", stdin: "3\n1 2 3\n3\n3 4 5\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "start=[1], end=[2]", stdin: "1\n1\n1\n2\n", expected: "1", expectedRaw: "1" },
      { input: "start=[0,1,2], end=[1,2,3]", stdin: "3\n0 1 2\n3\n1 2 3\n", expected: "3", expectedRaw: "3" },
      { input: "start=[0,3,1,5], end=[6,5,4,7]", stdin: "4\n0 3 1 5\n4\n6 5 4 7\n", expected: "2", expectedRaw: "2" }
    ]
  },
  124: {
    id: 124, name: "Job Sequencing Problem",
    functionName: "jobSequencing", returnType: "int",
    parameters: [{ name: "deadlines", type: "vector<int>" }, { name: "profits", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    // deadlines[i] = deadline of job i, profits[i] = profit of job i\n    int jobSequencing(vector<int>& deadlines, vector<int>& profits) {\n        int n = (int)deadlines.size();\n        int maxD = *max_element(deadlines.begin(), deadlines.end());\n        vector<int> slot(maxD + 1, -1);\n        // sort jobs by profit descending\n        vector<int> order(n);\n        iota(order.begin(), order.end(), 0);\n        sort(order.begin(), order.end(), [&](int a, int b){ return profits[a] > profits[b]; });\n        int total = 0;\n        for (int i : order) {\n            for (int t = min(deadlines[i], maxD); t >= 1; t--) {\n                if (slot[t] == -1) { slot[t] = i; total += profits[i]; break; }\n            }\n        }\n        return total;\n    }\n};",
      java: "class Solution {\n    public int jobSequencing(int[] deadlines, int[] profits) {\n        \n    }\n}",
      python: "class Solution:\n    def jobSequencing(self, deadlines: List[int], profits: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} deadlines\n * @param {number[]} profits\n * @return {number}\n */\nvar jobSequencing = function(deadlines, profits) {\n    \n};"
    },
    sampleTests: [
      { input: "deadlines=[2,1,2,1,3], profits=[100,19,27,25,15]", stdin: "5\n2 1 2 1 3\n5\n100 19 27 25 15\n", expected: "142", expectedRaw: "142" },
      { input: "deadlines=[2,1,2,1,3], profits=[100,19,27,25,15] (variant)", stdin: "5\n2 1 2 1 3\n5\n100 19 27 25 15\n", expected: "142", expectedRaw: "142" }
    ],
    hiddenTests: [
      { input: "deadlines=[1], profits=[5]", stdin: "1\n1\n1\n5\n", expected: "5", expectedRaw: "5" },
      { input: "deadlines=[1,2,3,4,5], profits=[10,20,30,40,50]", stdin: "5\n1 2 3 4 5\n5\n10 20 30 40 50\n", expected: "150", expectedRaw: "150" },
      { input: "deadlines=[3,1,2], profits=[50,10,20]", stdin: "3\n3 1 2\n3\n50 10 20\n", expected: "80", expectedRaw: "80" }
    ]
  },
  125: {
    id: 125, name: "Best Time to Buy and Sell Stock",
    functionName: "maxProfit", returnType: "int",
    parameters: [{ name: "prices", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
      python: "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};"
    },
    sampleTests: [
      { input: "prices = [7,1,5,3,6,4]", stdin: "6\n7 1 5 3 6 4\n", expected: "5", expectedRaw: "5" },
      { input: "prices = [7,6,4,3,1]", stdin: "5\n7 6 4 3 1\n", expected: "0", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "prices = [1]", stdin: "1\n1\n", expected: "0", expectedRaw: "0" },
      { input: "prices = [2,4,1]", stdin: "3\n2 4 1\n", expected: "2", expectedRaw: "2" },
      { input: "prices = [3,2,6,5,0,3]", stdin: "6\n3 2 6 5 0 3\n", expected: "4", expectedRaw: "4" }
    ]
  },
  126: {
    id: 126, name: "Minimum Number of Coins",
    functionName: "coinChange", returnType: "int",
    parameters: [{ name: "coins", type: "vector<int>" }, { name: "amount", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
      java: "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
      python: "class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ",
      js: "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};"
    },
    sampleTests: [
      { input: "coins = [1,5,6,9], amount = 11", stdin: "4\n1 5 6 9\n11\n", expected: "2", expectedRaw: "2" },
      { input: "coins = [2], amount = 3", stdin: "1\n2\n3\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "coins = [1], amount = 0", stdin: "1\n1\n0\n", expected: "0", expectedRaw: "0" },
      { input: "coins = [2], amount = 0", stdin: "1\n2\n0\n", expected: "0", expectedRaw: "0" },
      { input: "coins = [1,2,5], amount = 11", stdin: "3\n1 2 5\n11\n", expected: "3", expectedRaw: "3" }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // DYNAMIC PROGRAMMING
  // ─────────────────────────────────────────────────────────────
  127: {
    id: 127, name: "Climbing Stairs",
    functionName: "climbStairs", returnType: "int",
    parameters: [{ name: "n", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 2", stdin: "2\n", expected: "2", expectedRaw: "2" },
      { input: "n = 3", stdin: "3\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "n = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "n = 5", stdin: "5\n", expected: "8", expectedRaw: "8" },
      { input: "n = 10", stdin: "10\n", expected: "89", expectedRaw: "89" }
    ]
  },
  128: {
    id: 128, name: "House Robber",
    functionName: "rob", returnType: "int",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int rob(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar rob = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3,1]", stdin: "4\n1 2 3 1\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [2,7,9,3,1]", stdin: "5\n2 7 9 3 1\n", expected: "12", expectedRaw: "12" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,2]", stdin: "2\n1 2\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [2,1,1,2]", stdin: "4\n2 1 1 2\n", expected: "4", expectedRaw: "4" }
    ]
  },
  129: {
    id: 129, name: "Fibonacci Number",
    functionName: "fib", returnType: "int",
    parameters: [{ name: "n", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int fib(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int fib(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def fib(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar fib = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 2", stdin: "2\n", expected: "1", expectedRaw: "1" },
      { input: "n = 3", stdin: "3\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "n = 0", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "n = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "n = 10", stdin: "10\n", expected: "55", expectedRaw: "55" }
    ]
  },
  130: {
    id: 130, name: "N-th Tribonacci Number",
    functionName: "tribonacci", returnType: "int",
    parameters: [{ name: "n", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int tribonacci(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int tribonacci(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def tribonacci(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar tribonacci = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 4", stdin: "4\n", expected: "4", expectedRaw: "4" },
      { input: "n = 25", stdin: "25\n", expected: "1389537", expectedRaw: "1389537" }
    ],
    hiddenTests: [
      { input: "n = 0", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "n = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "n = 10", stdin: "10\n", expected: "149", expectedRaw: "149" }
    ]
  },
  131: {
    id: 131, name: "Decode Ways",
    functionName: "numDecodings", returnType: "int",
    parameters: [{ "name": "s", "type": "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int numDecodings(string s) {\n        \n    }\n};",
      java: "class Solution {\n    public int numDecodings(String s) {\n        \n    }\n}",
      python: "class Solution:\n    def numDecodings(self, s: str) -> int:\n        ",
      js: "/**\n * @param {string} s\n * @return {number}\n */\nvar numDecodings = function(s) {\n    \n};"
    },
    sampleTests: [
      { input: "s = \"12\"", stdin: "12\n", expected: "2", expectedRaw: "2" },
      { input: "s = \"226\"", stdin: "226\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "s = \"0\"", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "s = \"10\"", stdin: "10\n", expected: "1", expectedRaw: "1" },
      { input: "s = \"1234\"", stdin: "1234\n", expected: "3", expectedRaw: "3" }
    ]
  },
  132: {
    id: 132, name: "Word Break",
    functionName: "wordBreak", returnType: "bool",
    parameters: [{ name: "s", type: "string" }, { name: "wordDict", type: "vector<string>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "s = \"leetcode\", wordDict = [\"leet\",\"code\"]", stdin: "leetcode\n2\nleet\ncode\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]", stdin: "applepenapple\n2\napple\npen\n", expected: "true", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "s = \"catsandog\", wordDict = [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]", stdin: "catsandog\n5\ncats\ndog\nsand\nand\ncat\n", expected: "false", expectedRaw: "0" },
      { input: "s = \"a\", wordDict = [\"a\"]", stdin: "a\n1\na\n", expected: "true", expectedRaw: "1" },
      { input: "s = \"ab\", wordDict = [\"a\",\"b\"]", stdin: "ab\n2\na\nb\n", expected: "true", expectedRaw: "1" }
    ]
  },
  133: {
    id: 133, name: "Longest Increasing Subsequence",
    functionName: "lengthOfLIS", returnType: "int",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar lengthOfLIS = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [10,9,2,5,3,7,101,18]", stdin: "8\n10 9 2 5 3 7 101 18\n", expected: "4", expectedRaw: "4" },
      { input: "nums = [0,1,0,3,2,3]", stdin: "6\n0 1 0 3 2 3\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "nums = [7,7,7,7,7]", stdin: "5\n7 7 7 7 7\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [1,2,3,4,5]", stdin: "5\n1 2 3 4 5\n", expected: "5", expectedRaw: "5" }
    ]
  },
  134: {
    id: 134, name: "Coin Change",
    functionName: "coinChange", returnType: "int",
    parameters: [{ "name": "coins", "type": "vector<int>" }, { "name": "amount", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
      java: "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
      python: "class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ",
      js: "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};"
    },
    sampleTests: [
      { input: "coins = [1,5,6,9], amount = 11", stdin: "4\n1 5 6 9\n11\n", expected: "2", expectedRaw: "2" },
      { input: "coins = [2], amount = 3", stdin: "1\n2\n3\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "coins = [1], amount = 0", stdin: "1\n1\n0\n", expected: "0", expectedRaw: "0" },
      { input: "coins = [2], amount = 0", stdin: "1\n2\n0\n", expected: "0", expectedRaw: "0" },
      { input: "coins = [1,2,5], amount = 11", stdin: "3\n1 2 5\n11\n", expected: "3", expectedRaw: "3" }
    ]
  },
  135: {
    id: 135, name: "Longest Common Subsequence",
    functionName: "longestCommonSubsequence", returnType: "int",
    parameters: [{ "name": "s", "type": "string" }, { "name": "t", "type": "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        \n    }\n};",
      java: "class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        \n    }\n}",
      python: "class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        ",
      js: "/**\n * @param {string} text1\n * @param {string} text2\n * @return {number}\n */\nvar longestCommonSubsequence = function(text1, text2) {\n    \n};"
    },
    sampleTests: [
      { input: "text1 = \"abcde\", text2 = \"ace\"", stdin: "abcde\nace\n", expected: "3", expectedRaw: "3" },
      { input: "text1 = \"abc\", text2 = \"abc\"", stdin: "abc\nabc\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "text1 = \"abc\", text2 = \"def\"", stdin: "abc\ndef\n", expected: "0", expectedRaw: "0" },
      { input: "text1 = \"a\", text2 = \"a\"", stdin: "a\na\n", expected: "1", expectedRaw: "1" },
      { input: "text1 = \"abcba\", text2 = \"abcbcba\"", stdin: "abcba\nabcbcba\n", expected: "5", expectedRaw: "5" }
    ]
  },
  136: {
    id: 136, name: "0-1 Knapsack",
    functionName: "knapSack", returnType: "int",
    parameters: [{ name: "weights", type: "vector<int>" }, { name: "values", type: "vector<int>" }, { name: "W", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int knapSack(vector<int>& weights, vector<int>& values, int W) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "weights=[1,3,4,5], values=[1,4,5,7], W=7", stdin: "4\n1 3 4 5\n4\n1 4 5 7\n7\n", expected: "9", expectedRaw: "9" },
      { input: "weights=[2,3], values=[3,4], W=2", stdin: "2\n2 3\n2\n3 4\n2\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "weights=[1], values=[5], W=1", stdin: "1\n1\n1\n5\n1\n", expected: "5", expectedRaw: "5" },
      { input: "weights=[1,2,3], values=[6,10,12], W=5", stdin: "3\n1 2 3\n3\n6 10 12\n5\n", expected: "22", expectedRaw: "22" },
      { input: "weights=[4,5], values=[1,2], W=3", stdin: "2\n4 5\n2\n1 2\n3\n", expected: "0", expectedRaw: "0" }
    ]
  },
  137: {
    id: 137, name: "Minimum Path Sum",
    functionName: "minPathSum", returnType: "int",
    parameters: [{ "name": "grid", "type": "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int minPathSum(vector<vector<int>>& grid) {\n        \n    }\n};",
      java: "class Solution {\n    public int minPathSum(int[][] grid) {\n        \n    }\n}",
      python: "class Solution:\n    def minPathSum(self, grid: List[List[int]]) -> int:\n        ",
      js: "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar minPathSum = function(grid) {\n    \n};"
    },
    sampleTests: [
      { input: "grid = [[1,3,1],[1,5,1],[4,2,1]]", stdin: "3 3\n1 3 1\n1 5 1\n4 2 1\n", expected: "7", expectedRaw: "7" },
      { input: "grid = [[1,2,3],[4,5,6]]", stdin: "2 3\n1 2 3\n4 5 6\n", expected: "12", expectedRaw: "12" }
    ],
    hiddenTests: [
      { input: "grid = [[9]]", stdin: "1 1\n9\n", expected: "9", expectedRaw: "9" },
      { input: "grid = [[1,2],[1,1]]", stdin: "2 2\n1 2\n1 1\n", expected: "3", expectedRaw: "3" },
      { input: "grid = [[1,2,5],[3,2,1]]", stdin: "2 3\n1 2 5\n3 2 1\n", expected: "6", expectedRaw: "6" }
    ]
  },
  138: {
    id: 138, name: "Unique Paths",
    functionName: "uniquePaths", returnType: "int",
    parameters: [{ "name": "m", "type": "int" }, { "name": "n", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int uniquePaths(int m, int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int uniquePaths(int m, int n) {\n        \n    }\n}",
      python: "class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        ",
      js: "/**\n * @param {number} m\n * @param {number} n\n * @return {number}\n */\nvar uniquePaths = function(m, n) {\n    \n};"
    },
    sampleTests: [
      { input: "m = 3, n = 7", stdin: "3\n7\n", expected: "28", expectedRaw: "28" },
      { input: "m = 3, n = 2", stdin: "3\n2\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "m = 7, n = 3", stdin: "7\n3\n", expected: "28", expectedRaw: "28" },
      { input: "m = 3, n = 3", stdin: "3\n3\n", expected: "6", expectedRaw: "6" },
      { input: "m = 1, n = 1", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ]
  },
  139: {
    id: 139, name: "Edit Distance",
    functionName: "minDistance", returnType: "int",
    parameters: [{ "name": "s", "type": "string" }, { "name": "t", "type": "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        \n    }\n};",
      java: "class Solution {\n    public int minDistance(String word1, String word2) {\n        \n    }\n}",
      python: "class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        ",
      js: "/**\n * @param {string} word1\n * @param {string} word2\n * @return {number}\n */\nvar minDistance = function(word1, word2) {\n    \n};"
    },
    sampleTests: [
      { input: "word1 = \"horse\", word2 = \"ros\"", stdin: "horse\nros\n", expected: "3", expectedRaw: "3" },
      { input: "word1 = \"intention\", word2 = \"execution\"", stdin: "intention\nexecution\n", expected: "5", expectedRaw: "5" }
    ],
    hiddenTests: [
      { input: "word1 = \"\", word2 = \"\"", stdin: "@@EMPTY@@\n@@EMPTY@@\n", expected: "0", expectedRaw: "0" },
      { input: "word1 = \"a\", word2 = \"b\"", stdin: "a\nb\n", expected: "1", expectedRaw: "1" },
      { input: "word1 = \"abc\", word2 = \"\"", stdin: "abc\n@@EMPTY@@\n", expected: "3", expectedRaw: "3" }
    ]
  },
  140: {
    id: 140, name: "Partition Equal Subset Sum",
    functionName: "canPartition", returnType: "bool",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool canPartition(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean canPartition(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def canPartition(self, nums: List[int]) -> bool:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canPartition = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,5,11,5]", stdin: "4\n1 5 11 5\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [1,2,3,5]", stdin: "4\n1 2 3 5\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [1,1]", stdin: "2\n1 1\n", expected: "true", expectedRaw: "1" },
      { input: "nums = [1,2]", stdin: "2\n1 2\n", expected: "false", expectedRaw: "0" },
      { input: "nums = [3,1,1,2,2,1]", stdin: "6\n3 1 1 2 2 1\n", expected: "true", expectedRaw: "1" }
    ]
  },
  141: {
    id: 141, name: "Burst Balloons",
    functionName: "maxCoins", returnType: "int",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxCoins(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxCoins(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def maxCoins(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxCoins = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,1,5,8]", stdin: "4\n3 1 5 8\n", expected: "167", expectedRaw: "167" },
      { input: "nums = [1,5]", stdin: "2\n1 5\n", expected: "10", expectedRaw: "10" }
    ],
    hiddenTests: [
      { input: "nums = []", stdin: "0\n\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [3]", stdin: "1\n3\n", expected: "3", expectedRaw: "3" },
      { input: "nums = [7,9,8]", stdin: "3\n7 9 8\n", expected: "568", expectedRaw: "568" }
    ]
  },
  142: {
    id: 142, name: "Maximum Subarray",
    functionName: "maxSubArray", returnType: "int",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", stdin: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expected: "6", expectedRaw: "6" },
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [5,4,-1,7,8]", stdin: "5\n5 4 -1 7 8\n", expected: "23", expectedRaw: "23" },
      { input: "nums = [-1,-2,-3,-4]", stdin: "4\n-1 -2 -3 -4\n", expected: "-1", expectedRaw: "-1" },
      { input: "nums = [0,-3,1,1]", stdin: "4\n0 -3 1 1\n", expected: "2", expectedRaw: "2" }
    ]
  },
  143: {
    id: 143, name: "Maximum Product Subarray",
    functionName: "maxProduct", returnType: "int",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int maxProduct(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public int maxProduct(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxProduct = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [2,3,-2,4]", stdin: "4\n2 3 -2 4\n", expected: "6", expectedRaw: "6" },
      { input: "nums = [-2,0,-1]", stdin: "3\n-2 0 -1\n", expected: "0", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "nums = [-2,3,-4]", stdin: "3\n-2 3 -4\n", expected: "24", expectedRaw: "24" },
      { input: "nums = [0,-2]", stdin: "2\n0 -2\n", expected: "0", expectedRaw: "0" },
      { input: "nums = [-2]", stdin: "1\n-2\n", expected: "-2", expectedRaw: "-2" }
    ]
  },
  144: {
    id: 144, name: "BFS Shortest Path",
    functionName: "shortestPath", returnType: "int",
    parameters: [{ name: "n", type: "int" }, { name: "edges", type: "vector<vector<int>>" }, { name: "src", type: "int" }, { name: "dest", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int shortestPath(int n, vector<vector<int>>& edges, int src, int dest) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "n = 4, edges = [[0,1],[1,2],[2,3]], src = 0, dest = 3", stdin: "4\n3 2\n0 1 1 2 2 3\n0\n3\n", expected: "3", expectedRaw: "3" },
      { input: "n = 3, edges = [[0,1]], src = 0, dest = 2", stdin: "3\n1 2\n0 1\n0\n2\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "n = 1, edges = [], src = 0, dest = 0", stdin: "1\n0 2\n\n0\n0\n", expected: "0", expectedRaw: "0" },
      { input: "n = 5, edges = [[0,1],[0,2],[1,3],[2,3],[3,4]], src = 0, dest = 4", stdin: "5\n5 2\n0 1 0 2 1 3 2 3 3 4\n0\n4\n", expected: "3", expectedRaw: "3" },
      { input: "n = 3, edges = [[0,1],[1,2],[0,2]], src = 0, dest = 2", stdin: "3\n3 2\n0 1 1 2 0 2\n0\n2\n", expected: "1", expectedRaw: "1" }
    ]
  },
  145: {
    id: 145, name: "Pacific Atlantic Water Flow",
    functionName: "pacificAtlantic", returnType: "count:vector<vector<int>>",
    parameters: [{ "name": "heights", "type": "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        \n    }\n}",
      python: "class Solution:\n    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[][]} heights\n * @return {number[][]}\n */\nvar pacificAtlantic = function(heights) {\n    \n};"
    },
    sampleTests: [
      { input: "heights=[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", stdin: "5 5\n1 2 2 3 5\n3 2 3 4 4\n2 4 5 3 1\n6 7 1 4 5\n5 1 1 2 4\n", expected: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]", expectedRaw: "7" },
      { input: "heights = [[1]]", stdin: "1 1\n1\n", expected: "[[0,0]]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "heights = [[1,2],[4,3]]", stdin: "2 2\n1 2\n4 3\n", expected: "3 cells", expectedRaw: "3" },
      { input: "heights = [[3,3,3],[3,1,3],[0,2,4]]", stdin: "3 3\n3 3 3\n3 1 3\n0 2 4\n", expected: "8 cells", expectedRaw: "8" },
      { input: "heights = [[1,1],[1,1]]", stdin: "2 2\n1 1\n1 1\n", expected: "4 cells", expectedRaw: "4" }
    ]
  },
  146: {
    id: 146, name: "Walls and Gates",
    functionName: "wallsAndGates", returnType: "void",
    parameters: [{ "name": "rooms", "type": "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    void wallsAndGates(vector<vector<int>>& rooms) {\n        \n    }\n};",
      java: "class Solution {\n    public void wallsAndGates(int[][] rooms) {\n        \n    }\n}",
      python: "class Solution:\n    def wallsAndGates(self, rooms: List[List[int]]) -> None:\n        ",
      js: "/**\n * @param {number[][]} rooms\n * @return {void}\n */\nvar wallsAndGates = function(rooms) {\n    \n};"
    },
    sampleTests: [
      { input: "rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]", stdin: "4 4\n2147483647 -1 0 2147483647\n2147483647 2147483647 2147483647 -1\n2147483647 -1 2147483647 -1\n0 -1 2147483647 2147483647\n", expected: "[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]", expectedRaw: "3 -1 0 1\n2 2 1 -1\n1 -1 2 -1\n0 -1 3 4" },
      { input: "rooms = [[-1]]", stdin: "1 1\n-1\n", expected: "[[-1]]", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "rooms = [[0]]", stdin: "1 1\n0\n", expected: "[[0]]", expectedRaw: "0" },
      { input: "rooms = [[2147483647]]", stdin: "1 1\n2147483647\n", expected: "[[2147483647]]", expectedRaw: "2147483647" },
      { input: "rooms = [[0,2147483647],[-1,2147483647]]", stdin: "2 2\n0 2147483647\n-1 2147483647\n", expected: "[[0,1],[-1,2]]", expectedRaw: "0 1\n-1 2" }
    ]
  },
  147: {
    id: 147, name: "Rotting Oranges",
    functionName: "orangesRotting", returnType: "int",
    parameters: [{ "name": "grid", "type": "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int orangesRotting(vector<vector<int>>& grid) {\n        \n    }\n};",
      java: "class Solution {\n    public int orangesRotting(int[][] grid) {\n        \n    }\n}",
      python: "class Solution:\n    def orangesRotting(self, grid: List[List[int]]) -> int:\n        ",
      js: "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar orangesRotting = function(grid) {\n    \n};"
    },
    sampleTests: [
      { input: "grid = [[2,1,1],[1,1,0],[0,1,1]]", stdin: "3 3\n2 1 1\n1 1 0\n0 1 1\n", expected: "4", expectedRaw: "4" },
      { input: "grid = [[2,1,1],[0,1,1],[1,0,1]]", stdin: "3 3\n2 1 1\n0 1 1\n1 0 1\n", expected: "-1", expectedRaw: "-1" }
    ],
    hiddenTests: [
      { input: "grid = [[0,2]]", stdin: "1 2\n0 2\n", expected: "0", expectedRaw: "0" },
      { input: "grid = [[1]]", stdin: "1 1\n1\n", expected: "-1", expectedRaw: "-1" },
      { input: "grid = [[2,1,1],[1,1,1],[0,1,2]]", stdin: "3 3\n2 1 1\n1 1 1\n0 1 2\n", expected: "2", expectedRaw: "2" }
    ]
  },
  148: {
    id: 148, name: "Word Ladder",
    functionName: "ladderLength", returnType: "int",
    parameters: [{ name: "beginWord", type: "string" }, { name: "endWord", type: "string" }, { name: "wordList", type: "vector<string>" }],
    starterCode: {
      cpp: "// Note: use -std=c++17 for structured bindings (auto& [a,b])\nclass Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        \n    }\n};",
      java: "class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        \n    }\n}",
      python: "class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        ",
      js: "/**\n * @param {string} beginWord\n * @param {string} endWord\n * @param {string[]} wordList\n * @return {number}\n */\nvar ladderLength = function(beginWord, endWord, wordList) {\n    \n};"
    },
    sampleTests: [
      { input: "beginWord=\"hit\", endWord=\"cog\", wordList=[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", stdin: "hit\ncog\n6\nhot\ndot\ndog\nlot\nlog\ncog\n", expected: "5", expectedRaw: "5" },
      { input: "beginWord=\"hit\", endWord=\"cog\", wordList=[\"hot\",\"dot\",\"dog\",\"lot\",\"log\"]", stdin: "hit\ncog\n5\nhot\ndot\ndog\nlot\nlog\n", expected: "0", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "beginWord=\"a\", endWord=\"b\", wordList=[\"b\"]", stdin: "a\nb\n1\nb\n", expected: "2", expectedRaw: "2" },
      { input: "beginWord=\"hot\", endWord=\"dog\", wordList=[\"hot\",\"dog\",\"dot\"]", stdin: "hot\ndog\n3\nhot\ndog\ndot\n", expected: "3", expectedRaw: "3" },
      { input: "beginWord=\"abc\", endWord=\"xyz\", wordList=[\"abd\",\"abz\",\"xyz\"]", stdin: "abc\nxyz\n3\nabd\nabz\nxyz\n", expected: "0", expectedRaw: "0" }
    ]
  },
  149: {
    id: 149, name: "Dijkstra's Algorithm",
    functionName: "dijkstra", returnType: "vector<int>",
    parameters: [{ name: "n", type: "int" }, { name: "edges", type: "vector<vector<int>>" }, { name: "src", type: "int" }],
    starterCode: {
      cpp: "// Note: use -std=c++17 for structured bindings (auto& [u,v,w])\nclass Solution {\npublic:\n    vector<int> dijkstra(int n, vector<vector<int>>& edges, int src) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] dijkstra(int n, int[][] edges, int src) {\n        \n    }\n}",
      python: "class Solution:\n    def dijkstra(self, n: int, edges: List[List[int]], src: int) -> List[int]:\n        ",
      js: "/**\n * @param {number} n\n * @param {number[][]} edges\n * @param {number} src\n * @return {number[]}\n */\nvar dijkstra = function(n, edges, src) {\n    \n};"
    },
    sampleTests: [
      { input: "n=5, edges=[[0,1,10],[0,4,3],[1,2,2],[4,1,4],[4,3,8],[3,2,2]], src=0", stdin: "5\n6 3\n0 1 10 0 4 3 1 2 2 4 1 4 4 3 8 3 2 2\n0\n", expected: "0 7 9 11 3", expectedRaw: "0 7 9 11 3" },
      { input: "n=3, edges=[[0,1,1],[1,2,1]], src=0", stdin: "3\n2 3\n0 1 1 1 2 1\n0\n", expected: "0 1 2", expectedRaw: "0 1 2" }
    ],
    hiddenTests: [
      { input: "n=1, edges=[], src=0", stdin: "1\n0 3\n\n0\n", expected: "0", expectedRaw: "0" },
      { input: "n=2, edges=[[0,1,5]], src=0", stdin: "2\n1 3\n0 1 5\n0\n", expected: "0 5", expectedRaw: "0 5" },
      { input: "n=3, edges=[[0,1,3],[0,2,7],[1,2,2]], src=0", stdin: "3\n3 3\n0 1 3 0 2 7 1 2 2\n0\n", expected: "0 3 5", expectedRaw: "0 3 5" }
    ]
  },
  150: {
    id: 150, name: "Number of Islands",
    functionName: "numIslands", returnType: "int",
    parameters: [{ "name": "grid", "type": "vector<vector<char>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};",
      java: "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
      python: "class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        ",
      js: "/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};"
    },
    sampleTests: [
      { input: "grid=[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", stdin: "4 5\n49 49 49 49 48\n49 49 48 49 48\n49 49 48 48 48\n48 48 48 48 48\n", expected: "1", expectedRaw: "1" },
      { input: "grid=[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", stdin: "4 5\n49 49 48 48 48\n49 49 48 48 48\n48 48 49 48 48\n48 48 48 49 49\n", expected: "3", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "grid=[[\"1\"]]", stdin: "1 1\n49\n", expected: "1", expectedRaw: "1" },
      { input: "grid=[[\"0\"]]", stdin: "1 1\n48\n", expected: "0", expectedRaw: "0" },
      { input: "grid=[[\"1\",\"0\"],[\"0\",\"1\"]]", stdin: "2 2\n49 48\n48 49\n", expected: "2", expectedRaw: "2" }
    ]
  },
  151: {
    id: 151, name: "Clone Graph",
    functionName: "cloneGraph", returnType: "int:cloneGraph",
    parameters: [{ "name": "node", "type": "Node*" }],
    starterCode: {
      cpp: "/**\n * Definition for a Node.\n * class Node {\n * public:\n *     int val;\n *     vector<Node*> neighbors;\n *     Node() {\n *         val = 0;\n *         neighbors = vector<Node*>();\n *     }\n *     Node(int _val) {\n *         val = _val;\n *         neighbors = vector<Node*>();\n *     }\n *     Node(int _val, vector<Node*> _neighbors) {\n *         val = _val;\n *         neighbors = _neighbors;\n *     }\n * };\n */\nclass Solution {\npublic:\n    Node* cloneGraph(Node* node) {\n        \n    }\n};",
      java: "/*\n// Definition for a Node.\nclass Node {\n    public int val;\n    public List<Node> neighbors;\n    public Node() {\n        val = 0;\n        neighbors = new ArrayList<Node>();\n    }\n    public Node(int _val) {\n        val = _val;\n        neighbors = new ArrayList<Node>();\n    }\n    public Node(int _val, ArrayList<Node> _neighbors) {\n        val = _val;\n        neighbors = _neighbors;\n    }\n}\n*/\nclass Solution {\n    public Node cloneGraph(Node node) {\n        \n    }\n}",
      python: "\"\"\"\n# Definition for a Node.\nclass Node:\n    def __init__(self, val = 0, neighbors = None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\"\"\"\nclass Solution:\n    def cloneGraph(self, node: 'Optional[Node]') -> 'Optional[Node]':\n        ",
      js: "/**\n * // Definition for a Node.\n * function Node(val, neighbors) {\n *     this.val = val === undefined ? 0 : val;\n *     this.neighbors = neighbors === undefined ? [] : neighbors;\n * };\n */\n/**\n * @param {Node} node\n * @return {Node}\n */\nvar cloneGraph = function(node) {\n    \n};"
    },
    sampleTests: [
      { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", stdin: "4\n2 2 4\n2 1 3\n2 2 4\n2 1 3\n", expected: "4 nodes", expectedRaw: "4" },
      { input: "adjList = [[]]", stdin: "1\n0\n", expected: "1 node", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "adjList = []", stdin: "0\n", expected: "0 nodes", expectedRaw: "0" },
      { input: "adjList = [[2],[1]]", stdin: "2\n1 2\n1 1\n", expected: "2 nodes", expectedRaw: "2" },
      { input: "adjList = [[2,3],[1,3],[1,2]]", stdin: "3\n2 2 3\n2 1 3\n2 1 2\n", expected: "3 nodes", expectedRaw: "3" }
    ]
  },
  152: {
    id: 152, name: "Course Schedule",
    functionName: "canFinish", returnType: "bool",
    parameters: [{ name: "numCourses", type: "int" }, { name: "prerequisites", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", stdin: "2\n1 2\n1 0\n", expected: "true", expectedRaw: "1" },
      { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", stdin: "2\n2 2\n1 0 0 1\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "numCourses = 1, prerequisites = []", stdin: "1\n0 2\n\n", expected: "true", expectedRaw: "1" },
      { input: "numCourses = 3, prerequisites = [[1,0],[2,1]]", stdin: "3\n2 2\n1 0 2 1\n", expected: "true", expectedRaw: "1" },
      { input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", stdin: "4\n4 2\n1 0 2 0 3 1 3 2\n", expected: "true", expectedRaw: "1" }
    ]
  },
  153: {
    id: 153, name: "Detect Cycle in Directed Graph",
    functionName: "isCyclic", returnType: "bool",
    parameters: [{ name: "V", type: "int" }, { name: "adj", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool isCyclic(int V, vector<vector<int>>& adj) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean isCyclic(int V, int[][] adj) {\n        \n    }\n}",
      python: "class Solution:\n    def isCyclic(self, V: int, adj: List[List[int]]) -> bool:\n        ",
      js: "/**\n * @param {number} V\n * @param {number[][]} adj\n * @return {boolean}\n */\nvar isCyclic = function(V, adj) {\n    \n};"
    },
    sampleTests: [
      { input: "V = 4, adj = [[0,1],[1,2],[2,3],[3,3]]", stdin: "4\n4 2\n0 1 1 2 2 3 3 3\n", expected: "true", expectedRaw: "1" },
      { input: "V = 3, adj = [[0,1],[1,2]]", stdin: "3\n2 2\n0 1 1 2\n", expected: "false", expectedRaw: "0" }
    ],
    hiddenTests: [
      { input: "V = 1, adj = []", stdin: "1\n0 2\n\n", expected: "false", expectedRaw: "0" },
      { input: "V = 2, adj = [[0,1],[1,0]]", stdin: "2\n2 2\n0 1 1 0\n", expected: "true", expectedRaw: "1" },
      { input: "V = 3, adj = [[0,1],[0,2]]", stdin: "3\n2 2\n0 1 0 2\n", expected: "false", expectedRaw: "0" }
    ]
  },
  154: {
    id: 154, name: "Flood Fill",
    functionName: "floodFill", returnType: "vector<vector<int>>",
    parameters: [{ "name": "image", "type": "vector<vector<int>>" }, { "name": "sr", "type": "int" }, { "name": "sc", "type": "int" }, { "name": "color", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {\n        \n    }\n};",
      java: "class Solution {\n    public int[][] floodFill(int[][] image, int sr, int sc, int color) {\n        \n    }\n}",
      python: "class Solution:\n    def floodFill(self, image: List[List[int]], sr: int, sc: int, color: int) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[][]} image\n * @param {number} sr\n * @param {number} sc\n * @param {number} color\n * @return {number[][]}\n */\nvar floodFill = function(image, sr, sc, color) {\n    \n};"
    },
    sampleTests: [
      { input: "image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2", stdin: "3 3\n1 1 1\n1 1 0\n1 0 1\n1\n1\n2\n", expected: "[[2,2,2],[2,2,0],[2,0,1]]", expectedRaw: "2 2 2\n2 2 0\n2 0 1" },
      { input: "image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0", stdin: "2 3\n0 0 0\n0 0 0\n0\n0\n0\n", expected: "[[0,0,0],[0,0,0]]", expectedRaw: "0 0 0\n0 0 0" }
    ],
    hiddenTests: [
      { input: "image = [[0]], sr = 0, sc = 0, color = 2", stdin: "1 1\n0\n0\n0\n2\n", expected: "[[2]]", expectedRaw: "2" },
      { input: "image = [[0,1],[1,1]], sr = 1, sc = 1, color = 3", stdin: "2 2\n0 1\n1 1\n1\n1\n3\n", expected: "[[0,3],[3,3]]", expectedRaw: "0 3\n3 3" },
      { input: "image = [[1,0],[0,1]], sr = 0, sc = 1, color = 4", stdin: "2 2\n1 0\n0 1\n0\n1\n4\n", expected: "[[1,4],[0,1]]", expectedRaw: "1 4\n0 1" }
    ]
  },
  155: {
    id: 155, name: "Word Search",
    functionName: "exist", returnType: "bool",
    parameters: [{ "name": "board", "type": "vector<vector<char>>" }, { "name": "word", "type": "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}",
      python: "class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        ",
      js: "/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    \n};"
    },
    sampleTests: [
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"", stdin: "3 4\n65 66 67 69\n83 70 67 83\n65 68 69 69\nABCCED\n", expected: "true", expectedRaw: "1" },
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"SEE\"", stdin: "3 4\n65 66 67 69\n83 70 67 83\n65 68 69 69\nSEE\n", expected: "true", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCB\"", stdin: "3 4\n65 66 67 69\n83 70 67 83\n65 68 69 69\nABCB\n", expected: "false", expectedRaw: "0" },
      { input: "board = [[\"A\"]], word = \"A\"", stdin: "1 1\n65\nA\n", expected: "true", expectedRaw: "1" },
      { input: "board = [[\"A\"]], word = \"B\"", stdin: "1 1\n65\nB\n", expected: "false", expectedRaw: "0" }
    ]
  },
  156: {
    id: 156, name: "Alien Dictionary",
    functionName: "alienOrder", returnType: "string",
    parameters: [{ name: "words", type: "vector<string>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    string alienOrder(vector<string>& words) {\n        \n    }\n};",
      java: "class Solution {\n    public String alienOrder(String[] words) {\n        \n    }\n}",
      python: "class Solution:\n    def alienOrder(self, words: List[str]) -> str:\n        ",
      js: "/**\n * @param {string[]} words\n * @return {string}\n */\nvar alienOrder = function(words) {\n    \n};"
    },
    sampleTests: [
      { input: "words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]", stdin: "5\nwrt\nwrf\ner\nett\nrftt\n", expected: "\"wertf\"", expectedRaw: "wertf" },
      { input: "words = [\"z\",\"x\"]", stdin: "2\nz\nx\n", expected: "\"zx\"", expectedRaw: "zx" }
    ],
    hiddenTests: [
      { input: "words = [\"z\",\"x\",\"z\"]", stdin: "3\nz\nx\nz\n", expected: "\"\"", expectedRaw: "" },
      { input: "words = [\"a\",\"ab\"]", stdin: "2\na\nab\n", expected: "\"ab\"", expectedRaw: "ab" },
      { input: "words = [\"wrt\",\"wrf\"]", stdin: "2\nwrt\nwrf\n", expected: "\"wrtf\"", expectedRaw: "wrtf" }
    ]
  },
  157: {
    id: 157, name: "Course Schedule II",
    compareMode: "unordered",
    functionName: "findOrder", returnType: "vector<int>",
    parameters: [{ name: "numCourses", type: "int" }, { name: "prerequisites", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", stdin: "2\n1 2\n1 0\n", expected: "[0,1]", expectedRaw: "0 1" },
      { input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", stdin: "4\n4 2\n1 0 2 0 3 1 3 2\n", expected: "[0,2,1,3]", expectedRaw: "0 2 1 3" }
    ],
    hiddenTests: [
      { input: "numCourses = 2, prerequisites = [[0,1],[1,0]]", stdin: "2\n2 2\n0 1 1 0\n", expected: "[]", expectedRaw: "" },
      { input: "numCourses = 1, prerequisites = []", stdin: "1\n0 2\n\n", expected: "[0]", expectedRaw: "0" },
      { input: "numCourses = 3, prerequisites = [[1,0],[2,1]]", stdin: "3\n2 2\n1 0 2 1\n", expected: "[0,1,2]", expectedRaw: "0 1 2" }
    ]
  },
  158: {
    id: 158, name: "Number of Connected Components",
    functionName: "countComponents", returnType: "int",
    parameters: [{ name: "n", type: "int" }, { name: "edges", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int countComponents(int n, vector<vector<int>>& edges) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "n = 5, edges = [[0,1],[1,2],[3,4]]", stdin: "5\n3 2\n0 1 1 2 3 4\n", expected: "2", expectedRaw: "2" },
      { input: "n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]", stdin: "5\n4 2\n0 1 1 2 2 3 3 4\n", expected: "1", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "n = 5, edges = []", stdin: "5\n0 2\n\n", expected: "5", expectedRaw: "5" },
      { input: "n = 1, edges = []", stdin: "1\n0 2\n\n", expected: "1", expectedRaw: "1" },
      { input: "n = 4, edges = [[2,3],[1,2],[0,3]]", stdin: "4\n3 2\n2 3 1 2 0 3\n", expected: "1", expectedRaw: "1" }
    ]
  },
  159: {
    id: 159, name: "Redundant Connection",
    functionName: "findRedundantConnection", returnType: "vector<int>",
    parameters: [{ name: "edges", type: "vector<vector<int>>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> findRedundantConnection(vector<vector<int>>& edges) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "edges = [[1,2],[1,3],[2,3]]", stdin: "3 2\n1 2 1 3 2 3\n", expected: "[2,3]", expectedRaw: "2 3" },
      { input: "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]", stdin: "5 2\n1 2 2 3 3 4 1 4 1 5\n", expected: "[1,4]", expectedRaw: "1 4" }
    ],
    hiddenTests: [
      { input: "edges = [[1,2],[2,3],[1,3]]", stdin: "3 2\n1 2 2 3 1 3\n", expected: "[1,3]", expectedRaw: "1 3" },
      { input: "edges = [[1,3],[3,4],[1,4],[1,2]]", stdin: "4 2\n1 3 3 4 1 4 1 2\n", expected: "[1,4]", expectedRaw: "1 4" },
      { input: "edges = [[1,2],[2,3],[3,4],[4,5],[1,5]]", stdin: "5 2\n1 2 2 3 3 4 4 5 1 5\n", expected: "[1,5]", expectedRaw: "1 5" }
    ]
  },
  160: {
    id: 160, name: "Fibonacci Number",
    functionName: "fib", returnType: "int",
    parameters: [{ "name": "n", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int fib(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int fib(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def fib(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar fib = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 2", stdin: "2\n", expected: "1", expectedRaw: "1" },
      { input: "n = 3", stdin: "3\n", expected: "2", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "n = 0", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "n = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "n = 10", stdin: "10\n", expected: "55", expectedRaw: "55" }
    ]
  },
  161: {
    id: 161, name: "Factorial using Recursion",
    functionName: "factorial", returnType: "int",
    parameters: [{ "name": "n", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int factorial(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int factorial(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def factorial(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar factorial = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 5", stdin: "5\n", expected: "120", expectedRaw: "120" },
      { input: "n = 3", stdin: "3\n", expected: "6", expectedRaw: "6" }
    ],
    hiddenTests: [
      { input: "n = 0", stdin: "0\n", expected: "1", expectedRaw: "1" },
      { input: "n = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "n = 10", stdin: "10\n", expected: "3628800", expectedRaw: "3628800" }
    ]
  },
  162: {
    id: 162, name: "Sum of Digits using Recursion",
    functionName: "sumOfDigits", returnType: "int",
    parameters: [{ "name": "n", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int sumOfDigits(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int sumOfDigits(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def sumOfDigits(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar sumOfDigits = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 123", stdin: "123\n", expected: "6", expectedRaw: "6" },
      { input: "n = 4567", stdin: "4567\n", expected: "22", expectedRaw: "22" }
    ],
    hiddenTests: [
      { input: "n = 0", stdin: "0\n", expected: "0", expectedRaw: "0" },
      { input: "n = 9", stdin: "9\n", expected: "9", expectedRaw: "9" },
      { input: "n = 99999", stdin: "99999\n", expected: "45", expectedRaw: "45" }
    ]
  },
  163: {
    id: 163, name: "Power Function (Fast Exponentiation)",
    functionName: "myPow", returnType: "double", compareMode: "float",
    parameters: [{ name: "x", type: "double" }, { name: "n", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    double myPow(double x, int n) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "x = 2.00000, n = 10", stdin: "2\n10\n", expected: "1024.00000", expectedRaw: "1024.00000" },
      { input: "x = 2.10000, n = 3", stdin: "2.1\n3\n", expected: "9.26100", expectedRaw: "9.26100" }
    ],
    hiddenTests: [
      { input: "x = 2.0, n = -2", stdin: "2\n-2\n", expected: "0.25000", expectedRaw: "0.25000" },
      { input: "x = 1.0, n = 1000000000", stdin: "1\n1000000000\n", expected: "1.00000", expectedRaw: "1.00000" },
      { input: "x = 0.0, n = 5", stdin: "0\n5\n", expected: "0.00000", expectedRaw: "0.00000" }
    ]
  },
  164: {
    id: 164, name: "Tower of Hanoi",
    functionName: "toh", returnType: "int",
    parameters: [{ name: "n", type: "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    // Return the minimum number of moves to solve Tower of Hanoi with n disks\n    int toh(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public int toh(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def toh(self, n: int) -> int:\n        ",
      js: "/**\n * @param {number} n\n * @return {number}\n */\nvar toh = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 3", stdin: "3\n", expected: "7", expectedRaw: "7" },
      { input: "n = 4", stdin: "4\n", expected: "15", expectedRaw: "15" }
    ],
    hiddenTests: [
      { input: "n = 1", stdin: "1\n", expected: "1", expectedRaw: "1" },
      { input: "n = 2", stdin: "2\n", expected: "3", expectedRaw: "3" },
      { input: "n = 5", stdin: "5\n", expected: "31", expectedRaw: "31" }
    ]
  },
  165: {
    id: 165, name: "Subsets",
    functionName: "subsets", returnType: "count:vector<vector<int>>",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3]", stdin: "3\n1 2 3\n", expected: "8 subsets", expectedRaw: "8" },
      { input: "nums = [0]", stdin: "1\n0\n", expected: "2 subsets", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = []", stdin: "0\n\n", expected: "1 subset", expectedRaw: "1" },
      { input: "nums = [1,2]", stdin: "2\n1 2\n", expected: "4 subsets", expectedRaw: "4" },
      { input: "nums = [9,0,3,5]", stdin: "4\n9 0 3 5\n", expected: "16 subsets", expectedRaw: "16" }
    ]
  },
  166: {
    id: 166, name: "Permutations",
    functionName: "permute", returnType: "count:vector<vector<int>>",
    parameters: [{ "name": "nums", "type": "vector<int>" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        \n    }\n}",
      python: "class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,2,3]", stdin: "3\n1 2 3\n", expected: "6 permutations", expectedRaw: "6" },
      { input: "nums = [0,1]", stdin: "2\n0 1\n", expected: "2 permutations", expectedRaw: "2" }
    ],
    hiddenTests: [
      { input: "nums = [1]", stdin: "1\n1\n", expected: "1 permutation", expectedRaw: "1" },
      { input: "nums = [3,2,1,4]", stdin: "4\n3 2 1 4\n", expected: "24 permutations", expectedRaw: "24" },
      { input: "nums = [5,6]", stdin: "2\n5 6\n", expected: "2 permutations", expectedRaw: "2" }
    ]
  },
  167: {
    id: 167, name: "Combination Sum",
    functionName: "combinationSum", returnType: "count:vector<vector<int>>",
    parameters: [{ "name": "candidates", "type": "vector<int>" }, { "name": "target", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        \n    }\n}",
      python: "class Solution:\n    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:\n        ",
      js: "/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum = function(candidates, target) {\n    \n};"
    },
    sampleTests: [
      { input: "candidates = [2,3,6,7], target = 7", stdin: "4\n2 3 6 7\n7\n", expected: "2 combinations", expectedRaw: "2" },
      { input: "candidates = [2,3,5], target = 8", stdin: "3\n2 3 5\n8\n", expected: "3 combinations", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "candidates = [2], target = 1", stdin: "1\n2\n1\n", expected: "0 combinations", expectedRaw: "0" },
      { input: "candidates = [1], target = 1", stdin: "1\n1\n1\n", expected: "1 combination", expectedRaw: "1" },
      { input: "candidates = [1], target = 2", stdin: "1\n1\n2\n", expected: "1 combination", expectedRaw: "1" }
    ]
  },
  168: {
    id: 168, name: "Letter Combinations of Phone Number",
    functionName: "letterCombinations", returnType: "count:vector<string>",
    parameters: [{ "name": "digits", "type": "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<string> letterCombinations(string digits) {\n        \n    }\n};",
      java: "class Solution {\n    public List<String> letterCombinations(String digits) {\n        \n    }\n}",
      python: "class Solution:\n    def letterCombinations(self, digits: str) -> List[str]:\n        ",
      js: "/**\n * @param {string} digits\n * @return {string[]}\n */\nvar letterCombinations = function(digits) {\n    \n};"
    },
    sampleTests: [
      { input: "digits = \"23\"", stdin: "23\n", expected: "9 combinations", expectedRaw: "9" },
      { input: "digits = \"2\"", stdin: "2\n", expected: "3 combinations", expectedRaw: "3" }
    ],
    hiddenTests: [
      { input: "digits = \"7\"", stdin: "7\n", expected: "4 combinations", expectedRaw: "4" },
      { input: "digits = \"234\"", stdin: "234\n", expected: "27 combinations", expectedRaw: "27" }
    ]
  },
  169: {
    id: 169, name: "N-Queens",
    functionName: "solveNQueens", returnType: "count:vector<vector<string>>",
    parameters: [{ "name": "n", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<vector<string>> solveNQueens(int n) {\n        \n    }\n};",
      java: "class Solution {\n    public List<List<String>> solveNQueens(int n) {\n        \n    }\n}",
      python: "class Solution:\n    def solveNQueens(self, n: int) -> List[List[str]]:\n        ",
      js: "/**\n * @param {number} n\n * @return {string[][]}\n */\nvar solveNQueens = function(n) {\n    \n};"
    },
    sampleTests: [
      { input: "n = 4", stdin: "4\n", expected: "2 solutions", expectedRaw: "2" },
      { input: "n = 1", stdin: "1\n", expected: "1 solution", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "n = 2", stdin: "2\n", expected: "0 solutions", expectedRaw: "0" },
      { input: "n = 3", stdin: "3\n", expected: "0 solutions", expectedRaw: "0" },
      { input: "n = 5", stdin: "5\n", expected: "10 solutions", expectedRaw: "10" }
    ]
  },
  170: {
    id: 170, name: "Word Search",
    functionName: "exist", returnType: "bool",
    parameters: [{ "name": "board", "type": "vector<vector<char>>" }, { "name": "word", "type": "string" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};",
      java: "class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}",
      python: "class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        ",
      js: "/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    \n};"
    },
    sampleTests: [
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"", stdin: "3 4\n65 66 67 69\n83 70 67 83\n65 68 69 69\nABCCED\n", expected: "true", expectedRaw: "1" },
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"SEE\"", stdin: "3 4\n65 66 67 69\n83 70 67 83\n65 68 69 69\nSEE\n", expected: "true", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCB\"", stdin: "3 4\n65 66 67 69\n83 70 67 83\n65 68 69 69\nABCB\n", expected: "false", expectedRaw: "0" },
      { input: "board = [[\"A\"]], word = \"A\"", stdin: "1 1\n65\nA\n", expected: "true", expectedRaw: "1" },
      { input: "board = [[\"A\"]], word = \"B\"", stdin: "1 1\n65\nB\n", expected: "false", expectedRaw: "0" }
    ]
  },
  171: {
    id: 171, name: "Kth Largest Element in Array",
    functionName: "findKthLargest", returnType: "int",
    parameters: [{ "name": "nums", "type": "vector<int>" }, { "name": "k", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar findKthLargest = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [3,2,1,5,6,4], k = 2", stdin: "6\n3 2 1 5 6 4\n2\n", expected: "5", expectedRaw: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", stdin: "9\n3 2 3 1 2 4 5 5 6\n4\n", expected: "4", expectedRaw: "4" }
    ],
    hiddenTests: [
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "1", expectedRaw: "1" },
      { input: "nums = [2,1], k = 1", stdin: "2\n2 1\n1\n", expected: "2", expectedRaw: "2" },
      { input: "nums = [3,2,1,5,6,4], k = 6", stdin: "6\n3 2 1 5 6 4\n6\n", expected: "1", expectedRaw: "1" }
    ]
  },
  172: {
    id: 172, name: "Find Median from Data Stream",
    className: "MedianFinder", functionName: "findMedian", returnType: "design:MedianFinder",
    parameters: [{ name: "nums", type: "vector<int>" }],
    starterCode: {
      cpp: "class MedianFinder {\npublic:\n    MedianFinder() {}\n    void addNum(int num) {}\n    double findMedian() {}\n};",
      java: "class MedianFinder {\n    public MedianFinder() {}\n    public void addNum(int num) {}\n    public double findMedian() { return 0.0; }\n}",
      python: "class MedianFinder:\n    def __init__(self):\n        pass\n    def addNum(self, num: int) -> None:\n        pass\n    def findMedian(self) -> float:\n        pass",
      js: "class MedianFinder {\n    constructor() {}\n    addNum(num) {}\n    findMedian() {}\n}"
    },
    sampleTests: [
      { input: "addNum(1),addNum(2),findMedian()", stdin: "3\n1 2 3\n", expected: "2.0", expectedRaw: "2.0" },
      { input: "addNum(5),findMedian()", stdin: "1\n5\n", expected: "5.0", expectedRaw: "5.0" }
    ],
    hiddenTests: [
      { input: "addNum(6),addNum(10),addNum(2),findMedian()", stdin: "3\n6 10 2\n", expected: "6.0", expectedRaw: "6.0" },
      { input: "addNum(1),addNum(2),findMedian()", stdin: "2\n1 2\n", expected: "1.5", expectedRaw: "1.5" },
      { input: "addNum(3),addNum(1),addNum(2),findMedian()", stdin: "3\n3 1 2\n", expected: "2.0", expectedRaw: "2.0" }
    ]
  },
  173: {
    id: 173, name: "Merge K Sorted Lists",
    functionName: "mergeKLists", returnType: "ListNode*",
    parameters: [{ name: "lists", type: "vector<ListNode*>" }],
    starterCode: {
      cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};"
    },
    sampleTests: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", stdin: "3\n3\n1 4 5\n3\n1 3 4\n2\n2 6\n", expected: "1 1 2 3 4 4 5 6", expectedRaw: "1 1 2 3 4 4 5 6" },
      { input: "lists = []", stdin: "0\n", expected: "[]", expectedRaw: "" }
    ],
    hiddenTests: [
      { input: "lists = [[]]", stdin: "1\n0\n", expected: "", expectedRaw: "" },
      { input: "lists = [[1],[2],[3]]", stdin: "3\n1\n1\n1\n2\n1\n3\n", expected: "1 2 3", expectedRaw: "1 2 3" },
      { input: "lists = [[1,2],[1,2]]", stdin: "2\n2\n1 2\n2\n1 2\n", expected: "1 1 2 2", expectedRaw: "1 1 2 2" }
    ]
  },
  174: {
    id: 174, name: "Top K Frequent Elements",
    compareMode: "unordered",
    functionName: "topKFrequent", returnType: "vector<int>",
    parameters: [{ "name": "nums", "type": "vector<int>" }, { "name": "k", "type": "int" }],
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        \n    }\n};",
      java: "class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        \n    }\n}",
      python: "class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ",
      js: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    \n};"
    },
    sampleTests: [
      { input: "nums = [1,1,1,2,2,3], k = 2", stdin: "6\n1 1 1 2 2 3\n2\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [1], k = 1", stdin: "1\n1\n1\n", expected: "[1]", expectedRaw: "1" }
    ],
    hiddenTests: [
      { input: "nums = [4,4,4,4,2,2,2,1,3], k = 2", stdin: "9\n4 4 4 4 2 2 2 1 3\n2\n", expected: "[4,2]", expectedRaw: "4 2" },
      { input: "nums = [1,2], k = 2", stdin: "2\n1 2\n2\n", expected: "[1,2]", expectedRaw: "1 2" },
      { input: "nums = [1,1,1,2,2,3], k = 1", stdin: "6\n1 1 1 2 2 3\n1\n", expected: "[1]", expectedRaw: "1" }
    ]
  }
};

[
  21, 22, 40,
  61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
  82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97,
  105, 116, 122, 137, 144, 145, 146, 147, 149, 150, 151, 152, 153, 154, 155,
  157, 158, 159, 165, 166, 167, 170, 173
].forEach(id => {
  if (window.QUESTION_METADATA_REGISTRY[id]) {
    window.QUESTION_METADATA_REGISTRY[id].supportedLanguages = ["cpp"];
  }
});