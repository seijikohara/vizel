// V8-specific Error.captureStackTrace (used in VizelError for better stack traces)
interface ErrorConstructor {
  captureStackTrace?(targetObject: object, constructorOpt?: NewableFunction): void;
}

// Build-time process.env.NODE_ENV (replaced by bundlers like Vite, Webpack, Rollup)
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};
