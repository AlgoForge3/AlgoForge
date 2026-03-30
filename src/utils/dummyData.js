export const assessmentQuestions = [
  {
    id: 1,
    question: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
    correctAnswer: "O(log n)"
  },
  {
    id: 2,
    question: "Which data structure operates on a Last-In-First-Out (LIFO) principle?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correctAnswer: "Stack"
  },
  {
    id: 3,
    question: "What is the worst-case space complexity of breadth-first search on a tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    correctAnswer: "O(n)"
  }
];

export const mockProblems = [
  // ── Problem 1 ────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays",
    tags: ["Array", "Hash Table"],
    acceptance: "49.1%",
    description: "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to* `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]",  explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6",     output: "[1,2]",  explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
      { input: "nums = [3,3], target = 6",        output: "[0,1]",  explanation: null },
    ],
    constraints: [
      "2 <= nums.length <= 10⁴",
      "-10⁹ <= nums[i] <= 10⁹",
      "-10⁹ <= target <= 10⁹",
      "Only one valid answer exists.",
    ],
    // Test-case display only (actual check data lives on the backend)
    testCases: [
      { display: "nums = [2,7,11,15]\ntarget = 9" },
      { display: "nums = [3,2,4]\ntarget = 6" },
      { display: "nums = [3,3]\ntarget = 6" },
    ],
    starterCode: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};`,
    },
  },

  // ── Problem 2 ────────────────────────────────────────────────────────────────
  {
    id: 2,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays",
    tags: ["Array", "Dynamic Programming"],
    acceptance: "54.3%",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `iᵗʰ` day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return `0`.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5." },
      { input: "prices = [7,6,4,3,1]",   output: "0", explanation: "In this case, no transactions are done and the max profit = 0." },
    ],
    constraints: [
      "1 <= prices.length <= 10⁵",
      "0 <= prices[i] <= 10⁴",
    ],
    testCases: [
      { display: "prices = [7,1,5,3,6,4]" },
      { display: "prices = [7,6,4,3,1]" },
      { display: "prices = [1,2]" },
    ],
    starterCode: {
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        
    }
};`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        
    }
}`,
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        pass
`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    
};`,
    },
  },

  // ── Problem 3 ────────────────────────────────────────────────────────────────
  {
    id: 3,
    title: "Contains Duplicate",
    difficulty: "Easy",
    topic: "Arrays",
    tags: ["Array", "Hash Table", "Sorting"],
    acceptance: "61.5%",
    description: "Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]",             output: "true",  explanation: "The element 1 occurs at the indices 0 and 3." },
      { input: "nums = [1,2,3,4]",             output: "false", explanation: "All elements are distinct." },
      { input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: "true",  explanation: null },
    ],
    constraints: [
      "1 <= nums.length <= 10⁵",
      "-10⁹ <= nums[i] <= 10⁹",
    ],
    testCases: [
      { display: "nums = [1,2,3,1]" },
      { display: "nums = [1,2,3,4]" },
      { display: "nums = [1,1,1,3,3,4,3,2,4,2]" },
    ],
    starterCode: {
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        
    }
};`,
      java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        
    }
}`,
      python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    
};`,
    },
  },
];
