# Word Repetition Flow

## Огляд

Система нагадувань базується на алгоритмі інтервального повторення (Spaced Repetition). Слово повторюється через зростаючі інтервали: **1 → 3 → 7 → 14 → 30 → 90 днів**. Після всіх 6 повторень слово вважається вивченим (`needToLearn = false`).

---

## Поля слова (Word)

| Поле | Тип | Призначення |
|---|---|---|
| `needToLearn` | boolean | `true` = слово ще потребує повторення |
| `nextRepeatDate` | DateTime? | Коли слово треба повторити наступного разу. `null` = нове слово, ще не мало повторень |
| `repeatCount` | int | Кількість успішних повторень (0–6) |
| `lastRepeatAt` | DateTime? | Коли останній раз натискали "Я вивчив слово" |
| `lastNotificationAt` | DateTime? | Коли останній раз надсилалось автоматичне нагадування (крон-джоб) |

---

## Два режими повторення

### 1. Автоматичні нагадування (Cron Job)

**Файл:** `src/jobs/word-repetition.job.ts`

Крон `@Cron(EVERY_HOUR)` щогодини перевіряє усіх користувачів. Кожен користувач отримує **не більше одного** prompt-повідомлення на добу.

**Логіка вибору часу:**
- `repetitionTime = null` → ефективний час = **20:00** (default)
- `repetitionTime = "HH:00"` → ефективний час = HH

Крон порівнює `effectiveHour === currentHour`. Якщо не збігається — пропускає.

**Захист від дублювання:** якщо всі слова для цього юзера вже мають `lastNotificationAt >= today midnight` — нагадування не надсилається (юзер уже отримав його через ручний запуск або попередній крон-тік того ж часу).

Слова для нагадування (query):
```
needToLearn = true AND (nextRepeatDate IS NULL OR nextRepeatDate <= now())
```

Після успішного надсилання слова оновлюється `lastNotificationAt = now()`.

### 2. Ручний запуск ("Повторити слова зараз")

**Файл:** `src/bot/handlers/repetition/repetition.handler.ts` → `startRepetition()`

Користувач тисне кнопку → той самий запит слів → надсилає повідомлення "Починаємо повторення" + перше слово. Word IDs зберігаються в кеші (`repetition_session:{customerId}`) на 1 годину для навігації між словами.

---

## Стан клієнта під час повторення

```
MainMenu
  └─→ [/repeatWords] → RepeatWordsMain
        ├─→ [/repeatWordsNow]     → RepeatWordsNow   (показує слова одне за одним)
        ├─→ [/repeatWordsSchedule] → WaitingForRepetitionTime
        └─→ [/mainMenu]           → MainMenu
```

---

## Навігація між словами (RepeatWordsNow)

Кнопки **"Попереднє слово"** / **"Наступне слово"** — `callback_data`: `/previousWord_{wordId}` / `/nextWord_{wordId}`.

Обробник (`RepetitionCommandHandler.handleWordNavigation`):
1. Читає `repetition_session:{customerId}` з кешу (масив ID)
2. Знаходить поточний індекс за `currentWordId`
3. Обраховує `nextIndex` (циклічно)
4. Редагує існуюче повідомлення через `editMessageText`

---

## Кнопки реакції на слово

### "Я вивчив слово" (`/iHaveLearnedButton_{wordId}`)

Обробляється `RepeatWordsNowStrategy.handleLearningStatus` (state = `RepeatWordsNow`).

`updateWordRepetitionStatus({ wordId, success: true })` → `UpdateWordRepetitionHandler.calculateNextRepetition`:

```
repeatCount < 6:
  nextRepeatDate = now + intervals[repeatCount]   (1/3/7/14/30/90 днів)
  repeatCount += 1
  needToLearn = true

repeatCount >= 6:
  needToLearn = false   ← слово повністю вивчено
  nextRepeatDate = null
```

### "Ще треба вчити" (`/iNeedToLearn_{wordId}`)

`updateWordRepetitionStatus({ wordId, success: false })`:

```
repeatCount = 0   ← скидається на початок
nextRepeatDate = now + 1 день
needToLearn = true
```

---

## Відправка повідомлення зі словом

**Файл:** `src/jobs/word-repetition.job.ts` → `sendRepetitionNotification()`

```
word.videoExample?
  ├─ YES → sendVideo (template: repeatWordsNow)
  └─ NO  → sendMessage (template: repeatWordsNowText)

після успішного надсилання:
  → updateWordNotification(wordId)  ← оновлює lastNotificationAt
```

Шаблон `repeatWordsNow` (sendVideo):
- `caption`: слово + переклад + приклади (MarkdownV2)
- `video`: Telegram file_id (не escapeується!)
- Кнопки: "Я вивчив" / "Ще треба" / "Попереднє" / "Наступне" / "Головне меню"

---

## Маршрутизація команд у диспетчері

```
Webhook → CommandDispatcher.dispatchCommand()

[callbackQuery]:
  callbackQueryHandlers (перший що підходить):
    mainMenuHandler        → /mainMenu
    learnWordsHandler      → /learnWords, /addWord...
    repetitionHandler      → /repeatWords, /repeatWordsNow, /nextWord_*, /previousWord_*
    progressHandler        → /progress
    wordRepetitionHandler  → /iKnowWord_*, /learnWord_*

  ↓ якщо жоден не підходить:

[stateHandler] → залежно від customer.state:
  RepeatWordsNow → RepeatWordsNowStrategy
    обробляє: /iHaveLearnedButton_*, /iNeedToLearn_*, /mainMenu, навігацію
```

> **Важливо:** `/iHaveLearnedButton_*` і `/iNeedToLearn_*` НЕ обробляються в `callbackQueryHandlers` — вони передаються до `StateHandler` → `RepeatWordsNowStrategy`.

---

## Налаштування часу нагадувань

Зберігається у `customer.repetitionTime` у форматі `"HH:00"`. Default: `"20:00"`.

Кнопка "Налаштувати розклад" переводить стан у `WaitingForRepetitionTime` → `WaitingForCustomTime`. Стратегія `WaitingForCustomTimeStrategy` парсить введений час і зберігає.
