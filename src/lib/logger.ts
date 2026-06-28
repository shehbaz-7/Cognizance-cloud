export const logger = {
  info: (message: string, context?: any) => {
    console.log(JSON.stringify({ level: 'INFO', message, context, timestamp: new Date().toISOString() }));
  },
  warn: (message: string, context?: any) => {
    console.warn(JSON.stringify({ level: 'WARN', message, context, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any, context?: any) => {
    console.error(JSON.stringify({ level: 'ERROR', message, error: error?.message || error, context, timestamp: new Date().toISOString() }));
  },
};
