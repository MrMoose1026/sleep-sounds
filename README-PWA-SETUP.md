# Sleep Sound Generator phone-app kit

This kit turns the existing Sleep Sound Generator website into an installable
Progressive Web App (PWA). It opens from the phone's home screen in its own
app-style window.

## Add it to the project

1. Copy everything inside the `dist` folder into the same folder that already
   contains your current `app.js`, `styles.css`, and `audio` folder.
2. Keep using your current `app.js`, `styles.css`, and audio files. The kit does
   not include or replace them.
3. Use the included `index.html`, which contains the phone-app metadata and the
   corrected mixer layout.
4. Put the finished project on an HTTPS website. Service workers do not run when
   the HTML file is opened directly from a computer or phone's file browser.

The final folder should resemble:

```text
index.html
styles.css
app.js
pwa-register.js
service-worker.js
manifest.webmanifest
audio/
icons/
```

## Install on iPhone

1. Open the hosted app in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**.
4. Turn on **Open as Web App**.
5. Tap **Add**.

## Install on Android

1. Open the hosted app in Chrome.
2. Open the browser menu.
3. Choose **Install app** or **Add to Home screen**.

## When updating the app

Change the cache name at the top of `service-worker.js`, for example from
`sleep-sound-generator-v1` to `sleep-sound-generator-v2`. This tells installed
copies to replace their cached app files.

The audio files are intentionally not pre-cached because multiple long sound
files can consume substantial phone storage. They continue loading from the
hosted project normally.
