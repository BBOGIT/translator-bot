import { Sequelize } from "sequelize";

// For docker db
// const db = new Sequelize("postgres", "postgres", "postgres", {
//   host: "localhost",
//   port: 5440,
//   dialect: "postgres",
//   logging: console.log,
// });

const db = new Sequelize("words-db", "", "", {
  host: "./dev.sqlite",
  dialect: "sqlite",
  logging: console.log,
});

export default db;
