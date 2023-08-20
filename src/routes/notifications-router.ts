import { Router, Request, Response } from "express";

import NotificationInstance from "../model/notification";
import { v4 as uuidv4 } from "uuid";

export const notificationsRouter = Router({});

export class Notification {
    userId: string;
    remindInWeek: boolean;
    remindInMonth: boolean;
  constructor(options) {
    this.userId = options.userId;
    this.remindInWeek = options.remindInWeek;
    this.remindInMonth = options.remindInMonth;
  }

  async createNotification() {
    try {
      const id = uuidv4();
      const data = await NotificationInstance.create({
        id,
        userId: this.userId,
        remindInWeek: this.remindInWeek,
        remindInMonth: this.remindInMonth
      });
      return data;
    } catch (error) {
      return error;
    }
  }

  async getNotifications() {

    const data = await NotificationInstance.findAll({ where: {}});
    return data;
  }

  async getNotification() {
    try {
      const data = await NotificationInstance.findOne({ where: { userId: this.userId } });
      return data;
    } catch (error) {
      return error;
    }
  }

  async updateNotification() {
    try {
      const data = await NotificationInstance.findOne({ where: { userId: this.userId } });
      if (!data) {
        return false;
      }
      const updatedRecord = await data.update({
        ...this,
      });
      return updatedRecord;
    } catch (error) {
      return error;
    }
  }
}