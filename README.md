# Run Jest Unit Test Action

This action run jest unit test and generate a report and fail PR if any test cases are failing

This action will run unit test only for files changed in current PR. 

If no test cases are pesent for any file, then it will mark PR as success. 
If any test cases are failing, then it will mark PR as failed 

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
