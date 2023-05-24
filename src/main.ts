import { webhookRouter } from "./routes/webhook-router";
import { wordsRouter } from "./routes/words-router";
import server from "./server";

// Старайся всі строки писати як енуми чи константи
// Десь в папці комон
export enum ERouter {
  WORDS = "/words",
  WEBHOOK = "/webhook",
}

async function bootstrap() {
  server.init();

  server.app.use(ERouter.WORDS, wordsRouter);
  server.app.use(ERouter.WEBHOOK, webhookRouter);

  await server.initDb();

  server.listen();
}

bootstrap();
