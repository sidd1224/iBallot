/**
 * A utility function to automatically retry failed blockchain calls.
 * This is useful for handling intermittent network errors like ECONNRESET.
 * @param {Function} call - An async function that makes the blockchain call.
 * @param {number} retries - The maximum number of times to retry.
 * @param {number} delay - The initial delay between retries in milliseconds.
 * @returns {Promise<any>} The result of the successful blockchain call.
 */
async function retryBlockchainCall(call, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to execute the provided blockchain call
      return await call();
    } catch (err) {
      // Check if it's a known, transient network error
      const isNetworkError = err.code === 'ECONNRESET' || err.code === 'EAI_AGAIN' || err.message.includes('failed to detect network');
      
      if (isNetworkError) {
        console.warn(`Blockchain call failed with ${err.code} (attempt ${i + 1}/${retries}). Retrying in ${delay / 1000}s...`);
        
        // If this is the last attempt, throw the error to prevent an infinite loop
        if (i === retries - 1) {
          console.error('All blockchain call retries failed.');
          throw err;
        }

        // Wait for the specified delay before the next attempt
        await new Promise(res => setTimeout(res, delay));
        // Increase the delay for the next retry (exponential backoff)
        delay *= 2;
      } else {
        // If it's not a network error, re-throw it immediately
        throw err;
      }
    }
  }
}

module.exports = { retryBlockchainCall };
