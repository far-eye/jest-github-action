# Run Jest Unit Test Action

This action run jest unit test and generate a report and fail PR if any test cases are failing

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
