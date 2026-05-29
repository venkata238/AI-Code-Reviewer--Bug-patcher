const axios = require('axios');

const axiosRetryModule = require('axios-retry');

const axiosRetry = axiosRetryModule.default;

const groqClient = axios.create({
  baseURL: 'https://api.groq.com',
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

axiosRetry(groqClient, {
  retries: 2,
  retryDelay: axiosRetryModule.exponentialDelay,
  retryCondition: (err) => {
    return (
      err.code === 'ECONNABORTED' ||
      err.response?.status >= 500
    );
  },
});

module.exports = groqClient;