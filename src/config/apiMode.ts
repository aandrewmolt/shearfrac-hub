/**
 * API Mode Configuration
 * All data operations go through AWS API
 */

// AWS API configuration
const AWS_API_URL = import.meta.env.VITE_AWS_API_URL || import.meta.env.VITE_API_URL;

// Always use AWS API mode
export const API_MODE = 'aws';

// Export helper functions
export const useAwsApi = () => true;
export const useTursoDb = () => false;

// Log the current mode
if (typeof window !== 'undefined') {
  console.log(`🔧 API Mode: AWS`);
  console.log(`☁️ Using AWS API: ${AWS_API_URL}`);
}

export default {
  mode: 'aws',
  isAws: true,
  isTurso: false,
  awsUrl: AWS_API_URL,
};