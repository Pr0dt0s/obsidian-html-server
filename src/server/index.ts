import express from 'express';

export const createServer = ({
  port,
  path,
  hostname,
  queryFile,
}: {
  port: number;
  path: string;
  hostname?: string;
  queryFile: (path: string) => { payload: string; contentType: string } | null;
}) => {
  const app = express();
  app.use('/', (req, res, next) => {
    const data = queryFile(req.path);
    if (!data) {
      return next();
    }
    res.contentType(data.contentType);
    res.write(data.payload);
    res.end();
  });
  app.use('/', (req, res) => {
    console.log('request received..');
    res.write(`Trying to access ${req.path}`);
    res.end();
  });
  const server = app.listen(port, hostname || '*');
  return {
    on: server.on.bind(server),
  };
};
