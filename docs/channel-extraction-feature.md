# Channel Message Extraction Feature

## Обзор

Реализована логика автоматического извлечения и сохранения слов из пересланных сообщений Telegram каналов.

## Что реализовано

### 1. База данных
- ✅ Создана таблица `ChannelExtractionConfig` для хранения regex паттернов
- ✅ Миграция применена успешно

### 2. AI интеграция  
- ✅ Добавлен метод `generateRegexPatterns()` в `AiService`
- ✅ Реализована поддержка в `OpenAIService` и `DeepseekService`
- ✅ Кэширование regex паттернов для производительности

### 3. Обработка webhook'ов
- ✅ Обновлен `WebhookService` для определения пересланных сообщений
- ✅ Добавлена поддержка `forward_origin` (новый формат Telegram)
- ✅ Извлечение информации о канале

### 4. Сервисы и обработчики
- ✅ `ChannelExtractionService` - основная логика извлечения данных
- ✅ `ForwardedMessageHandler` - обработка пересланных сообщений
- ✅ Интеграция с `CommandDispatcher` с высоким приоритетом

### 5. Пользовательский интерфейс
- ✅ Новые шаблоны сообщений для уведомлений
- ✅ Поддержка украинского языка
- ✅ Информативные сообщения об ошибках

## Как это работает

### Пример сообщения из канала:
```
😼 genuine - подлинный; неподдельный; настоящий; истинный; искренний; реальный; естественный; натуральный

1️⃣ Not genuine.
Не настоящий.

2️⃣ Do you believe that Hal has genuine emotions?
Вы верите, что у Хэла есть искренние эмоции?

3️⃣ Tommy Riordan is a genuine war hero, I'm not taking anything away from the guy.
Томми Риордан настоящий герой войны, я ничего у парня не отниму.
```

### Процесс обработки:

1. **Webhook получен** → `WebhookService` определяет пересланное сообщение
2. **Проверка канала** → `ChannelExtractionService` ищет конфигурацию в БД
3. **AI создание паттернов** (если нужно) → `AiService` генерирует regex
4. **Извлечение данных** → Применение regex к тексту сообщения
5. **Сохранение слова** → `WordService` создает новое слово для пользователя
6. **Уведомление** → Отправка подтверждения пользователю

### Извлекаемые данные:
- **Word**: `genuine`
- **Translation**: `подлинный; неподдельный; настоящий; истинный; искренний; реальный; естественный; натуральный`
- **Examples**: Полный блок с пронумерованными примерами

## Преимущества

- **🤖 Автоматизация**: AI создает regex только при первом сообщении с канала
- **⚡ Производительность**: Последующие сообщения обрабатываются без AI 
- **🔧 Гибкость**: Можно редактировать regex в БД вручную
- **📈 Масштабируемость**: Легко добавлять новые каналы
- **🛡️ Надежность**: Fallback паттерны при ошибках AI

## Технические детали

### Новые файлы:
```
src/channel/
├── channel-extraction.service.ts
├── channel.module.ts
├── interfaces/
│   ├── channel-info.interface.ts
│   ├── extraction-patterns.interface.ts
│   └── index.ts
└── dto/
    └── create-channel-config.dto.ts

src/bot/handlers/forwarded/
└── forwarded-message.handler.ts
```

### Обновленные файлы:
- `src/webhook/webhook.service.ts` - детекция пересланных сообщений
- `src/webhook/dto/telegram-webhook-dto.ts` - поддержка forward_origin
- `src/ai/ai.service.ts` - новый метод generateRegexPatterns
- `src/ai/providers/*.service.ts` - реализации для провайдеров
- `src/bot/handlers/commands/command-dispatcher.ts` - приоритетная обработка
- `src/message/*.json` - новые шаблоны сообщений

### База данных:
```sql
CREATE TABLE "channel_extraction_configs" (
    "id" SERIAL PRIMARY KEY,
    "channelId" TEXT UNIQUE NOT NULL,
    "channelTitle" TEXT,
    "channelUsername" TEXT,
    "wordRegex" TEXT NOT NULL,
    "translationRegex" TEXT NOT NULL,
    "examplesRegex" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdByAI" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)
);
```

## Тестирование

Для тестирования функции:
1. Перешлите сообщение из образовательного канала боту
2. Бот должен автоматически извлечь слово, перевод и примеры
3. Получите подтверждение о сохранении слова
4. При первом сообщении с канала будет создана AI конфигурация

## Мониторинг

Логи содержат информацию о:
- Создании новых конфигураций каналов
- Успешном/неуспешном извлечении данных  
- Ошибках AI и fallback сценариях
- Производительности обработки

---

*Реализовано: Сентябрь 2025*
