const fs = require('fs');
const path = require('path');

const envFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || 'https://api.skybooker.com'}',
  authServiceUrl: '${process.env.AUTH_SERVICE_URL || 'https://auth.skybooker.com'}',
  razorpayKeyId: '${process.env.RAZORPAY_KEY_ID || 'rzp_live_XXXXXXXXXXXXXX'}',
};
`;

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');

fs.writeFile(targetPath, envFile, (err) => {
  if (err) {
    console.error('Error writing environment file:', err);
  } else {
    console.log(`Environment file generated at ${targetPath}`);
  }
});
