const core = require('@actions/core');
import { context, getOctokit } from "@actions/github"
import { exec } from "@actions/exec"
import { sep, join, resolve } from "path"
import { readFileSync } from "fs"
import { GitHub } from "@actions/github/lib/utils";

const TEST_FILE_REPORT = "report.json";
const cwd = process.cwd();
const CWD = cwd + sep

runAction();


async function runAction() {
    try {
        let filedList = await findChangesFiledList();
        console.debug("Ashish -> ", filedList);
        // await runJestCmd();
        // const results = await readResult();
        // console.debug('resuls here', { results: results?.success });
        // await printResult(results);
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    }
}

async function findChangesFiledList() {
    try {
        const githubSha = core.getInput('github-sha', {
            required: true,
        });
        const githubPullSha = core.getInput('github-pull-sha', {
            required: true
        });
        const cmd = `git diff --name-only --diff-filter=ACMRT ${githubPullSha} ${githubSha}`;
        const stdout = await exec(cmd)
        console.log(stdout);
        return stdout;
    } catch (error) {
        console.log(error);
    }
}

async function runJestCmd() {

    try {
        // Create jest command
        const jestCmd = `npm test DetectRoutingService -- --ci --json --coverage --testLocationInResults --outputFile=${TEST_FILE_REPORT}`;
        console.log("jestCommand -> ", jestCmd);
        await exec(jestCmd, [], { cwd: CWD });
        console.debug("jext command executed");
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    }
}

async function readResult() {
    let results = null;
    try {
        const resultFilePath = join(CWD, TEST_FILE_REPORT);
        console.log("resultFilePath -> ", resultFilePath);
        results = JSON.parse(readFileSync(resultFilePath, "utf-8"))
        console.debug({ resultsSuccess: Boolean(results?.success) });
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
            name: "jest-github-action-test",
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
            await core.setFailed("Test cases failing");
        }
    }
}