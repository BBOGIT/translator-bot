FROM --platform=linux/amd64 node:16-alpine AS builder

WORKDIR /app

# Копіюємо файли залежностей
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Встановлюємо залежності
RUN npm ci

# Копіюємо вихідний код
COPY . .

# Генеруємо Prisma клієнт і компілюємо проект
RUN npx prisma generate
RUN npm run build

# Видаляємо девелоперські залежності
RUN npm prune --production

# Створюємо оптимізований продакшн образ
FROM --platform=linux/amd64 node:16-alpine AS production

WORKDIR /app

# Встановлюємо необхідні залежності для компіляції bcrypt
RUN apk add --no-cache --virtual .build-deps make gcc g++ python3

# Копіюємо необхідні файли з builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Видаляємо bcrypt і перевстановлюємо для поточної архітектури
RUN npm uninstall bcrypt
RUN npm install bcrypt --build-from-source

# Видаляємо залежності збірки, оскільки вони більше не потрібні
RUN apk del .build-deps

# Копіюємо статичні файли для flow-editor
COPY --from=builder /app/src/flow-editor/public ./dist/flow-editor/public/

# Встановлюємо Prisma клієнт для продакшн
RUN npx prisma generate

# Створюємо користувача для запуску додатку
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Змінюємо власника файлів
RUN chown -R nestjs:nodejs /app

# Переключаємося на користувача nestjs
USER nestjs

# Експонуємо порт
EXPOSE 1889

# Запускаємо міграції та додаток
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/main"] 