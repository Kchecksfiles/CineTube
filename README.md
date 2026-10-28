<div align="center">

<img src="assets/cinetube-logo.png" alt="CineTube logo" width="112">

# CineTube

**YouTube, with a little more of that streaming-service feel.**

<img src="assets/cinetube-logo-transition.gif" alt="CineTube interface-to-logo transition" width="720">

<img src="assets/cinetube-readme-animation.gif" alt="CineTube cinematic interface animation" width="820">

</div>

---

CineTube is a browser extension that gives YouTube a more cinematic, catalogue-style interface. Think big featured content, horizontal rows, a slimmer navigation rail, and a few controls to make the viewing experience your own.

It's an independent experiment in making a familiar product feel different — without building another video platform from scratch.

## A look around

### The featured screen

The homepage gets a large featured area, with content rows underneath instead of one endless wall of thumbnails.

<img src="assets/homepage-hero.png" alt="CineTube homepage with featured billboard and recommended videos" width="100%">

### Browse by mood, topic, or channel

Topic-based rows make the page feel closer to browsing a streaming catalogue. Channel discovery and subscription content get their own space too.

<p align="center">
  <img src="assets/topic-rows.png" alt="CineTube topic rows for podcasts and sports" width="49%">
  <img src="assets/channel-discovery.png" alt="CineTube channel discovery and subscription videos" width="49%">
</p>

### Hover previews

Video cards can show hover-triggered previews through YouTube's player. Preview behaviour and startup speed can vary, and improving responsiveness is still an area to work on.

<img src="assets/hover-preview.png" alt="CineTube video card with an active hover preview" width="100%">

### A navigation rail that stays out of the way

A compact sidebar keeps the main destinations close without taking over the screen.

<p align="center">
  <img src="assets/navigation-sidebar.png" alt="CineTube expanded navigation sidebar" width="260">
</p>

## What it does

- **Featured billboard** — a prominent area for highlighted videos.
- **Horizontal content rows** — browse videos by topic and subscriptions.
- **Video-card metadata** — see details like channel, views, and upload time.
- **Hover previews** — preview videos from cards using YouTube's player.
- **Flexible watch layouts** — choose Cinema, Minimal, or Classic modes.
- **Interface controls** — customize elements such as Shorts visibility, end-screen cards, and navigation behaviour.
- **Settings that stick** — save preferences through the browser's storage API.

The exact experience depends on YouTube's current page structure and the settings you enable.

## Install locally

CineTube is currently intended for local installation in a Chromium-based browser.

1. Download this repository and extract it.
2. Open `chrome://extensions/` in Chrome (or the equivalent extensions page in your browser).
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the project folder containing `manifest.json`.
6. Open YouTube in a new tab.

To update a local install, pull or download the latest files and use **Reload** on the extension card.

## Built with

- JavaScript
- HTML
- CSS
- Chrome Extensions Manifest V3
- Chrome Extension APIs

## Current state

CineTube is a work in progress. The interface and customization features are implemented, but YouTube changes can break parts of the experience. Browser compatibility and hover-preview performance still need ongoing testing.

Found a bug? Open an issue with your browser version, the page where it happened, and steps to reproduce it.

## Disclaimer

CineTube is an unofficial community project. It is not affiliated with, endorsed by, or sponsored by YouTube, Google, or Netflix. Their names and trademarks belong to their respective owners.

## License

No license has been selected yet. Until one is added, all rights are reserved by the copyright holder.
