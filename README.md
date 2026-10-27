# requiredenv

## Motivation

Often, especially in multi-user projects, we forget to document new environment variables. Ultimately this results in other team members not setting the variable and seeing unexpected failures, sometimes far away from where the variable was used.

With dotenv for inspiration, allow a user to define what environment variables are expected and throw an exception early at runtime, rather than waiting for whatever unexpected behavior a missing variable causes.

## Installation

```bash
npm i @natebourgoin/requiredenv
```

## Basic Usage

- Create a file in the root of your project called `required.env`
- List the environment variables you care about by name (one per line), without values

For example:

```dosini
VAR1
VAR2
VAR3
```

Then, early in your program, do the following:

```javascript
require('@natebourgoin/requiredenv').checkRequired()
```

If an environment variable listed in `required.env` is not defined in `process.env`, this throws an exception.

## Alternate File for Requirements

If you wish, you can specify a specific file to be parsed rather than the default `required.env`:

```javascript
require('@natebourgoin/requiredenv').checkRequired({ environmentDefinition : "path/to/file" });
```

## Integration with dotenv

By passing the output of dotenv to requiredenv you can also make sure that all items that are defined in .env are also defined in `required.env`. This is useful to enforce that the definition file is kept up to date.

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

## Comments in required.env

If a line starts with a `#` character, it is ignored as a comment. This is useful for documenting each variable in `required.env`.

For example:

```dosini
# The port that this service will be hosted on
PORT
# The user the service will run as
USER
# Secret key that should never be checked into source but needs to exist in process.env
SECRET_1
```
