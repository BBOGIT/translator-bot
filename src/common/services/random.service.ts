import { Injectable } from '@nestjs/common';

/**
 * Сервіс для генерації випадкових значень
 */
@Injectable()
export class RandomService {
  /**
   * Генерує випадкове ціле число в діапазоні [min, max]
   */
  getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return (
      Math.floor(
        Math.random() * (max - min + 1)
      ) + min
    );
  }

  /**
   * Генерує випадковий елемент з масиву
   */
  getRandomElement<T>(array: T[]): T {
    if (!array.length) {
      throw new Error('Масив порожній');
    }
    return array[
      this.getRandomInt(0, array.length - 1)
    ];
  }

  /**
   * Генерує випадковий рядок заданої довжини
   */
  getRandomString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        this.getRandomInt(
          0,
          characters.length - 1
        )
      );
    }
    return result;
  }
}
