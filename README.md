# YouTube Minimal Video Saver

A lightweight userscript that automatically saves your YouTube watch progress and resumes videos from where you left off.

Completed videos are cleaned up automatically to keep storage minimal and clutter-free.

---

## Features

- ▶ Resume videos from the last watched position
- 🧹 Automatically removes saved progress after ~95% completion
- 💾 Extremely lightweight storage usage
- 🧠 Fully compatible with YouTube SPA navigation
- 🖱 Built-in UI to manage saved videos
- ⚡ No background loops or performance impact

---

## How It Works

- The script periodically saves the current playback time
- Once a video reaches ~95% completion, its saved data is automatically deleted
- A simple management UI lets you:
  - View saved videos
  - Jump back to saved positions
  - Delete individual entries or clear all

All data is stored locally using userscript storage.

---

## Installation

1. Install **Tampermonkey** (or a compatible userscript manager)
2. Open the script page on **GreasyFork**
3. Click **Install**
4. Watch YouTube videos as usual — progress is saved automatically

---

## User Interface

The script adds a menu entry to Tampermonkey:

- **📜 Manage Saved Videos**

This opens a clean modal interface showing all saved videos and controls.

---

## Compatibility

- ✔ Chrome / Chromium
- ✔ Firefox
- ✔ Edge
- ✔ YouTube Desktop

> Mobile browsers are not officially supported.

---

## Privacy & Security

This script:
- Does **not** collect personal data
- Does **not** make network requests
- Stores data **locally only**
- Uses minimal storage and auto-cleanup

---

## License

MIT License

---

## Disclaimer

This project is not affiliated with or endorsed by YouTube or Google.
