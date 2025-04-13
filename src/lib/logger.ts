import log from 'loglevel';

// Determine the logging level based on the environment
// Vite uses import.meta.env.MODE which is 'development', 'production', etc.
const isProduction = import.meta.env.MODE === 'production';
const defaultLevel = isProduction ? log.levels.INFO : log.levels.DEBUG;

// Initialize loglevel
log.setLevel(defaultLevel);

// You can customize the logger further if needed, e.g., adding prefixes
// Example:
// const originalFactory = log.methodFactory;
// log.methodFactory = (methodName, logLevel, loggerName) => {
//   const rawMethod = originalFactory(methodName, logLevel, loggerName);
//   return (message, ...args) => {
//     rawMethod(`[${methodName.toUpperCase()}] ${message}`, ...args);
//   };
// };
// log.rebuild(); // Apply the changes

console.log(`[Logger] Initialized with level: ${Object.keys(log.levels)[log.getLevel()]}`); // Log initialization for verification

export default log;