const fs = require('node:fs');

if (fs.existsSync('.env')) {
  console.log('.env already exists; it was not changed.');
} else {
  fs.copyFileSync('.env.example', '.env');
  console.log('Created .env from .env.example. Review the local API URL before starting.');
}
