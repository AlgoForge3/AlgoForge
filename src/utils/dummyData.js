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
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    starterCode: {
      cpp: "class Solution {\npublic:\n    // arr = {nums, target} style: arr[0..n-2] are elements, arr[n-1] is target\n    vector<int> solve(vector<int>& arr) {\n        int n = arr.size();\n        int target = arr[n - 1];\n        for (int i = 0; i < n - 1; i++)\n            for (int j = i + 1; j < n - 1; j++)\n                if (arr[i] + arr[j] == target)\n                    return {i, j};\n        return {-1, -1};\n    }\n};",
      java: "class Solution {\n    // arr last element is target; rest are nums\n    public int[] solve(int[] arr) {\n        int n = arr.length;\n        int target = arr[n - 1];\n        for (int i = 0; i < n - 1; i++)\n            for (int j = i + 1; j < n - 1; j++)\n                if (arr[i] + arr[j] == target)\n                    return new int[]{i, j};\n        return new int[]{-1, -1};\n    }\n}",
      python: "class Solution:\n    # arr: last element is target; rest are nums\n    def solve(self, arr):\n        target = arr[-1]\n        nums = arr[:-1]\n        seen = {}\n        for i, val in enumerate(nums):\n            if target - val in seen:\n                return [seen[target - val], i]\n            seen[val] = i\n        return [-1, -1]",
      javascript: "// Note: JS execution not yet supported via Docker.\n// Please use C++, Java, or Python.\nfunction solve(arr) {\n    \n}"
    }
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Medium",
    topic: "Stacks",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    starterCode: {
      cpp: "class Solution {\npublic:\n    // The wrapper passes arr = {ascii values}; but for this problem\n    // write your logic assuming arr represents your working data\n    vector<int> solve(vector<int>& arr) {\n        // Placeholder: return arr unchanged\n        return arr;\n    }\n};",
      java: "class Solution {\n    public int[] solve(int[] arr) {\n        return arr;\n    }\n}",
      python: "class Solution:\n    def solve(self, arr):\n        return arr",
      javascript: "// JS execution not yet supported via Docker.\nfunction solve(arr) {\n    \n}"
    }
  },
  {
    id: 3,
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    topic: "Linked Lists",
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.\n\nThe linked-lists are merged by splicing together the nodes of the first two lists, and so on.",
    starterCode: {
      cpp: "class Solution {\npublic:\n    vector<int> solve(vector<int>& arr) {\n        // Placeholder\n        sort(arr.begin(), arr.end());\n        return arr;\n    }\n};",
      java: "import java.util.*;\nclass Solution {\n    public int[] solve(int[] arr) {\n        Arrays.sort(arr);\n        return arr;\n    }\n}",
      python: "class Solution:\n    def solve(self, arr):\n        return sorted(arr)",
      javascript: "// JS execution not yet supported via Docker.\nfunction solve(arr) {\n    \n}"
    }
  }
];
