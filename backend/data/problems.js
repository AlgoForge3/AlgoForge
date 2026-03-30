/**
 * Backend problem registry.
 * Each problem carries:
 *   - functionName / returnType / parameters  →  used to generate LeetCode-style wrappers
 *   - testCases: { inputs: { [paramName]: value }, expected: value }
 *
 * Input encoding strategy
 * ─────────────────────────────────────────────────────────────────────────
 * The wrapper receives typed per-parameter inputs from `testCases[n].inputs`.
 * It instantiates a Solution, calls the real function with those args, and
 * prints the result with a "TC<n>:" prefix so dockerService can parse it.
 */

const problems = [
  {
    id: 1,
    functionName: 'twoSum',
    returnType:   'vector<int>',
    parameters: [
      { type: 'vector<int>', name: 'nums'   },
      { type: 'int',         name: 'target' },
    ],
    testCases: [
      { inputs: { nums: [2,7,11,15], target: 9  }, expected: [0,1], display: 'nums = [2,7,11,15]\ntarget = 9'  },
      { inputs: { nums: [3,2,4],     target: 6  }, expected: [1,2], display: 'nums = [3,2,4]\ntarget = 6'  },
      { inputs: { nums: [3,3],       target: 6  }, expected: [0,1], display: 'nums = [3,3]\ntarget = 6'  },
    ],
  },
  {
    id: 2,
    functionName: 'maxProfit',
    returnType:   'int',
    parameters: [
      { type: 'vector<int>', name: 'prices' },
    ],
    testCases: [
      { inputs: { prices: [7,1,5,3,6,4] }, expected: 5, display: 'prices = [7,1,5,3,6,4]' },
      { inputs: { prices: [7,6,4,3,1]   }, expected: 0, display: 'prices = [7,6,4,3,1]'   },
      { inputs: { prices: [1,2]          }, expected: 1, display: 'prices = [1,2]'          },
    ],
  },
  {
    id: 3,
    functionName: 'containsDuplicate',
    returnType:   'bool',
    parameters: [
      { type: 'vector<int>', name: 'nums' },
    ],
    testCases: [
      { inputs: { nums: [1,2,3,1]             }, expected: true,  display: 'nums = [1,2,3,1]'             },
      { inputs: { nums: [1,2,3,4]             }, expected: false, display: 'nums = [1,2,3,4]'             },
      { inputs: { nums: [1,1,1,3,3,4,3,2,4,2] }, expected: true,  display: 'nums = [1,1,1,3,3,4,3,2,4,2]' },
    ],
  },
];

/**
 * Look up a problem by id. Returns undefined if not found.
 * @param {number} id
 */
function getProblemById(id) {
  return problems.find(p => p.id === Number(id));
}

module.exports = { problems, getProblemById };
