const axios = require('axios');
const LEETCODE_API = 'https://leetcode.com/graphql';
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
axios.post(LEETCODE_API, { operationName: 'questionData', variables: { titleSlug: 'logger-rate-limiter' }, query })
  .then(res => console.log(JSON.stringify(res.data.data.question, null, 2)))
  .catch(e => console.error(e.message));
