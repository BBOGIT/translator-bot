import { DataTypes, Model } from "sequelize";
import db from "../config/datebase";

interface WordAttributes {
  id: string;
  word: string;
  translation: string;
  language: string;
  needToLearn: boolean;
}

class WordInstance extends Model<WordAttributes> {
  id: string;
  word: string;
  translation: string;
  language: string;
  needToLearn: boolean;
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
    needToLearn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }
  },
  {
    sequelize: db,
    tableName: "words", // Використовуй енумы
  }
);

export default WordInstance;
