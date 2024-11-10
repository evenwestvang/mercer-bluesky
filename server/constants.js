const ENV = process.env.NODE_ENV || 'development';
export const config = await import(`./config/${ENV}.js`).then(module => module.config);