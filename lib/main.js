const fs = require('fs');

const NEWLINES_MATCH = /\n|\r|\r\n/;
const DEFAULT_FILENAME = 'required.env';
const COMMENT_CHARACTER = '#';
const EXPECTED_ENCODING = 'utf-8';

function checkRequired({ environmentDefinition = DEFAULT_FILENAME, checkInRequiredEnv = {} } = {}) {

  // Trim each line so stray spaces, tabs, or indentation don't change what a line means
  let lines = fs.readFileSync(environmentDefinition, EXPECTED_ENCODING).split(NEWLINES_MATCH).map(line => line.trim());

  lines.forEach(line => {
    // Ignore empty lines and lines that start with comments
    if (line && !line.startsWith(COMMENT_CHARACTER)) {
      // Verify the env variable exists
      if (!process.env[line]) {
        throw new Error(`Missing environment variable ${line}`);
      }
    }
  });

  // Verify that each optionalReverseCheckVars was found
  Object.keys(checkInRequiredEnv).forEach(toCheck => {
    if (!lines.includes(toCheck)) {
      throw new Error(`${toCheck} is not defined in ${environmentDefinition} as expected`);
    }
  })
}

module.exports.checkRequired = checkRequired;