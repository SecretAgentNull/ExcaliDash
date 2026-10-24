---
title: ExcaliDash Local Development
description: Set up the ExcaliDash frontend and backend locally to develop a self-hosted Excalidraw workspace.
---

<script setup>
import { setupSlides } from "../.vitepress/theme/screenshot-flows";
</script>

# Local development

Run the backend and frontend in separate terminals.

## Requirements

- Node.js 24.22.1+ (`nvm use` selects the version in `.nvmrc`)
- npm 10
- Git

## Install dependencies

From the repository root:

```bash
npm run install:all
npm install
```

### Embedded editor version

The frontend pins `@excalidraw/excalidraw` to `0.18.0-17d8904`, the published
`next` build that includes sticky notes. The stable `0.18.1` release does not
include them. Keep the exact version and frontend lockfile together when updating;
prerelease builds can change the embedding API. This build uses `onExcalidrawAPI`
for the editor callback and `exportScene` for SVG previews.

Russian is available as **Русский** in **Settings → Language**, and the same
saved preference selects the editor's built-in `ru-RU` translation. Russian covers settings, dashboard controls, editor chrome, sharing, history,
profile, sign-in, onboarding, and administration. Source strings live in
`frontend/src/locales/ru.ts`; `useTranslation` rerenders UI when the saved locale
changes. Editor effects use `useEventTranslation` so a language change does not
reload a drawing or reconnect collaboration. Unknown server diagnostics remain
unchanged instead of being hidden.

## Configure the apps

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Replace the generated path placeholders in `backend/.env`:

```dotenv
DATABASE_URL=file:./dev.db
BACKUP_DIR=./backups
```

## Start the backend

```bash
cd backend
npm run dev
```

## Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:6767`, then follow the first-run screens below. Select the arrows to move from authentication setup through creating an administrator and opening your first drawing.

<ScreenshotCarousel label="First-run setup after starting the local services" :slides="setupSlides" />

## Fork CI and container publishing

CI publishes images to `ghcr.io/<owner>/<repository>-backend` and
`ghcr.io/<owner>/<repository>-frontend`, with the repository path lowercased.
It authenticates using the built-in `GITHUB_TOKEN` with `packages: write`;
no Docker Hub secret is required. Pushes to `dev` publish development images
and pushes to `main` publish stable images, after tests pass. Pull requests
build without publishing. Manual runs build without publishing by default; select
**Publish container images** on `dev` or `main` to publish a deployable image pair.
For example:

```sh
gh workflow run CI --ref dev -f publish_images=true
```

Forks retain the upstream `VERSION` without introducing their own release versions.
GitHub release creation and release-driven branch synchronization run only in
`ZimengXiong/ExcaliDash`. Container builds still use commit-specific development
tags and the upstream version for stable images; these do not change the app version
or create Git tags or GitHub releases in the fork.

The production Compose file defaults to this fork's images at
`ghcr.io/secretagentnull/excalidash`. Set `EXCALIDASH_IMAGE_PREFIX` to use a
different fork, and `EXCALIDASH_TAG` to select a release (`latest` by default,
`dev` for development). New GHCR packages may be private; make both packages
public in GitHub's package settings for anonymous pulls, or authenticate Docker
with an account that has package read access.

To deploy the image pair published from `dev`, use:

```sh
EXCALIDASH_TAG=dev docker compose -f docker-compose.prod.yml pull
EXCALIDASH_TAG=dev docker compose -f docker-compose.prod.yml up -d
```

The `latest` tag is published only by a successful build on `main`.
