const axios = require('axios');
const fs = require('fs');

const run = async () => {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              id
              slug
            }
            hasSolution
            hasVideoSolution
          }
        }
      }
    `;
    
    try {
        const res = await axios.post('https://leetcode.com/graphql', {
            operationName: 'problemsetQuestionList',
            variables: { categorySlug: "", skip: 0, limit: 10, filters: {} },
            query
        });
        console.log(JSON.stringify(res.data.data.problemsetQuestionList.questions[0], null, 2));
    } catch(err) {
        console.error(err.message);
    }
};

run();
