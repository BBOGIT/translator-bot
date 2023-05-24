import { Sequelize } from "sequelize";

const db = new Sequelize("words-db", "", "", {
  host: "./dev.sqlite",
  dialect: "sqlite",
  logging: console.log,
});

export default db;
