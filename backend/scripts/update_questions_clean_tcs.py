import json
import re

# Load question metadata from question-metadata.js
def load_metadata_registry():
    with open('js/question-metadata.js', 'r', encoding='utf-8') as f:
        content = f.read()
    m = re.search(r'window\.QUESTION_METADATA_REGISTRY\s*=\s*(\{.*?\});\s*$', content, re.DOTALL)
    if not m:
        # try without trailing semicolon
        m = re.search(r'window\.QUESTION_METADATA_REGISTRY\s*=\s*(\{.*?\});', content, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    return {}

# Define the exact repaired data for the 33 placeholder questions
REPAIRED_33 = {
    4: {
        "statement": "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.",
        "inputFormat": "An array of n distinct integers nums where each integer is in the range [0, n].",
        "outputFormat": "Return the missing integer from the range [0, n].",
        "constraints": "n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n\nAll the numbers of nums are unique.",
        "sampleInput": "nums = [3,0,1]",
        "sampleOutput": "2",
        "examples": [
            {"input": "nums = [3,0,1]", "output": "2", "explanation": "n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number in the range since it does not appear in nums."},
            {"input": "nums = [0,1]", "output": "2", "explanation": "n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is the missing number."}
        ]
    },
    5: {
        "statement": "Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive, return the duplicate number. You must solve the problem without modifying the array nums and using only constant extra space.",
        "inputFormat": "An array of integers nums of length n + 1 with values between 1 and n.",
        "outputFormat": "Return the repeated integer in nums.",
        "constraints": "1 <= n <= 10^5\nnums.length == n + 1\n1 <= nums[i] <= n\nAll the integers in nums appear only once except for precisely one integer which appears two or more times.",
        "sampleInput": "nums = [1,3,4,2,2]",
        "sampleOutput": "2",
        "examples": [
            {"input": "nums = [1,3,4,2,2]", "output": "2"},
            {"input": "nums = [3,1,3,4,2]", "output": "3"}
        ]
    },
    6: {
        "statement": "Given an integer array nums and an integer target, return the total number of times target appears in nums.",
        "inputFormat": "An integer array nums and an integer target.",
        "outputFormat": "Return an integer representing the frequency of target in nums.",
        "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i], target <= 10^9",
        "sampleInput": "nums = [1,2,2,3,3,3], target = 3",
        "sampleOutput": "3",
        "examples": [
            {"input": "nums = [1,2,2,3,3,3], target = 3", "output": "3"},
            {"input": "nums = [1,2,2,3,3,3], target = 2", "output": "2"}
        ]
    },
    7: {
        "statement": "Given an array of integers nums, find and return the first element that does not repeat (occurs exactly once in the array). If there is no such element, return -1.",
        "inputFormat": "An array of integers nums.",
        "outputFormat": "Return the first non-repeating integer, or -1 if every element repeats.",
        "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
        "sampleInput": "nums = [1,2,3,2,1,4]",
        "sampleOutput": "3",
        "examples": [
            {"input": "nums = [1,2,3,2,1,4]", "output": "3", "explanation": "3 is the first element from the left that appears only once."},
            {"input": "nums = [9,4,9,6,7,4]", "output": "6"}
        ]
    },
    8: {
        "statement": "Given an array of integers nums, find the first repeating element whose duplicate (second occurrence) appears earliest when scanning from left to right. If no elements repeat, return -1.",
        "inputFormat": "An array of integers nums.",
        "outputFormat": "Return the integer value of the first repeating element, or -1 if no duplicates exist.",
        "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
        "sampleInput": "nums = [1,2,3,2,1]",
        "sampleOutput": "2",
        "examples": [
            {"input": "nums = [1,2,3,2,1]", "output": "2", "explanation": "2 appears again at index 3, which is earlier than the second occurrence of 1 at index 4."},
            {"input": "nums = [3,1,2,1,3]", "output": "1", "explanation": "1 appears again at index 3, before 3 appears again at index 4."}
        ]
    },
    10: {
        "statement": "Given an integer array nums, count and return the number of distinct (unique) elements present in the array.",
        "inputFormat": "An array of integers nums.",
        "outputFormat": "Return the count of unique values in nums.",
        "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
        "sampleInput": "nums = [1,2,3,2,1]",
        "sampleOutput": "3",
        "examples": [
            {"input": "nums = [1,2,3,2,1]", "output": "3", "explanation": "The distinct elements are 1, 2, and 3."},
            {"input": "nums = [1,1,1,1]", "output": "1"}
        ]
    },
    11: {
        "statement": "Given two integer arrays nums1 and nums2, return an array of their intersection. Each element in the result must be unique and you may return the result in any order.",
        "inputFormat": "Two integer arrays nums1 and nums2.",
        "outputFormat": "Return a list of unique elements present in both arrays.",
        "constraints": "1 <= nums1.length, nums2.length <= 1000\n0 <= nums1[i], nums2[i] <= 1000",
        "sampleInput": "nums1 = [1,2,2,1], nums2 = [2,2]",
        "sampleOutput": "[2]",
        "examples": [
            {"input": "nums1 = [1,2,2,1], nums2 = [2,2]", "output": "[2]"},
            {"input": "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", "output": "[9,4]"}
        ]
    },
    12: {
        "statement": "Given two integer arrays nums1 and nums2, determine the union of both arrays and return the total count of distinct elements in the union.",
        "inputFormat": "Two integer arrays nums1 and nums2.",
        "outputFormat": "Return an integer representing the number of unique elements in the union of nums1 and nums2.",
        "constraints": "1 <= nums1.length, nums2.length <= 10^5\n-10^9 <= nums1[i], nums2[i] <= 10^9",
        "sampleInput": "nums1 = [1,2,3], nums2 = [2,3,4]",
        "sampleOutput": "4",
        "examples": [
            {"input": "nums1 = [1,2,3], nums2 = [2,3,4]", "output": "4", "explanation": "The union contains distinct elements {1, 2, 3, 4}, so the count is 4."},
            {"input": "nums1 = [1,2,1,3], nums2 = [2,2]", "output": "3", "explanation": "The union contains distinct elements {1, 2, 3}, count = 3."}
        ]
    },
    13: {
        "statement": "Given an integer array nums of size n, find all elements that appear more than ⌊ n/3 ⌋ times.",
        "inputFormat": "An integer array nums.",
        "outputFormat": "Return an array containing all majority elements that appear strictly more than n/3 times.",
        "constraints": "1 <= nums.length <= 5 * 10^4\n-10^9 <= nums[i] <= 10^9",
        "sampleInput": "nums = [3,2,3]",
        "sampleOutput": "[3]",
        "examples": [
            {"input": "nums = [3,2,3]", "output": "[3]"},
            {"input": "nums = [1,2]", "output": "[1,2]"}
        ]
    },
    15: {
        "statement": "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Return the number of unique elements k.",
        "inputFormat": "A sorted integer array nums in non-decreasing order.",
        "outputFormat": "Return the integer k, the number of unique elements.",
        "constraints": "1 <= nums.length <= 3 * 10^4\n-100 <= nums[i] <= 100\nnums is sorted in non-decreasing order.",
        "sampleInput": "nums = [1,1,2]",
        "sampleOutput": "2",
        "examples": [
            {"input": "nums = [1,1,2]", "output": "2", "explanation": "Your function should return k = 2, with the first two elements of nums being 1 and 2."},
            {"input": "nums = [0,0,1,1,1,2,2,3,3,4]", "output": "5"}
        ]
    },
    18: {
        "statement": "You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively. Merge nums2 into nums1 as one sorted array in-place. nums1 has a total length of m + n, where the first m elements denote the initial values and the last n elements are set to 0.",
        "inputFormat": "Integer array nums1 of length m + n, integer m, integer array nums2 of length n, and integer n.",
        "outputFormat": "Modify nums1 in-place so that it contains all sorted elements from both arrays.",
        "constraints": "nums1.length == m + n\nnums2.length == n\n0 <= m, n <= 200\n1 <= m + n <= 200\n-10^9 <= nums1[i], nums2[j] <= 10^9",
        "sampleInput": "nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3",
        "sampleOutput": "[1,2,2,3,5,6]",
        "examples": [
            {"input": "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", "output": "[1,2,2,3,5,6]"},
            {"input": "nums1 = [1], m = 1, nums2 = [], n = 0", "output": "[1]"}
        ]
    },
    20: {
        "statement": "Given an array of integers nums and an integer target, determine whether there exists a pair of distinct elements nums[i] and nums[j] (where i != j) such that their sum equals target. Return true if such a pair exists, otherwise false.",
        "inputFormat": "An array of integers nums and an integer target.",
        "outputFormat": "Return true if a pair summing to target exists, otherwise false.",
        "constraints": "2 <= nums.length <= 10^5\n-10^9 <= nums[i], target <= 10^9",
        "sampleInput": "nums = [2,7,11,15], target = 9",
        "sampleOutput": "true",
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "true", "explanation": "2 + 7 = 9."},
            {"input": "nums = [1,3,5], target = 10", "output": "false"}
        ]
    },
    21: {
        "statement": "Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
        "inputFormat": "An integer array nums.",
        "outputFormat": "Return a list of all unique triplets that sum to 0.",
        "constraints": "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
        "sampleInput": "nums = [-1,0,1,2,-1,-4]",
        "sampleOutput": "[[-1,-1,2],[-1,0,1]]",
        "examples": [
            {"input": "nums = [-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]"},
            {"input": "nums = [0,1,1]", "output": "[]"}
        ]
    },
    22: {
        "statement": "Given an array nums of n integers and an integer target, return an array of all unique quadruplets [nums[a], nums[b], nums[c], nums[d]] such that 0 <= a, b, c, d < n are distinct indices and nums[a] + nums[b] + nums[c] + nums[d] == target. The solution set must not contain duplicate quadruplets.",
        "inputFormat": "An integer array nums and an integer target.",
        "outputFormat": "Return all unique quadruplets that sum to target.",
        "constraints": "1 <= nums.length <= 200\n-10^9 <= nums[i], target <= 10^9",
        "sampleInput": "nums = [1,0,-1,0,-2,2], target = 0",
        "sampleOutput": "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]",
        "examples": [
            {"input": "nums = [1,0,-1,0,-2,2], target = 0", "output": "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]"},
            {"input": "nums = [2,2,2,2,2], target = 8", "output": "[[2,2,2,2]]"}
        ]
    },
    23: {
        "statement": "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        "inputFormat": "An array of integers nums.",
        "outputFormat": "Return the maximum sum of any contiguous subarray in nums.",
        "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        "sampleInput": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        "sampleOutput": "6",
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The subarray [4,-1,2,1] has the largest sum 6."},
            {"input": "nums = [1]", "output": "1"}
        ]
    },
    27: {
        "statement": "Given an array of integers nums and a positive integer k, find the first negative integer in every window (contiguous subarray) of size k. If a window does not contain any negative integer, then output 0 for that window.",
        "inputFormat": "An array of integers nums and window size k.",
        "outputFormat": "Return an array of size n - k + 1 containing the first negative number of each window.",
        "constraints": "1 <= k <= nums.length <= 10^5\n-10^5 <= nums[i] <= 10^5",
        "sampleInput": "nums = [-8,2,-6,5,-4], k = 2",
        "sampleOutput": "[-8,-6,-6,-4]",
        "examples": [
            {"input": "nums = [-8,2,-6,5,-4], k = 2", "output": "[-8,-6,-6,-4]", "explanation": "Windows: [-8, 2] -> -8; [2, -6] -> -6; [-6, 5] -> -6; [5, -4] -> -4."},
            {"input": "nums = [1,2,3,4,5], k = 2", "output": "[0,0,0,0]"}
        ]
    },
    28: {
        "statement": "Given two strings s and p, return the total count of substrings in s that are anagrams of pattern p.",
        "inputFormat": "Two strings s and p consisting of lowercase English letters.",
        "outputFormat": "Return an integer representing the count of anagram occurrences of p in s.",
        "constraints": "1 <= s.length, p.length <= 3 * 10^4\ns and p consist of lowercase English letters.",
        "sampleInput": "s = \"cbaebabacd\", p = \"abc\"",
        "sampleOutput": "2",
        "examples": [
            {"input": "s = \"cbaebabacd\", p = \"abc\"", "output": "2", "explanation": "Substrings at index 0 (\"cba\") and index 6 (\"bac\") are anagrams of \"abc\"."},
            {"input": "s = \"abab\", p = \"ab\"", "output": "3", "explanation": "Substrings at index 0 (\"ab\"), index 1 (\"ba\"), and index 2 (\"ab\") are anagrams of \"ab\"."}
        ]
    },
    35: {
        "statement": "Given an integer array nums and two indices left and right (with left <= right), calculate and return the sum of the elements of nums between indices left and right inclusive (i.e. nums[left] + nums[left + 1] + ... + nums[right]).",
        "inputFormat": "An array of integers nums, and two 0-indexed integers left and right.",
        "outputFormat": "Return the sum of elements from index left to right inclusive.",
        "constraints": "1 <= nums.length <= 10^4\n-10^5 <= nums[i] <= 10^5\n0 <= left <= right < nums.length",
        "sampleInput": "nums = [-2,0,3,-5,2,-1], left = 0, right = 2",
        "sampleOutput": "1",
        "examples": [
            {"input": "nums = [-2,0,3,-5,2,-1], left = 0, right = 2", "output": "1", "explanation": "(-2) + 0 + 3 = 1."},
            {"input": "nums = [-2,0,3,-5,2,-1], left = 2, right = 5", "output": "-1", "explanation": "3 + (-5) + 2 + (-1) = -1."}
        ]
    },
    47: {
        "statement": "Given a string s, count and return the total number of vowels ('a', 'e', 'i', 'o', 'u', case-insensitive) present in the string.",
        "inputFormat": "A string s.",
        "outputFormat": "Return an integer representing the total count of vowels in s.",
        "constraints": "1 <= s.length <= 10^5\ns consists of printable ASCII characters.",
        "sampleInput": "s = \"hello\"",
        "sampleOutput": "2",
        "examples": [
            {"input": "s = \"hello\"", "output": "2", "explanation": "Vowels are 'e' and 'o'."},
            {"input": "s = \"aeiou\"", "output": "5"}
        ]
    },
    52: {
        "statement": "Given a string s, find the length of the longest substring without repeating characters.",
        "inputFormat": "A string s consisting of English letters, digits, symbols and spaces.",
        "outputFormat": "Return an integer representing the maximum length of a non-repeating substring.",
        "constraints": "0 <= s.length <= 5 * 10^4",
        "sampleInput": "s = \"abcabcbb\"",
        "sampleOutput": "3",
        "examples": [
            {"input": "s = \"abcabcbb\"", "output": "3", "explanation": "The answer is \"abc\", with the length of 3."},
            {"input": "s = \"bbbbb\"", "output": "1", "explanation": "The answer is \"b\", with the length of 1."}
        ]
    },
    55: {
        "statement": "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string \"\".",
        "inputFormat": "Two strings s and t.",
        "outputFormat": "Return the shortest substring of s that contains all characters of t, or \"\" if none exists.",
        "constraints": "m == s.length, n == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters.",
        "sampleInput": "s = \"ADOBECODEBANC\", t = \"ABC\"",
        "sampleOutput": "\"BANC\"",
        "examples": [
            {"input": "s = \"ADOBECODEBANC\", t = \"ABC\"", "output": "\"BANC\"", "explanation": "The minimum window substring \"BANC\" includes 'A', 'B', and 'C' from string t."},
            {"input": "s = \"a\", t = \"a\"", "output": "\"a\""}
        ]
    },
    66: {
        "statement": "Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list. k is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.",
        "inputFormat": "The head of a singly linked list head and an integer k.",
        "outputFormat": "Return the head of the modified linked list after group reversal.",
        "constraints": "The number of nodes in the list is n.\n1 <= k <= n <= 5000\n0 <= Node.val <= 1000",
        "sampleInput": "head = [1,2,3,4,5], k = 2",
        "sampleOutput": "[2,1,4,3,5]",
        "examples": [
            {"input": "head = [1,2,3,4,5], k = 2", "output": "[2,1,4,3,5]"},
            {"input": "head = [1,2,3,4,5], k = 3", "output": "[3,2,1,4,5]"}
        ]
    },
    79: {
        "statement": "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.",
        "inputFormat": "An array of integers nums and window size k.",
        "outputFormat": "Return an array containing the maximum value from each window of size k.",
        "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\n1 <= k <= nums.length",
        "sampleInput": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        "sampleOutput": "[3,3,5,5,6,7]",
        "examples": [
            {"input": "nums = [1,3,-1,-3,5,3,6,7], k = 3", "output": "[3,3,5,5,6,7]", "explanation": "Windows: [1 3 -1] -> 3; [3 -1 -3] -> 3; [-1 -3 5] -> 5; [-3 5 3] -> 5; [5 3 6] -> 6; [3 6 7] -> 7."},
            {"input": "nums = [1], k = 1", "output": "[1]"}
        ]
    },
    98: {
        "statement": "Given an unsorted array of integers nums, sort the array in non-decreasing (ascending) order using the Bubble Sort algorithm and return the sorted array.",
        "inputFormat": "An integer array nums.",
        "outputFormat": "Return the sorted array in non-decreasing order.",
        "constraints": "1 <= nums.length <= 1000\n-10^4 <= nums[i] <= 10^4",
        "sampleInput": "nums = [64,34,25,12,22,11,90]",
        "sampleOutput": "[11,12,22,25,34,64,90]",
        "examples": [
            {"input": "nums = [64,34,25,12,22,11,90]", "output": "[11,12,22,25,34,64,90]"},
            {"input": "nums = [5,1,4,2,8]", "output": "[1,2,4,5,8]"}
        ]
    },
    99: {
        "statement": "Given an unsorted array of integers nums, sort the array in non-decreasing (ascending) order using the Selection Sort algorithm and return the sorted array.",
        "inputFormat": "An integer array nums.",
        "outputFormat": "Return the sorted array in non-decreasing order.",
        "constraints": "1 <= nums.length <= 1000\n-10^4 <= nums[i] <= 10^4",
        "sampleInput": "nums = [64,25,12,22,11]",
        "sampleOutput": "[11,12,22,25,64]",
        "examples": [
            {"input": "nums = [64,25,12,22,11]", "output": "[11,12,22,25,64]"},
            {"input": "nums = [3,2,1]", "output": "[1,2,3]"}
        ]
    },
    100: {
        "statement": "Given an unsorted array of integers nums, sort the array in non-decreasing (ascending) order using the Insertion Sort algorithm and return the sorted array.",
        "inputFormat": "An integer array nums.",
        "outputFormat": "Return the sorted array in non-decreasing order.",
        "constraints": "1 <= nums.length <= 1000\n-10^4 <= nums[i] <= 10^4",
        "sampleInput": "nums = [12,11,13,5,6]",
        "sampleOutput": "[5,6,11,12,13]",
        "examples": [
            {"input": "nums = [12,11,13,5,6]", "output": "[5,6,11,12,13]"},
            {"input": "nums = [5,2,4,6,1,3]", "output": "[1,2,3,4,5,6]"}
        ]
    },
    102: {
        "statement": "Given an unsorted array of integers nums, sort the array in non-decreasing (ascending) order using the Quick Sort algorithm and return the sorted array.",
        "inputFormat": "An integer array nums.",
        "outputFormat": "Return the sorted array in non-decreasing order.",
        "constraints": "1 <= nums.length <= 5 * 10^4\n-10^5 <= nums[i] <= 10^5",
        "sampleInput": "nums = [3,6,8,10,1,2,1]",
        "sampleOutput": "[1,1,2,3,6,8,10]",
        "examples": [
            {"input": "nums = [3,6,8,10,1,2,1]", "output": "[1,1,2,3,6,8,10]"},
            {"input": "nums = [5,2,4,6,1,3]", "output": "[1,2,3,4,5,6]"}
        ]
    },
    103: {
        "statement": "Given an array of non-negative integers nums, sort the array in non-decreasing (ascending) order using the Counting Sort algorithm and return the sorted array.",
        "inputFormat": "An array of non-negative integers nums.",
        "outputFormat": "Return the sorted array in non-decreasing order.",
        "constraints": "1 <= nums.length <= 10^5\n0 <= nums[i] <= 10^5",
        "sampleInput": "nums = [4,2,2,8,3,3,1]",
        "sampleOutput": "[1,2,2,3,3,4,8]",
        "examples": [
            {"input": "nums = [4,2,2,8,3,3,1]", "output": "[1,2,2,3,3,4,8]"},
            {"input": "nums = [2,0,2,1,1,0]", "output": "[0,0,1,1,2,2]"}
        ]
    },
    104: {
        "statement": "Given an array of non-negative integers nums, sort the array in non-decreasing (ascending) order using the Radix Sort algorithm and return the sorted array.",
        "inputFormat": "An array of non-negative integers nums.",
        "outputFormat": "Return the sorted array in non-decreasing order.",
        "constraints": "1 <= nums.length <= 5 * 10^4\n0 <= nums[i] <= 10^6",
        "sampleInput": "nums = [170,45,75,90,802,24,2,66]",
        "sampleOutput": "[2,24,45,66,75,90,170,802]",
        "examples": [
            {"input": "nums = [170,45,75,90,802,24,2,66]", "output": "[2,24,45,66,75,90,170,802]"},
            {"input": "nums = [3,6,8,10,1,2]", "output": "[1,2,3,6,8,10]"}
        ]
    },
    105: {
        "statement": "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        "inputFormat": "An array of intervals intervals where each interval has start and end time [start_i, end_i].",
        "outputFormat": "Return an array of merged, non-overlapping intervals.",
        "constraints": "1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4",
        "sampleInput": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        "sampleOutput": "[[1,6],[8,10],[15,18]]",
        "examples": [
            {"input": "intervals = [[1,3],[2,6],[8,10],[15,18]]", "output": "[[1,6],[8,10],[15,18]]", "explanation": "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."},
            {"input": "intervals = [[1,4],[4,5]]", "output": "[[1,5]]", "explanation": "Intervals [1,4] and [4,5] overlap at 4, so merge them into [1,5]."}
        ]
    },
    106: {
        "statement": "Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue. We will use the integers 0, 1, and 2 to represent the color red, white, and blue, respectively. You must solve this problem without using the library's sort function.",
        "inputFormat": "An integer array nums where nums[i] is 0, 1, or 2.",
        "outputFormat": "Modify nums in-place so that all 0s come first, then 1s, then 2s.",
        "constraints": "n == nums.length\n1 <= n <= 300\nnums[i] is either 0, 1, or 2.",
        "sampleInput": "nums = [2,0,2,1,1,0]",
        "sampleOutput": "[0,0,1,1,2,2]",
        "examples": [
            {"input": "nums = [2,0,2,1,1,0]", "output": "[0,0,1,1,2,2]"},
            {"input": "nums = [2,0,1]", "output": "[0,1,2]"}
        ]
    },
    115: {
        "statement": "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element of this array. You must write an algorithm that runs in O(log n) time.",
        "inputFormat": "A 1-indexed rotated sorted integer array nums of unique elements.",
        "outputFormat": "Return the minimum integer value in nums.",
        "constraints": "n == nums.length\n1 <= n <= 5000\n-5000 <= nums[i] <= 5000\nAll the integers of nums are unique.\nnums is sorted and rotated between 1 and n times.",
        "sampleInput": "nums = [3,4,5,1,2]",
        "sampleOutput": "1",
        "examples": [
            {"input": "nums = [3,4,5,1,2]", "output": "1", "explanation": "The original array was [1,2,3,4,5] rotated 3 times."},
            {"input": "nums = [4,5,6,7,0,1,2]", "output": "0"}
        ]
    },
    126: {
        "statement": "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You may assume that you have an infinite number of each kind of coin.",
        "inputFormat": "An integer array coins and an integer amount.",
        "outputFormat": "Return the minimum number of coins needed, or -1 if impossible.",
        "constraints": "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
        "sampleInput": "coins = [1,5,6,9], amount = 11",
        "sampleOutput": "2",
        "examples": [
            {"input": "coins = [1,5,6,9], amount = 11", "output": "2", "explanation": "11 = 6 + 5 (2 coins)."},
            {"input": "coins = [2], amount = 3", "output": "-1"}
        ]
    }
}

def derive_format_from_meta(meta):
    if not meta:
        return "Standard input parameters.", "Standard return value.", []
    params = meta.get("parameters", [])
    param_strs = [f"{p.get('name')} ({p.get('type')})" for p in params]
    ret_type = meta.get("returnType", "value")
    input_fmt = f"Parameters: {', '.join(param_strs)}." if param_strs else "Standard input parameters."
    output_fmt = f"Returns {ret_type}." if ret_type else "Standard return value."
    samples = []
    for s in meta.get("sampleTests", []):
        samples.append({
            "input": s.get("input", ""),
            "output": s.get("expected", "")
        })
    return input_fmt, output_fmt, samples

def main():
    registry = load_metadata_registry()
    print(f"Loaded {len(registry)} questions from registry")

    with open('data/questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f"Loaded {len(questions)} questions from questions.json")

    repaired_count = 0
    preserved_count = 0

    for q in questions:
        qid = q['id']
        # Strip tcs
        q.pop('tcs', None)

        if qid in REPAIRED_33:
            repaired = REPAIRED_33[qid]
            q['statement'] = repaired['statement']
            q['inputFormat'] = repaired['inputFormat']
            q['outputFormat'] = repaired['outputFormat']
            q['constraints'] = repaired['constraints']
            q['sampleInput'] = repaired['sampleInput']
            q['sampleOutput'] = repaired['sampleOutput']
            q['examples'] = repaired['examples']
            repaired_count += 1
        else:
            preserved_count += 1
            meta = registry.get(str(qid))
            in_fmt, out_fmt, samples = derive_format_from_meta(meta)
            q['inputFormat'] = q.get('inputFormat') or in_fmt
            q['outputFormat'] = q.get('outputFormat') or out_fmt
            if 'examples' not in q or not q['examples']:
                if samples:
                    q['examples'] = samples
                elif q.get('sampleInput') and q.get('sampleOutput'):
                    q['examples'] = [{"input": q['sampleInput'], "output": q['sampleOutput']}]

    with open('data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"Successfully updated questions.json! Repaired: {repaired_count}, Preserved: {preserved_count}")

    # Also update tiers.json
    with open('data/tiers.json', 'r', encoding='utf-8') as f:
        tiers_data = json.load(f)

    if 'questions' in tiers_data and isinstance(tiers_data['questions'], list):
        for tq in tiers_data['questions']:
            tq.pop('tcs', None)
            if tq['id'] in REPAIRED_33:
                r = REPAIRED_33[tq['id']]
                tq['statement'] = r['statement']
                tq['constraints'] = r['constraints']
                tq['sampleInput'] = r['sampleInput']
                tq['sampleOutput'] = r['sampleOutput']

    with open('data/tiers.json', 'w', encoding='utf-8') as f:
        json.dump(tiers_data, f, indent=2, ensure_ascii=False)

    print("Successfully cleaned tiers.json!")

if __name__ == '__main__':
    main()
