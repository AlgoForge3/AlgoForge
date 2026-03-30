const cppTemplate = `class Solution {
public:
    vector<int> solve(vector<int>& arr) {
        // Write your solution here
        return arr;
    }
};`;

const cppWrapper = (userCode) => `
#include <iostream>
#include <vector>

using namespace std;

${userCode}

int main() {
    Solution sol;
    vector<int> input = {1, 2, 3, 4, 5};
    vector<int> result = sol.solve(input);
    
    cout << "[";
    for(size_t i = 0; i < result.size(); ++i) {
        cout << result[i];
        if(i != result.size() - 1) cout << ", ";
    }
    cout << "]" << endl;
    return 0;
}
`;

const javaTemplate = `class Solution {
    public int[] solve(int[] arr) {
        // Write your solution here
        return arr;
    }
}`;

const javaWrapper = (userCode) => `
import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] input = {1, 2, 3, 4, 5};
        int[] result = sol.solve(input);
        
        System.out.print("[");
        for(int i = 0; i < result.length; ++i) {
            System.out.print(result[i]);
            if(i != result.length - 1) System.out.print(", ");
        }
        System.out.println("]");
    }
}
`;

const pythonTemplate = `class Solution:
    def solve(self, arr):
        # Write your solution here
        return arr
`;

const pythonWrapper = (userCode) => `
${userCode}

if __name__ == "__main__":
    sol = Solution()
    input_arr = [1, 2, 3, 4, 5]
    result = sol.solve(input_arr)
    print(result)
`;

module.exports = {
    cpp: { template: cppTemplate, wrapper: cppWrapper },
    java: { template: javaTemplate, wrapper: javaWrapper },
    python: { template: pythonTemplate, wrapper: pythonWrapper }
};
