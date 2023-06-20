import { webhookRouter } from "./routes/webhook-router";
import { wordsRouter } from "./routes/words-router";
import { usersRouter } from "./routes/users-router";
import { Server } from "./server";


// ТУДУ: Старайся всі строки писати як енуми чи константи
// Десь в папці комон
export enum ERouter {
  WORDS = "/words",
  WEBHOOK = "/webhook",
  USERS = "/users",
}

async function bootstrap() {
  const server = new Server({ port: 1889 });

  // Не зміг нормально типізувати, тож можна так і так
  server.app.use(ERouter.WORDS, wordsRouter);
  server.use(ERouter.WEBHOOK, webhookRouter);
  server.use(ERouter.USERS, usersRouter);

  await server.initDb();

  server.listen();
}

bootstrap();
