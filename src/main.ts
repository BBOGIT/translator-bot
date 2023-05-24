import { webhookRouter } from "./routes/webhook-router";
import { wordsRouter } from "./routes/words-router";
import { Server } from "./server";

// Старайся всі строки писати як енуми чи константи
// Десь в папці комон
export enum ERouter {
  WORDS = "/words",
  WEBHOOK = "/webhook",
}

async function bootstrap() {
  const server = new Server({ port: 1889 });

  server.app.use(ERouter.WORDS, wordsRouter);
  server.app.use(ERouter.WEBHOOK, webhookRouter);

  await server.initDb();

  server.listen();
}

bootstrap();
