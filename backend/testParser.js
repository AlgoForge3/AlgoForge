const axios = require('axios');

const getLeetCodeQuestion = async (titleSlug) => {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        titleSlug
        metaData
        exampleTestcaseList
      }
    }
  `;
  try {
    const res = await axios.post('https://leetcode.com/graphql', {
      operationName: 'questionData',
      variables: { titleSlug },
      query
    });
    console.log(JSON.stringify(res.data.data.question.metaData));
  } catch (err) {
    console.error(err);
  }
};
getLeetCodeQuestion('valid-parentheses');
