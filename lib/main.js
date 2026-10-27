const fs = require('fs');

const LINE_BREAKS = /\r\n|\r|\n/;
const DEFAULT_FILENAME = 'required.env';
const COMMENT_CHARACTER = '#';
const EXPECTED_ENCODING = 'utf-8';
const QUOTES = ['"', '\'', '`'];

// One .env line: optional `export`, a name made of dotenv's key characters, then
// either `=value`, an inline `# comment`, or nothing. Values are never used.
const LINE_MATCH = /^(?:export\s+)?([\w.-]+)\s*(?:(=)(.*)|#.*)?$/;

// Reads the variable names out of a file written in .env syntax, so a
// .env.example can be used as the definition file as-is.
function parseNames(contents, environmentDefinition) {
  const lines = contents.split(LINE_BREAKS);
  const names = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();

    // Ignore empty lines and comments
    if (!line || line.startsWith(COMMENT_CHARACTER)) {
      continue;
    }

    const match = LINE_MATCH.exec(line);
    if (!match) {
      throw new Error(`Unable to parse line ${index + 1} of ${environmentDefinition}: ${line}`);
    }
    names.push(match[1]);

    // A quoted value can span lines; skip to its closing quote so the lines
    // inside it aren't read as names
    const value = match[2] ? match[3].trim() : '';
    const quote = QUOTES.find(candidate => value.startsWith(candidate));
    if (quote && value.indexOf(quote, 1) === -1) {
      const start = index;
      do {
        index++;
        if (index >= lines.length) {
          throw new Error(`Unterminated quoted value for ${match[1]} on line ${start + 1} of ${environmentDefinition}`);
        }
      } while (!lines[index].includes(quote));
    }
  }

  return names;
}

function checkRequired({ environmentDefinition = DEFAULT_FILENAME, checkInRequiredEnv = {}, allowEmptyValues = false } = {}) {
  const names = parseNames(fs.readFileSync(environmentDefinition, EXPECTED_ENCODING), environmentDefinition);

  // Like dotenv-safe, an empty value counts as missing unless allowEmptyValues is set
  const missing = names.filter(name => process.env[name] === undefined || (!allowEmptyValues && process.env[name] === ''));
  if (missing.length) {
    const label = missing.length === 1 ? 'Missing environment variable' : 'Missing environment variables';
    const error = new Error(`${label} ${missing.join(', ')}`);
    error.missing = missing;
    throw error;
  }

  // Verify that every variable in checkInRequiredEnv is listed in the definition file
  const notListed = Object.keys(checkInRequiredEnv || {}).filter(name => !names.includes(name));
  if (notListed.length) {
    const verb = notListed.length === 1 ? 'is' : 'are';
    const error = new Error(`${notListed.join(', ')} ${verb} not defined in ${environmentDefinition} as expected`);
    error.notListed = notListed;
    throw error;
  }
}

module.exports.checkRequired = checkRequired;
