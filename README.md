# Run Jest Unit Test Action

This action run jest unit test and generate a report and fail PR if any test cases are failing

This action will run unit test only for files changed in current PR. 
If all test cases are passing, it will mark PR as success. If any test cases are failing, 
then it will mark PR as failed 


If no test cases are pesent for any changed file, then it will mark PR as success. 


**Note - When calculating file changed in current PR, if there are more 300 files in the diff, it will only pick 300 files. 
For now pagination support is not added in this action.
Refer this link for more details - https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#compare-two-commits**

## Example usage

```yaml
steps:
  - uses: actions/checkout@v3
    with:
      fetch-depth: 0
  - name: Installing dependencies
    run: npm install --legacy-peer-deps 
  - name: Jest Action
    uses: far-eye/jest-github-action@v2.0.0
```
