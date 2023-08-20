import { DataTypes, Model } from "sequelize";
import db from "../config/datebase";

interface NotificationAttributes {
    id: string;
    userId: string;
    remindInWeek: boolean;
    remindInMonth: boolean;
}

class NotificationInstance extends Model<NotificationAttributes> {
    id: string;
    userId: string;
    remindInWeek: boolean;
    remindInMonth: boolean;
}

NotificationInstance.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },
        remindInWeek: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        remindInMonth: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }
    },
    {
        sequelize: db,
        tableName: "notifications", // Використовуй енумы
    }
);

export default NotificationInstance;
