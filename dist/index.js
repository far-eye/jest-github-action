/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 377:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 961:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 833:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 773:
/***/ ((module) => {

module.exports = eval("require")("@actions/github/lib/utils");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ../../.nvm/versions/node/v16.19.0/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/github
var github = __nccwpck_require__(833);
// EXTERNAL MODULE: ../../.nvm/versions/node/v16.19.0/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/exec
var exec = __nccwpck_require__(961);
;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
;// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");
// EXTERNAL MODULE: ../../.nvm/versions/node/v16.19.0/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/github/lib/utils
var utils = __nccwpck_require__(773);
;// CONCATENATED MODULE: ./index.js
const core = __nccwpck_require__(377);






const TEST_FILE_REPORT = "report.json";
const cwd = process.cwd();
const CWD = cwd + external_path_namespaceObject.sep

runAction();


async function runAction() {
    try {
        let fileList = await findChangesFileList();
        console.debug("Ashish -> ", fileList);
        await runJestCmd(fileList);
        const results = await readResult();
        console.debug('resuls here', { results: results?.success });
        console.debug('resuls here', { results });
        await printResult(results);
    } catch (error) {
        console.log("error->", error.message);
        core.setFailed(error.message)
    }
}

async function findChangesFileList() {
    try {
        let myOutput = '';
        let myError = '';
        let fileList = [];

        const options = {};
        options.listeners = {
            stdout: (data) => {
                myOutput += data;
            },
            stderr: (data) => {
                myError += data.toString();
            },
            stdline: data => {
                console.log({data});
                let path = data.split('/');
                let fileNameWithExt = path[path.length-1];
                const fileName = fileNameWithExt.split('.js')?.[0];
                console.debug("stlinedata -> ", {fileName: fileName});
                fileList.push(fileName);
            }
        };
        const githubSha = core.getInput('github-sha', {
            required: true,
        });
        const githubPullSha = core.getInput('github-pull-sha', {
            required: true
        });
        const cmd = `git diff --name-only --diff-filter=ACMRT ${githubPullSha} ${githubSha}`;
        const stdout = await (0,exec.exec)(cmd, [], options)
        return fileList;
    } catch (error) {
        console.log(error);
    }
}

async function runJestCmd(changedFiles) {

    try {
        // Create jest command
        const changedFiledStr = changedFiles.join(' ');
        const jestCmd = `npm test ${changedFiledStr} -- --ci --json --coverage --testLocationInResults --passWithNoTests --outputFile=${TEST_FILE_REPORT}`;
        
        let myOutput = '';
        let myError = '';

        const options = {};
        options.listeners = {
            stdout: (data) => {
                myOutput += data;
            },
            stderr: (data) => {
                myError += data.toString();
            },
            stdline: data => {
                // console.log({stdline});
            }
        };
        options.cwd = CWD;
        
        
        // const jestCmd = `npm test --listTests --findRelatedTests ${changedFiledStr}`;
        console.log("jestCommand -> ", jestCmd);
        // await exec(jestCmd, [], { cwd: CWD });
        const stdout = await (0,exec.exec)(jestCmd, [], options);
        // console.debug({ myOutput, myError});
        console.debug("jext command executed");
    } catch (error) {
        console.log("error->", error.message);
        // core.setFailed(error.message)
    }
}

async function readResult() {
    let results = null;
    try {
        const resultFilePath = (0,external_path_namespaceObject.join)(CWD, TEST_FILE_REPORT);
        console.log("resultFilePath -> ", resultFilePath);
        results = JSON.parse((0,external_fs_namespaceObject.readFileSync)(resultFilePath, "utf-8"))
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
            ...github.context.repo,
            head_sha: github.context.payload.pull_request?.head.sha ?? github.context.sha,
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
        const octokit = (0,github.getOctokit)(token);
        await octokit.rest.checks.create(payload)
        const commentPayload = {
            ...github.context.repo,
            body: payload.output.summary,
            issue_number: github.context.payload.pull_request?.number ?? 0
        }
        await octokit.rest.issues.createComment(commentPayload);
        if (!results?.success) {
            // Fail action check if all test cases are not successful
            await core.setFailed("Test cases failing");
        }
    }
}
})();

module.exports = __webpack_exports__;
/******/ })()
;