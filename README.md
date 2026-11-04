# 🎮 SMART Steam Workshop Loader

[![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)](https://www.electronjs.org/)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**SMART Steam Workshop Loader** is a powerful desktop application built for downloading Steam Workshop mods and collections in bulk. Say goodbye to manually entering commands in the console — just paste your links, and the app handles the rest.

## ✨ Features

* **Collections & Single Mods:** Just paste a link or ID. The app automatically detects whether it's a single mod or a collection and extracts all child items.
* **Cascading Parser:** A smart detection algorithm uses three levels of validation (Official Steam API -> DOM Parsing via Chromium -> Regular Expressions). If one method fails, the next one kicks in.
* **Accurate Progress Bar:** Tracks real download speed (MB/s), total size, and estimated time of arrival (ETA).
* **Anti-Bot Protection Bypass:** Configured User-Agent and session handling allow bypassing simple Steam anti-bot checks during page parsing.
* **Multi-language:** Full localization of the UI and console logs into English, Russian, and Spanish.
* **Modern UI:** Dark and Light themes, plus a convenient color-coded console output.
* **Built-in SteamCMD:** No additional installations required — Valve's utility is already bundled into the installer.

## 📸 Screenshots

<div align="center">
  <img width="800" alt="Black Theme" src="https://github.com/user-attachments/assets/d3def4ba-01c6-4e5b-87ce-cf4d7783ddd5" />
  <br/>
  <i>Dark Theme</i>
  <br/><br/>
  <img width="800" alt="White Theme" src="https://github.com/user-attachments/assets/97be7daf-65bf-47f1-a6ae-b3c5594daefd" />
  <br/>
  <i>Light Theme</i>
</div>

## 🚀 How It Works

1. Paste links or IDs (e.g., from your browser).
2. The app extracts numeric IDs and queries the Steam API to check if the object is a collection.
3. If the API doesn't respond, a hidden Electron window loads the page and scrapes the mod IDs directly from the HTML structure (even if they are loaded dynamically).
4. Before downloading, the app requests the exact file sizes from Valve to filter out deleted mods and build an accurate progress graph.
5. `steamcmd.exe` is launched, downloading the mods into the `steamapps/workshop/content/` folder.

## 💻 Running from Source

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Clone the repository:
   ```bash
   git clone https://github.com/Hate6-0/SMARTSteamWorkshopLoader.git
