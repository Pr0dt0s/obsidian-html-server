import * as express from "express";

export const createServer = ({
  port,
  path,
}: {
  port: number;
  path: string;
}) => {
  const app = express();
  app.use("/", (req, res) => {
    console.log("request received..");
    res.write(`Trying to access ${req.path}`);
    res.end();
  });
  const server = app.listen(port);
  return {
    on: server.on.bind(server),
  };
};
