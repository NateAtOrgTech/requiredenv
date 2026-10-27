const { test } = require('node:test');
const assert = require('node:assert');
const dotEnv = require('dotenv');

const requiredEnv = require('../lib/main');

const fixture = name => `tests/test_files/${name}`;

// Sets the given variables for the length of fn, then restores process.env exactly
function withEnv(vars, fn) {
  const saved = {};
  for (const name of Object.keys(vars)) {
    saved[name] = process.env[name];
    if (vars[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = vars[name];
    }
  }
  try {
    return fn();
  } finally {
    for (const name of Object.keys(saved)) {
      if (saved[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = saved[name];
      }
    }
  }
}

test('throws if the definition file does not exist', () => {
  assert.throws(() => requiredEnv.checkRequired({ environmentDefinition: fixture('does_not_exist.env') }), { code: 'ENOENT' });
});

test('reads required.env from the working directory by default', () => {
  const cwd = process.cwd();
  process.chdir(fixture('default'));
  try {
    withEnv({ DEFAULT_FILE_VAR: undefined }, () => {
      assert.throws(() => requiredEnv.checkRequired(), { missing: ['DEFAULT_FILE_VAR'] });
    });
  } finally {
    process.chdir(cwd);
  }
});

test('lines starting with # are ignored as comments', () => {
  withEnv({ BUT_DO_THIS: 'value ignored' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('ignore_comments.env') });
  });
});

test('a single required variable passes when set', () => {
  withEnv({ TEST_ENV_VAR: 'test value' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('single.env') });
  });
});

test('multiple required variables pass when set', () => {
  withEnv({ TEST1: 'TEST1', TEST2: 'TEST2', TEST3: 'TEST3' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('multiple_env_variables.env') });
  });
});

test('throws naming the missing variable', () => {
  withEnv({ MISSING: undefined }, () => {
    assert.throws(() => requiredEnv.checkRequired({ environmentDefinition: fixture('single_missing.env') }), {
      message: 'Missing environment variable MISSING',
      missing: ['MISSING'],
    });
  });
});

test('reports every missing variable in one error', () => {
  withEnv({ FIRST_MISSING: undefined, SECOND_MISSING: undefined }, () => {
    assert.throws(() => requiredEnv.checkRequired({ environmentDefinition: fixture('multiple_missing.env') }), {
      message: 'Missing environment variables FIRST_MISSING, SECOND_MISSING',
      missing: ['FIRST_MISSING', 'SECOND_MISSING'],
    });
  });
});

test('empty values count as missing by default', () => {
  withEnv({ EMPTY_ALLOWED: '' }, () => {
    assert.throws(() => requiredEnv.checkRequired({ environmentDefinition: fixture('empty_value.env') }), {
      message: 'Missing environment variable EMPTY_ALLOWED',
    });
  });
});

test('empty values pass with allowEmptyValues', () => {
  withEnv({ EMPTY_ALLOWED: '' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('empty_value.env'), allowEmptyValues: true });
  });
});

test('plays well with dotenv', () => {
  withEnv({ DOTENV_TEST1: undefined, DOTENV_TEST2: undefined }, () => {
    const dotEnvResult = dotEnv.config({ path: fixture('dotenv.env') });
    requiredEnv.checkRequired({ environmentDefinition: fixture('test_dotenv_required.env'), checkInRequiredEnv: dotEnvResult.parsed });
  });
});

test('reverse check passes when the variable is listed', () => {
  withEnv({ TO_CHECK: 'foo' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('simple_check_works.env'), checkInRequiredEnv: { TO_CHECK: 'unused value' } });
  });
});

test('reverse check throws naming the unlisted variable', () => {
  assert.throws(
    () => requiredEnv.checkRequired({ environmentDefinition: fixture('missing_check_throws.env'), checkInRequiredEnv: { MISSING: 'unused value' } }),
    { message: 'MISSING is not defined in tests/test_files/missing_check_throws.env as expected', notListed: ['MISSING'] },
  );
});

test('reverse check reports every unlisted variable', () => {
  assert.throws(
    () => requiredEnv.checkRequired({ environmentDefinition: fixture('missing_check_throws.env'), checkInRequiredEnv: { ONE: 'x', TWO: 'y' } }),
    { message: 'ONE, TWO are not defined in tests/test_files/missing_check_throws.env as expected', notListed: ['ONE', 'TWO'] },
  );
});

test('a null checkInRequiredEnv skips the reverse check', () => {
  withEnv({ TEST_ENV_VAR: 'test value' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('single.env'), checkInRequiredEnv: null });
  });
});

test('surrounding whitespace and blank lines are ignored', () => {
  withEnv({ PADDED_VAR: 'padded', TABBED_VAR: 'tabbed' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('whitespace.env') });
  });
});

test('indented comments are ignored', () => {
  withEnv({ INDENTED_COMMENT_VAR: 'value ignored' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('indented_comments.env') });
  });
});

test('Windows line endings parse without throwing', () => {
  withEnv({ CRLF_ONE: 'one', CRLF_TWO: 'two' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('crlf.env') });
  });
});

test('reverse check matches entries that have surrounding whitespace', () => {
  withEnv({ PADDED_VAR: 'padded', TABBED_VAR: 'tabbed' }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('whitespace.env'), checkInRequiredEnv: { PADDED_VAR: 'unused value' } });
  });
});

const ENV_SYNTAX_NAMES = [
  'PLAIN',
  'EMPTY_DEFAULT',
  'WITH_VALUE',
  'EXPORTED',
  'QUOTED',
  'INLINE',
  'BARE',
  'MULTILINE',
  'SINGLE_QUOTED',
  'BACKTICKED',
  'dotted.name-with-dash',
];

test('reads names from .env syntax and ignores values', () => {
  const vars = Object.fromEntries(ENV_SYNTAX_NAMES.map(name => [name, 'set']));
  withEnv({ ...vars, LOOKS_LIKE_A_NAME: undefined }, () => {
    requiredEnv.checkRequired({ environmentDefinition: fixture('env_syntax.env') });
  });
});

test('lines inside a multi-line quoted value are not read as names', () => {
  const vars = Object.fromEntries(ENV_SYNTAX_NAMES.map(name => [name, 'set']));
  withEnv({ ...vars, LOOKS_LIKE_A_NAME: undefined }, () => {
    assert.throws(
      () => requiredEnv.checkRequired({ environmentDefinition: fixture('env_syntax.env'), checkInRequiredEnv: { LOOKS_LIKE_A_NAME: 'x' } }),
      { notListed: ['LOOKS_LIKE_A_NAME'] },
    );
  });
});

test('throws a format error for lines that are not .env syntax', () => {
  withEnv({ VALID: 'set' }, () => {
    assert.throws(() => requiredEnv.checkRequired({ environmentDefinition: fixture('invalid_line.env') }), {
      message: 'Unable to parse line 2 of tests/test_files/invalid_line.env: this is not a variable',
    });
  });
});

test('throws on an unterminated quoted value', () => {
  assert.throws(() => requiredEnv.checkRequired({ environmentDefinition: fixture('unterminated.env') }), {
    message: 'Unterminated quoted value for OPEN on line 1 of tests/test_files/unterminated.env',
  });
});
