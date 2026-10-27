export interface CheckRequiredOptions {
  /**
   * File that lists the required variable names, in .env syntax.
   * Relative paths resolve from process.cwd(), the same as dotenv.
   * @default 'required.env'
   */
  environmentDefinition?: string;
  /**
   * Variables that must also be listed in the definition file: either a path
   * to a .env file, which is skipped if it doesn't exist, or an object such as
   * dotenv's `parsed` output. Values are ignored.
   */
  checkInRequiredEnv?: string | Record<string, unknown> | null;
  /**
   * Accept variables that are set to an empty string.
   * @default false
   */
  allowEmptyValues?: boolean;
}

/** The error thrown when a check fails. */
export interface RequiredEnvError extends Error {
  /** Variables from the definition file that are not set. */
  missing?: string[];
  /** Variables from checkInRequiredEnv that the definition file does not list. */
  notListed?: string[];
}

/**
 * Throws if any variable listed in the definition file is not set in
 * process.env, or if checkInRequiredEnv has variables the file doesn't list.
 */
export function checkRequired(options?: CheckRequiredOptions): void;
