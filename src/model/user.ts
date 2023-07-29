import { DataTypes, Model } from "sequelize";
import db from "../config/datebase";

interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  chatId: string;
  state: string;
}

class UserInstance extends Model<UserAttributes> {}

UserInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "users", // Використовуй енумы
  }
);

export default UserInstance;
