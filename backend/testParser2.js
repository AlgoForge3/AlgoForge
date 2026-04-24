const axios = require('axios');
const LEETCODE_API = 'https://leetcode.com/graphql';

const run = async () => {
    const slug = 'valid-parentheses';
    
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags { name }
          codeSnippets { lang langSlug code }
          metaData
          exampleTestcaseList
        }
      }
    `;
    const res = await axios.post(LEETCODE_API, { operationName: 'questionData', variables: { titleSlug: slug }, query });
    const q = res.data.data.question;

    const parseOutputsFromHTML = (html) => {
        const outputs = [];
        const regex = /Output(.*?):?<\/strong>\s*(.*?)(?=<|\n)/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            let val = match[2].trim();
            val = val.replace(/<[^>]*>?/gm, '').trim();
            outputs.push(val);
        }
        return outputs;
    };

    const metaData = JSON.parse(q.metaData);
    const outputs = parseOutputsFromHTML(q.content);
    
    const testCases = [];
    q.exampleTestcaseList.forEach((testcaseStr, i) => {
        const inputs = testcaseStr.split('\n');
        const inputObj = {};
        metaData.params.forEach((param, pIdx) => {
            let raw = inputs[pIdx];
            try { raw = JSON.parse(raw); } catch(e){}
            inputObj[param.name] = raw;
        });

        let expected = outputs[i];
        
        console.log("Expected unparsed:", expected); // Let's check what it got
        
        // DONT parse for now, just let it be a string!
        testCases.push({ inputs: inputObj, expected: expected || "", display: testcaseStr });
    });

    console.log("Testcases:", JSON.stringify(testCases, null, 2));
};
run();
