/**
 * question-metadata.js — AlgoQuest DSA Dashboard
 *
 * SECURITY HARDENING (Priority 1):
 *   Test execution data has been removed from this file and moved to
 *   backend/data/test_cases.json (server-side, never served to browser).
 *
 * This file contains ONLY what the client-side code needs:
 *   - functionName, parameters, returnType  → driver code generation (compiler.js)
 *   - starterCode                           → Monaco editor language templates
 *   - sampleTests[].input / .expected      → human-readable UI display
 *   - compareMode                          → reference only (unused client-side)
 *
 * REMOVED:
 *   - hiddenTests[]          (secret — server-side only)
 *   - sampleTests[].stdin    (execution — backend constructs this)
 *   - sampleTests[].expectedRaw (comparison — backend does this)
 */

window.QUESTION_METADATA_REGISTRY = {
  "1": {
    "id": 1,
    "name": "Two Sum",
    "compareMode": "unordered",
    "functionName": "twoSum",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "expected": "[0,1]"
      },
      {
        "input": "nums = [3,2,4], target = 6",
        "expected": "[1,2]"
      }
    ]
  },
  "2": {
    "id": 2,
    "name": "Contains Duplicate",
    "functionName": "containsDuplicate",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,1]",
        "expected": "true"
      },
      {
        "input": "nums = [1,2,3,4]",
        "expected": "false"
      }
    ]
  },
  "3": {
    "id": 3,
    "name": "Majority Element",
    "functionName": "majorityElement",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int majorityElement(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar majorityElement = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,2,3]",
        "expected": "3"
      },
      {
        "input": "nums = [2,2,1,1,1,2,2]",
        "expected": "2"
      }
    ]
  },
  "4": {
    "id": 4,
    "name": "Find Missing Number",
    "functionName": "missingNumber",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int missingNumber(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def missingNumber(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar missingNumber = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,0,1]",
        "expected": "2"
      },
      {
        "input": "nums = [0,1]",
        "expected": "2"
      }
    ]
  },
  "5": {
    "id": 5,
    "name": "Find Duplicate Number",
    "functionName": "findDuplicate",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findDuplicate(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findDuplicate(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findDuplicate = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,3,4,2,2]",
        "expected": "2"
      },
      {
        "input": "nums = [3,1,3,4,2]",
        "expected": "3"
      }
    ]
  },
  "6": {
    "id": 6,
    "name": "Count Frequency of Elements",
    "functionName": "countFrequency",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int countFrequency(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public int countFrequency(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def countFrequency(self, nums: List[int], target: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar countFrequency = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,2,3,3,3], target = 3",
        "expected": "3"
      },
      {
        "input": "nums = [1,2,2,3,3,3], target = 2",
        "expected": "2"
      }
    ]
  },
  "7": {
    "id": 7,
    "name": "Find First Non-Repeating Element",
    "functionName": "firstNonRepeating",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int firstNonRepeating(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int firstNonRepeating(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def firstNonRepeating(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar firstNonRepeating = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,2,1,4]",
        "expected": "3"
      },
      {
        "input": "nums = [9,4,9,6,7,4]",
        "expected": "6"
      }
    ]
  },
  "8": {
    "id": 8,
    "name": "Find First Repeating Element",
    "functionName": "firstRepeating",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int firstRepeating(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int firstRepeating(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def firstRepeating(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar firstRepeating = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,2,1]",
        "expected": "2"
      },
      {
        "input": "nums = [3,1,2,1,3]",
        "expected": "1"
      }
    ]
  },
  "9": {
    "id": 9,
    "name": "Longest Consecutive Sequence",
    "functionName": "longestConsecutive",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int longestConsecutive(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def longestConsecutive(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar longestConsecutive = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [100,4,200,1,3,2]",
        "expected": "4"
      },
      {
        "input": "nums = [0,3,7,2,5,8,4,6,0,1]",
        "expected": "9"
      }
    ]
  },
  "10": {
    "id": 10,
    "name": "Count Distinct Elements",
    "functionName": "countDistinct",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int countDistinct(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int countDistinct(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def countDistinct(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar countDistinct = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,2,1]",
        "expected": "3"
      },
      {
        "input": "nums = [1,1,1,1]",
        "expected": "1"
      }
    ]
  },
  "11": {
    "id": 11,
    "name": "Intersection of Two Arrays",
    "compareMode": "unordered",
    "functionName": "intersection",
    "parameters": [
      {
        "name": "nums1",
        "type": "vector<int>"
      },
      {
        "name": "nums2",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] intersection(int[] nums1, int[] nums2) {\n        \n    }\n}",
      "python": "class Solution:\n    def intersection(self, nums1: List[int], nums2: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number[]}\n */\nvar intersection = function(nums1, nums2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums1 = [1,2,2,1], nums2 = [2,2]",
        "expected": "[2]"
      },
      {
        "input": "nums1 = [4,9,5], nums2 = [9,4,9,8,4]",
        "expected": "[9,4]"
      }
    ]
  },
  "12": {
    "id": 12,
    "name": "Union of Two Arrays",
    "functionName": "unionArrays",
    "parameters": [
      {
        "name": "nums1",
        "type": "vector<int>"
      },
      {
        "name": "nums2",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int unionArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      "java": "class Solution {\n    public int unionArrays(int[] nums1, int[] nums2) {\n        \n    }\n}",
      "python": "class Solution:\n    def unionArrays(self, nums1: List[int], nums2: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar unionArrays = function(nums1, nums2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums1 = [1,2,3], nums2 = [2,3,4]",
        "expected": "4"
      },
      {
        "input": "nums1 = [1,2,1,3], nums2 = [2,2]",
        "expected": "3"
      }
    ]
  },
  "13": {
    "id": 13,
    "name": "Majority Element II",
    "compareMode": "unordered",
    "functionName": "majorityElement",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> majorityElement(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<Integer> majorityElement(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def majorityElement(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar majorityElement = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,2,3]",
        "expected": "[3]"
      },
      {
        "input": "nums = [1,2]",
        "expected": "[1,2]"
      }
    ]
  },
  "14": {
    "id": 14,
    "name": "Move Zeroes",
    "functionName": "moveZeroes",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void moveZeroes(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public void moveZeroes(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar moveZeroes = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [0,1,0,3,12]",
        "expected": "[1,3,12,0,0]"
      },
      {
        "input": "nums = [0]",
        "expected": "[0]"
      }
    ]
  },
  "15": {
    "id": 15,
    "name": "Remove Duplicates from Sorted Array",
    "functionName": "removeDuplicates",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int removeDuplicates(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int removeDuplicates(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar removeDuplicates = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,1,2]",
        "expected": "2"
      },
      {
        "input": "nums = [0,0,1,1,1,2,2,3,3,4]",
        "expected": "5"
      }
    ]
  },
  "16": {
    "id": 16,
    "name": "Trapping Rain Water",
    "functionName": "trap",
    "parameters": [
      {
        "name": "height",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
      "java": "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
      "python": "class Solution:\n    def trap(self, height: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        "expected": "6"
      },
      {
        "input": "height = [4,2,0,3,2,5]",
        "expected": "9"
      }
    ]
  },
  "17": {
    "id": 17,
    "name": "Container With Most Water",
    "functionName": "maxArea",
    "parameters": [
      {
        "name": "height",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "height = [1,8,6,2,5,4,8,3,7]",
        "expected": "49"
      },
      {
        "input": "height = [1,1]",
        "expected": "1"
      }
    ]
  },
  "18": {
    "id": 18,
    "name": "Merge Two Sorted Arrays",
    "functionName": "merge",
    "parameters": [
      {
        "name": "nums1",
        "type": "vector<int>"
      },
      {
        "name": "m",
        "type": "int"
      },
      {
        "name": "nums2",
        "type": "vector<int>"
      },
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:\n        ",
      "js": "/**\n * @param {number[]} nums1\n * @param {number} m\n * @param {number[]} nums2\n * @param {number} n\n * @return {void}\n */\nvar merge = function(nums1, m, nums2, n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3",
        "expected": "[1,2,2,3,5,6]"
      },
      {
        "input": "nums1=[1], m=1, nums2=[], n=0",
        "expected": "[1]"
      }
    ]
  },
  "19": {
    "id": 19,
    "name": "Sort Colors",
    "functionName": "sortColors",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void sortColors(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public void sortColors(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar sortColors = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,0,2,1,1,0]",
        "expected": "[0,0,1,1,2,2]"
      },
      {
        "input": "nums = [2,0,1]",
        "expected": "[0,1,2]"
      }
    ]
  },
  "20": {
    "id": 20,
    "name": "Pair With Given Sum",
    "functionName": "hasPairWithSum",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool hasPairWithSum(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean hasPairWithSum(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def hasPairWithSum(self, nums: List[int], target: int) -> bool:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {boolean}\n */\nvar hasPairWithSum = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "expected": "true"
      },
      {
        "input": "nums = [1,3,5], target = 10",
        "expected": "false"
      }
    ]
  },
  "21": {
    "id": 21,
    "name": "Three Sum",
    "compareMode": "unordered",
    "functionName": "threeSum",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-1,0,1,2,-1,-4]",
        "expected": "[[-1,-1,2],[-1,0,1]]"
      },
      {
        "input": "nums = [0,1,1]",
        "expected": "[]"
      }
    ]
  },
  "22": {
    "id": 22,
    "name": "Four Sum",
    "compareMode": "unordered",
    "functionName": "fourSum",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> fourSum(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<Integer>> fourSum(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[][]}\n */\nvar fourSum = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,0,-1,0,-2,2], target = 0",
        "expected": "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]"
      },
      {
        "input": "nums = [2,2,2,2,2], target = 8",
        "expected": "[[2,2,2,2]]"
      }
    ]
  },
  "23": {
    "id": 23,
    "name": "Maximum Subarray Sum",
    "functionName": "maxSubArray",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        "expected": "6"
      },
      {
        "input": "nums = [1]",
        "expected": "1"
      }
    ]
  },
  "24": {
    "id": 24,
    "name": "Sliding Window Maximum",
    "functionName": "maxSlidingWindow",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar maxSlidingWindow = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        "expected": "[3,3,5,5,6,7]"
      },
      {
        "input": "nums = [1], k = 1",
        "expected": "[1]"
      }
    ]
  },
  "25": {
    "id": 25,
    "name": "Longest Substring Without Repeating Characters",
    "functionName": "lengthOfLongestSubstring",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"abcabcbb\"",
        "expected": "3"
      },
      {
        "input": "s = \"bbbbb\"",
        "expected": "1"
      }
    ]
  },
  "26": {
    "id": 26,
    "name": "Maximum Sum Subarray of Size K",
    "functionName": "maxSumSubarray",
    "parameters": [
      {
        "name": "arr",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxSumSubarray(vector<int>& arr, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxSumSubarray(int[] arr, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxSumSubarray(self, arr: List[int], k: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} arr\n * @param {number} k\n * @return {number}\n */\nvar maxSumSubarray = function(arr, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "arr = [2,3,4,1,5], k = 3",
        "expected": "10"
      },
      {
        "input": "arr = [1,4,2,10,2,3,1,0,20], k = 4",
        "expected": "24"
      }
    ]
  },
  "27": {
    "id": 27,
    "name": "First Negative Number in Every Window",
    "functionName": "firstNegativeInWindow",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> firstNegativeInWindow(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] firstNegativeInWindow(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def firstNegativeInWindow(self, nums: List[int], k: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar firstNegativeInWindow = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-8,2,-6,5,-4], k = 2",
        "expected": "[-8,-6,-6,-4]"
      },
      {
        "input": "nums = [1,2,3,4,5], k = 2",
        "expected": "[0,0,0,0]"
      }
    ]
  },
  "28": {
    "id": 28,
    "name": "Count Anagrams",
    "functionName": "countAnagrams",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "p",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int countAnagrams(string s, string p) {\n        \n    }\n};",
      "java": "class Solution {\n    public int countAnagrams(String s, String p) {\n        \n    }\n}",
      "python": "class Solution:\n    def countAnagrams(self, s: str, p: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} p\n * @return {number}\n */\nvar countAnagrams = function(s, p) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"cbaebabacd\", p = \"abc\"",
        "expected": "2"
      },
      {
        "input": "s = \"abab\", p = \"ab\"",
        "expected": "3"
      }
    ]
  },
  "29": {
    "id": 29,
    "name": "Minimum Window Substring",
    "functionName": "minWindow",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "t",
        "type": "string"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};",
      "java": "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
      "python": "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nvar minWindow = function(s, t) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"ADOBECODEBANC\", t = \"ABC\"",
        "expected": "\"BANC\""
      },
      {
        "input": "s = \"a\", t = \"a\"",
        "expected": "\"a\""
      }
    ]
  },
  "30": {
    "id": 30,
    "name": "Product of Array Except Self",
    "functionName": "productExceptSelf",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,4]",
        "expected": "[24,12,8,6]"
      },
      {
        "input": "nums = [-1,1,0,-3,3]",
        "expected": "[0,0,9,0,0]"
      }
    ]
  },
  "31": {
    "id": 31,
    "name": "Subarray Sum Equals K",
    "functionName": "subarraySum",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int subarraySum(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def subarraySum(self, nums: List[int], k: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar subarraySum = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,1,1], k = 2",
        "expected": "2"
      },
      {
        "input": "nums = [1,2,3], k = 3",
        "expected": "2"
      }
    ]
  },
  "32": {
    "id": 32,
    "name": "Running Sum of 1D Array",
    "functionName": "runningSum",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> runningSum(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] runningSum(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def runningSum(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar runningSum = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,4]",
        "expected": "[1,3,6,10]"
      },
      {
        "input": "nums = [1,1,1,1,1]",
        "expected": "[1,2,3,4,5]"
      }
    ]
  },
  "33": {
    "id": 33,
    "name": "Longest Subarray with Sum K",
    "functionName": "longestSubarrayWithSumK",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int longestSubarrayWithSumK(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int longestSubarrayWithSumK(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def longestSubarrayWithSumK(self, nums: List[int], k: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar longestSubarrayWithSumK = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [10,5,2,7,1,9], k = 15",
        "expected": "4"
      },
      {
        "input": "nums = [1,2,3], k = 3",
        "expected": "2"
      }
    ]
  },
  "34": {
    "id": 34,
    "name": "Equilibrium Index",
    "functionName": "findEquilibriumIndex",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findEquilibriumIndex(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findEquilibriumIndex(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findEquilibriumIndex(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findEquilibriumIndex = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-7,1,5,2,-4,3,0]",
        "expected": "3"
      },
      {
        "input": "nums = [1,2,3]",
        "expected": "-1"
      }
    ]
  },
  "35": {
    "id": 35,
    "name": "Range Sum Query",
    "functionName": "rangeSumQuery",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "left",
        "type": "int"
      },
      {
        "name": "right",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int rangeSumQuery(vector<int>& nums, int left, int right) {\n        // Build prefix sum and return sum in range\n        \n    }\n};",
      "java": "class Solution {\n    public int rangeSumQuery(int[] nums, int left, int right) {\n        \n    }\n}",
      "python": "class Solution:\n    def rangeSumQuery(self, nums: List[int], left: int, right: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} left\n * @param {number} right\n * @return {number}\n */\nvar rangeSumQuery = function(nums, left, right) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-2,0,3,-5,2,-1], left = 0, right = 2",
        "expected": "1"
      },
      {
        "input": "nums = [-2,0,3,-5,2,-1], left = 2, right = 5",
        "expected": "-1"
      }
    ]
  },
  "36": {
    "id": 36,
    "name": "Rotate Array",
    "functionName": "rotate",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void rotate(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public void rotate(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def rotate(self, nums: List[int], k: int) -> None:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar rotate = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,4,5,6,7], k = 3",
        "expected": "[5,6,7,1,2,3,4]"
      },
      {
        "input": "nums = [-1,-100,3,99], k = 2",
        "expected": "[3,99,-1,-100]"
      }
    ]
  },
  "37": {
    "id": 37,
    "name": "Leaders in an Array",
    "functionName": "findLeaders",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> findLeaders(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] findLeaders(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findLeaders(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar findLeaders = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [16,17,4,3,5,2]",
        "expected": "[17,5,2]"
      },
      {
        "input": "nums = [1,2,3,4]",
        "expected": "[4]"
      }
    ]
  },
  "38": {
    "id": 38,
    "name": "Maximum Subarray",
    "functionName": "maxSubArray",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        "expected": "6"
      },
      {
        "input": "nums = [1]",
        "expected": "1"
      }
    ]
  },
  "39": {
    "id": 39,
    "name": "Maximum Product Subarray",
    "functionName": "maxProduct",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxProduct(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxProduct(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxProduct = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,3,-2,4]",
        "expected": "6"
      },
      {
        "input": "nums = [-2,0,-1]",
        "expected": "0"
      }
    ]
  },
  "40": {
    "id": 40,
    "name": "Merge Intervals",
    "functionName": "merge",
    "parameters": [
      {
        "name": "intervals",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}"
    },
    "sampleTests": [
      {
        "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        "expected": "[[1,6],[8,10],[15,18]]"
      },
      {
        "input": "intervals = [[1,4],[4,5]]",
        "expected": "[[1,5]]"
      }
    ]
  },
  "41": {
    "id": 41,
    "name": "Find Minimum in Rotated Sorted Array",
    "functionName": "findMin",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,4,5,1,2]",
        "expected": "1"
      },
      {
        "input": "nums = [4,5,6,7,0,1,2]",
        "expected": "0"
      }
    ]
  },
  "42": {
    "id": 42,
    "name": "Valid Anagram",
    "functionName": "isAnagram",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "t",
        "type": "string"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}",
      "python": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"anagram\", t = \"nagaram\"",
        "expected": "true"
      },
      {
        "input": "s = \"rat\", t = \"car\"",
        "expected": "false"
      }
    ]
  },
  "43": {
    "id": 43,
    "name": "Group Anagrams",
    "functionName": "groupAnagrams",
    "parameters": [
      {
        "name": "strs",
        "type": "vector<string>"
      }
    ],
    "returnType": "count:vector<vector<string>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
      "python": "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ",
      "js": "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
        "expected": "3 groups"
      },
      {
        "input": "strs = [\"\"]",
        "expected": "1 group"
      }
    ]
  },
  "44": {
    "id": 44,
    "name": "First Unique Character in a String",
    "functionName": "firstUniqChar",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int firstUniqChar(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int firstUniqChar(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def firstUniqChar(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar firstUniqChar = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"leetcode\"",
        "expected": "0"
      },
      {
        "input": "s = \"loveleetcode\"",
        "expected": "2"
      }
    ]
  },
  "45": {
    "id": 45,
    "name": "Roman to Integer",
    "functionName": "romanToInt",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int romanToInt(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int romanToInt(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def romanToInt(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar romanToInt = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"III\"",
        "expected": "3"
      },
      {
        "input": "s = \"LVIII\"",
        "expected": "58"
      }
    ]
  },
  "46": {
    "id": 46,
    "name": "Character Frequency Count",
    "functionName": "charFrequency",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "c",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int charFrequency(string s, string c) {\n        \n    }\n};",
      "java": "class Solution {\n    public int charFrequency(String s, String c) {\n        \n    }\n}",
      "python": "class Solution:\n    def charFrequency(self, s: str, c: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} c\n * @return {number}\n */\nvar charFrequency = function(s, c) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"aababab\", c = \"a\"",
        "expected": "4"
      },
      {
        "input": "s = \"hello\", c = \"l\"",
        "expected": "2"
      }
    ]
  },
  "47": {
    "id": 47,
    "name": "Count Vowels and Consonants",
    "functionName": "countVowels",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int countVowels(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int countVowels(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def countVowels(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar countVowels = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"hello\"",
        "expected": "2"
      },
      {
        "input": "s = \"aeiou\"",
        "expected": "5"
      }
    ]
  },
  "48": {
    "id": 48,
    "name": "Valid Palindrome",
    "functionName": "isPalindrome",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        ",
      "js": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"A man a plan a canal Panama\"",
        "expected": "true"
      },
      {
        "input": "s = \"race a car\"",
        "expected": "false"
      }
    ]
  },
  "49": {
    "id": 49,
    "name": "Reverse String",
    "functionName": "reverseString",
    "parameters": [
      {
        "name": "s",
        "type": "vector<char>"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};",
      "java": "class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}"
    },
    "sampleTests": [
      {
        "input": "s = ['h','e','l','l','o']",
        "expected": "['o','l','l','e','h']"
      },
      {
        "input": "s = ['H','a','n','n','a','h']",
        "expected": "['h','a','n','n','a','H']"
      }
    ]
  },
  "50": {
    "id": 50,
    "name": "Reverse Words in a String",
    "functionName": "reverseWords",
    "parameters": [
      {
        "name": "s",
        "type": "string:line"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string reverseWords(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public String reverseWords(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def reverseWords(self, s: str) -> str:\n        ",
      "js": "/**\n * @param {string} s\n * @return {string}\n */\nvar reverseWords = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"the sky is blue\"",
        "expected": "\"blue is sky the\""
      },
      {
        "input": "s = \"  hello world  \"",
        "expected": "\"world hello\""
      }
    ]
  },
  "51": {
    "id": 51,
    "name": "String Compression",
    "functionName": "compress",
    "parameters": [
      {
        "name": "chars",
        "type": "vector<char>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int compress(vector<char>& chars) {\n        \n    }\n};",
      "java": "class Solution {\n    public int compress(char[] chars) {\n        \n    }\n}"
    },
    "sampleTests": [
      {
        "input": "chars = ['a','a','b','b','c','c','c']",
        "expected": "6"
      },
      {
        "input": "chars = ['a']",
        "expected": "1"
      }
    ]
  },
  "52": {
    "id": 52,
    "name": "Longest Substring Without Repeating Characters",
    "functionName": "lengthOfLongestSubstring",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"abcabcbb\"",
        "expected": "3"
      },
      {
        "input": "s = \"bbbbb\"",
        "expected": "1"
      }
    ]
  },
  "53": {
    "id": 53,
    "name": "Longest Repeating Character Replacement",
    "functionName": "characterReplacement",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int characterReplacement(String s, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @param {number} k\n * @return {number}\n */\nvar characterReplacement = function(s, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"ABAB\", k = 2",
        "expected": "4"
      },
      {
        "input": "s = \"AABABBA\", k = 1",
        "expected": "4"
      }
    ]
  },
  "54": {
    "id": 54,
    "name": "Find All Anagrams in String",
    "functionName": "findAnagrams",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "p",
        "type": "string"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> findAnagrams(string s, string p) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<Integer> findAnagrams(String s, String p) {\n        \n    }\n}",
      "python": "class Solution:\n    def findAnagrams(self, s: str, p: str) -> List[int]:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} p\n * @return {number[]}\n */\nvar findAnagrams = function(s, p) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"cbaebabacd\", p = \"abc\"",
        "expected": "[0,6]"
      },
      {
        "input": "s = \"abab\", p = \"ab\"",
        "expected": "[0,1,2]"
      }
    ]
  },
  "55": {
    "id": 55,
    "name": "Minimum Window Substring",
    "functionName": "minWindow",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "t",
        "type": "string"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};",
      "java": "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
      "python": "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nvar minWindow = function(s, t) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"ADOBECODEBANC\", t = \"ABC\"",
        "expected": "\"BANC\""
      },
      {
        "input": "s = \"a\", t = \"a\"",
        "expected": "\"a\""
      }
    ]
  },
  "56": {
    "id": 56,
    "name": "Longest Common Prefix",
    "functionName": "longestCommonPrefix",
    "parameters": [
      {
        "name": "strs",
        "type": "vector<string>"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        \n    }\n};",
      "java": "class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        \n    }\n}"
    },
    "sampleTests": [
      {
        "input": "strs = [\"flower\",\"flow\",\"flight\"]",
        "expected": "\"fl\""
      },
      {
        "input": "strs = [\"dog\",\"racecar\",\"car\"]",
        "expected": "\"\""
      }
    ]
  },
  "57": {
    "id": 57,
    "name": "Check String Rotation",
    "functionName": "rotateString",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "goal",
        "type": "string"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool rotateString(string s, string goal) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean rotateString(String s, String goal) {\n        \n    }\n}",
      "python": "class Solution:\n    def rotateString(self, s: str, goal: str) -> bool:\n        ",
      "js": "/**\n * @param {string} s\n * @param {string} goal\n * @return {boolean}\n */\nvar rotateString = function(s, goal) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"abcde\", goal = \"cdeab\"",
        "expected": "true"
      },
      {
        "input": "s = \"abcde\", goal = \"abced\"",
        "expected": "false"
      }
    ]
  },
  "58": {
    "id": 58,
    "name": "Encode and Decode Strings",
    "functionName": "encode",
    "parameters": [
      {
        "name": "strs",
        "type": "vector<string>"
      }
    ],
    "returnType": "design:Codec",
    "starterCode": {
      "cpp": "class Codec {\npublic:\n    string encode(vector<string>& strs) {\n        \n    }\n    vector<string> decode(string s) {\n        \n    }\n};",
      "java": "public class Codec {\n    public String encode(List<String> strs) {\n        \n    }\n    public List<String> decode(String s) {\n        \n    }\n}"
    },
    "sampleTests": [
      {
        "input": "strs = [\"Hello\",\"World\"]",
        "expected": "2"
      },
      {
        "input": "strs = [\"\"]",
        "expected": "1"
      }
    ]
  },
  "59": {
    "id": 59,
    "name": "Longest Palindromic Substring",
    "compareMode": "any_of",
    "functionName": "longestPalindrome",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string longestPalindrome(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public String longestPalindrome(String s) {\n        \n    }\n}"
    },
    "sampleTests": [
      {
        "input": "s = \"babad\"",
        "expected": "\"bab\" or \"aba\""
      },
      {
        "input": "s = \"cbbd\"",
        "expected": "\"bb\""
      }
    ]
  },
  "60": {
    "id": 60,
    "name": "Palindromic Substrings",
    "functionName": "countSubstrings",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int countSubstrings(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int countSubstrings(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def countSubstrings(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar countSubstrings = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"abc\"",
        "expected": "3"
      },
      {
        "input": "s = \"aaa\"",
        "expected": "6"
      }
    ]
  },
  "61": {
    "id": 61,
    "name": "Linked List Cycle",
    "functionName": "hasCycle",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*:cycle"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "head = [3,2,0,-4], pos = 1",
        "expected": "true"
      },
      {
        "input": "head = [1,2], pos = 0",
        "expected": "true"
      }
    ]
  },
  "62": {
    "id": 62,
    "name": "Middle of Linked List",
    "functionName": "middleNode",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*"
      }
    ],
    "returnType": "ListNode*->val",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* middleNode(ListNode* head) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode middleNode(ListNode head) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar middleNode = function(head) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "head = [1,2,3,4,5]",
        "expected": "3"
      },
      {
        "input": "head = [1,2,3,4,5,6]",
        "expected": "4"
      }
    ]
  },
  "63": {
    "id": 63,
    "name": "Palindrome Linked List",
    "functionName": "isPalindrome",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    bool isPalindrome(ListNode* head) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public boolean isPalindrome(ListNode head) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def isPalindrome(self, head: Optional[ListNode]) -> bool:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {boolean}\n */\nvar isPalindrome = function(head) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "head = [1,2,2,1]",
        "expected": "true"
      },
      {
        "input": "head = [1,2]",
        "expected": "false"
      }
    ]
  },
  "64": {
    "id": 64,
    "name": "Detect Cycle Start in Linked List",
    "functionName": "detectCycle",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*:cycle"
      }
    ],
    "returnType": "ListNode*->val",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode *detectCycle(ListNode *head) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "head = [3,2,0,-4], pos = 1",
        "expected": "2"
      },
      {
        "input": "head = [1,2], pos = 0",
        "expected": "1"
      }
    ]
  },
  "65": {
    "id": 65,
    "name": "Reverse Linked List",
    "functionName": "reverseList",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*"
      }
    ],
    "returnType": "ListNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "head = [1,2,3,4,5]",
        "expected": "[5,4,3,2,1]"
      },
      {
        "input": "head = [1,2]",
        "expected": "[2,1]"
      }
    ]
  },
  "66": {
    "id": 66,
    "name": "Reverse Linked List in Groups",
    "functionName": "reverseKGroup",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "ListNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseKGroup(ListNode* head, int k) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseKGroup(ListNode head, int k) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @param {number} k\n * @return {ListNode}\n */\nvar reverseKGroup = function(head, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "head = [1,2,3,4,5], k = 2",
        "expected": "[2,1,4,3,5]"
      },
      {
        "input": "head = [1,2,3,4,5], k = 3",
        "expected": "[3,2,1,4,5]"
      }
    ]
  },
  "67": {
    "id": 67,
    "name": "Merge Two Sorted Lists",
    "functionName": "mergeTwoLists",
    "parameters": [
      {
        "name": "list1",
        "type": "ListNode*"
      },
      {
        "name": "list2",
        "type": "ListNode*"
      }
    ],
    "returnType": "ListNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "list1 = [1,2,4], list2 = [1,3,4]",
        "expected": "[1,1,2,3,4,4]"
      },
      {
        "input": "list1 = [], list2 = []",
        "expected": "[]"
      }
    ]
  },
  "68": {
    "id": 68,
    "name": "Remove Nth Node From End of List",
    "functionName": "removeNthFromEnd",
    "parameters": [
      {
        "name": "head",
        "type": "ListNode*"
      },
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "ListNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* removeNthFromEnd(ListNode* head, int n) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @param {number} n\n * @return {ListNode}\n */\nvar removeNthFromEnd = function(head, n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "head = [1,2,3,4,5], n = 2",
        "expected": "[1,2,3,5]"
      },
      {
        "input": "head = [1], n = 1",
        "expected": "[]"
      }
    ]
  },
  "69": {
    "id": 69,
    "name": "Add Two Numbers",
    "functionName": "addTwoNumbers",
    "parameters": [
      {
        "name": "l1",
        "type": "ListNode*"
      },
      {
        "name": "l2",
        "type": "ListNode*"
      }
    ],
    "returnType": "ListNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} l1\n * @param {ListNode} l2\n * @return {ListNode}\n */\nvar addTwoNumbers = function(l1, l2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "l1 = [2,4,3], l2 = [5,6,4]",
        "expected": "[7,0,8]"
      },
      {
        "input": "l1 = [0], l2 = [0]",
        "expected": "[0]"
      }
    ]
  },
  "70": {
    "id": 70,
    "name": "Intersection of Two Linked Lists",
    "functionName": "getIntersectionNode",
    "parameters": [
      {
        "name": "headA",
        "type": "ListNode*:intersectA"
      },
      {
        "name": "headB",
        "type": "ListNode*:intersectB"
      }
    ],
    "returnType": "ListNode*->val",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {\n        \n    }\n};",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\npublic class Solution {\n    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {\n        \n    }\n}",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def getIntersectionNode(self, headA: ListNode, headB: ListNode) -> Optional[ListNode]:\n        ",
      "js": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} headA\n * @param {ListNode} headB\n * @return {ListNode}\n */\nvar getIntersectionNode = function(headA, headB) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "listA=[4,1,8,4,5], listB=[5,6,1,8,4,5], skipA=2, skipB=3",
        "expected": "8"
      },
      {
        "input": "listA=[1,9,1,2,4], listB=[3,2,4], skipA=3, skipB=1",
        "expected": "2"
      }
    ]
  },
  "71": {
    "id": 71,
    "name": "Find The Duplicate Number",
    "functionName": "findDuplicate",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findDuplicate(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findDuplicate(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findDuplicate = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,3,4,2,2]",
        "expected": "2"
      },
      {
        "input": "nums = [3,1,3,4,2]",
        "expected": "3"
      }
    ]
  },
  "72": {
    "id": 72,
    "name": "Valid Parentheses",
    "functionName": "isValid",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        ",
      "js": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"()\"",
        "expected": "true"
      },
      {
        "input": "s = \"()[]{\"",
        "expected": "true"
      }
    ]
  },
  "73": {
    "id": 73,
    "name": "Min Stack",
    "functionName": "getMin",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "design:MinStack",
    "starterCode": {
      "cpp": "class MinStack {\npublic:\n    MinStack() {}\n    void push(int val) {}\n    void pop() {}\n    int top() {}\n    int getMin() {}\n};",
      "java": "class MinStack {\n    public MinStack() {}\n    public void push(int val) {}\n    public void pop() {}\n    public int top() {}\n    public int getMin() {}\n}",
      "python": "class MinStack:\n    def __init__(self):\n        pass\n    def push(self, val: int) -> None:\n        pass\n    def pop(self) -> None:\n        pass\n    def top(self) -> int:\n        pass\n    def getMin(self) -> int:\n        pass",
      "js": "class MinStack {\n    constructor() {}\n    push(val) {}\n    pop() {}\n    top() {}\n    getMin() {}\n}"
    },
    "sampleTests": [
      {
        "input": "push(-2),push(0),push(-3),getMin()",
        "expected": "-3"
      },
      {
        "input": "push(1),getMin()",
        "expected": "1"
      }
    ]
  },
  "74": {
    "id": 74,
    "name": "Implement Queue Using Stacks",
    "functionName": "peek",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "design:MyQueue",
    "starterCode": {
      "cpp": "class MyQueue {\npublic:\n    MyQueue() {}\n    void push(int x) {}\n    int pop() {}\n    int peek() {}\n    bool empty() {}\n};",
      "java": "class MyQueue {\n    public MyQueue() {}\n    public void push(int x) {}\n    public int pop() { return 0; }\n    public int peek() { return 0; }\n    public boolean empty() { return true; }\n}",
      "python": "class MyQueue:\n    def __init__(self):\n        pass\n    def push(self, x: int) -> None:\n        pass\n    def pop(self) -> int:\n        pass\n    def peek(self) -> int:\n        pass\n    def empty(self) -> bool:\n        pass",
      "js": "class MyQueue {\n    constructor() {}\n    push(x) {}\n    pop() {}\n    peek() {}\n    empty() {}\n}"
    },
    "sampleTests": [
      {
        "input": "push(1),push(2),peek()",
        "expected": "1"
      },
      {
        "input": "push(1),peek()",
        "expected": "1"
      }
    ]
  },
  "75": {
    "id": 75,
    "name": "Daily Temperatures",
    "functionName": "dailyTemperatures",
    "parameters": [
      {
        "name": "temperatures",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        \n    }\n}",
      "python": "class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} temperatures\n * @return {number[]}\n */\nvar dailyTemperatures = function(temperatures) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "temperatures = [73,74,75,71,69,72,76,73]",
        "expected": "[1,1,4,2,1,1,0,0]"
      },
      {
        "input": "temperatures = [30,40,50,60]",
        "expected": "[1,1,1,0]"
      }
    ]
  },
  "76": {
    "id": 76,
    "name": "Largest Rectangle in Histogram",
    "functionName": "largestRectangleArea",
    "parameters": [
      {
        "name": "heights",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        \n    }\n};",
      "java": "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        \n    }\n}",
      "python": "class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} heights\n * @return {number}\n */\nvar largestRectangleArea = function(heights) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "heights = [2,1,5,6,2,3]",
        "expected": "10"
      },
      {
        "input": "heights = [2,4]",
        "expected": "4"
      }
    ]
  },
  "77": {
    "id": 77,
    "name": "Next Greater Element",
    "functionName": "nextGreaterElement",
    "parameters": [
      {
        "name": "nums1",
        "type": "vector<int>"
      },
      {
        "name": "nums2",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] nextGreaterElement(int[] nums1, int[] nums2) {\n        \n    }\n}",
      "python": "class Solution:\n    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number[]}\n */\nvar nextGreaterElement = function(nums1, nums2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums1 = [4,1,2], nums2 = [1,3,4,2]",
        "expected": "[-1,3,-1]"
      },
      {
        "input": "nums1 = [2,4], nums2 = [1,2,3,4]",
        "expected": "[3,-1]"
      }
    ]
  },
  "78": {
    "id": 78,
    "name": "Stock Span Problem",
    "functionName": "stockSpan",
    "parameters": [
      {
        "name": "prices",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> stockSpan(vector<int>& prices) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] stockSpan(int[] prices) {\n        \n    }\n}",
      "python": "class Solution:\n    def stockSpan(self, prices: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} prices\n * @return {number[]}\n */\nvar stockSpan = function(prices) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "prices = [100,80,60,70,60,75,85]",
        "expected": "[1,1,1,2,1,4,6]"
      },
      {
        "input": "prices = [10,4,5,90,120,80]",
        "expected": "[1,1,2,4,5,1]"
      }
    ]
  },
  "79": {
    "id": 79,
    "name": "Sliding Window Maximum",
    "functionName": "maxSlidingWindow",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar maxSlidingWindow = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        "expected": "[3,3,5,5,6,7]"
      },
      {
        "input": "nums = [1], k = 1",
        "expected": "[1]"
      }
    ]
  },
  "80": {
    "id": 80,
    "name": "Design Circular Queue",
    "functionName": "Rear",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "design:MyCircularQueue",
    "starterCode": {
      "cpp": "class MyCircularQueue {\npublic:\n    MyCircularQueue(int k) {}\n    bool enQueue(int value) {}\n    bool deQueue() {}\n    int Front() {}\n    int Rear() {}\n    bool isEmpty() {}\n    bool isFull() {}\n};",
      "java": "class MyCircularQueue {\n    public MyCircularQueue(int k) {}\n    public boolean enQueue(int value) { return false; }\n    public boolean deQueue() { return false; }\n    public int Front() { return -1; }\n    public int Rear() { return -1; }\n    public boolean isEmpty() { return true; }\n    public boolean isFull() { return false; }\n}",
      "python": "class MyCircularQueue:\n    def __init__(self, k: int):\n        pass\n    def enQueue(self, value: int) -> bool:\n        pass\n    def deQueue(self) -> bool:\n        pass\n    def Front(self) -> int:\n        pass\n    def Rear(self) -> int:\n        pass\n    def isEmpty(self) -> bool:\n        pass\n    def isFull(self) -> bool:\n        pass",
      "js": "class MyCircularQueue {\n    constructor(k) {}\n    enQueue(value) {}\n    deQueue() {}\n    Front() {}\n    Rear() {}\n    isEmpty() {}\n    isFull() {}\n}"
    },
    "sampleTests": [
      {
        "input": "k=3, enQueue(1),enQueue(2),enQueue(3),Rear()",
        "expected": "3"
      },
      {
        "input": "k=6, enQueue(6),Rear()",
        "expected": "6"
      }
    ]
  },
  "81": {
    "id": 81,
    "name": "First Non-Repeating Character in Stream",
    "functionName": "firstNonRepeating",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string firstNonRepeating(string stream) {\n        \n    }\n};",
      "java": "class Solution {\n    public String firstNonRepeating(String stream) {\n        \n    }\n}",
      "python": "class Solution:\n    def firstNonRepeating(self, stream: str) -> str:\n        ",
      "js": "/**\n * @param {string} stream\n * @return {string}\n */\nvar firstNonRepeating = function(stream) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "stream = \"aabc\"",
        "expected": "\"a#bb\""
      },
      {
        "input": "stream = \"abcabc\"",
        "expected": "\"aaabc#\""
      }
    ]
  },
  "82": {
    "id": 82,
    "name": "Maximum Depth of Binary Tree",
    "functionName": "maxDepth",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "expected": "3"
      },
      {
        "input": "root = [1,null,2]",
        "expected": "2"
      }
    ]
  },
  "83": {
    "id": 83,
    "name": "Invert Binary Tree",
    "functionName": "invertTree",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "TreeNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public TreeNode invertTree(TreeNode root) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [4,2,7,1,3,6,9]",
        "expected": "[4,7,2,9,6,3,1]"
      },
      {
        "input": "root = [2,1,3]",
        "expected": "[2,3,1]"
      }
    ]
  },
  "84": {
    "id": 84,
    "name": "Diameter of Binary Tree",
    "functionName": "diameterOfBinaryTree",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int diameterOfBinaryTree(TreeNode* root) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int diameterOfBinaryTree(TreeNode root) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar diameterOfBinaryTree = function(root) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [1,2,3,4,5]",
        "expected": "3"
      },
      {
        "input": "root = [1,2]",
        "expected": "1"
      }
    ]
  },
  "85": {
    "id": 85,
    "name": "Balanced Binary Tree",
    "functionName": "isBalanced",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    bool isBalanced(TreeNode* root) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public boolean isBalanced(TreeNode root) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isBalanced(self, root: Optional[TreeNode]) -> bool:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isBalanced = function(root) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "expected": "true"
      },
      {
        "input": "root = [1,2,2,3,3,null,null,4,4]",
        "expected": "false"
      }
    ]
  },
  "86": {
    "id": 86,
    "name": "Path Sum",
    "functionName": "hasPathSum",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      },
      {
        "name": "targetSum",
        "type": "int"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    bool hasPathSum(TreeNode* root, int targetSum) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public boolean hasPathSum(TreeNode root, int targetSum) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @param {number} targetSum\n * @return {boolean}\n */\nvar hasPathSum = function(root, targetSum) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22",
        "expected": "true"
      },
      {
        "input": "root = [1,2,3], targetSum = 5",
        "expected": "false"
      }
    ]
  },
  "87": {
    "id": 87,
    "name": "Construct Binary Tree from Preorder and Inorder",
    "functionName": "buildTree",
    "parameters": [
      {
        "name": "preorder",
        "type": "vector<int>"
      },
      {
        "name": "inorder",
        "type": "vector<int>"
      }
    ],
    "returnType": "TreeNode*:raw",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public TreeNode buildTree(int[] preorder, int[] inorder) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {number[]} preorder\n * @param {number[]} inorder\n * @return {TreeNode}\n */\nvar buildTree = function(preorder, inorder) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",
        "expected": "[3,9,20,null,null,15,7]"
      },
      {
        "input": "preorder = [-1], inorder = [-1]",
        "expected": "[-1]"
      }
    ]
  },
  "88": {
    "id": 88,
    "name": "LCA of Binary Tree",
    "functionName": "lowestCommonAncestor",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      },
      {
        "name": "p",
        "type": "TreeNode*->val"
      },
      {
        "name": "q",
        "type": "TreeNode*->val"
      }
    ],
    "returnType": "TreeNode*->val",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root=[3,5,1,6,2,0,8,null,null,7,4], p=5, q=1",
        "expected": "3"
      },
      {
        "input": "root=[3,5,1,6,2,0,8,null,null,7,4], p=5, q=4",
        "expected": "5"
      }
    ]
  },
  "89": {
    "id": 89,
    "name": "Validate Binary Search Tree",
    "functionName": "isValidBST",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public boolean isValidBST(TreeNode root) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isValidBST = function(root) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [2,1,3]",
        "expected": "true"
      },
      {
        "input": "root = [5,1,4,null,null,3,6]",
        "expected": "false"
      }
    ]
  },
  "90": {
    "id": 90,
    "name": "Lowest Common Ancestor of BST",
    "functionName": "lowestCommonAncestor",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      },
      {
        "name": "p",
        "type": "TreeNode*->val"
      },
      {
        "name": "q",
        "type": "TreeNode*->val"
      }
    ],
    "returnType": "TreeNode*->val",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root=[6,2,8,0,4,7,9,null,null,3,5], p=2, q=8",
        "expected": "6"
      },
      {
        "input": "root=[6,2,8,0,4,7,9,null,null,3,5], p=2, q=4",
        "expected": "2"
      }
    ]
  },
  "91": {
    "id": 91,
    "name": "Kth Smallest in BST",
    "functionName": "kthSmallest",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int kthSmallest(TreeNode* root, int k) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int kthSmallest(TreeNode root, int k) {\n        \n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:\n        ",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @param {number} k\n * @return {number}\n */\nvar kthSmallest = function(root, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [3,1,4,null,2], k = 1",
        "expected": "1"
      },
      {
        "input": "root = [5,3,6,2,4,null,null,1], k = 3",
        "expected": "3"
      }
    ]
  },
  "92": {
    "id": 92,
    "name": "Search in a BST",
    "functionName": "searchBST",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      },
      {
        "name": "val",
        "type": "int"
      }
    ],
    "returnType": "TreeNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* searchBST(TreeNode* root, int val) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root = [4,2,7,1,3], val = 2",
        "expected": "[2,1,3]"
      },
      {
        "input": "root = [4,2,7,1,3], val = 5",
        "expected": "[]"
      }
    ]
  },
  "93": {
    "id": 93,
    "name": "Insert into a BST",
    "functionName": "insertIntoBST",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      },
      {
        "name": "val",
        "type": "int"
      }
    ],
    "returnType": "count:TreeNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    TreeNode* insertIntoBST(TreeNode* root, int val) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root = [4,2,7,1,3], val = 5",
        "expected": "6 nodes"
      },
      {
        "input": "root = [40,20,60,10,30,50,70], val = 25",
        "expected": "8 nodes"
      }
    ]
  },
  "94": {
    "id": 94,
    "name": "Level Order Traversal",
    "functionName": "levelOrder",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "expected": "[[3],[9,20],[15,7]]"
      },
      {
        "input": "root = [1]",
        "expected": "[[1]]"
      }
    ]
  },
  "95": {
    "id": 95,
    "name": "Right Side View of Binary Tree",
    "functionName": "rightSideView",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    vector<int> rightSideView(TreeNode* root) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root = [1,2,3,null,5,null,4]",
        "expected": "[1,3,4]"
      },
      {
        "input": "root = [1,null,3]",
        "expected": "[1,3]"
      }
    ]
  },
  "96": {
    "id": 96,
    "name": "Binary Tree Zigzag Level Order Traversal",
    "functionName": "zigzagLevelOrder",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "expected": "[[3],[20,9],[15,7]]"
      },
      {
        "input": "root = [1]",
        "expected": "[[1]]"
      }
    ]
  },
  "97": {
    "id": 97,
    "name": "Serialize and Deserialize Binary Tree",
    "functionName": "serialize",
    "parameters": [
      {
        "name": "root",
        "type": "TreeNode*"
      }
    ],
    "returnType": "design:CodecTree",
    "starterCode": {
      "cpp": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Codec {\npublic:\n    string serialize(TreeNode* root) {\n        \n    }\n    TreeNode* deserialize(string data) {\n        \n    }\n};",
      "java": "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\npublic class Codec {\n    public String serialize(TreeNode root) {\n        return \"\";\n    }\n    public TreeNode deserialize(String data) {\n        return null;\n    }\n}",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Codec:\n    def serialize(self, root: Optional[TreeNode]) -> str:\n        pass\n    def deserialize(self, data: str) -> Optional[TreeNode]:\n        pass",
      "js": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\nvar serialize = function(root) {\n    \n};\nvar deserialize = function(data) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "root = [1,2,3,null,null,4,5]",
        "expected": "5 nodes"
      },
      {
        "input": "root = []",
        "expected": "0 nodes"
      }
    ]
  },
  "98": {
    "id": 98,
    "name": "Bubble Sort",
    "functionName": "bubbleSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> bubbleSort(vector<int>& nums) {\n        int n = nums.size();\n        for (int i = 0; i < n - 1; i++)\n            for (int j = 0; j < n - i - 1; j++)\n                if (nums[j] > nums[j+1])\n                    swap(nums[j], nums[j+1]);\n        return nums;\n    }\n};",
      "java": "class Solution {\n    public int[] bubbleSort(int[] nums) {\n        int n = nums.length;\n        for (int i = 0; i < n - 1; i++)\n            for (int j = 0; j < n - i - 1; j++)\n                if (nums[j] > nums[j+1]) {\n                    int tmp = nums[j]; nums[j] = nums[j+1]; nums[j+1] = tmp;\n                }\n        return nums;\n    }\n}",
      "python": "class Solution:\n    def bubbleSort(self, nums: List[int]) -> List[int]:\n        n = len(nums)\n        for i in range(n - 1):\n            for j in range(n - i - 1):\n                if nums[j] > nums[j+1]:\n                    nums[j], nums[j+1] = nums[j+1], nums[j]\n        return nums",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar bubbleSort = function(nums) {\n    const n = nums.length;\n    for (let i = 0; i < n - 1; i++)\n        for (let j = 0; j < n - i - 1; j++)\n            if (nums[j] > nums[j+1])\n                [nums[j], nums[j+1]] = [nums[j+1], nums[j]];\n    return nums;\n};"
    },
    "sampleTests": [
      {
        "input": "nums = [64,34,25,12,22,11,90]",
        "expected": "[11,12,22,25,34,64,90]"
      },
      {
        "input": "nums = [5,1,4,2,8]",
        "expected": "[1,2,4,5,8]"
      }
    ]
  },
  "99": {
    "id": 99,
    "name": "Selection Sort",
    "functionName": "selectionSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> selectionSort(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] selectionSort(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def selectionSort(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar selectionSort = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [64,25,12,22,11]",
        "expected": "[11,12,22,25,64]"
      },
      {
        "input": "nums = [3,2,1]",
        "expected": "[1,2,3]"
      }
    ]
  },
  "100": {
    "id": 100,
    "name": "Insertion Sort",
    "functionName": "insertionSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> insertionSort(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] insertionSort(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def insertionSort(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar insertionSort = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [12,11,13,5,6]",
        "expected": "[5,6,11,12,13]"
      },
      {
        "input": "nums = [5,2,4,6,1,3]",
        "expected": "[1,2,3,4,5,6]"
      }
    ]
  },
  "101": {
    "id": 101,
    "name": "Merge Sort",
    "functionName": "mergeSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> mergeSort(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] mergeSort(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def mergeSort(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar mergeSort = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [38,27,43,3,9,82,10]",
        "expected": "[3,9,10,27,38,43,82]"
      },
      {
        "input": "nums = [5,2,4,6,1,3]",
        "expected": "[1,2,3,4,5,6]"
      }
    ]
  },
  "102": {
    "id": 102,
    "name": "Quick Sort",
    "functionName": "quickSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> quickSort(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] quickSort(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def quickSort(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar quickSort = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,6,8,10,1,2,1]",
        "expected": "[1,1,2,3,6,8,10]"
      },
      {
        "input": "nums = [5,2,4,6,1,3]",
        "expected": "[1,2,3,4,5,6]"
      }
    ]
  },
  "103": {
    "id": 103,
    "name": "Counting Sort",
    "functionName": "countingSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> countingSort(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] countingSort(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def countingSort(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar countingSort = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [4,2,2,8,3,3,1]",
        "expected": "[1,2,2,3,3,4,8]"
      },
      {
        "input": "nums = [2,0,2,1,1,0]",
        "expected": "[0,0,1,1,2,2]"
      }
    ]
  },
  "104": {
    "id": 104,
    "name": "Radix Sort",
    "functionName": "radixSort",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> radixSort(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] radixSort(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def radixSort(self, nums: List[int]) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar radixSort = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [170,45,75,90,802,24,2,66]",
        "expected": "[2,24,45,66,75,90,170,802]"
      },
      {
        "input": "nums = [3,6,8,10,1,2]",
        "expected": "[1,2,3,6,8,10]"
      }
    ]
  },
  "105": {
    "id": 105,
    "name": "Merge Intervals",
    "functionName": "merge",
    "parameters": [
      {
        "name": "intervals",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        "expected": "[[1,6],[8,10],[15,18]]"
      },
      {
        "input": "intervals = [[1,4],[4,5]]",
        "expected": "[[1,5]]"
      }
    ]
  },
  "106": {
    "id": 106,
    "name": "Sort Colors",
    "functionName": "sortColors",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void sortColors(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public void sortColors(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar sortColors = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,0,2,1,1,0]",
        "expected": "[0,0,1,1,2,2]"
      },
      {
        "input": "nums = [2,0,1]",
        "expected": "[0,1,2]"
      }
    ]
  },
  "107": {
    "id": 107,
    "name": "Kth Largest Element in Array",
    "functionName": "findKthLargest",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar findKthLargest = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,2,1,5,6,4], k = 2",
        "expected": "5"
      },
      {
        "input": "nums = [3,2,3,1,2,4,5,5,6], k = 4",
        "expected": "4"
      }
    ]
  },
  "108": {
    "id": 108,
    "name": "Binary Search",
    "functionName": "search",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-1,0,3,5,9,12], target = 9",
        "expected": "4"
      },
      {
        "input": "nums = [-1,0,3,5,9,12], target = 2",
        "expected": "-1"
      }
    ]
  },
  "109": {
    "id": 109,
    "name": "Search in Rotated Sorted Array",
    "functionName": "search",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [4,5,6,7,0,1,2], target = 0",
        "expected": "4"
      },
      {
        "input": "nums = [4,5,6,7,0,1,2], target = 3",
        "expected": "-1"
      }
    ]
  },
  "110": {
    "id": 110,
    "name": "Find Peak Element",
    "functionName": "findPeakElement",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findPeakElement(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findPeakElement(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findPeakElement(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findPeakElement = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,1]",
        "expected": "2"
      },
      {
        "input": "nums = [1,2,1,3,5,6,4]",
        "expected": "5"
      }
    ]
  },
  "111": {
    "id": 111,
    "name": "Search Insert Position",
    "functionName": "searchInsert",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int searchInsert(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public int searchInsert(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def searchInsert(self, nums: List[int], target: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar searchInsert = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,3,5,6], target = 5",
        "expected": "2"
      },
      {
        "input": "nums = [1,3,5,6], target = 2",
        "expected": "1"
      }
    ]
  },
  "112": {
    "id": 112,
    "name": "First and Last Position of Element",
    "functionName": "searchRange",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> searchRange(vector<int>& nums, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] searchRange(int[] nums, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def searchRange(self, nums: List[int], target: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar searchRange = function(nums, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [5,7,7,8,8,10], target = 8",
        "expected": "[3,4]"
      },
      {
        "input": "nums = [5,7,7,8,8,10], target = 6",
        "expected": "[-1,-1]"
      }
    ]
  },
  "113": {
    "id": 113,
    "name": "Square Root using Binary Search",
    "functionName": "mySqrt",
    "parameters": [
      {
        "name": "x",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int mySqrt(int x) {\n        \n    }\n};",
      "java": "class Solution {\n    public int mySqrt(int x) {\n        \n    }\n}",
      "python": "class Solution:\n    def mySqrt(self, x: int) -> int:\n        ",
      "js": "/**\n * @param {number} x\n * @return {number}\n */\nvar mySqrt = function(x) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "x = 4",
        "expected": "2"
      },
      {
        "input": "x = 8",
        "expected": "2"
      }
    ]
  },
  "114": {
    "id": 114,
    "name": "Koko Eating Bananas",
    "functionName": "minEatingSpeed",
    "parameters": [
      {
        "name": "piles",
        "type": "vector<int>"
      },
      {
        "name": "h",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int minEatingSpeed(vector<int>& piles, int h) {\n        \n    }\n};",
      "java": "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        \n    }\n}",
      "python": "class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} piles\n * @param {number} h\n * @return {number}\n */\nvar minEatingSpeed = function(piles, h) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "piles = [3,6,7,11], h = 8",
        "expected": "4"
      },
      {
        "input": "piles = [30,11,23,4,20], h = 5",
        "expected": "30"
      }
    ]
  },
  "115": {
    "id": 115,
    "name": "Find Minimum in Rotated Sorted Array",
    "functionName": "findMin",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,4,5,1,2]",
        "expected": "1"
      },
      {
        "input": "nums = [4,5,6,7,0,1,2]",
        "expected": "0"
      }
    ]
  },
  "116": {
    "id": 116,
    "name": "Search a 2D Matrix",
    "functionName": "searchMatrix",
    "parameters": [
      {
        "name": "matrix",
        "type": "vector<vector<int>>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool searchMatrix(vector<vector<int>>& matrix, int target) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
        "expected": "true"
      },
      {
        "input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13",
        "expected": "false"
      }
    ]
  },
  "117": {
    "id": 117,
    "name": "Jump Game",
    "functionName": "canJump",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canJump = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,3,1,1,4]",
        "expected": "true"
      },
      {
        "input": "nums = [3,2,1,0,4]",
        "expected": "false"
      }
    ]
  },
  "118": {
    "id": 118,
    "name": "Jump Game II",
    "functionName": "jump",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int jump(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int jump(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def jump(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar jump = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,3,1,1,4]",
        "expected": "2"
      },
      {
        "input": "nums = [2,3,0,1,4]",
        "expected": "2"
      }
    ]
  },
  "119": {
    "id": 119,
    "name": "Gas Station",
    "functionName": "canCompleteCircuit",
    "parameters": [
      {
        "name": "gas",
        "type": "vector<int>"
      },
      {
        "name": "cost",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n        \n    }\n};",
      "java": "class Solution {\n    public int canCompleteCircuit(int[] gas, int[] cost) {\n        \n    }\n}",
      "python": "class Solution:\n    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} gas\n * @param {number[]} cost\n * @return {number}\n */\nvar canCompleteCircuit = function(gas, cost) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "gas=[1,2,3,4,5], cost=[3,4,5,1,2]",
        "expected": "3"
      },
      {
        "input": "gas=[2,3,4], cost=[3,4,3]",
        "expected": "-1"
      }
    ]
  },
  "120": {
    "id": 120,
    "name": "Max Profit II (Multiple Transactions)",
    "functionName": "maxProfit",
    "parameters": [
      {
        "name": "prices",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "prices = [7,1,5,3,6,4]",
        "expected": "7"
      },
      {
        "input": "prices = [1,2,3,4,5]",
        "expected": "4"
      }
    ]
  },
  "121": {
    "id": 121,
    "name": "Assign Cookies",
    "functionName": "findContentChildren",
    "parameters": [
      {
        "name": "g",
        "type": "vector<int>"
      },
      {
        "name": "s",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findContentChildren(vector<int>& g, vector<int>& s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findContentChildren(int[] g, int[] s) {\n        \n    }\n}",
      "python": "class Solution:\n    def findContentChildren(self, g: List[int], s: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} g\n * @param {number[]} s\n * @return {number}\n */\nvar findContentChildren = function(g, s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "g = [1,2,3], s = [1,1]",
        "expected": "1"
      },
      {
        "input": "g = [1,2], s = [1,2,3]",
        "expected": "2"
      }
    ]
  },
  "122": {
    "id": 122,
    "name": "Non-Overlapping Intervals",
    "functionName": "eraseOverlapIntervals",
    "parameters": [
      {
        "name": "intervals",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "intervals = [[1,2],[2,3],[3,4],[1,3]]",
        "expected": "1"
      },
      {
        "input": "intervals = [[1,2],[1,2],[1,2]]",
        "expected": "2"
      }
    ]
  },
  "123": {
    "id": 123,
    "name": "Activity Selection Problem",
    "functionName": "activitySelection",
    "parameters": [
      {
        "name": "start",
        "type": "vector<int>"
      },
      {
        "name": "end",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int activitySelection(vector<int>& start, vector<int>& end) {\n        int n = (int)start.size();\n        // sort activities by end time\n        vector<int> idx(n);\n        iota(idx.begin(), idx.end(), 0);\n        sort(idx.begin(), idx.end(), [&](int a, int b){ return end[a] < end[b]; });\n        int count = 1, last = idx[0];\n        for (int i = 1; i < n; i++) {\n            if (start[idx[i]] >= end[last]) { count++; last = idx[i]; }\n        }\n        return count;\n    }\n};"
    },
    "sampleTests": [
      {
        "input": "start=[1,3,0,5,8,5], end=[2,4,6,7,9,9]",
        "expected": "4"
      },
      {
        "input": "start=[1,2,3], end=[3,4,5]",
        "expected": "2"
      }
    ]
  },
  "124": {
    "id": 124,
    "name": "Job Sequencing Problem",
    "functionName": "jobSequencing",
    "parameters": [
      {
        "name": "deadlines",
        "type": "vector<int>"
      },
      {
        "name": "profits",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    // deadlines[i] = deadline of job i, profits[i] = profit of job i\n    int jobSequencing(vector<int>& deadlines, vector<int>& profits) {\n        int n = (int)deadlines.size();\n        int maxD = *max_element(deadlines.begin(), deadlines.end());\n        vector<int> slot(maxD + 1, -1);\n        // sort jobs by profit descending\n        vector<int> order(n);\n        iota(order.begin(), order.end(), 0);\n        sort(order.begin(), order.end(), [&](int a, int b){ return profits[a] > profits[b]; });\n        int total = 0;\n        for (int i : order) {\n            for (int t = min(deadlines[i], maxD); t >= 1; t--) {\n                if (slot[t] == -1) { slot[t] = i; total += profits[i]; break; }\n            }\n        }\n        return total;\n    }\n};",
      "java": "class Solution {\n    public int jobSequencing(int[] deadlines, int[] profits) {\n        \n    }\n}",
      "python": "class Solution:\n    def jobSequencing(self, deadlines: List[int], profits: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} deadlines\n * @param {number[]} profits\n * @return {number}\n */\nvar jobSequencing = function(deadlines, profits) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "deadlines=[2,1,2,1,3], profits=[100,19,27,25,15]",
        "expected": "142"
      },
      {
        "input": "deadlines=[2,1,2,1,3], profits=[100,19,27,25,15] (variant)",
        "expected": "142"
      }
    ]
  },
  "125": {
    "id": 125,
    "name": "Best Time to Buy and Sell Stock",
    "functionName": "maxProfit",
    "parameters": [
      {
        "name": "prices",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "prices = [7,1,5,3,6,4]",
        "expected": "5"
      },
      {
        "input": "prices = [7,6,4,3,1]",
        "expected": "0"
      }
    ]
  },
  "126": {
    "id": 126,
    "name": "Minimum Number of Coins",
    "functionName": "coinChange",
    "parameters": [
      {
        "name": "coins",
        "type": "vector<int>"
      },
      {
        "name": "amount",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
      "java": "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
      "python": "class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "coins = [1,5,6,9], amount = 11",
        "expected": "2"
      },
      {
        "input": "coins = [2], amount = 3",
        "expected": "-1"
      }
    ]
  },
  "127": {
    "id": 127,
    "name": "Climbing Stairs",
    "functionName": "climbStairs",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def climbStairs(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 2",
        "expected": "2"
      },
      {
        "input": "n = 3",
        "expected": "3"
      }
    ]
  },
  "128": {
    "id": 128,
    "name": "House Robber",
    "functionName": "rob",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int rob(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar rob = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3,1]",
        "expected": "4"
      },
      {
        "input": "nums = [2,7,9,3,1]",
        "expected": "12"
      }
    ]
  },
  "129": {
    "id": 129,
    "name": "Fibonacci Number",
    "functionName": "fib",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int fib(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int fib(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def fib(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar fib = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 2",
        "expected": "1"
      },
      {
        "input": "n = 3",
        "expected": "2"
      }
    ]
  },
  "130": {
    "id": 130,
    "name": "N-th Tribonacci Number",
    "functionName": "tribonacci",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int tribonacci(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int tribonacci(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def tribonacci(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar tribonacci = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 4",
        "expected": "4"
      },
      {
        "input": "n = 25",
        "expected": "1389537"
      }
    ]
  },
  "131": {
    "id": 131,
    "name": "Decode Ways",
    "functionName": "numDecodings",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int numDecodings(string s) {\n        \n    }\n};",
      "java": "class Solution {\n    public int numDecodings(String s) {\n        \n    }\n}",
      "python": "class Solution:\n    def numDecodings(self, s: str) -> int:\n        ",
      "js": "/**\n * @param {string} s\n * @return {number}\n */\nvar numDecodings = function(s) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "s = \"12\"",
        "expected": "2"
      },
      {
        "input": "s = \"226\"",
        "expected": "3"
      }
    ]
  },
  "132": {
    "id": 132,
    "name": "Word Break",
    "functionName": "wordBreak",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "wordDict",
        "type": "vector<string>"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "s = \"leetcode\", wordDict = [\"leet\",\"code\"]",
        "expected": "true"
      },
      {
        "input": "s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]",
        "expected": "true"
      }
    ]
  },
  "133": {
    "id": 133,
    "name": "Longest Increasing Subsequence",
    "functionName": "lengthOfLIS",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar lengthOfLIS = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [10,9,2,5,3,7,101,18]",
        "expected": "4"
      },
      {
        "input": "nums = [0,1,0,3,2,3]",
        "expected": "4"
      }
    ]
  },
  "134": {
    "id": 134,
    "name": "Coin Change",
    "functionName": "coinChange",
    "parameters": [
      {
        "name": "coins",
        "type": "vector<int>"
      },
      {
        "name": "amount",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
      "java": "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
      "python": "class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "coins = [1,5,6,9], amount = 11",
        "expected": "2"
      },
      {
        "input": "coins = [2], amount = 3",
        "expected": "-1"
      }
    ]
  },
  "135": {
    "id": 135,
    "name": "Longest Common Subsequence",
    "functionName": "longestCommonSubsequence",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "t",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        \n    }\n};",
      "java": "class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        \n    }\n}",
      "python": "class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        ",
      "js": "/**\n * @param {string} text1\n * @param {string} text2\n * @return {number}\n */\nvar longestCommonSubsequence = function(text1, text2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "text1 = \"abcde\", text2 = \"ace\"",
        "expected": "3"
      },
      {
        "input": "text1 = \"abc\", text2 = \"abc\"",
        "expected": "3"
      }
    ]
  },
  "136": {
    "id": 136,
    "name": "0-1 Knapsack",
    "functionName": "knapSack",
    "parameters": [
      {
        "name": "weights",
        "type": "vector<int>"
      },
      {
        "name": "values",
        "type": "vector<int>"
      },
      {
        "name": "W",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int knapSack(vector<int>& weights, vector<int>& values, int W) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "weights=[1,3,4,5], values=[1,4,5,7], W=7",
        "expected": "9"
      },
      {
        "input": "weights=[2,3], values=[3,4], W=2",
        "expected": "3"
      }
    ]
  },
  "137": {
    "id": 137,
    "name": "Minimum Path Sum",
    "functionName": "minPathSum",
    "parameters": [
      {
        "name": "grid",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int minPathSum(vector<vector<int>>& grid) {\n        \n    }\n};",
      "java": "class Solution {\n    public int minPathSum(int[][] grid) {\n        \n    }\n}",
      "python": "class Solution:\n    def minPathSum(self, grid: List[List[int]]) -> int:\n        ",
      "js": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar minPathSum = function(grid) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "grid = [[1,3,1],[1,5,1],[4,2,1]]",
        "expected": "7"
      },
      {
        "input": "grid = [[1,2,3],[4,5,6]]",
        "expected": "12"
      }
    ]
  },
  "138": {
    "id": 138,
    "name": "Unique Paths",
    "functionName": "uniquePaths",
    "parameters": [
      {
        "name": "m",
        "type": "int"
      },
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int uniquePaths(int m, int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int uniquePaths(int m, int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} m\n * @param {number} n\n * @return {number}\n */\nvar uniquePaths = function(m, n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "m = 3, n = 7",
        "expected": "28"
      },
      {
        "input": "m = 3, n = 2",
        "expected": "3"
      }
    ]
  },
  "139": {
    "id": 139,
    "name": "Edit Distance",
    "functionName": "minDistance",
    "parameters": [
      {
        "name": "s",
        "type": "string"
      },
      {
        "name": "t",
        "type": "string"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        \n    }\n};",
      "java": "class Solution {\n    public int minDistance(String word1, String word2) {\n        \n    }\n}",
      "python": "class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        ",
      "js": "/**\n * @param {string} word1\n * @param {string} word2\n * @return {number}\n */\nvar minDistance = function(word1, word2) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "word1 = \"horse\", word2 = \"ros\"",
        "expected": "3"
      },
      {
        "input": "word1 = \"intention\", word2 = \"execution\"",
        "expected": "5"
      }
    ]
  },
  "140": {
    "id": 140,
    "name": "Partition Equal Subset Sum",
    "functionName": "canPartition",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool canPartition(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean canPartition(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def canPartition(self, nums: List[int]) -> bool:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canPartition = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,5,11,5]",
        "expected": "true"
      },
      {
        "input": "nums = [1,2,3,5]",
        "expected": "false"
      }
    ]
  },
  "141": {
    "id": 141,
    "name": "Burst Balloons",
    "functionName": "maxCoins",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxCoins(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxCoins(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxCoins(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxCoins = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,1,5,8]",
        "expected": "167"
      },
      {
        "input": "nums = [1,5]",
        "expected": "10"
      }
    ]
  },
  "142": {
    "id": 142,
    "name": "Maximum Subarray",
    "functionName": "maxSubArray",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        "expected": "6"
      },
      {
        "input": "nums = [1]",
        "expected": "1"
      }
    ]
  },
  "143": {
    "id": 143,
    "name": "Maximum Product Subarray",
    "functionName": "maxProduct",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int maxProduct(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public int maxProduct(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxProduct = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [2,3,-2,4]",
        "expected": "6"
      },
      {
        "input": "nums = [-2,0,-1]",
        "expected": "0"
      }
    ]
  },
  "144": {
    "id": 144,
    "name": "BFS Shortest Path",
    "functionName": "shortestPath",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      },
      {
        "name": "edges",
        "type": "vector<vector<int>>"
      },
      {
        "name": "src",
        "type": "int"
      },
      {
        "name": "dest",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int shortestPath(int n, vector<vector<int>>& edges, int src, int dest) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "n = 4, edges = [[0,1],[1,2],[2,3]], src = 0, dest = 3",
        "expected": "3"
      },
      {
        "input": "n = 3, edges = [[0,1]], src = 0, dest = 2",
        "expected": "-1"
      }
    ]
  },
  "145": {
    "id": 145,
    "name": "Pacific Atlantic Water Flow",
    "functionName": "pacificAtlantic",
    "parameters": [
      {
        "name": "heights",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        \n    }\n}",
      "python": "class Solution:\n    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[][]} heights\n * @return {number[][]}\n */\nvar pacificAtlantic = function(heights) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "heights=[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]",
        "expected": "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]"
      },
      {
        "input": "heights = [[1]]",
        "expected": "[[0,0]]"
      }
    ]
  },
  "146": {
    "id": 146,
    "name": "Walls and Gates",
    "functionName": "wallsAndGates",
    "parameters": [
      {
        "name": "rooms",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "void",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    void wallsAndGates(vector<vector<int>>& rooms) {\n        \n    }\n};",
      "java": "class Solution {\n    public void wallsAndGates(int[][] rooms) {\n        \n    }\n}",
      "python": "class Solution:\n    def wallsAndGates(self, rooms: List[List[int]]) -> None:\n        ",
      "js": "/**\n * @param {number[][]} rooms\n * @return {void}\n */\nvar wallsAndGates = function(rooms) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]",
        "expected": "[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]"
      },
      {
        "input": "rooms = [[-1]]",
        "expected": "[[-1]]"
      }
    ]
  },
  "147": {
    "id": 147,
    "name": "Rotting Oranges",
    "functionName": "orangesRotting",
    "parameters": [
      {
        "name": "grid",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int orangesRotting(vector<vector<int>>& grid) {\n        \n    }\n};",
      "java": "class Solution {\n    public int orangesRotting(int[][] grid) {\n        \n    }\n}",
      "python": "class Solution:\n    def orangesRotting(self, grid: List[List[int]]) -> int:\n        ",
      "js": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar orangesRotting = function(grid) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "grid = [[2,1,1],[1,1,0],[0,1,1]]",
        "expected": "4"
      },
      {
        "input": "grid = [[2,1,1],[0,1,1],[1,0,1]]",
        "expected": "-1"
      }
    ]
  },
  "148": {
    "id": 148,
    "name": "Word Ladder",
    "functionName": "ladderLength",
    "parameters": [
      {
        "name": "beginWord",
        "type": "string"
      },
      {
        "name": "endWord",
        "type": "string"
      },
      {
        "name": "wordList",
        "type": "vector<string>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "// Note: use -std=c++17 for structured bindings (auto& [a,b])\nclass Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        \n    }\n};",
      "java": "class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        \n    }\n}",
      "python": "class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        ",
      "js": "/**\n * @param {string} beginWord\n * @param {string} endWord\n * @param {string[]} wordList\n * @return {number}\n */\nvar ladderLength = function(beginWord, endWord, wordList) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "beginWord=\"hit\", endWord=\"cog\", wordList=[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
        "expected": "5"
      },
      {
        "input": "beginWord=\"hit\", endWord=\"cog\", wordList=[\"hot\",\"dot\",\"dog\",\"lot\",\"log\"]",
        "expected": "0"
      }
    ]
  },
  "149": {
    "id": 149,
    "name": "Dijkstra's Algorithm",
    "functionName": "dijkstra",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      },
      {
        "name": "edges",
        "type": "vector<vector<int>>"
      },
      {
        "name": "src",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "// Note: use -std=c++17 for structured bindings (auto& [u,v,w])\nclass Solution {\npublic:\n    vector<int> dijkstra(int n, vector<vector<int>>& edges, int src) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] dijkstra(int n, int[][] edges, int src) {\n        \n    }\n}",
      "python": "class Solution:\n    def dijkstra(self, n: int, edges: List[List[int]], src: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number} n\n * @param {number[][]} edges\n * @param {number} src\n * @return {number[]}\n */\nvar dijkstra = function(n, edges, src) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n=5, edges=[[0,1,10],[0,4,3],[1,2,2],[4,1,4],[4,3,8],[3,2,2]], src=0",
        "expected": "0 7 9 11 3"
      },
      {
        "input": "n=3, edges=[[0,1,1],[1,2,1]], src=0",
        "expected": "0 1 2"
      }
    ]
  },
  "150": {
    "id": 150,
    "name": "Number of Islands",
    "functionName": "numIslands",
    "parameters": [
      {
        "name": "grid",
        "type": "vector<vector<char>>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};",
      "java": "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
      "python": "class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        ",
      "js": "/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "grid=[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
        "expected": "1"
      },
      {
        "input": "grid=[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]",
        "expected": "3"
      }
    ]
  },
  "151": {
    "id": 151,
    "name": "Clone Graph",
    "functionName": "cloneGraph",
    "parameters": [
      {
        "name": "node",
        "type": "Node*"
      }
    ],
    "returnType": "int:cloneGraph",
    "starterCode": {
      "cpp": "/**\n * Definition for a Node.\n * class Node {\n * public:\n *     int val;\n *     vector<Node*> neighbors;\n *     Node() {\n *         val = 0;\n *         neighbors = vector<Node*>();\n *     }\n *     Node(int _val) {\n *         val = _val;\n *         neighbors = vector<Node*>();\n *     }\n *     Node(int _val, vector<Node*> _neighbors) {\n *         val = _val;\n *         neighbors = _neighbors;\n *     }\n * };\n */\nclass Solution {\npublic:\n    Node* cloneGraph(Node* node) {\n        \n    }\n};",
      "java": "/*\n// Definition for a Node.\nclass Node {\n    public int val;\n    public List<Node> neighbors;\n    public Node() {\n        val = 0;\n        neighbors = new ArrayList<Node>();\n    }\n    public Node(int _val) {\n        val = _val;\n        neighbors = new ArrayList<Node>();\n    }\n    public Node(int _val, ArrayList<Node> _neighbors) {\n        val = _val;\n        neighbors = _neighbors;\n    }\n}\n*/\nclass Solution {\n    public Node cloneGraph(Node node) {\n        \n    }\n}",
      "python": "\"\"\"\n# Definition for a Node.\nclass Node:\n    def __init__(self, val = 0, neighbors = None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\"\"\"\nclass Solution:\n    def cloneGraph(self, node: 'Optional[Node]') -> 'Optional[Node]':\n        ",
      "js": "/**\n * // Definition for a Node.\n * function Node(val, neighbors) {\n *     this.val = val === undefined ? 0 : val;\n *     this.neighbors = neighbors === undefined ? [] : neighbors;\n * };\n */\n/**\n * @param {Node} node\n * @return {Node}\n */\nvar cloneGraph = function(node) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "adjList = [[2,4],[1,3],[2,4],[1,3]]",
        "expected": "4 nodes"
      },
      {
        "input": "adjList = [[]]",
        "expected": "1 node"
      }
    ]
  },
  "152": {
    "id": 152,
    "name": "Course Schedule",
    "functionName": "canFinish",
    "parameters": [
      {
        "name": "numCourses",
        "type": "int"
      },
      {
        "name": "prerequisites",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "numCourses = 2, prerequisites = [[1,0]]",
        "expected": "true"
      },
      {
        "input": "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        "expected": "false"
      }
    ]
  },
  "153": {
    "id": 153,
    "name": "Detect Cycle in Directed Graph",
    "functionName": "isCyclic",
    "parameters": [
      {
        "name": "V",
        "type": "int"
      },
      {
        "name": "adj",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool isCyclic(int V, vector<vector<int>>& adj) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean isCyclic(int V, int[][] adj) {\n        \n    }\n}",
      "python": "class Solution:\n    def isCyclic(self, V: int, adj: List[List[int]]) -> bool:\n        ",
      "js": "/**\n * @param {number} V\n * @param {number[][]} adj\n * @return {boolean}\n */\nvar isCyclic = function(V, adj) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "V = 4, adj = [[0,1],[1,2],[2,3],[3,3]]",
        "expected": "true"
      },
      {
        "input": "V = 3, adj = [[0,1],[1,2]]",
        "expected": "false"
      }
    ]
  },
  "154": {
    "id": 154,
    "name": "Flood Fill",
    "functionName": "floodFill",
    "parameters": [
      {
        "name": "image",
        "type": "vector<vector<int>>"
      },
      {
        "name": "sr",
        "type": "int"
      },
      {
        "name": "sc",
        "type": "int"
      },
      {
        "name": "color",
        "type": "int"
      }
    ],
    "returnType": "vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[][] floodFill(int[][] image, int sr, int sc, int color) {\n        \n    }\n}",
      "python": "class Solution:\n    def floodFill(self, image: List[List[int]], sr: int, sc: int, color: int) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[][]} image\n * @param {number} sr\n * @param {number} sc\n * @param {number} color\n * @return {number[][]}\n */\nvar floodFill = function(image, sr, sc, color) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2",
        "expected": "[[2,2,2],[2,2,0],[2,0,1]]"
      },
      {
        "input": "image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0",
        "expected": "[[0,0,0],[0,0,0]]"
      }
    ]
  },
  "155": {
    "id": 155,
    "name": "Word Search",
    "functionName": "exist",
    "parameters": [
      {
        "name": "board",
        "type": "vector<vector<char>>"
      },
      {
        "name": "word",
        "type": "string"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}",
      "python": "class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        ",
      "js": "/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"",
        "expected": "true"
      },
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"SEE\"",
        "expected": "true"
      }
    ]
  },
  "156": {
    "id": 156,
    "name": "Alien Dictionary",
    "functionName": "alienOrder",
    "parameters": [
      {
        "name": "words",
        "type": "vector<string>"
      }
    ],
    "returnType": "string",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    string alienOrder(vector<string>& words) {\n        \n    }\n};",
      "java": "class Solution {\n    public String alienOrder(String[] words) {\n        \n    }\n}",
      "python": "class Solution:\n    def alienOrder(self, words: List[str]) -> str:\n        ",
      "js": "/**\n * @param {string[]} words\n * @return {string}\n */\nvar alienOrder = function(words) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]",
        "expected": "\"wertf\""
      },
      {
        "input": "words = [\"z\",\"x\"]",
        "expected": "\"zx\""
      }
    ]
  },
  "157": {
    "id": 157,
    "name": "Course Schedule II",
    "compareMode": "unordered",
    "functionName": "findOrder",
    "parameters": [
      {
        "name": "numCourses",
        "type": "int"
      },
      {
        "name": "prerequisites",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "numCourses = 2, prerequisites = [[1,0]]",
        "expected": "[0,1]"
      },
      {
        "input": "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
        "expected": "[0,2,1,3]"
      }
    ]
  },
  "158": {
    "id": 158,
    "name": "Number of Connected Components",
    "functionName": "countComponents",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      },
      {
        "name": "edges",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int countComponents(int n, vector<vector<int>>& edges) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "n = 5, edges = [[0,1],[1,2],[3,4]]",
        "expected": "2"
      },
      {
        "input": "n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]",
        "expected": "1"
      }
    ]
  },
  "159": {
    "id": 159,
    "name": "Redundant Connection",
    "functionName": "findRedundantConnection",
    "parameters": [
      {
        "name": "edges",
        "type": "vector<vector<int>>"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> findRedundantConnection(vector<vector<int>>& edges) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "edges = [[1,2],[1,3],[2,3]]",
        "expected": "[2,3]"
      },
      {
        "input": "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]",
        "expected": "[1,4]"
      }
    ]
  },
  "160": {
    "id": 160,
    "name": "Fibonacci Number",
    "functionName": "fib",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int fib(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int fib(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def fib(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar fib = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 2",
        "expected": "1"
      },
      {
        "input": "n = 3",
        "expected": "2"
      }
    ]
  },
  "161": {
    "id": 161,
    "name": "Factorial using Recursion",
    "functionName": "factorial",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int factorial(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int factorial(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def factorial(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar factorial = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 5",
        "expected": "120"
      },
      {
        "input": "n = 3",
        "expected": "6"
      }
    ]
  },
  "162": {
    "id": 162,
    "name": "Sum of Digits using Recursion",
    "functionName": "sumOfDigits",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int sumOfDigits(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int sumOfDigits(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def sumOfDigits(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar sumOfDigits = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 123",
        "expected": "6"
      },
      {
        "input": "n = 4567",
        "expected": "22"
      }
    ]
  },
  "163": {
    "id": 163,
    "name": "Power Function (Fast Exponentiation)",
    "compareMode": "float",
    "functionName": "myPow",
    "parameters": [
      {
        "name": "x",
        "type": "double"
      },
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "double",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    double myPow(double x, int n) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "x = 2.00000, n = 10",
        "expected": "1024.00000"
      },
      {
        "input": "x = 2.10000, n = 3",
        "expected": "9.26100"
      }
    ]
  },
  "164": {
    "id": 164,
    "name": "Tower of Hanoi",
    "functionName": "toh",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    // Return the minimum number of moves to solve Tower of Hanoi with n disks\n    int toh(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public int toh(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def toh(self, n: int) -> int:\n        ",
      "js": "/**\n * @param {number} n\n * @return {number}\n */\nvar toh = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 3",
        "expected": "7"
      },
      {
        "input": "n = 4",
        "expected": "15"
      }
    ]
  },
  "165": {
    "id": 165,
    "name": "Subsets",
    "functionName": "subsets",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3]",
        "expected": "8 subsets"
      },
      {
        "input": "nums = [0]",
        "expected": "2 subsets"
      }
    ]
  },
  "166": {
    "id": 166,
    "name": "Permutations",
    "functionName": "permute",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        \n    }\n}",
      "python": "class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,2,3]",
        "expected": "6 permutations"
      },
      {
        "input": "nums = [0,1]",
        "expected": "2 permutations"
      }
    ]
  },
  "167": {
    "id": 167,
    "name": "Combination Sum",
    "functionName": "combinationSum",
    "parameters": [
      {
        "name": "candidates",
        "type": "vector<int>"
      },
      {
        "name": "target",
        "type": "int"
      }
    ],
    "returnType": "count:vector<vector<int>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        \n    }\n}",
      "python": "class Solution:\n    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:\n        ",
      "js": "/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum = function(candidates, target) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "candidates = [2,3,6,7], target = 7",
        "expected": "2 combinations"
      },
      {
        "input": "candidates = [2,3,5], target = 8",
        "expected": "3 combinations"
      }
    ]
  },
  "168": {
    "id": 168,
    "name": "Letter Combinations of Phone Number",
    "functionName": "letterCombinations",
    "parameters": [
      {
        "name": "digits",
        "type": "string"
      }
    ],
    "returnType": "count:vector<string>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<string> letterCombinations(string digits) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<String> letterCombinations(String digits) {\n        \n    }\n}",
      "python": "class Solution:\n    def letterCombinations(self, digits: str) -> List[str]:\n        ",
      "js": "/**\n * @param {string} digits\n * @return {string[]}\n */\nvar letterCombinations = function(digits) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "digits = \"23\"",
        "expected": "9 combinations"
      },
      {
        "input": "digits = \"2\"",
        "expected": "3 combinations"
      }
    ]
  },
  "169": {
    "id": 169,
    "name": "N-Queens",
    "functionName": "solveNQueens",
    "parameters": [
      {
        "name": "n",
        "type": "int"
      }
    ],
    "returnType": "count:vector<vector<string>>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<vector<string>> solveNQueens(int n) {\n        \n    }\n};",
      "java": "class Solution {\n    public List<List<String>> solveNQueens(int n) {\n        \n    }\n}",
      "python": "class Solution:\n    def solveNQueens(self, n: int) -> List[List[str]]:\n        ",
      "js": "/**\n * @param {number} n\n * @return {string[][]}\n */\nvar solveNQueens = function(n) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "n = 4",
        "expected": "2 solutions"
      },
      {
        "input": "n = 1",
        "expected": "1 solution"
      }
    ]
  },
  "170": {
    "id": 170,
    "name": "Word Search",
    "functionName": "exist",
    "parameters": [
      {
        "name": "board",
        "type": "vector<vector<char>>"
      },
      {
        "name": "word",
        "type": "string"
      }
    ],
    "returnType": "bool",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};",
      "java": "class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}",
      "python": "class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        ",
      "js": "/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"",
        "expected": "true"
      },
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"SEE\"",
        "expected": "true"
      }
    ]
  },
  "171": {
    "id": 171,
    "name": "Kth Largest Element in Array",
    "functionName": "findKthLargest",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "int",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar findKthLargest = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [3,2,1,5,6,4], k = 2",
        "expected": "5"
      },
      {
        "input": "nums = [3,2,3,1,2,4,5,5,6], k = 4",
        "expected": "4"
      }
    ]
  },
  "172": {
    "id": 172,
    "name": "Find Median from Data Stream",
    "functionName": "findMedian",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      }
    ],
    "returnType": "design:MedianFinder",
    "starterCode": {
      "cpp": "class MedianFinder {\npublic:\n    MedianFinder() {}\n    void addNum(int num) {}\n    double findMedian() {}\n};",
      "java": "class MedianFinder {\n    public MedianFinder() {}\n    public void addNum(int num) {}\n    public double findMedian() { return 0.0; }\n}",
      "python": "class MedianFinder:\n    def __init__(self):\n        pass\n    def addNum(self, num: int) -> None:\n        pass\n    def findMedian(self) -> float:\n        pass",
      "js": "class MedianFinder {\n    constructor() {}\n    addNum(num) {}\n    findMedian() {}\n}"
    },
    "sampleTests": [
      {
        "input": "addNum(1),addNum(2),findMedian()",
        "expected": "2.0"
      },
      {
        "input": "addNum(5),findMedian()",
        "expected": "5.0"
      }
    ]
  },
  "173": {
    "id": 173,
    "name": "Merge K Sorted Lists",
    "functionName": "mergeKLists",
    "parameters": [
      {
        "name": "lists",
        "type": "vector<ListNode*>"
      }
    ],
    "returnType": "ListNode*",
    "starterCode": {
      "cpp": "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};"
    },
    "sampleTests": [
      {
        "input": "lists = [[1,4,5],[1,3,4],[2,6]]",
        "expected": "1 1 2 3 4 4 5 6"
      },
      {
        "input": "lists = []",
        "expected": "[]"
      }
    ]
  },
  "174": {
    "id": 174,
    "name": "Top K Frequent Elements",
    "compareMode": "unordered",
    "functionName": "topKFrequent",
    "parameters": [
      {
        "name": "nums",
        "type": "vector<int>"
      },
      {
        "name": "k",
        "type": "int"
      }
    ],
    "returnType": "vector<int>",
    "starterCode": {
      "cpp": "class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        \n    }\n};",
      "java": "class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        \n    }\n}",
      "python": "class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ",
      "js": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    \n};"
    },
    "sampleTests": [
      {
        "input": "nums = [1,1,1,2,2,3], k = 2",
        "expected": "[1,2]"
      },
      {
        "input": "nums = [1], k = 1",
        "expected": "[1]"
      }
    ]
  }
};
