const core = require('@actions/core');
import { context, getOctokit } from "@actions/github"
import { exec } from "@actions/exec"
import { sep, join, resolve } from "path"
import { readFileSync } from "fs"

const TEST_FILE_REPORT = "report.json";
const cwd = process.cwd();
const CWD = cwd + sep

runAction();


async function runAction() {
    try {
        let changedFileList = await findChangesFileList();
        console.log("Changed File List -> ", changedFileList);
        // await runJestCmd(changedFileList);
        // const results = await readResult();
        // if(results) {
        //     await printResult(results);
        // }
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    }
}

async function findChangesFileList() {
    try {
        let exeOutput = '';
        let exeError = '';
        let changedfileList = [];

        const options = {};
        options.listeners = {
            stdout: (data) => {
                exeOutput += data;
            },
            stderr: (data) => {
                exeError += data.toString();
            },
            stdline: data => {
                // For now below code will be executed for all file type
                // ToDo: Run below code only for JS files by adding grep option in exec command

                // Split path (For eg src/services/myservice.js will split into ['src', 'services', 'myservice.js']);
                let path = data.split(sep);
                // Extract fileName from last entry of path array
                let fileNameWithExt = path[path.length-1];
                // Remove extension from JS files
                const fileName = fileNameWithExt.split('.js')?.[0];
                changedfileList.push(fileName);
            }
        };
        // get current branch SHA
        const githubSha = core.getInput('github-sha', {
            required: true,
        });

        // get base branch SHA
        const githubPullSha = core.getInput('github-pull-sha', {
            required: true
        });

        const cmd = `git diff --name-only --diff-filter=ACMRT ${githubPullSha} ${githubSha}`;
        await exec(cmd, [], options)

        const token = core.getInput('github-token', {
            required: true,
        });
        // const client = new GitHub(token)
        const base = context.payload.pull_request?.base?.sha;
        const head = context.payload.pull_request?.head?.sha;

        core.info(`Base commit: ${base}`)
        core.info(`Head commit: ${head}`)
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        // const response = await client.request.compareCommits({
        //     base,
        //     head,
        //     owner: context.repo.owner,
        //     repo: context.repo.repo
        //   })

        // Octokit.js
        // https://github.com/octokit/core.js#readme
        const octokit = getOctokit(token);

        const response = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
            owner,
            repo,
            basehead: `${base}...${head}`
        })  
        //   if (response.status !== 200) {
        //     core.setFailed(
        //       `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
        //         "Please submit an issue on this action's GitHub repo."
        //     )
        //   }
          console.log({response});

        return changedfileList;
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
        const payload = {
            ...context.repo,
            head_sha: context.payload.pull_request?.head.sha ?? context.sha,
            name: "jest-github-action",
            status: "completed",
            conclusion: results.success ? "success" : "failure",
            output: {
                title: results.success ? "Jest tests passed" : "Jest tests failed",
                text: results.success ? "All " + results.numTotalTests + " test cases passed." : results.numFailedTestSuites + " test cases failed out of " + results.numTotalTests,
                summary: `Test Suites: ${results.numPassedTestSuites} passed, ${results.numTotalTestSuites} total`
                    + '\n'
                    + `Tests:       ${results.numPassedTests} passed, ${results.numTotalTests} total`
            }
        }
        console.debug({ payload });
        const token = core.getInput('github-token', {
            required: true,
        });
        const octokit = getOctokit(token);
        await octokit.rest.checks.create(payload)
        const commentPayload = {
            ...context.repo,
            body: payload.output.summary,
            issue_number: context.payload.pull_request?.number ?? 0
        }
        await octokit.rest.issues.createComment(commentPayload);
        if (!results?.success) {
            // Fail action check if all test cases are not successful
            await core.setFailed("Test cases failing.");
        }
    }
}