/**
 * API Mode Configuration
 * Determines whether to use Turso database directly or AWS API
 */

// Check if AWS API is configured
const AWS_API_URL = import.meta.env.VITE_API_URL;
const isAwsConfigured = AWS_API_URL && !AWS_API_URL.includes('your-api-gateway-id');

// Check if we should use AWS (when configured and not in local mode)
const DATABASE_MODE = import.meta.env.VITE_DATABASE_MODE || 'turso';

// Determine API mode
export const API_MODE = isAwsConfigured ? 'aws' : 'turso';

// Export helper functions
export const useAwsApi = () => API_MODE === 'aws';
export const useTursoDb = () => API_MODE === 'turso';

// Log the current mode
if (typeof window !== 'undefined') {
  console.log(`🔧 API Mode: ${API_MODE}`);
  if (API_MODE === 'aws') {
    console.log(`☁️ Using AWS API: ${AWS_API_URL}`);
  } else {
    console.log(`💾 Using Turso Database: ${DATABASE_MODE}`);
  }
}

export default {
  mode: API_MODE,
  isAws: API_MODE === 'aws',
  isTurso: API_MODE === 'turso',
  awsUrl: AWS_API_URL,
};