const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const env = {
  ...process.env,
  PGCLIENTENCODING: 'UTF8',
};

const dbHost = env.DB_HOST || 'localhost';
const dbPort = env.DB_PORT || '5432';
const dbUser = env.DB_USER || 'postgres';
const dbPassword = env.DB_PASSWORD || 'postgres';
const dbName = env.DB_NAME || 'bibliotheque';

function psqlArgs(file) {
  const args = [
    '-h', dbHost,
    '-p', dbPort,
    '-U', dbUser,
    '-d', dbName,
    '-v', 'ON_ERROR_STOP=1',
  ];

  if (file) {
    args.push('-f', file);
  }

  return args;
}

function run(command, extraEnv = {}) {
  execSync(command, {
    stdio: 'inherit',
    env: { ...env, ...extraEnv },
    shell: true,
  });
}

const action = process.argv[2];
const root = path.join(__dirname, '..');

try {
  if (action === 'migrate') {
    const file = path.join(root, 'db', 'schema_prod.sql');
    run(`psql ${psqlArgs(file).map((arg) => JSON.stringify(arg)).join(' ')}`);
  } else if (action === 'seed') {
    const file = path.join(root, 'db', 'seed_demo.sql');
    run(`psql ${psqlArgs(file).map((arg) => JSON.stringify(arg)).join(' ')}`);
  } else if (action === 'reset') {
    run(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${dbName};" -c "CREATE DATABASE ${dbName};"`, {
      PGPASSWORD: dbPassword,
    });
    run(`psql ${psqlArgs(path.join(root, 'db', 'schema_prod.sql')).map((arg) => JSON.stringify(arg)).join(' ')}`);
    run(`psql ${psqlArgs(path.join(root, 'db', 'seed_demo.sql')).map((arg) => JSON.stringify(arg)).join(' ')}`);
  } else {
    console.error('Usage: node scripts/db.js [migrate|seed|reset]');
    process.exit(1);
  }
} catch (error) {
  console.error('Database script failed:', error.message);
  process.exit(1);
}
