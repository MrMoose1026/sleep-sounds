# Sleep Sound Generator — MVP

A simple browser-based ambient soundscape generator. It layers multiple seamless loops, starts them at random offsets, and slowly changes their individual levels so the overall combination rarely repeats in exactly the same way.

## Add these audio files

Put your own seamless MP3 loops into the `audio/` folder using these names:

- `rain.mp3`
- `wind.mp3`
- `room-tone.mp3`
- `distant.mp3`

For best results, make each loop a noticeably different duration (for example ~37s, ~53s, ~71s, ~89s) rather than exporting four loops at the same length.

## Run it

Because browsers can be picky about local audio loading, serve the folder with a small local server rather than double-clicking `index.html`.

If you have Node installed:

```bash
npx serve .
```

Then open the local address it gives you.

## Current MVP features

- One Sleep / Stop button
- 5-second fade in/out
- Random start positions for each loop
- Independent loop playback
- Slowly drifting track volumes
- Master volume
- Per-track mixer

## Good next additions

- Sleep timer
- Presets (Rainy Cabin, Night Forest, Spaceship, Ocean, etc.)
- User-selectable layers
- Save favorite mixes in localStorage
- PWA / install-to-home-screen support
- Very slow stereo movement for selected sounds
- Optional one-shot events such as distant thunder or an occasional owl
