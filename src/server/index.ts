import express from "express";
import * as core from "express-serve-static-core";

import db from "../config/datebase";

export class Server {
  public app: core.Express;
  private port: number;

  // Конструктор должен принимать конфиги и прочее барахло
  constructor(args: { port: number }) {
    this.port = args.port;
    this.app = express();
  }

  async init() {
    this.app.use(express.json());
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Example app listening on port ${this.port}`);
    });
  }

  async initDb() {
    await db.sync();

    console.log("db is ready");
  }
}

const server = new Server({ port: 1889 });

export default server;
