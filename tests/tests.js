const tap = require('tap');
const dotEnv = require('dotenv');

const requiredEnv = require('../lib/main');

tap.throws(function () {
  requiredEnv.checkRequired();
}, new Error('ENOENT: no such file or directory, open \'required.env\''), 'An Error should be thrown if requirements file doesn\'t exist');

tap.doesNotThrow('lines starting with # should be ignored as comments', () => {
  process.env.BUT_DO_THIS = "value ignored";
  requiredEnv.checkRequired( { environmentDefinition : 'tests/test_files/ignore_comments.env' });
});

tap.doesNotThrow('basic single required.env parses without throwing', () => {
  process.env.TEST_ENV_VAR = "test value";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/single.env' });
});

tap.doesNotThrow('multiple entries parses without throwing', () => {
  process.env.TEST1 = "TEST1";
  process.env.TEST2 = "TEST2";
  process.env.TEST3 = "TEST3";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/multiple_env_variables.env' });
});

tap.throws(function () {
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/single_missing.env'});
}, new Error('Missing environment variable MISSING'), 'An Error should be thrown with the missing environment variable');

tap.doesNotThrow('plays well with dotenv', () => {
  let dotEnvResult = dotEnv.config({ path: 'tests/test_files/dotenv.env' });
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/test_dotenv_required.env', checkInRequiredEnv : dotEnvResult.parsed });
});

tap.doesNotThrow('single checking that variable exists in requiredenv works', () => {
  process.env.TO_CHECK = "foo";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/simple_check_works.env', checkInRequiredEnv : { 'TO_CHECK': 'unused value' }});
});

tap.throws(function () {
  process.env.MISSING = "foo";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/missing_check_throws.env', checkInRequiredEnv : { 'MISSING': 'unused value' }});
}, new Error(`MISSING is not defined in tests/test_files/missing_check_throws.env as expected`), 'An Error should be thrown when a reverse check fails');
tap.doesNotThrow('surrounding whitespace and blank lines are ignored', () => {
  process.env.PADDED_VAR = "padded";
  process.env.TABBED_VAR = "tabbed";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/whitespace.env' });
});

tap.doesNotThrow('indented comments are ignored', () => {
  process.env.INDENTED_COMMENT_VAR = "value ignored";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/indented_comments.env' });
});

tap.doesNotThrow('Windows line endings parse without throwing', () => {
  process.env.CRLF_ONE = "one";
  process.env.CRLF_TWO = "two";
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/crlf.env' });
});

tap.doesNotThrow('reverse check matches entries that have surrounding whitespace', () => {
  requiredEnv.checkRequired({ environmentDefinition : 'tests/test_files/whitespace.env', checkInRequiredEnv : { 'PADDED_VAR': 'unused value' }});
});
