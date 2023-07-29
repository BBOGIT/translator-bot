import { DataTypes, Model } from "sequelize";
import db from "../config/datebase";

interface WordAttributes {
  id: string;
  word: string;
  translation: string;
  language: string;
}

class WordInstance extends Model<WordAttributes> {
  id: string;
  word: string;
  translation: string;
  language: string;
}

WordInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    word: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    translation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "words", // Використовуй енумы
  }
);

export default WordInstance;
