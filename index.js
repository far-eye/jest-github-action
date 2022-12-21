const core = require('@actions/core');
import { context, getOctokit } from "@actions/github"
import { exec } from "@actions/exec"
import { sep, join, resolve } from "path"
import { readFileSync } from "fs"

const TEST_FILE_REPORT = "report.json";
const NO_TEST_MSG = "No test cases available for this PR.";
const cwd = process.cwd();
const CWD = cwd + sep
runAction();


async function runAction() {
    try {
        let changedFileList = await findChangesFileList();
        console.log("Changed File List Count -> ", changedFileList?.length);
        if(changedFileList?.length) {
            await runJestCmd(changedFileList);
            const results = await readResult();
            if(results) {
                await printResult(results);
            }
        } else {
            // if there are no chnages in JS file
            // then donot run jest
            // just post comment for no tests avaialable
            await postComment(NO_TEST_MSG);
        }
        
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    }
}

// This method returns list of files changed in current PR
async function findChangesFileList() {
    try {

        // Get access token from input
        const token = core.getInput('github-token', {
            required: true,
        });
        const base = context.payload.pull_request?.base?.sha;
        const head = context.payload.pull_request?.head?.sha;

        core.info(`Base commit: ${base}`)
        core.info(`Head commit: ${head}`)
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        // Octokit.js
        // https://github.com/octokit/core.js#readme
        const octokit = getOctokit(token);

        // Note - When calculating file changed in current PR, if there are more 300 files in the diff, response will only return 300 files. 
        // To handle more than 300 file, we need to add pagination support in this API call
        // For now pagination support is not added in this action.
        // Refer this link for more details - https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#compare-two-commits
        // Compare base PR base branch commit and feature branch head commit
        const response = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
            owner,
            repo,
            basehead: `${base}...${head}`
        })  
          if (response.status !== 200) {
            core.setFailed(
              `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
                "Please submit an issue on this action's GitHub repo."
            )
          }

        // Filter JS file and then remove .js extension from file name
        const changedFileList = response?.data?.files?.filter(file => file.filename.endsWith('.js'))
            .map(file => {
            let filePath = file.filename;
            // Split path (For eg src/services/myservice.js will split into ['src', 'services', 'myservice.js']);
            let pathList = filePath.split(sep);
            // Extract fileName from last entry of path array
            let fileNameWithExt = pathList[pathList.length - 1];
            // // Remove extension from JS files
            // let fileName = fileNameWithExt.split('.js')?.[0];
            return fileName
        })

        console.log({ response, changedFileList });

        return changedFileList || [];
    } catch (error) {
        core.setFailed(error.message);
    }
}


// This method will run unit test only on chnaged files in current PR 
// and it will write its result in report.json file
async function runJestCmd(changedFiles) {

    try {
        // Create jest command
        const changedFiledStr = changedFiles.join(' ');
        const jestCmd = `npm test ${changedFiledStr} -- --ci --json --coverage --testLocationInResults --passWithNoTests --outputFile=${TEST_FILE_REPORT}`;
        const options = {
            cwd: CWD
        }
        console.log("jest command -> ", jestCmd);
        const stdout = await exec(jestCmd, [], options);
        console.log("Jest command executed");
    } catch (error) {
        console.log("error->", error.message);
    }
}



// This methid will read results written in report.json
async function readResult() {
    let results = null;
    try {
        const resultFilePath = join(CWD, TEST_FILE_REPORT);
        console.log("Result file path -> ", resultFilePath);
        results = JSON.parse(readFileSync(resultFilePath, "utf-8"))
        console.log({ resultsSuccess: Boolean(results?.success) });
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    } finally {
        return results;
    }
}

async function printResult(results) {
    if (results) {
        const isTestsAvailable = Boolean(results.numTotalTestSuites);
        let testSuiteMsg, passedCasesMsg, failedCasesMsg;
        if(isTestsAvailable) {
            // if tests are avaiable then, prepare messages to show to user
            // otherwise skip it
            testSuiteMsg = `Test Suites: ${results.numPassedTestSuites} passed, ${results.numTotalTestSuites} total`;
            passedCasesMsg = `Passed Tests: ${results.numPassedTests} passed, ${results.numTotalTests} total`;
            failedCasesMsg = results.success ? "Failed Tests: " + results.numFailedTests + " failed, " + results.numTotalTests + " total" : ''
        }
        const payload = {
            ...context.repo,
            head_sha: context.payload.pull_request?.head.sha ?? context.sha,
            name: "jest-github-action",
            status: "completed",
            conclusion: results.success ? "success" : "failure",
            output: {
                title: results.success ? "Jest tests passed" 
                    : "Jest tests failed",
                text: results.success ? "All " + results.numTotalTests + " test cases passed." 
                    : results.numFailedTestSuites + " test cases failed out of " + results.numTotalTests,
                // If there are no test suites available for changed files then, print no test message
                // else print count summary in comment
                summary: isTestsAvailable ? `${testSuiteMsg}\n${passedCasesMsg}\n${failedCasesMsg}` : NO_TEST_MSG
                   
            }
        }
        const token = core.getInput('github-token', {
            required: true,
        });
        const octokit = getOctokit(token);
        await octokit.rest.checks.create(payload)
        await postComment(payload.output.summary)
        if (!results?.success) {
            // Fail action check if all test cases are not successful
            await core.setFailed("Test cases failed.");
        }
    }
}



async function postComment(message) {
    const octokit = getOctokit(token);
    const commentPayload = {
        ...context.repo,
        body: message,
        issue_number: context.payload.pull_request?.number ?? 0
    }
    await octokit.rest.issues.createComment(commentPayload);
}