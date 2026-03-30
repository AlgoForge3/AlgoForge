/**
 * Multi-testcase wrappers for Docker execution.
 * Each testCase: { input: number[], expected: number[] }
 * Output format per line: "TC0:val1,val2,..."
 */

const cppWrapper = (userCode, testCases) => {
  const blocks = testCases.map((tc, idx) => {
    const inputVec = tc.input.join(', ');
    return `
    // Test Case ${idx}
    {
        vector<int> _inp = {${inputVec}};
        vector<int> _res = Solution().solve(_inp);
        cout << "TC${idx}:";
        for (size_t i = 0; i < _res.size(); ++i) {
            if (i > 0) cout << ",";
            cout << _res[i];
        }
        cout << "\\n";
    }`;
  }).join('\n');

  return `
#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_map>
#include <string>
#include <climits>
using namespace std;

${userCode}

int main() {
${blocks}
    return 0;
}
`;
};

const javaWrapper = (userCode, testCases) => {
  const blocks = testCases.map((tc, idx) => {
    const inputArr = tc.input.join(', ');
    return `
        // Test Case ${idx}
        {
            int[] _inp = {${inputArr}};
            int[] _res = new Solution().solve(_inp);
            StringBuilder _sb = new StringBuilder("TC${idx}:");
            for (int i = 0; i < _res.length; i++) {
                if (i > 0) _sb.append(",");
                _sb.append(_res[i]);
            }
            System.out.println(_sb.toString());
        }`;
  }).join('\n');

  return `
import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
${blocks}
    }
}
`;
};

const pythonWrapper = (userCode, testCases) => {
  const blocks = testCases.map((tc, idx) => {
    const inputList = `[${tc.input.join(', ')}]`;
    return `
_res = Solution().solve(${inputList})
if isinstance(_res, (list, tuple)):
    print("TC${idx}:" + ",".join(str(x) for x in _res))
else:
    print("TC${idx}:" + str(_res))`;
  }).join('\n');

  return `${userCode}

if __name__ == "__main__":
${blocks.split('\n').map(l => '    ' + l).join('\n')}
`;
};

module.exports = {
  cpp:    { wrapper: cppWrapper    },
  java:   { wrapper: javaWrapper   },
  python: { wrapper: pythonWrapper },
};
