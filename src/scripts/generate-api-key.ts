import { randomBytes } from 'crypto';

const key = randomBytes(32).toString('hex');
console.log('Generated API Key:');
console.log(key);
console.log('\nAdd this to your .env file:');
console.log(`API_KEYS=${key}`);
