# Рассвет — деплой

Статический сайт. Никакого билда не требуется.

## Быстрый деплой через Vercel CLI

```bash
npm i -g vercel
cd deploy
vercel          # превью
vercel --prod   # прод
```

## Через GitHub + Vercel

1. Создайте репозиторий на github.com
2. Загрузите в него содержимое папки `deploy/`
3. На https://vercel.com/new импортируйте репозиторий
4. Framework Preset: **Other**, Build Command и Output Directory оставьте пустыми
5. Deploy

## Через drag & drop

1. На https://vercel.com/new нажмите «Deploy without Git» / перетащите ZIP папки `deploy/`

## Кастомный домен

В проекте на Vercel: **Settings → Domains → Add**.

## Структура

```
deploy/
├── index.html      главная (бывший «Рассвет v2.html»)
├── vercel.json     кеширование статики
└── img/            фото лендинга
```
