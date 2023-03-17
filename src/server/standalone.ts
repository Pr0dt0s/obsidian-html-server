console.log(
  'This is the standalone server runner, it is currently only used for development.'
);

import { createServer } from '.';

const server = createServer({
  port: 8080,
  path: './test_vault',
  hostname: 'localhost',
  queryFile(path) {
    return {
      contentType: 'application/json',
      payload: JSON.stringify({ env: process.env, path }),
    };
  },
});

server.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

// just to keep typescript happy.
export {};
