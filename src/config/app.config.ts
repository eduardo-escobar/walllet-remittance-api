export const appConfig = () => ({
  app: {
    port: Number.parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  exchangeRates: {
    clpToPen: Number.parseFloat(process.env.EXCHANGE_RATE_CLP_TO_PEN || '0.0043'),
    penToClp: Number.parseFloat(process.env.EXCHANGE_RATE_PEN_TO_CLP || '232.55813953'),
  },

  transaction: {
    feePercentage: Number.parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE || '2.5'),
    minAmount: Number.parseFloat(process.env.MIN_TRANSACTION_AMOUNT || '1000'),
    maxAmount: Number.parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '5000000'),
  },

  externalProvider: {
    url: process.env.EXTERNAL_PROVIDER_URL || 'https://httpbin.org/delay/1',
    timeout: Number.parseInt(process.env.EXTERNAL_PROVIDER_TIMEOUT || '5000', 10),
    maxRetries: Number.parseInt(process.env.EXTERNAL_PROVIDER_MAX_RETRIES || '3', 10),
  },

  quote: {
    validityMinutes: Number.parseInt(process.env.QUOTE_VALIDITY_MINUTES || '10', 10),
  },

  idempotency: {
    keyExpiryHours: Number.parseInt(process.env.IDEMPOTENCY_KEY_EXPIRY_HOURS || '24', 10),
  },
});
