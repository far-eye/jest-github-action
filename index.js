const core = require('@actions/core');
const github = require('@actions/github');
import { exec } from "@actions/exec"
import { sep, join, resolve } from "path"

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  // Create jest command
  const jestCmd = "npm test -- --ci --json --coverage --testLocationInResults --outputFile=report.json";
  console.log("jestCommand -> ", jestCmd);

  try {
    await exec(jestCmd);
    const cwd = process.cwd();
    const resultFilePath = join(cwd, "report.json");
    console.log("resultFilePath -> ", resultFilePath);
  } catch(error) {
    console.error("Something went wrong", error.message);
  }

} catch (error) {
  core.setFailed(error.message);
}