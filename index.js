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
        await runJestCmd();
        const results = await readResult();
        console.debug('resuls here', { results: results?.success });
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
                    summary: results.success
                        ? `${results.numPassedTests} tests passing in ${results.numPassedTestSuites
                        } suite${results.numPassedTestSuites > 1 ? "s" : ""}.`
                        : `Failed tests: ${results.numFailedTests}/${results.numTotalTests}. Failed suites: ${results.numFailedTests}/${results.numTotalTestSuites}.`,
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
        }
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    }
}

async function runJestCmd() {
    
    try {
        // Create jest command
        const jestCmd = `npm test sortingSaga languageSaga -- --ci --json --coverage --testLocationInResults --outputFile=${TEST_FILE_REPORT}`;
        console.log("jestCommand -> ", jestCmd);
        await exec(jestCmd, [], { cwd: CWD });
        console.debug("jext command executed");
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    } finally {
        return results;
    }
}

async function readResult() {
    let results = null;
    try {
        const resultFilePath = join(CWD, TEST_FILE_REPORT);
        console.log("resultFilePath -> ", resultFilePath);
        results = JSON.parse(readFileSync(resultFilePath, "utf-8"))
        console.debug({ resultsSuccess: Boolean(results?.success) });
    } catch(error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    } finally {
        return results;
    }
}