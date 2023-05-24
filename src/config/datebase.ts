import { Sequelize } from 'sequelize';

const db = new Sequelize('words-db', '', '', {
    host: './dev.sqlite',  
    dialect: 'sqlite',
    logging: false
})

export default db;

/Users/bohdanbuhriienko/Documents/Lessons/itkamas/src/config/datebase.ts