const axios = require('axios');
const Problem = require('../models/Problem');

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
    return res.data?.data?.question;
  } catch (err) {
    console.error(`Error fetching ${titleSlug}:`, err.message);
    return null;
  }
};

const parseOutputsFromHTML = (html) => {
  const outputs = [];
  // Some LC problems use <strong>Output:</strong> <em>true</em>, others <strong>Output:</strong> true
  const regex = /Output(.*?):\s*<\/strong>\s*(?:<em>)?(.*?)(?:<\/em>)?(?=<|\n)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
      let val = match[2].trim();
      val = val.replace(/<[^>]*>?/gm, '').trim();
      outputs.push(val);
  }
  return outputs;
};

const mapType = (lcType) => {
    if(lcType.includes('[]')) return 'vector<int>'; // Approximation
    if(lcType === 'integer') return 'int';
    if(lcType === 'string') return 'string';
    if(lcType === 'boolean') return 'bool';
    return lcType; 
};

// @desc Sync an array of LeetCode title slugs to our DB
const syncLeetcodeProblems = async (req, res) => {
    const slugs = req.body.slugs;
    if(!slugs || !Array.isArray(slugs)) return res.status(400).json({error: "Provide an array of slugs"});

    const synced = [];
    
    for (let slug of slugs) {
        console.log(`Syncing: ${slug}`);
        try {
            const q = await getLeetCodeQuestion(slug);
            if (!q) {
                console.error("Skipped " + slug);
                continue;
            }

            const metaData = JSON.parse(q.metaData);
            const outputs = parseOutputsFromHTML(q.content);
            
            const testCases = [];
            (q.exampleTestcaseList || []).forEach((testcaseStr, i) => {
                const inputs = testcaseStr.split('\n');
                const inputObj = {};
                metaData.params.forEach((param, pIdx) => {
                    let raw = inputs[pIdx];
                    try { raw = JSON.parse(raw); } catch(e){}
                    inputObj[param.name] = raw;
                });

                let expected = outputs[i] ? outputs[i] : "";
                if (expected && expected !== "true" && expected !== "false") {
                    try { expected = JSON.parse(expected); } catch(e){}
                } else if (expected === "true") expected = true;
                else if (expected === "false") expected = false;

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

            const jsCode = q.codeSnippets?.find(s => s.langSlug === 'javascript')?.code || '';
            const cppCode = q.codeSnippets?.find(s => s.langSlug === 'cpp')?.code || '';
            const pyCode = q.codeSnippets?.find(s => s.langSlug === 'python3' || s.langSlug === 'python')?.code || '';
            const javaCode = q.codeSnippets?.find(s => s.langSlug === 'java')?.code || '';

            const problemData = {
                problemNumber: parseInt(q.questionFrontendId) || Math.floor(Math.random() * 10000),
                title: q.title,
                titleSlug: q.titleSlug,
                difficulty: q.difficulty,
                topics: q.topicTags.map(t => t.name),
                description: q.content || "Description not available",
                functionName: metaData.name,
                returnType,
                parameters,
                starterCode: {
                    javascript: jsCode,
                    cpp: cppCode,
                    python: pyCode,
                    java: javaCode
                },
                testCases,
                isSkeleton: false
            };

            const existing = await Problem.findOne({ 
                $or: [
                    { titleSlug: q.titleSlug },
                    { problemNumber: parseInt(q.questionFrontendId) }
                ] 
            });
            let savedProblem;
            if (existing) {
                problemData.problemNumber = existing.problemNumber;
                savedProblem = await Problem.findByIdAndUpdate(existing._id, problemData, { new: true });
            } else {
                savedProblem = await Problem.create(problemData);
            }
            synced.push({ title: savedProblem.title, status: 'Success' });
        } catch (innerErr) {
            console.error(`Error syncing ${slug}:`, innerErr);
        }
    }
    
    return res.json({ message: "Sync complete", results: synced });
};

const seedAllLeetcode = async (req, res) => {
    let skip = 0;
    const limit = 100;
    let totalFetched = 0;
    
    // We send res immediately to prevent timeout, then process in background
    res.json({ message: "Started background syncing of all 3000 problems." });

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
        
        try {
            const lcRes = await axios.post('https://leetcode.com/graphql', {
                operationName: 'problemsetQuestionList',
                variables: { categorySlug: "", skip, limit, filters: {} },
                query
            });
            
            const list = lcRes.data.data.problemsetQuestionList.questions;
            if (!list || list.length === 0) break;

            const bulkOps = list.map(q => {
                const pNum = parseInt(q.frontendQuestionId) || Math.floor(Math.random() * 50000);
                return {
                    updateOne: {
                        filter: { problemNumber: pNum },
                        update: {
                            $set: {
                                title: q.title,
                                titleSlug: q.titleSlug,
                                difficulty: q.difficulty,
                                topics: q.topicTags.map(t => t.name)
                            },
                            $setOnInsert: {
                                description: "Content locked: Click to auto-fetch from LeetCode",
                                functionName: "Skeleton",
                                returnType: "void",
                                isSkeleton: true,
                                acceptance: "",
                                testCases: [],
                                parameters: [],
                                starterCode: {}
                            }
                        },
                        upsert: true
                    }
                };
            });

            await Problem.bulkWrite(bulkOps);
            totalFetched += list.length;
            console.log(`Successfully synced ${totalFetched} skeletal records.`);
            
            skip += limit;
            await new Promise(r => setTimeout(r, 1500)); // sleep to prevent rate limit
        } catch(e) {
            console.error("Bulk sync error at skip " + skip + ": ", e.message);
            break;
        }
    }
    
    console.log("Finished syncing ALL LeetCode skeletons!");
};

module.exports = { syncLeetcodeProblems, seedAllLeetcode };
