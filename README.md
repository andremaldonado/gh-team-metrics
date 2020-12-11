This is a simple script to help development teams understand stats based on github activity.

## What this script shows

* A graph with pull requests per week (last 3 months)
* A table with how many pull requests each person opened
* Check TODO for future improvements

## How to run

* Export your [github token](https://developer.github.com/v4/guides/forming-calls/#authenticating-with-graphql) to GH_TOKEN
* Run `node src/index.js --user "username1" --user "username2"`

## TODO

 - [ ] Avoid multiple iterations that is slowing down the script
 - [ ] Show stats based on repo's names
 - [ ] Show time to review stats
 - [ ] Show stats based on PR statuses
 - [ ] Show issues stats based on a repo's project
