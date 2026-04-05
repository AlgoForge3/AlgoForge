/**
 * Seed Script — backend/scripts/seedProblems.js
 *
 * Usage:
 *   node backend/scripts/seedProblems.js
 *
 * Clears the `problems` collection and inserts fresh seed data.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
const Problem  = require('../models/Problem');

// ── Seed Data ─────────────────────────────────────────────────────────────────

const seeds = [
  // ── 1. Two Sum ──────────────────────────────────────────────────────────────
  {
    problemNumber: 1,
    title:       'Two Sum',
    difficulty:  'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    topics:      ['Array', 'Hash Table'],
    acceptance:  '49.1%',
    functionName: 'twoSum',
    returnType:   'vector<int>',
    parameters: [
      { type: 'vector<int>', name: 'nums'   },
      { type: 'int',         name: 'target' },
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
    testCases: [
      { inputs: { nums: [2,7,11,15], target: 9 }, expected: [0,1], display: 'nums = [2,7,11,15]\ntarget = 9' },
      { inputs: { nums: [3,2,4],     target: 6 }, expected: [1,2], display: 'nums = [3,2,4]\ntarget = 6'   },
      { inputs: { nums: [3,3],       target: 6 }, expected: [0,1], display: 'nums = [3,3]\ntarget = 6'     },
    ],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]',  explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6',     output: '[1,2]',  explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
      { input: 'nums = [3,3], target = 6',        output: '[0,1]',  explanation: null },
    ],
    constraints: [
      '2 <= nums.length <= 10⁴',
      '-10⁹ <= nums[i] <= 10⁹',
      '-10⁹ <= target <= 10⁹',
      'Only one valid answer exists.',
    ],
  },

  // ── 2. Palindrome Number ────────────────────────────────────────────────────
  {
    problemNumber: 2,
    title:       'Palindrome Number',
    difficulty:  'Easy',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\nFor example, 121 is a palindrome while 123 is not.',
    topics:      ['Math'],
    acceptance:  '55.2%',
    functionName: 'isPalindrome',
    returnType:   'bool',
    parameters: [
      { type: 'int', name: 'x' },
    ],
    starterCode: {
      cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        
    }
};`,
      java: `class Solution {
    public boolean isPalindrome(int x) {
        
    }
}`,
      python: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        pass
`,
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
var isPalindrome = function(x) {
    
};`,
    },
    testCases: [
      { inputs: { x: 121  }, expected: true,  display: 'x = 121'  },
      { inputs: { x: -121 }, expected: false, display: 'x = -121' },
      { inputs: { x: 10   }, expected: false, display: 'x = 10'   },
      { inputs: { x: 0    }, expected: true,  display: 'x = 0'    },
    ],
    examples: [
      { input: 'x = 121',  output: 'true',  explanation: '121 reads as 121 from left to right and from right to left.' },
      { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.' },
      { input: 'x = 10',   output: 'false', explanation: 'Reads 01 from right to left. Therefore it is not a palindrome.' },
    ],
    constraints: [
      '-2³¹ <= x <= 2³¹ - 1',
    ],
  },

  // ── 3. Reverse String ───────────────────────────────────────────────────────
  {
    problemNumber: 3,
    title:       'Reverse String',
    difficulty:  'Easy',
    description: 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\nFor this problem, we encode the character array as their ASCII values and return the reversed ASCII array.',
    topics:      ['Two Pointers', 'String'],
    acceptance:  '75.6%',
    functionName: 'reverseString',
    returnType:   'vector<int>',
    parameters: [
      { type: 'vector<int>', name: 's' },
    ],
    starterCode: {
      cpp: `class Solution {
public:
    vector<int> reverseString(vector<int>& s) {
        // s contains ASCII values of characters
        // Reverse in-place and return s
        
    }
};`,
      java: `class Solution {
    public int[] reverseString(int[] s) {
        // s contains ASCII values of characters
        // Reverse in-place and return s
        
    }
}`,
      python: `class Solution:
    def reverseString(self, s: List[int]) -> List[int]:
        # s contains ASCII values of characters
        # Reverse in-place and return s
        pass
`,
      javascript: `/**
 * @param {number[]} s  (ASCII values)
 * @return {number[]}
 */
var reverseString = function(s) {
    
};`,
    },
    testCases: [
      { inputs: { s: [104,101,108,108,111] }, expected: [111,108,108,101,104], display: 's = ["h","e","l","l","o"]  (ASCII)' },
      { inputs: { s: [72,97,110,110,97,104] }, expected: [104,97,110,110,97,72], display: 's = ["H","a","n","n","a","h"]  (ASCII)' },
    ],
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: null },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: null },
    ],
    constraints: [
      '1 <= s.length <= 10⁵',
      's[i] is a printable ASCII character.',
    ],
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Clear existing problems
  await Problem.deleteMany({});
  console.log('🗑️   Cleared problems collection');

  // Insert fresh seed data
  const inserted = await Problem.insertMany(seeds);
  console.log(`🌱  Seeded ${inserted.length} problems:`);
  inserted.forEach(p => console.log(`     • [${p.problemNumber}] ${p.title}  (${p.difficulty})`));

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Seeding complete!');
}

seed().catch(err => {
  console.error('❌  Seeding failed:', err.message);
  process.exit(1);
});
