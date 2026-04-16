# Click2Save Electron

Electron version of Click2Save migrated from the root product documents.

## Features

- Text and image collection
- Date filtering
- Record list and detail panel
- Image thumbnails
- Note editing
- Manual text creation
- Delete record
- Tray and notifications
- Auto judgment
- Copy-then-key capture
- Double-copy capture
- Alt+Q capture for current clipboard content

## Structure

- `src/main`: main process, storage, tray, clipboard monitor
- `src/renderer`: UI and interactions
- `data`: local development data directory

## Install

Run inside `Click2Save.Electron`:

```bash
npm install
```

## Start

```bash
npm run dev
```

## Build

```bash
npm run dist
```

## Notes

- Current storage layer uses JSON files for fast startup
- Current `Alt+Q` implementation captures current clipboard content
- To fully simulate copy-from-selection on `Alt+Q`, add an OS automation library later
- `copy-then-key` depends on `uiohook-napi`
