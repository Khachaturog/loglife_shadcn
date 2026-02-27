# Документация Log Life

## Структура и порядок

| Что читать | Где | Зачем |
|------------|-----|--------|
| **Требования (подряд)** | [requirements/](requirements/) | Бизнес-требования, глоссарий, сущности, экраны. Навигация: [requirements/README.md](requirements/README.md). Читать по порядку 00 → 15. |
| **Сводка бизнес-логики** | [requirements/business-logic.md](requirements/business-logic.md) | Краткая выжимка: продукт, доменная модель, правила, экраны, потоки данных. Удобно для быстрого входа. |
| **План разработки фронта** | [plan-frontend.md](plan-frontend.md) | План по фазам: роутинг, экраны, API. Ссылки на требования. |
| **Техническая документация** | [technical/](technical/) | Схема БД ([01-supabase-schema.md](technical/01-supabase-schema.md)), настройка Supabase, деплой, версионирование конфигов ([04-block-config-schema.md](technical/04-block-config-schema.md)), **запросы к API** ([technical/api-requests.md](technical/api-requests.md)). |

Раньше `api-requests.md` и `business-logic.md` лежали в корне `docs/` без явного места. Сейчас: **api-requests** перенесён в `technical/` (это описание запросов к Supabase), **business-logic** — в `requirements/` (сводка по требованиям). В корне `docs/` остаётся только **plan-frontend.md** (план разработки, один файл).

---

**Правило:** вести и актуализировать документацию при изменении кода или продукта. Для Cursor оно задано в `.cursor/rules/docs-sync.mdc`.
