# Монорепозиторії: переваги та недоліки

## Що таке монорепо

**Монорепозиторій** — це один git-репозиторій, в якому розміщено кілька пов'язаних проєктів. У нашому випадку: існуючий NestJS бекенд + новий Angular Mini App.

Альтернатива — **поліреп** (polyrepo): кожен проєкт живе у власному репозиторії і деплоїться незалежно.

---

## Переваги монорепо

### 1. Спільний код без npm-пакетів
Shared типи, інтерфейси та утиліти можна імпортувати напряму:
```typescript
// apps/mini-app/src/app/api/words.service.ts
import type { WordResponseDto } from '../../../../../../src/word/dto';
// або через path alias:
import type { WordResponseDto } from '@backend/word/dto';
```
Не потрібно публікувати окремий npm-пакет `@translator-bot/shared-types` і тримати його синхронізованим.

### 2. Атомарні зміни
Якщо ви змінюєте API (наприклад, додаєте поле `repeatCount` до `WordResponseDto`), ви можете в **одному коміті** оновити і бек, і фронт. Немає "розсинхронізованих версій".

### 3. Єдиний CI/CD пайплайн
Один `.github/workflows/deploy.yml` збирає і деплоїть обидва проєкти разом. Легше налаштувати conditional builds: "якщо змінився `src/` — rebuild backend, якщо `apps/mini-app/` — rebuild frontend".

### 4. Спільна конфігурація
- Один `tsconfig.json` base для shared rules
- Один `.eslintrc` / `prettier.config.js`
- Один `docker-compose.yml` для всього стеку
- Спільні secrets у `.env`

### 5. Простіше onboarding
`git clone` → `npm install` → все готово. Новий розробник не мусить клонувати 2–3 репозиторії і розбиратись у їх залежностях.

### 6. Спрощене версіювання
Версія бекенду і фронтенду завжди синхронізовані (один `CHANGELOG`, один git tag). Немає ситуації "frontend v2.1.0 не сумісний з backend v1.8.0".

---

## Недоліки монорепо

### 1. Повільніший `git clone` і `git log` з часом
Якщо репо росте до тисяч файлів, базові git операції стають помітно повільнішими. Для нашого масштабу (~500 файлів) — не критично.

### 2. `npm install` встановлює залежності всіх проєктів
Angular має свої `@angular/*` залежності, NestJS — свої. Без правильного налаштування workspaces вони будуть дублюватись у `node_modules`.

**Рішення:** npm workspaces hoisting підіймає спільні залежності в корінь. Конфліктуючі версії ізолюються в `apps/mini-app/node_modules/`.

### 3. Більший context для CI/CD
За замовчуванням кожен push запускає всі тести, навіть якщо змінився тільки README. Потрібно налаштувати **path-based filters**:
```yaml
# .github/workflows/ci.yml
on:
  push:
    paths:
      - 'src/**'        # backend
      - 'apps/**'       # frontend
      - 'prisma/**'
```

### 4. Складніша архітектура git
Якщо команди frontend і backend великі — pull requests стають "шумними", рев'юери бачать зміни в обох частинах. Для команди 1–3 людини це не проблема.

### 5. Заплутані path aliases
Якщо не налаштовані правильно, відносні imports між `src/` (NestJS) і `apps/mini-app/src/` стають громіздкими. Потрібно дбайливо налаштувати `tsconfig.json` path aliases.

---

## Коли монорепо НЕ підходить

| Ситуація | Краще поліреп |
|----------|---------------|
| Фронт і бек деплояться абсолютно незалежно різними командами | ✅ |
| Різні мови (наприклад, Go backend + TS frontend) | ✅ |
| Open source проєкт де frontend — окрема бібліотека | ✅ |
| Репо вже має 10+ проєктів і потребує Nx/Turborepo | ✅ |

---

## Коли монорепо підходить ідеально

| Ситуація | Монорепо |
|----------|----------|
| Один розробник або мала команда (1–5 осіб) | ✅ |
| Фронт і бек тісно пов'язані (shared типи, co-deploy) | ✅ |
| Проєкт 2–3 застосунки з одним доменом | ✅ |
| Хочеться простоти, а не enterprise-інструментів | ✅ |

---

## Наш вибір: npm workspaces (без Nx/Turborepo)

Для нашого масштабу (1 бек + 1 фронт) **npm workspaces** — достатньо. Nx або Turborepo мають сенс коли 5+ пакетів і потрібен distributed caching.

**Структура:**
```
translator-bot/
├── package.json          ← { "workspaces": ["apps/mini-app"] }
├── src/                  ← NestJS (не workspace, основний проєкт)
└── apps/
    └── mini-app/
        └── package.json  ← Angular workspace member
```

**Ключові правила:**
- `@angular/*` залежності — тільки в `apps/mini-app/package.json`
- Shared dev tools (eslint, prettier, jest) — в корінному `package.json`
- NestJS залежності — в корінному `package.json` (бо `src/` не є workspace member, він IS the root project)

---

## Альтернатива: Nx monorepo

Якщо проєкт зросте, можна мігрувати на **Nx**:
```bash
npx nx init              # додає Nx до існуючого репо
```
Nx дає:
- Affected builds (rebuild тільки те, що змінилось)
- Task graph із залежностями
- Remote caching (Nx Cloud)
- Generators для Angular/NestJS

Але для поточного масштабу — зайва складність.
