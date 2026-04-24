const axios = require('axios');
const mongoose = require('mongoose');
const Problem = require('./models/Problem');
require('dotenv').config();

const LEETCODE_API = 'https://leetcode.com/graphql';

const getLeetCodeQuestion = async (titleSlug) => {
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

  try {
    const res = await axios.post(LEETCODE_API, {
      operationName: 'questionData',
      variables: { titleSlug },
      query
    });
    return res.data.data.question;
  } catch (err) {
    console.error(`Error fetching ${titleSlug}:`, err.message);
    return null;
  }
};

const parseOutputsFromHTML = (html) => {
  const outputs = [];
  // Regex to match "Output: </strong> [0,1]" or similar.
  const regex = /Output(.*?):?<\/strong>\s*(.*?)(?=<|\n)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
      // The second capture group should be the value.
      let val = match[2].trim();
      // Remove any trailing tags just in case
      val = val.replace(/<[^>]*>?/gm, '').trim();
      outputs.push(val);
  }
  return outputs;
};

const mapType = (lcType) => {
    // Map leetcode type to our types
    if(lcType.includes('integer[]')) return 'vector<int>';
    if(lcType === 'integer') return 'int';
    if(lcType === 'string') return 'string';
    if(lcType === 'boolean') return 'bool';
    return lcType; 
};

const syncProblem = async (titleSlug) => {
  console.log(`Syncing: ${titleSlug}`);
  const q = await getLeetCodeQuestion(titleSlug);
  if (!q) return;

  const metaData = JSON.parse(q.metaData);
  const outputs = parseOutputsFromHTML(q.content);
  
  const testCases = [];
  q.exampleTestcaseList.forEach((testcaseStr, i) => {
      const inputs = testcaseStr.split('\n');
      const inputObj = {};
      metaData.params.forEach((param, pIdx) => {
          let raw = inputs[pIdx];
          // Try to parse arrays or numbers, otherwise keep as string
          try { raw = JSON.parse(raw); } catch(e){}
          inputObj[param.name] = raw;
      });

      let expected = outputs[i];
      if (expected) {
          try { expected = JSON.parse(expected); } catch(e){}
      } else {
          expected = ""; // Fallback
      }

      testCases.push({
          inputs: inputObj,
          expected,
          display: testcaseStr
      });
  });

  const parameters = metaData.params.map(p => ({
      name: p.name,
      type: mapType(p.type)
  }));
  const returnType = mapType(metaData.return.type);

  // Extract Starter Snippets
  const jsCode = q.codeSnippets?.find(s => s.langSlug === 'javascript')?.code || '';
  const cppCode = q.codeSnippets?.find(s => s.langSlug === 'cpp')?.code || '';
  const pyCode = q.codeSnippets?.find(s => s.langSlug === 'python3' || s.langSlug === 'python')?.code || '';
  const javaCode = q.codeSnippets?.find(s => s.langSlug === 'java')?.code || '';

  const problemData = {
      problemNumber: parseInt(q.questionFrontendId),
      title: q.title,
      titleSlug: q.titleSlug,
      difficulty: q.difficulty,
      topics: q.topicTags.map(t => t.name),
      description: q.content,
      functionName: metaData.name,
      returnType,
      parameters,
      starterCode: {
          javascript: jsCode,
          cpp: cppCode,
          python: pyCode,
          java: javaCode
      },
      testCases
  };

  const existing = await Problem.findOne({ titleSlug });
  let savedProblem;
  if (existing) {
      problemData.problemNumber = existing.problemNumber; // Maintain stable ID 
      savedProblem = await Problem.findByIdAndUpdate(existing._id, problemData, { new: true });
      console.log(`Updated problem ${savedProblem.problemNumber}: ${savedProblem.title}`);
  } else {
      savedProblem = await Problem.create(problemData);
      console.log(`Created new problem ${savedProblem.problemNumber}: ${savedProblem.title}`);
  }
};

const run = async () => {
  try {
      await mongoose.connect(process.env.MONGO_URI, { family: 4 });
      const problemsToSync = [
          'two-sum',
          'valid-parentheses',
          'climbing-stairs',
          'merge-two-sorted-lists',
          'longest-common-prefix',
          'roman-to-integer'
      ];

      for (let slug of problemsToSync) {
          await syncProblem(slug);
      }

      console.log('Finished syncing LeetCode problems!');
      process.exit(0);
  } catch (err) {
      console.error(err);
      process.exit(1);
  }
};

run();
