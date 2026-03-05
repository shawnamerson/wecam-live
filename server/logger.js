const isProduction = process.env.NODE_ENV === 'production';

export const log = {
  info: (...args) => { if (!isProduction) console.log(...args); },
  warn: console.warn,
  error: console.error,
};
