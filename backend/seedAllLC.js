const axios = require('axios');
const mongoose = require('mongoose');
const Problem = require('./models/Problem');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log("Connected to MongoDB...");
        
        let skip = 0;
        const limit = 500;
        let totalFetched = 0;
        
        while (true) {
            console.log(`Fetching from ${skip} to ${skip + limit}...`);
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
                    difficulty
                    frontendQuestionId: questionFrontendId
                    title
                    titleSlug
                    topicTags {
                      name
                    }
                  }
                }
              }
            `;
            
            const res = await axios.post('https://leetcode.com/graphql', {
                operationName: 'problemsetQuestionList',
                variables: { categorySlug: "", skip, limit, filters: {} },
                query
            });
            
            const list = res.data.data.problemsetQuestionList.questions;
            if (list.length === 0) break;

            const bulkOps = list.map(q => ({
                updateOne: {
                    filter: { titleSlug: q.titleSlug },
                    update: {
                        $set: {
                            problemNumber: parseInt(q.frontendQuestionId) || Math.floor(Math.random() * 50000),
                            title: q.title,
                            titleSlug: q.titleSlug,
                            difficulty: q.difficulty,
                            topics: q.topicTags.map(t => t.name),
                            description: "Content locked: Click to auto-fetch from LeetCode",
                            functionName: "Skeleton",
                            returnType: "void",
                        },
                        $setOnInsert: {
                            isSkeleton: true,
                            acceptance: "",
                            testCases: [],
                            parameters: [],
                            starterCode: {}
                        }
                    },
                    upsert: true
                }
            }));

            await Problem.bulkWrite(bulkOps);
            totalFetched += list.length;
            console.log(`Successfully synced ${totalFetched} skeletal records.`);
            
            skip += limit;
            await new Promise(r => setTimeout(r, 1000)); // sleep 1 sec
        }
        
        console.log("Finished syncing ALL LeetCode skeletons!");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

run();
