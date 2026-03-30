/**
 * Dynamic LeetCode-style wrapper generator.
 *
 * generateWrapper(language, userCode, problemMeta, testCases)
 *   → full source code ready to compile & run inside Docker
 *
 * problemMeta shape:
 *   { functionName, returnType, parameters: [{type, name}] }
 *
 * testCases shape:
 *   [{ inputs: { [paramName]: value }, expected: any }]
 *
 * Output per test case (one line):  TC0:val,val,...
 */

// ── C++ helpers ───────────────────────────────────────────────────────────────

/** Render a JS value as a C++ literal matching the parameter type. */
function cppLiteral(type, value) {
  const t = type.replace(/\s/g, '');

  if (t === 'int' || t === 'long' || t === 'long long') {
    return String(value);
  }
  if (t === 'bool') {
    return value ? 'true' : 'false';
  }
  if (t === 'string') {
    return `"${String(value)}"`;
  }
  if (t === 'vector<int>' || t === 'vector<int>&') {
    const arr = Array.isArray(value) ? value : [];
    return `{${arr.join(', ')}}`;
  }
  if (t === 'vector<string>' || t === 'vector<string>&') {
    const arr = Array.isArray(value) ? value : [];
    return `{${arr.map(s => `"${s}"`).join(', ')}}`;
  }
  if (t === 'vector<vector<int>>' || t === 'vector<vector<int>>&') {
    const arr = Array.isArray(value) ? value : [];
    return `{${arr.map(row => `{${row.join(', ')}}`).join(', ')}}`;
  }
  // Fallback — treat as int
  return String(value);
}

/** Render a C++ variable declaration: "vector<int> nums = {1,2,3};" */
function cppDecl(param, value, varSuffix) {
  // Strip & from type for variable declaration
  const rawType = param.type.replace(/&$/, '').trim();
  const lit      = cppLiteral(param.type, value);
  return `        ${rawType} _${param.name}${varSuffix} = ${lit};`;
}

/** Print a C++ result given returnType. */
function cppPrintResult(returnType, resultVar, idxStr) {
  const t = returnType.replace(/\s/g, '');
  if (t === 'vector<int>' || t === 'vector<long long>') {
    return `
        cout << "TC${idxStr}:";
        for (size_t _i = 0; _i < ${resultVar}.size(); ++_i) {
            if (_i > 0) cout << ",";
            cout << ${resultVar}[_i];
        }
        cout << "\\n";`;
  }
  if (t === 'vector<string>') {
    return `
        cout << "TC${idxStr}:";
        for (size_t _i = 0; _i < ${resultVar}.size(); ++_i) {
            if (_i > 0) cout << ",";
            cout << ${resultVar}[_i];
        }
        cout << "\\n";`;
  }
  if (t === 'bool') {
    return `
        cout << "TC${idxStr}:" << (${resultVar} ? "true" : "false") << "\\n";`;
  }
  // int, long, etc.
  return `
        cout << "TC${idxStr}:" << ${resultVar} << "\\n";`;
}

function generateCppWrapper(userCode, problemMeta, testCases) {
  const { functionName, returnType, parameters } = problemMeta;

  const blocks = testCases.map((tc, idx) => {
    const decls = parameters
      .map(p => cppDecl(p, tc.inputs[p.name], `_${idx}`))
      .join('\n');
    const argList = parameters.map(p => `_${p.name}_${idx}`).join(', ');
    const callExpr = `_sol.${functionName}(${argList})`;
    const printBlock = cppPrintResult(returnType, `_result_${idx}`, idx);
    return `
    // ── Test Case ${idx} ──
    {
${decls}
        auto _result_${idx} = _sol.${functionName}(${parameters.map(p => `_${p.name}_${idx}`).join(', ')});
${printBlock}
    }`;
  }).join('\n');

  return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <climits>
#include <numeric>
using namespace std;

${userCode}

int main() {
    Solution _sol;
${blocks}
    return 0;
}
`;
}

// ── Java helpers ──────────────────────────────────────────────────────────────

function javaLiteral(type, value) {
  const t = type.replace(/\s/g, '');
  if (t === 'int' || t === 'long')  return String(value);
  if (t === 'boolean')              return value ? 'true' : 'false';
  if (t === 'String')               return `"${value}"`;
  if (t === 'int[]')                return `new int[]{${(value || []).join(', ')}}`;
  if (t === 'long[]')               return `new long[]{${(value || []).join(', ')}}`;
  if (t === 'String[]')             return `new String[]{${(value || []).map(s => `"${s}"`).join(', ')}}`;
  if (t === 'int[][]') {
    const rows = (value || []).map(r => `{${r.join(', ')}}`);
    return `new int[][]{${rows.join(', ')}}`;
  }
  return String(value);
}

function javaPrintResult(returnType, resultVar, idxStr) {
  const t = returnType.replace(/\s/g, '');
  if (t === 'int[]' || t === 'long[]') {
    return `
            StringBuilder _sb${idxStr} = new StringBuilder("TC${idxStr}:");
            for (int _i = 0; _i < ${resultVar}.length; _i++) {
                if (_i > 0) _sb${idxStr}.append(",");
                _sb${idxStr}.append(${resultVar}[_i]);
            }
            System.out.println(_sb${idxStr}.toString());`;
  }
  if (t === 'boolean') {
    return `
            System.out.println("TC${idxStr}:" + ${resultVar});`;
  }
  // int, long, String, etc.
  return `
            System.out.println("TC${idxStr}:" + ${resultVar});`;
}

function generateJavaWrapper(userCode, problemMeta, testCases) {
  const { functionName, returnType, parameters } = problemMeta;

  const blocks = testCases.map((tc, idx) => {
    const decls = parameters
      .map(p => {
        const lit = javaLiteral(p.type, tc.inputs[p.name]);
        return `            ${p.type} _${p.name}_${idx} = ${lit};`;
      })
      .join('\n');
    const argList = parameters.map(p => `_${p.name}_${idx}`).join(', ');
    const resultDecl = `            ${returnType} _result_${idx} = new Solution().${functionName}(${argList});`;
    const printBlock = javaPrintResult(returnType, `_result_${idx}`, idx);

    return `
        // ── Test Case ${idx} ──
        {
${decls}
${resultDecl}
${printBlock}
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
}

// ── Python helpers ────────────────────────────────────────────────────────────

function pyLiteral(value) {
  if (Array.isArray(value)) return `[${value.map(pyLiteral).join(', ')}]`;
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'string')  return `"${value}"`;
  return String(value);
}

function pyPrintResult(returnType, resultVar, idxStr) {
  const t = returnType.replace(/\s/g, '');
  if (t === 'vector<int>' || t === 'List[int]' || t.startsWith('vector') || t.startsWith('List')) {
    return `
    if isinstance(${resultVar}, (list, tuple)):
        print("TC${idxStr}:" + ",".join(str(x) for x in ${resultVar}))
    else:
        print("TC${idxStr}:" + str(${resultVar}))`;
  }
  if (t === 'bool') {
    return `
    print("TC${idxStr}:" + ("true" if ${resultVar} else "false"))`;
  }
  return `
    print("TC${idxStr}:" + str(${resultVar}))`;
}

function generatePythonWrapper(userCode, problemMeta, testCases) {
  const { functionName, returnType, parameters } = problemMeta;

  const blocks = testCases.map((tc, idx) => {
    const argLiterals = parameters.map(p => pyLiteral(tc.inputs[p.name])).join(', ');
    const resultVar   = `_result_${idx}`;
    const printBlock  = pyPrintResult(returnType, resultVar, idx);
    return `
# ── Test Case ${idx} ──
${resultVar} = Solution().${functionName}(${argLiterals})${printBlock}`;
  }).join('\n');

  return `${userCode}

if __name__ == "__main__":
${blocks.split('\n').map(l => '    ' + l).join('\n')}
`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a complete, compilable source file.
 *
 * @param {string} language     - 'cpp' | 'java' | 'python'
 * @param {string} userCode     - The Solution class written by the user
 * @param {object} problemMeta  - { functionName, returnType, parameters }
 * @param {Array}  testCases    - [{ inputs: {...}, expected: ... }]
 * @returns {string} Full source code ready for Docker
 */
function generateWrapper(language, userCode, problemMeta, testCases) {
  switch (language) {
    case 'cpp':    return generateCppWrapper(userCode, problemMeta, testCases);
    case 'java':   return generateJavaWrapper(userCode, problemMeta, testCases);
    case 'python': return generatePythonWrapper(userCode, problemMeta, testCases);
    default: throw new Error(`Unsupported language: ${language}`);
  }
}

module.exports = { generateWrapper };
