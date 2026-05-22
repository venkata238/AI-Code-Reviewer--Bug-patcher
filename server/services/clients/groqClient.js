const axios = require('axios');
const axiosRetry = require('axios-retry');

const groqClient = axios.create({
  baseURL: 'https://api.groq.com',
  timeout: 30000, // ✅ GLOBAL timeout (30s)
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
axiosRetry(groqClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) => {
    return (
      err.code === 'ECONNABORTED' ||
      err.response?.status >= 500
    );
  },
});
module.exports = groqClient;