type LogMethod = (...args: unknown[]) => void;

interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

const noop: LogMethod = () => {};

const createLogger = (): Logger => ({
  debug: noop,
  info: noop,
  warn: noop,
  error: noop
});

export const loggers = {
  git: createLogger(),
  filesystem: createLogger()
};

export const logHelpers = {
  gitOperation: noop,
  fileOperation: noop
};
