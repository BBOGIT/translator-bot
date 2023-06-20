import { DataTypes, Model } from "sequelize";
import db from "../config/datebase";

interface WordAttributes {
  id: string;
  word: string;
  translation: string;
}

class WordInstance extends Model<WordAttributes> { }

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
  },
  {
    sequelize: db,
    tableName: "words", // ТУДУ: Використовуй енумы
  }
);

export default WordInstance;
