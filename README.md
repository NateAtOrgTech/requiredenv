# requiredenv

## Motivation

Often, especially in multi-user projects, we forget to document new environment variables. Ultimately this results in other team members not setting the variable and seeing unexpected failures, sometimes far away from where the variable was used.

With dotenv for inspiration, allow a user to define what environment variables are expected and throw an exception early at runtime, rather than waiting for whatever unexpected behavior a missing variable causes.

requiredenv has no runtime dependencies and includes TypeScript types.

It only checks that variables exist. It doesn't load them (use dotenv or Node's `--env-file` for that), and it doesn't check types or formats. If you need that, look at a schema validator such as envalid or zod.

## Installation

```bash
npm i @natebourgoin/requiredenv
```

## Basic Usage

Create a file in the root of your project called `required.env` that lists the environment variables you need. It uses the same syntax as a `.env` file, and values are ignored, so you can list bare names or point requiredenv at an existing `.env.example`:

```dosini
VAR1
VAR2=
VAR3=example value
```

Then, early in your program, do the following:

```javascript
require('@natebourgoin/requiredenv').checkRequired()
```

If any variable listed in `required.env` is not set in `process.env`, this throws one error that names every missing variable, for example `Missing environment variables VAR1, VAR3`. The names are also available as an array on the error's `missing` property.

## Empty Values

Like [dotenv-safe](https://github.com/rolodato/dotenv-safe), a variable that is set to an empty string counts as missing by default. To accept empty values, pass `allowEmptyValues`:

```javascript
require('@natebourgoin/requiredenv').checkRequired({ allowEmptyValues: true });
```

## Alternate File for Requirements

If you wish, you can specify a specific file to be parsed rather than the default `required.env`:

```javascript
require('@natebourgoin/requiredenv').checkRequired({ environmentDefinition : ".env.example" });
```

Like dotenv, relative paths are resolved from the current working directory (`process.cwd()`), not from the file that calls requiredenv. If you start your app from a different directory, pass an absolute path, for example `path.join(__dirname, 'required.env')`.

## Integration with dotenv

requiredenv can also make sure that every variable in your `.env` is listed in `required.env`. This keeps the definition file up to date. Pass the path to your `.env`:

```javascript
require('@natebourgoin/requiredenv').checkRequired({ checkInRequiredEnv : ".env" });
```

If that file doesn't exist, as is usual in production, this check is skipped. It reads the file the same way as the definition file, so it works whether you load `.env` with dotenv, with Node's `--env-file`, or not at all.

You can also pass dotenv's output directly:

```javascript
let parsed = require('dotenv').config().parsed;
require('@natebourgoin/requiredenv').checkRequired({ checkInRequiredEnv : parsed });
```

You are also able to take advantage of this behavior without dotenv by defining the variables you expect to find:

```javascript
let expected = {VAR1 : 'UNUSED VALUE', VAR2 : 'UNUSED VALUE', VAR3: 'UNUSED VALUE'}
require('@natebourgoin/requiredenv').checkRequired({ checkInRequiredEnv : expected });
```

*NOTE: For this check, values are ignored and can be set to any value*

If any of these variables are not listed in the definition file, requiredenv throws one error naming all of them, also available as an array on the error's `notListed` property.

## File Format

The definition file follows `.env` syntax:

- Each line is a variable name, optionally followed by `=` and a value, or by dotenv's `: value` form. Values are ignored.
- A leading `export ` is allowed, as in shell-style `.env` files.
- Lines starting with `#` are comments, and so is anything after ` #` on a line.
- Quoted values (`"`, `'`, or `` ` ``) may span multiple lines; the lines inside them are not read as names.
- Blank lines and surrounding whitespace are ignored.
- Any other line throws an error that names the file and line number, so typos are caught rather than silently skipped.

For example:

```dosini
# The port that this service will be hosted on
PORT=3000
# The user the service will run as
export USER=
# Secret key that should never be checked into source but needs to exist in process.env
SECRET_1 # from the team vault
# Multi-line values are fine too
CERTIFICATE="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
```
