# Технічне завдання: Angular Telegram Mini App

**Проєкт:** translator-bot  
**Версія:** 1.0  
**Дата:** 2026-04-22  
**Тип:** Monorepo (Angular frontend + NestJS backend)

---

> ## Дизайн-система
>
> Реалізований дизайн базується на стилях, описаних у розділі 2 цього документа.
> Усі кольори, типографіка, анімації та компоненти визначені через CSS Custom Properties.
> Цільова технологія реалізації — **Angular 18 standalone**.

---

## 1. Контекст і мета

Бот-перекладач вже працює як Telegram бот із state-machine логікою (NestJS + PostgreSQL). Ціль — додати повноцінний Web App (Telegram Mini App) поверх існуючого бека, щоб користувач міг управляти своїм словником через нативний UI всередині месенджера.

Дизайни готові (створені через Claude Design). Цей документ описує архітектуру, структуру та вимоги до реалізації з **точним відтворенням затвердженого дизайну**.

---

## 2. Design System

### 2.1 Кольори

```scss
// CSS Custom Properties — точно з дизайн-файлу
:root {
  --primary:       #2AABEE;   // Telegram blue
  --primary-dark:  #1A96D9;
  --primary-light: #E8F6FD;   // #2AABEE + 18% opacity bg
  --bg:            #F0F2F5;   // page background
  --surface:       #FFFFFF;   // card background
  --text:          #1A1A2E;   // primary text
  --text-2:        #6B7280;   // secondary text
  --text-3:        #9CA3AF;   // hint/placeholder
  --success:       #22C55E;
  --success-light: #DCFCE7;
  --warning:       #F59E0B;
  --danger:        #EF4444;
  --border:        rgba(0,0,0,0.07);

  // Shadows
  --shadow-sm:  0 1px 6px rgba(0,0,0,0.06);
  --shadow:     0 4px 20px rgba(0,0,0,0.09);
  --shadow-lg:  0 8px 36px rgba(0,0,0,0.13);

  // Geometry
  --radius:     18px;   // cards
  --radius-sm:  12px;   // small elements
  --nav-h:      68px;   // bottom nav height
  --header-h:   56px;   // screen header height
}

// Dark mode overrides (через Telegram colorScheme)
[data-theme="dark"] {
  --bg:      #1A1A2E;
  --surface: #252540;
  --text:    #F0F2F5;
  --text-2:  #9CA3AF;
  --border:  rgba(255,255,255,0.08);
}
```

### 2.2 Типографіка

- **Шрифт:** Plus Jakarta Sans (400, 500, 600, 700, 800; italic 400)
- **Fallback:** `-apple-system, BlinkMacSystemFont, sans-serif`
- **Базовий font-size:** 16px, `-webkit-font-smoothing: antialiased`

```scss
// Шкала розмірів з дизайну
$font-sizes: (
  "xs":  10.5px,   // nav labels, badges
  "sm":  11px,     // uppercase labels (letter-spacing: 0.6px)
  "base": 13px,    // body text, examples
  "md":  14–15px,  // secondary text, buttons
  "lg":  16.5px,   // word titles в списку
  "xl":  18–19px,  // input text, headers
  "2xl": 22–24px,  // stats numbers
  "3xl": 27–34px,  // hero numbers, ring %
  "4xl": 40–44px,  // flashcard word
  "5xl": 58px,     // settings time display
);
```

### 2.3 Градієнти (точно з дизайну)

```scss
$gradients: (
  "hero":     linear-gradient(160deg, #2AABEE 0%, #1A96D9 55%, #1578A8 100%),
  "primary":  linear-gradient(135deg, #2AABEE, #1A96D9),
  "purple":   linear-gradient(135deg, #8B5CF6, #6D28D9),  // repeat cards
  "green":    linear-gradient(135deg, #10B981, #059669),   // progress
  "flashcard-back": linear-gradient(145deg, #2AABEE, #1578A8),
  "ring":     linearGradient(#2AABEE → #10B981),           // SVG ring
);
```

### 2.4 Анімації

```scss
@keyframes slideUp    { from { transform: translateY(28px); opacity: 0; } }
@keyframes fadeIn     { from { opacity: 0; } }
@keyframes scaleIn    { from { transform: scale(0.88); opacity: 0; } }
@keyframes shake      { /* ±9px, ±5px */ }
@keyframes checkPulse { 0%→scale(1), 40%→scale(1.35), 70%→scale(0.88) }
@keyframes shimmer    { /* skeleton loader, bg-size: 200% */ }
@keyframes slideInFromRight { from { transform: translateX(60px); opacity: 0; } }
@keyframes bounce     { /* loading dots, translateY(-5px) */ }

// Spring easing: cubic-bezier(0.34, 1.36, 0.64, 1)
// Stagger delays: d1=0.06s, d2=0.12s, d3=0.18s, d4=0.24s, d5=0.30s
```

### 2.5 Компоненти дизайну

**Card:**
```scss
.card {
  background: var(--surface);
  border-radius: var(--radius);        // 18px
  box-shadow: var(--shadow-sm);
}
```

**Buttons:**
```scss
.btn { padding: 14px 20px; border-radius: 12px; font-size: 15.5px; font-weight: 600; }
.btn:active { transform: scale(0.966); }
.btn-primary   { background: var(--primary); color: #fff; }
.btn-secondary { background: var(--primary-light); color: var(--primary); }
.btn-outline   { background: transparent; border: 1.5px solid var(--border); }
.btn-success   { background: var(--success); color: #fff; }
.btn-warn      { background: #FEF3C7; color: #D97706; }
.btn-sm        { padding: 10px 16px; font-size: 14px; }
```

**Bottom Nav:**
- Height: 68px, white background, `box-shadow: 0 -4px 20px rgba(0,0,0,0.05)`
- Active: blue pill indicator (36×3px) above icon, icon scale(1.18) translateY(-1px)
- Tabs: Home, Learn, Repeat, Progress

**Screen Header:**
- Height: 56px, sticky, white background, bottom border
- Back button: 36×36px circle, `background: var(--bg)`
- Title: 18px, font-weight 700

**Toggle:**
- 50×28px, thumb 22×22px, left:3px (off) / left:25px (on)
- Spring transition cubic-bezier(0.34, 1.36, 0.64, 1)

**Skeleton loader:**
- shimmer gradient: `#EAECEF → #DDE0E4 → #EAECEF`, background-size: 200%
- border-radius: 8px

**Progress bar:**
- Height: 4px, `border-radius: 2px`, primary fill, transition 0.5s

### 2.6 Іконки (inline SVG)

Власний набір `Ic.*`: Home, Book, Repeat, BarChart, Flame, Check, X, ChevR, ChevL, ChevD, Camera, Search, Settings, Clock, Bell, BookOpen, Plus.
Всі — stroke-based, strokeWidth=2, strokeLinecap=round/linejoin=round.

---

## 3. Екрани (8 screens)

Shared компоненти: `BottomNav`, `ScreenHdr`, `Toggle`, `SkeletonCard`, іконки `Ic.*`

### Screen 1: Home
- **Hero блок** з градієнтом `#2AABEE → #1578A8`
  - Greeting "Good morning, {name} 👋" (fontSize 27, fontWeight 800)
  - Streak badge: `rgba(255,255,255,0.16)` background, Flame icon + число + "day streak"
  - Stats bar: `rgba(255,255,255,0.15)` background, 3 колонки (Total / Learned / Due Today), розділювачі `rgba(255,255,255,0.28)`, числа fontWeight 800 fontSize 24
- **Action cards** (3 картки з градієнтними іконками):
  - Learn Words — синій градієнт `#2AABEE → #1A96D9`
  - Repeat Words — пурпурний `#8B5CF6 → #6D28D9` + badge з кількістю
  - My Progress — зелений `#10B981 → #059669`
  - Анімація при touch: scale(0.975), box-shadow зменшується
- **Browse Learned Words** — outlined button внизу
- Entrance: staggered slideUp (d2, d3, d4 delays)

### Screen 2: Learn
- Header "Learn Words"
- Input card: uppercase label "ENGLISH WORD OR PHRASE" (primary color), textarea з auto-resize
- Кнопки: Photo (outline) + Translate → (primary, flex 2.2)
- **Skeleton loader** під час завантаження (1.1s таймаут у прототипі)
- **Result card:**
  - Header: синій градієнт, "English → Ukrainian" label, слово (fontSize 30, white, bold), переклад (fontSize 22, italic)
  - Examples: accordion (Show/Hide examples), приклади з `borderLeft: 3px solid var(--primary)`
  - Buttons: "Learn More" (secondary) + "Got It!" (success з checkPulse анімацією)
- Shake анімація при порожньому submit + error banner вгорі

### Screen 3: Repeat (Flashcards)
- Header "Repeat Words" + лічильник "X/9" справа
- Progress bar (4px, primary)
- **3D Flashcard** (perspective 1100px, rotateY 180deg, transition 0.52s):
  - Front: word (fontSize 44, fontWeight 800), "Tap to reveal" hint, "English" label
  - Back: синій градієнт, переклад (fontSize 40), приклади у `rgba(255,255,255,0.15)` блоці
- **Progress dots**: ширина 22px (active) / 8px, кольори green/orange/blue/gray
- Swipe gesture (touchStart/End, threshold 52px)
- Кнопки після flip: "Need Practice" (warn) + "Learned ✓" (success)
- **Session Complete screen**: зелений check circle, статистика 2×2 grid, кнопки restart/schedule

### Screen 4: Schedule
- Header "Repetition Schedule" + back button
- Summary badge: синій circle icon + поточний час + частота
- **Preset chips** (2×2 grid): `07:00`, `09:00`, `19:00`, `21:00`
  - Active: primary border (2px), primary-light bg, check badge у правому куті
  - Transition: cubic-bezier(0.34, 1.36, 0.64, 1)
- **Frequency toggle**: Daily / Weekly / Monthly, segmented control (active = primary bg)
- **Custom time picker** (accordion):
  - Hour spinner: кнопки −/+, число fontSize 40 fontWeight 800
  - Minute spinner: кроки по 5
  - "Use This Time" secondary button
- "Confirm Schedule" primary button (з checkPulse при save)

### Screen 5: Progress
- Header "My Progress" + Settings icon справа
- **SVG Circular ring** (R=72, strokeWidth=14):
  - Gray track + gradient fill (`#2AABEE → #10B981`)
  - Percentage text (fontSize 34) + "completed" label
  - Animated stroke-dashoffset (1.4s transition)
- **Metric cards** (2-column grid):
  - Words Learned (blue, count-up animation)
  - Streak Days (orange/flame icon, count-up)
- Due Today (full width, yellow/warning color)
- **Weekly bar chart** (7 bars, flex layout, height 80px):
  - Weekdays (S, M, T, W, T, F, S)
  - S/S bars: `#E5E7EB` (weekend), weekdays: primary gradient
- CTAs: "Repeat Now" (primary) + "Browse Learned Words" (secondary)

### Screen 6: Words (Learned Words List)
- Header "Learned Words" + back
- **Sticky search bar** (top: 56px, zIndex 55): Ic.Search + input + clear X
- Word count: "N words" label
- **Accordion list**: word (fontWeight 700) + translation (text-2), expand → examples
  - Examples: `borderLeft: 3px solid primary`, bg: var(--bg), borderRadius 9px
- "Load More (N remaining)" outlined button (batch: 9)
- Empty state: 📚 emoji + "No words found"
- Entrance: staggered slideUp, delay 0.035s × index

### Screen 7: Settings
- Header "Settings" + back
- **Big time display** card: "Daily Reminder" label, time fontSize 58 primary color, letterSpacing -1
- **Notification toggle** card: Bell icon (primary-light bg when on) + Toggle
- **Quick links** card: Repetition Schedule / Learned Words rows з ChevR
- Save button (primary, checkPulse при save)

### Screen 8: Practice
- Header "Practice Words" + лічильник слів
- **Sticky search bar**: фільтрація по слову/перекладу
- **Режим списку**: список слів із accordion — натиснути → перейти в режим картки
- **Режим картки (flashcard)**: окреме слово з перекладом і прикладами, кнопки навігації
- Вхідна анімація staggered slideUp

---

## 4. Монорепозиторій: структура

Фронтенд розміщується **в межах існуючого репозиторію** як окремий workspace:

```
translator-bot/                          ← корінь монорепо
├── src/                                 ← NestJS backend (існуючий)
├── prisma/
├── docs/
├── apps/
│   └── mini-app/                        ← Angular застосунок (новий)
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/                ← guards, interceptors, telegram service
│       │   │   ├── features/
│       │   │   │   ├── home/            ← дашборд
│       │   │   │   ├── learn/           ← додати нове слово
│       │   │   │   ├── repeat/          ← флешкарти повторення
│       │   │   │   ├── practice/        ← тренування слів
│       │   │   │   ├── progress/        ← статистика
│       │   │   │   ├── words/           ← список вивчених слів
│       │   │   │   ├── schedule/        ← налаштування розкладу
│       │   │   │   └── settings/        ← налаштування
│       │   │   └── shared/              ← UI компоненти (BottomNav, ScreenHdr, Toggle, Skeleton, Icons)
│       │   ├── environments/
│       │   └── styles/
│       ├── angular.json
│       ├── tsconfig.json
│       └── package.json
├── package.json                         ← root package.json з workspaces
└── nest-cli.json
```

### Налаштування root package.json

```json
{
  "workspaces": ["apps/mini-app"],
  "scripts": {
    "mini-app:dev": "npm run -w apps/mini-app start",
    "mini-app:build": "npm run -w apps/mini-app build:prod",
    "mini-app:lint": "npm run -w apps/mini-app lint"
  }
}
```

### NestJS: сервінг зібраного Angular

Backend роздає зібраний Angular із `dist/mini-app/browser/` через існуючий `StaticController` або новий контролер:

```
GET /mini-app        → index.html (Angular entry point)
GET /mini-app/*      → статичні assets
```

Для prod — через nginx або NestJS `ServeStaticModule`.

---

## 5. Telegram Mini App: технічна специфіка

### 3.1 SDK

```html
<!-- apps/mini-app/src/index.html -->
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 3.2 Angular TelegramService

```typescript
// core/services/telegram.service.ts
@Injectable({ providedIn: 'root' })
export class TelegramService {
  private tg = window.Telegram.WebApp;

  get user() { return this.tg.initDataUnsafe?.user; }
  get initData() { return this.tg.initData; }
  get colorScheme() { return this.tg.colorScheme; }

  ready() { this.tg.ready(); }
  expand() { this.tg.expand(); }
  close() { this.tg.close(); }

  showMainButton(text: string, callback: () => void) {
    this.tg.MainButton.setText(text);
    this.tg.MainButton.onClick(callback);
    this.tg.MainButton.show();
  }

  hideMainButton() { this.tg.MainButton.hide(); }

  showBackButton(callback: () => void) {
    this.tg.BackButton.onClick(callback);
    this.tg.BackButton.show();
  }

  hideBackButton() { this.tg.BackButton.hide(); }

  hapticImpact(style: 'light' | 'medium' | 'heavy') {
    this.tg.HapticFeedback.impactOccurred(style);
  }

  showAlert(message: string) {
    this.tg.showAlert(message);
  }

  setHeaderColor(color: string) {
    this.tg.setHeaderColor(color);
  }
}
```

### 3.3 Аутентифікація через Telegram initData

Замість email/password — валідація через `initData` (HMAC-SHA256 підпис від Telegram).

**Новий endpoint на беку:**

```
POST /auth/telegram
Body: { initData: string }
Response: { access_token: string, refresh_token: string }
```

Backend перевіряє підпис `initData` через `BOT_TOKEN` та видає JWT. Це замінює логін для Mini App.

**AuthInterceptor** автоматично додає `Authorization: Bearer <token>` до всіх запитів.

---

## 6. API: відповідність існуючих endpoints

Усі існуючі контролери вже захищені `JwtAuthGuard`. Mini App використовує їх напряму.

### 4.1 Words API

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/words/customer/:customerId` | Слова за статусом навчання (`?needToLearn=true/false`) |
| `GET` | `/words/customer/:customerId/learned` | Вивчені слова з пагінацією |
| `GET` | `/words/customer/:customerId/count` | Кількість слів |
| `GET` | `/words/repetition?customerId=X` | Слова для повторення |
| `POST` | `/words` | Додати нове слово |
| `PUT` | `/words/:wordId` | Оновити слово |
| `PATCH` | `/words/:wordId/repetition` | Оновити статус повторення |

### 4.2 Customers API

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/customers/:chatId` | Отримати профіль за chatId |
| `PUT` | `/customers/:chatId` | Оновити час нагадувань |

### 4.3 Auth API (нові endpoints для Mini App)

| Метод | Endpoint | Опис |
|-------|----------|------|
| `POST` | `/auth/telegram` | Вхід через Telegram initData |
| `POST` | `/auth/refresh` | Оновлення токена |

### 4.4 Потребує реалізації на беку

Для повноцінного Mini App потрібно додати:

```
DELETE /words/:wordId              ← видалення слова
GET    /words/customer/:id/stats   ← зведена статистика (for progress screen)
```

---

## 7. Angular: технічні рішення

### 7.1 Версія та залежності

```json
{
  "dependencies": {
    "@angular/core": "^18.0.0",
    "@angular/router": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@ngrx/store": "^18.0.0",
    "@ngrx/effects": "^18.0.0",
    "@ngrx/entity": "^18.0.0"
  }
}
```

Використовувати **standalone components** (без NgModule).

### 7.2 Routing

```typescript
// app.routes.ts (актуальний)
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',     loadComponent: () => import('./features/home/home.component') },
  { path: 'learn',    loadComponent: () => import('./features/learn/learn.component') },
  { path: 'repeat',   loadComponent: () => import('./features/repeat/repeat.component') },
  { path: 'schedule', loadComponent: () => import('./features/schedule/schedule.component') },
  { path: 'progress', loadComponent: () => import('./features/progress/progress.component') },
  { path: 'words',    loadComponent: () => import('./features/words/words.component') },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component') },
  { path: 'practice', loadComponent: () => import('./features/practice/practice.component') },
  { path: '**', redirectTo: 'home' },
];
```

### 7.3 State management (NgRx)

```
store/
├── words/
│   ├── words.actions.ts
│   ├── words.reducer.ts
│   ├── words.effects.ts
│   └── words.selectors.ts
├── customer/
│   ├── customer.actions.ts
│   ├── customer.reducer.ts
│   ├── customer.effects.ts
│   └── customer.selectors.ts
└── repetition/
    ├── repetition.actions.ts
    ├── repetition.reducer.ts
    └── repetition.selectors.ts
```

### 7.4 HTTP Layer

```typescript
// core/api/words.api.ts
@Injectable({ providedIn: 'root' })
export class WordsApiService {
  private http = inject(HttpClient);
  private base = '/api/words';

  getWords(customerId: number, needToLearn: boolean) {
    return this.http.get<WordResponseDto[]>(
      `${this.base}/customer/${customerId}`,
      { params: { needToLearn } }
    );
  }

  updateRepetition(wordId: number, success: boolean) {
    return this.http.patch<WordResponseDto>(
      `${this.base}/${wordId}/repetition`,
      { success }
    );
  }
  // ...
}
```

### 7.5 Теми (CSS Custom Properties)

```scss
// styles/themes.scss
:root {
  --tg-theme-bg-color: var(--tg-theme-bg-color, #ffffff);
  --tg-theme-text-color: var(--tg-theme-text-color, #000000);
  --tg-theme-hint-color: var(--tg-theme-hint-color, #999999);
  --tg-theme-link-color: var(--tg-theme-link-color, #2678b6);
  --tg-theme-button-color: var(--tg-theme-button-color, #2678b6);
  --tg-theme-button-text-color: var(--tg-theme-button-text-color, #ffffff);
  --tg-theme-secondary-bg-color: var(--tg-theme-secondary-bg-color, #f1f1f1);
}
```

Усі компоненти використовують тільки CSS-змінні Telegram для автоматичної підтримки dark/light mode.

---

## 9. Безпека

### 7.1 Валідація initData на беку

```typescript
// auth/telegram-auth.service.ts
import * as crypto from 'crypto';

validateTelegramInitData(initData: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return expectedHash === hash;
}
```

### 7.2 JWT для Mini App

- Access token: 15 хвилин
- Refresh token: 7 днів
- Автоматичний refresh через `HttpInterceptor`

---

## 10. Telegram Bot: інтеграція

### 8.1 Кнопка відкриття Mini App

У існуючих шаблонах повідомлень додати `web_app` кнопку:

```json
{
  "name": "mainMenu",
  "body": "{\"text\":\"...\",\"reply_markup\":{\"inline_keyboard\":[[{\"text\":\"Відкрити додаток\",\"web_app\":{\"url\":\"https://your-domain.com/mini-app\"}}]]}}"
}
```

### 8.2 Команда /app

Нова команда бота `/app` → відправляє повідомлення з кнопкою Web App.

---

## 11. Розгортання

### 9.1 Build pipeline

```bash
# 1. Збірка Angular
cd apps/mini-app && ng build --configuration=production --base-href=/mini-app/

# 2. Копіювання до dist NestJS
cp -r apps/mini-app/dist/browser/ dist/mini-app/

# 3. NestJS build
nest build
```

### 9.2 Docker

```dockerfile
# Dockerfile (оновлений)
FROM node:20-alpine AS mini-app-builder
WORKDIR /app
COPY apps/mini-app/package*.json ./apps/mini-app/
RUN npm install -w apps/mini-app
COPY apps/mini-app/ ./apps/mini-app/
RUN npm run mini-app:build

FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
COPY --from=mini-app-builder /app/apps/mini-app/dist/ ./apps/mini-app/dist/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]
```

### 9.3 NestJS StaticModule

```typescript
// app.module.ts
ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'mini-app'),
  serveRoot: '/mini-app',
  exclude: ['/api/*'],
})
```

---

## 12. Порядок реалізації

### Фаза 1: Інфраструктура монорепо (2–3 дні)
- [ ] Ініціалізувати `apps/mini-app` як Angular 18 standalone проєкт
- [ ] Налаштувати root workspaces в `package.json`
- [ ] Налаштувати build pipeline та `ServeStaticModule`
- [ ] Базовий `TelegramService` + ініціалізація `WebApp.ready()`
- [ ] CSS-змінні теми Telegram

### Фаза 2: Аутентифікація (1–2 дні)
- [ ] Endpoint `POST /auth/telegram` з валідацією initData
- [ ] `AuthInterceptor` та `AuthGuard` в Angular
- [ ] Автоматичний refresh токена

### Фаза 3: Core screens (4–5 днів)
- [ ] MainMenu screen
- [ ] Dictionary screen з пагінацією
- [ ] WordCard screen
- [ ] AddWord screen

### Фаза 4: Repetition flow (2–3 дні)
- [ ] Repetition screen (флешкартки)
- [ ] Інтеграція з `PATCH /words/:id/repetition`
- [ ] Telegram HapticFeedback при відповідях

### Фаза 5: Progress + polish (2 дні)
- [ ] Progress screen
- [ ] Анімації переходів між екранами
- [ ] Повна підтримка dark mode через Telegram CSS vars
- [ ] Telegram MainButton / BackButton інтеграція на всіх екранах

---

## 13. Технічні обмеження та нотатки

- Mini App повинен бути доступний по **HTTPS** (Telegram вимога)
- Під час розробки — `ngrok` або `localtunnel` для тестування в Telegram
- `window.Telegram.WebApp` доступний тільки в Telegram WebView, не в браузері → додати `isTelegramEnv()` guard та fallback для розробки
- Angular build output у `apps/mini-app/dist/browser/` → копіюється до `dist/mini-app/` NestJS
- `base-href` для Angular має бути `/mini-app/`
- Усі API запити через відносний шлях `/api/` (proxy в Angular dev server → backend `localhost:3000`)

### Angular dev proxy (apps/mini-app/proxy.conf.json)
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```
