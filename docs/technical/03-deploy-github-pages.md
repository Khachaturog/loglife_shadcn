# Деплой на GitHub Pages (пошагово)

Проект настроен на сборку и публикацию через GitHub Actions.

**Репозиторий:** `https://github.com/<username>/<repo-name>`

После деплоя сайт будет доступен по адресу:

`https://<username>.github.io/<repo-name>/` (подставьте свой username и имя репозитория)

---

## Шаг 1. Репозиторий на GitHub

1. Создайте репозиторий на [github.com](https://github.com/new) (если ещё нет).
2. Не добавляйте README, .gitignore или лицензию, если проект уже есть локально.
3. Подключите локальный проект и запушьте:

```bash
git remote add origin https://github.com/<username>/<repo-name>.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Шаг 2. Секреты для Supabase

Переменные окружения в GitHub не видны при сборке из соображений безопасности. Их нужно добавить как **Secrets**:

1. Откройте репозиторий на GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Нажмите **New repository secret** и создайте два секрета:

| Name                  | Value                                      |
|-----------------------|--------------------------------------------|
| `VITE_SUPABASE_URL`   | URL вашего проекта (например `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Anon (public) key из Supabase Dashboard   |

Значения можно взять в [Supabase](https://supabase.com/dashboard) → ваш проект → **Settings** → **API**.

---

## Шаг 3. Включить GitHub Pages

1. В репозитории: **Settings** → **Pages**.
2. В блоке **Build and deployment**:
   - **Source**: обязательно выберите **GitHub Actions** (не «Deploy from a branch»).
3. Сохраните (остальное менять не нужно).

Если оставить «Deploy from a branch», GitHub будет отдавать исходники из репозитория, а не собранное приложение — в итоге в консоли будет 404 на `/src/main.tsx`.

---

## Ошибка «Setup GitHub Pages» / «Get Pages site failed»

Если в workflow шаг **Setup GitHub Pages** падает с ошибкой:

```
Error: Get Pages site failed. Please verify that the repository has Pages enabled
and configured to build using GitHub Actions...
Error: HttpError: Not Found
```

значит Pages ещё не настроен или выбран неправильный источник. **Шаг 3** выполнен некорректно или не выполнен: в **Settings** → **Pages** принудительно выберите **Source: GitHub Actions**. После этого перезапустите workflow (Actions → Deploy to GitHub Pages → Run workflow).

---

## Шаг 4. Деплой

- При каждом **push в ветку `main`** workflow сам соберёт проект и задеплоит его на GitHub Pages.
- Либо откройте вкладку **Actions**, выберите workflow **Deploy to GitHub Pages** и нажмите **Run workflow** (кнопка **Run workflow** справа).

Первый деплой может занять 1–2 минуты. Статус смотрите во вкладке **Actions**.

---

## Шаг 5. Открыть сайт

После успешного выполнения workflow:

1. Снова зайдите в **Settings** → **Pages**.
2. Вверху появится зелёный блок с ссылкой вида:  
   `https://<username>.github.io/<repo-name>/`
3. Перейдите по этой ссылке — должно открыться приложение.

Если открывается пустая страница или 404, подождите 1–2 минуты и обновите страницу (кэш CDN).

---

## Что уже сделано в проекте

- **Vite**: `base` задаётся через `BASE_PATH` при сборке в CI, чтобы корректно работали ссылки и ассеты на подпути (`/repo-name/`).
- **React Router**: используется `basename={import.meta.env.BASE_URL}`, чтобы роуты совпадали с этим базовым путём.
- **GitHub Actions** (`.github/workflows/deploy-pages.yml`):
  - установка зависимостей и `npm run build` с секретами Supabase;
  - копирование `index.html` в `404.html` для работы SPA при прямых переходах по URL;
  - публикация папки `dist` на GitHub Pages.

---

## Если деплой из другой ветки

В файле `.github/workflows/deploy-pages.yml` в секции `on.push.branches` указана ветка `main`. Чтобы деплоить с другой ветки (например `master`), замените:

```yaml
on:
  push:
    branches: [master]
```

---

## Локальная проверка сборки «как для GitHub Pages»

Чтобы проверить сборку с тем же базовым путём, что и на Pages:

```bash
BASE_PATH=/<repo-name>/ npm run build
npx vite preview
```

Откройте в браузере `http://localhost:4173/<repo-name>/` — должно вести себя как на GitHub Pages.

---

## Ошибка 404 на /src/main.tsx

Если в консоли браузера видите `GET .../src/main.tsx net::ERR_ABORTED 404`:

- Сайт отдаётся **не из артефакта** workflow, а из исходников репозитория.
- Зайдите в **Settings** → **Pages** и в **Source** выберите **GitHub Actions** (не «Deploy from a branch»).
- Дождитесь зелёного выполнения workflow во вкладке **Actions**, затем обновите страницу по адресу вашего сайта (обязательно с путём `/<repo-name>/`).
