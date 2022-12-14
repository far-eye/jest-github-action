const core = require('@actions/core');
import { context, getOctokit } from "@actions/github"
import { exec } from "@actions/exec"
import { sep, join, resolve } from "path"
import { readFileSync } from "fs"

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  // Create jest command
  const jestCmd = "npm test sortingSaga -- --ci --json --coverage --testLocationInResults --outputFile=report.json";
  console.log("jestCommand -> ", jestCmd);

  await exec(jestCmd);
  const cwd = process.cwd();
  const resultFilePath = join(cwd, "report.json");
  console.log("resultFilePath -> ", resultFilePath);
  const results = JSON.parse(readFileSync(resultFilePath, "utf-8"))
  console.debug({results});
  // const payload = {
  //   ...context.repo,
  //   head_sha: context.payload.pull_request?.head.sha ?? context.sha,
  //   name: "jest-github-action-test",
  //   status: "completed",
  //   conclusion: results.success ? "success" : "failure",
  //   output: {
  //     title: results.success ? "Jest tests passed" : "Jest tests failed",
  //     text: results.success ? "All " + results.numTotalTests + " test cases passed." : results.numFailedTestSuites + " test cases failed out of " + results.numTotalTests,
  //     summary: results.success
  //       ? `${results.numPassedTests} tests passing in ${results.numPassedTestSuites
  //       } suite${results.numPassedTestSuites > 1 ? "s" : ""}.`
  //       : `Failed tests: ${results.numFailedTests}/${results.numTotalTests}. Failed suites: ${results.numFailedTests}/${results.numTotalTestSuites}.`,
  //   }
  // }
  // console.debug({payload});
  // const token = core.getInput('github-token', {
  //   required: true,
  // });
  // const octokit = getOctokit(token);
  // await octokit.rest.checks.create(payload)
  // const commentPayload = {
  //   ...context.repo,
  //   body: payload.output.summary,
  //   issue_number: context.payload.pull_request?.number ?? 0
  // }
  // await octokit.rest.issues.createComment(commentPayload);

} catch (error) {
  console.log("error->", error.message);
  core.setFailed(error.message)
}