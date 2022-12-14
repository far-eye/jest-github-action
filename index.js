const core = require('@actions/core');
const github = require('@actions/github');

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  // Create jest command
  const jestCmd = "npm test -- --ci --json --coverage --testLocationInResults --outputFile=report.json";
  console.log("jestCommand -> ", jestCmd);

} catch (error) {
  core.setFailed(error.message);
}