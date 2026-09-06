const TRACKS = [
  {
    id: "rain-base",
    name: "Rain",
    file: "audio/rain-base.wav",
    volume: 0.75,
    drift: 0.04,
    loopEndTrim: 1.1
  },
  {
    id: "rain-window",
    name: "Window Rain",
    file: "audio/rain-window.mp3",
    volume: 0.35,
    drift: 0.03
  },
  {
    id: "wind-base",
    name: "Wind",
    file: "audio/wind-base.mp3",
    volume: 0.22,
    drift: 0.04
  },
  {
    id: "room-tone",
    name: "Room Tone",
    file: "audio/room-tone.mp3",
    volume: 0.12,
    drift: 0.02
  }
];

  const SOUNDSCAPES = {
    rainyRoom: {
      name: "Rainy Room",
      tracks: TRACKS
    },
    fireplaceCabin: {
    name: "Fireplace Cabin",
    tracks: [
      {
        id: "fireplace",
        name: "Fireplace",
        file: "audio/fireplace-crackling.mp3",
        volume: 0.75,
        drift: 0.03
      },
      {
        id: "gentle-breeze",
        name: "Gentle Breeze",
        file: "audio/gentle-breeze.wav",
        volume: 0.55,
        drift: 0.03
      },
      {
        id: "cabin-ambience",
        name: "Cabin Ambience",
        file: "audio/cabin-room-tone.wav",
        volume: 0.25,
        drift: 0.03
      }
    ]
  }
};

const RANDOM_EVENTS = [
  {
    id: "thunder",
    name: "Distant Thunder",
    files: [
      "audio/thunder-distant-01.mp3",
      "audio/thunder-distant-02.mp3",
      "audio/thunder-distant-03.mp3"
    ],
    volume: 0.22,

    // Thunder happens every 2–6 minutes.
    minDelayMs: 2 * 60 * 1000,
    maxDelayMs: 6 * 60 * 1000
  },
  {
    id: "creak",
    name: "House Creak",
    files: [
      "audio/creak-01.mp3",
      "audio/creak-02.mp3"
    ],
    volume: 0.12,

    // A creak happens every 8–20 minutes.
    minDelayMs: 8 * 60 * 1000,
    maxDelayMs: 20 * 60 * 1000
  }
];

const FADE_SECONDS = 5;
const DRIFT_INTERVAL_MS = 12000;

const sleepButton = document.getElementById("sleepButton");
const status = document.getElementById("status");
const masterVolume = document.getElementById("masterVolume");
const mixerControls = document.getElementById("mixerControls");
const soundscapeSelect =
  document.getElementById("soundscapeSelect");
let selectedTracks =
  SOUNDSCAPES[soundscapeSelect.value].tracks;
const eventTimers = new Map();
const activeEventNodes = new Set();

let audioContext;
let masterGain;
let trackNodes = [];
let driftTimer;
let isPlaying = false;

soundscapeSelect.addEventListener("change", () => {
  const selectedKey = soundscapeSelect.value;
  const selectedSoundscape = SOUNDSCAPES[selectedKey];

  clearTrackNodes();

  selectedTracks = selectedSoundscape.tracks;
  buildMixer(selectedTracks);
});

function buildMixer(tracksToShow) {
  mixerControls.innerHTML = "";

  tracksToShow.forEach((track) => {
    const wrapper = document.createElement("div");
    wrapper.className = "track-control";

    const label = document.createElement("label");
    label.htmlFor = `volume-${track.id}`;
    label.textContent = track.name;

    const slider = document.createElement("input");
    slider.id = `volume-${track.id}`;
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = String(track.volume);

    slider.addEventListener("input", () => {
      track.volume = Number(slider.value);

      const node = trackNodes.find(
        (entry) => entry.id === track.id
      );

      if (node) {
  node.audio.volume =
    getEffectiveVolume(track.volume);
}
    });

    wrapper.append(label, slider);
    mixerControls.appendChild(wrapper);
  });
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

function getMasterLevel() {
  return Number(masterVolume.value);
}

function getEffectiveVolume(trackVolume, variation = 1) {
  return clampVolume(
    trackVolume * getMasterLevel() * variation
  );
}

function clearTrackNodes() {
  trackNodes.forEach((track) => {
    track.audio.pause();
    track.audio.removeAttribute("src");
    track.audio.load();
  });

  trackNodes = [];
}

async function ensureAudioGraph() {
  if (trackNodes.length > 0) return;

  trackNodes = selectedTracks.map((track) => {
    const audio = new Audio(track.file);

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = getEffectiveVolume(track.volume);

    /*
      Skip unwanted silence or fading at the end
      of tracks that define loopEndTrim.
    */
    audio.addEventListener("timeupdate", () => {
      const trim = Number(track.loopEndTrim) || 0;

      if (
        trim <= 0 ||
        !Number.isFinite(audio.duration) ||
        audio.duration <= trim
      ) {
        return;
      }

      if (audio.currentTime >= audio.duration - trim) {
        audio.currentTime = 0;
      }
    });

    audio.addEventListener("error", () => {
      console.error(`Could not load: ${track.file}`);
      status.textContent = `Could not load ${track.name}.`;
    });

    return {
      ...track,
      audio
    };
  });
}

async function playRandomEvent(eventConfig) {
  if (!audioContext || !masterGain || !isPlaying) {
    return;
  }

  const fileIndex = Math.floor(
    Math.random() * eventConfig.files.length
  );

  const selectedFile = eventConfig.files[fileIndex];
  const audio = new Audio(selectedFile);

  audio.preload = "auto";

  const source =
    audioContext.createMediaElementSource(audio);

  const gain = audioContext.createGain();

  /*
    Slightly vary the volume each time so repeated
    sounds don't feel exactly identical.
  */
  const volumeVariation = randomBetween(0.85, 1.15);

  gain.gain.value = Math.min(
    1,
    eventConfig.volume * volumeVariation
  );

  source.connect(gain);
  gain.connect(masterGain);

  const eventNode = {
    id: eventConfig.id,
    audio,
    source,
    gain,
    cleanup: null
  };

  function cleanup() {
    activeEventNodes.delete(eventNode);

    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    source.disconnect();
    gain.disconnect();
  }

  eventNode.cleanup = cleanup;
  activeEventNodes.add(eventNode);

  audio.addEventListener("ended", cleanup, {
    once: true
  });

  audio.addEventListener("error", () => {
    console.error(
      `Could not load ${eventConfig.name}: ${selectedFile}`
    );

    cleanup();
  }, {
    once: true
  });

  try {
    await audio.play();
  } catch (error) {
    console.error(
      `Could not play ${eventConfig.name}:`,
      error
    );

    cleanup();
  }
}

function scheduleRandomEvent(eventConfig) {
  const previousTimer = eventTimers.get(
    eventConfig.id
  );

  if (previousTimer) {
    clearTimeout(previousTimer);
  }

  const delay = randomBetween(
    eventConfig.minDelayMs,
    eventConfig.maxDelayMs
  );

  const timer = window.setTimeout(async () => {
    eventTimers.delete(eventConfig.id);

    if (!isPlaying) {
      return;
    }

    await playRandomEvent(eventConfig);

    /*
      Select a completely new delay before the
      next occurrence.
    */
    if (isPlaying) {
      scheduleRandomEvent(eventConfig);
    }
  }, delay);

  eventTimers.set(eventConfig.id, timer);
}

async function randomizeStartingPoints() {
  await Promise.all(
    trackNodes.map(
      (track) =>
        new Promise((resolve) => {
          const setOffset = () => {
            const trim = Number(track.loopEndTrim) || 0;
            const usableDuration =
              track.audio.duration - trim;

            if (
              Number.isFinite(usableDuration) &&
              usableDuration > 1
            ) {
              track.audio.currentTime =
                Math.random() *
                Math.max(0, usableDuration - 0.5);
            }

            resolve();
          };

          if (track.audio.readyState >= 1) {
            setOffset();
          } else {
            track.audio.addEventListener(
              "loadedmetadata",
              setOffset,
              { once: true }
            );

            track.audio.addEventListener(
              "error",
              resolve,
              { once: true }
            );

            track.audio.load();
          }
        })
    )
  );
}

function startRandomEvents() {
  RANDOM_EVENTS.forEach((eventConfig) => {
    scheduleRandomEvent(eventConfig);
  });
}

function cancelEventTimers() {
  eventTimers.forEach((timer) => {
    clearTimeout(timer);
  });

  eventTimers.clear();
}

function stopActiveEvents() {
  [...activeEventNodes].forEach((eventNode) => {
    eventNode.cleanup();
  });

  activeEventNodes.clear();
}

function beginDrift() {
  clearInterval(driftTimer);

  driftTimer = setInterval(() => {
    if (!isPlaying) return;

    trackNodes.forEach((trackNode) => {
      const track = selectedTracks.find(
        (item) => item.id === trackNode.id
      );

      if (!track) return;

      const amount =
        (Math.random() * 2 - 1) * track.drift;

      const driftedVolume = clampVolume(
        track.volume + amount
      );

      trackNode.audio.volume =
        getEffectiveVolume(driftedVolume);
    });
  }, DRIFT_INTERVAL_MS);
}

async function startSoundscape() {
  await ensureAudioGraph();

  stopActiveEvents();
  await randomizeStartingPoints();

  trackNodes.forEach((trackNode) => {
    const track = selectedTracks.find(
      (item) => item.id === trackNode.id
    );

    if (track) {
      trackNode.audio.volume =
        getEffectiveVolume(track.volume);
    }
  });

  const playResults = await Promise.allSettled(
    trackNodes.map((track) => track.audio.play())
  );

  const successful = playResults.filter(
    (result) => result.status === "fulfilled"
  ).length;

  if (!successful) {
    status.textContent =
      "The audio files could not be loaded. Check the filenames and audio folder.";

    return;
  }

  isPlaying = true;

  sleepButton.textContent = "Stop";
  sleepButton.classList.add("is-playing");
  sleepButton.setAttribute("aria-pressed", "true");

  status.textContent = "Soundscape drifting…";

  beginDrift();
  startRandomEvents();
}

function stopSoundscape() {
  if (!isPlaying) return;

  isPlaying = false;

  clearInterval(driftTimer);
  cancelEventTimers();

  trackNodes.forEach((track) => {
    track.audio.pause();
  });

  stopActiveEvents();

  sleepButton.textContent = "Sleep";
  sleepButton.classList.remove("is-playing");
  sleepButton.setAttribute("aria-pressed", "false");

  status.textContent = "Ready";
}

sleepButton.addEventListener("click", async () => {
  if (isPlaying) {
    stopSoundscape();
  } else {
    await startSoundscape();
  }
});

masterVolume.addEventListener("input", () => {
  trackNodes.forEach((trackNode) => {
    const track = selectedTracks.find(
      (item) => item.id === trackNode.id
    );

    if (!track) return;

    trackNode.audio.volume =
      getEffectiveVolume(track.volume);
  });
});

buildMixer(selectedTracks);