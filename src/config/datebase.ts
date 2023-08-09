import { Sequelize } from "sequelize";
const configSettings = {
  ...process.env,
};
// For docker db
// const db = new Sequelize("postgres", "postgres", "postgres", {
//   host: "localhost",
//   port: 5440,
//   dialect: "postgres",
//   logging: console.log,
// });


let db = new Sequelize("words-db", "", "", {
  host: "./dev.sqlite",
  dialect: "sqlite",
  logging: console.log,
});

if (configSettings['NODE_ENV'] == 'production') {
  let db = new Sequelize("prpzjkjp", "prpzjkjp", "9BRIlIjXcQvxEtw0zO33pPvl_EZHhZha", {
  host: 'trumpet.db.elephantsql.com', 
  dialect: 'postgres',
  logging: console.log,
});
}

export default db;
