// Karaoke Star – Full Integrated Build
// - Uses <audio> elements directly for playback
// - Web Audio only for mic analysis (RMS + pitch/key estimate)
// - Ducking via guideAudio.volume
// - Live score, run score, best tonight
// - Scrolling lyrics with sustain bar


// ==== TIMER STATE ====
let audioTimerInterval = null;

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + (s < 10 ? "0" + s : s);
}

function resetAudioTimerDisplay() {
  const el = document.getElementById('audioTimer');
  if (el) el.textContent = "0:00";
}

function startAudioTimer(backingEl) {
  clearAudioTimer();
  if (!backingEl) return;
  audioTimerInterval = setInterval(() => {
    const t = backingEl.currentTime || 0;
    const el = document.getElementById('audioTimer');
    if (el) el.textContent = formatTime(t);
  }, 100);
}

function clearAudioTimer() {
  if (audioTimerInterval !== null) {
    clearInterval(audioTimerInterval);
    audioTimerInterval = null;
  }
}

// ==== CONFIG: key / scale (for key alignment) ====

// Assume C major for now (can tweak if you want).
const SONG_KEY_ROOT = 0; // 0 = C
const SONG_SCALE = [0, 2, 4, 5, 7, 9, 11];

const LYRICS = [
  { text: "" },
  { text: "" },

  { text: "We locked eyes, that’s why" },
  { text: "I had to get a closer look" },
  { text: "To see what you were all about" },
  { text: "When we locked eyes" },
  { text: "I knew right then and there" },
  { text: "You had something that deserved a better look" },
  { text: "Something was drawing me in" },
  { text: "Beauty has a way of doing that" },
  { text: "When, we locked eyes" },
  { text: "It was I" },
  { text: "I knew, that was it — you hurt me, that was it, " },

  { text: "you had me, you had me" },
  { text: "When I was young I used to dream, used to dream, used to dream" },
  { text: "About a girl who would steal my heart with just a look" },
  { text: "Fantasy, has a way of transforming a man’s direction" },
  { text: "Opinion — don’t let that get in the way" },
  { text: "I felt it when we locked eyes" },
  { text: "When we locked eyes" },
  { text: "The world came to a screaming stop" },
  { text: "When we locked eyes" },
  { text: "I knew this was it" },

  { text: "" },
  { text: "It might as well have been a hold up" },
  { text: "You had me at that moment" },
  { text: "I swear we became one" },
  { text: "When we locked eyes" },
  { text: "From then on I was running so hard" },
  { text: "Trying to catch up with what you had going on" },
  { text: "Sure wish I knew back then" },
  { text: "Where that second would take us" },
  { text: "On such a journey" },
  { text: "World-wide discovery" },
  { text: "When we locked eyes" },
  { text: "When we locked eyes" },
  { text: "When we locked eyes" },

  { text: "" },
  { text: "I wouldn’t trade what we did for anything" },
  { text: "But my girl — it was destiny" },
  { text: "I predicted it — I tried to tell you" },
  { text: "Love is such a fragile thing" },
  { text: "Please don’t forget — you had me" },
  { text: "And I will always remember how that felt" },
  { text: "When it was right" },
  { text: "On my way now, still living" },
  { text: "And thinking about when we locked eyes" },
  { text: "Oh oh oh — it hurts" },
  { text: "To love this hard and to fall so far" },
  { text: "But that’s how the story goes" },
  { text: "When we locked eyes" },
  { text: "When we locked eyes — you had me" }
];



// Audio elements
const backingAudio = document.getElementById("backingAudio");
const guideAudio   = document.getElementById("guideAudio");

// Mic / audio context
let audioCtx = null;
let micStream = null;
let micSource = null;
let micAnalyser = null;

// Mix bus for recording (does NOT affect what you hear)
let recordAudioCtx = null;
let backingSource = null;
let guideSource   = null;
let micBusSource  = null;
let backingGain   = null;
let guideGain     = null;
let micGain       = null;
let masterGain    = null;
let mixDestination = null;
let mixStream      = null;

// State
let isPlaying = false;
let lyricSpeedFactor = 1.0; // 0.75 = slower, 1.0 = normal, 1.25 = faster

let duckingAnimationId = null;
let currentMode = "share";   // share / assist / ghost
let engineMode  = "manual";  // manual / auto

let mediaRecorder = null;
let recordedChunks = [];
let lastRecordingUrl = null;
let lastRecordingAudio = null;

// Weights (0–1 from sliders)
let keyWeight   = 1.0;
let pitchWeight = 1.0;
let volWeight   = 1.0;

// Scoring
let runningScore = 0;  // live
let sessionScore = 0;  // cumulative for this run
let bestScore    = 0;  // best tonight

// UI refs
const statusEl     = document.getElementById("status");
const loadBtn      = document.getElementById("loadBtn");
const playBtn      = document.getElementById("playBtn");
const resumeBtn    = document.getElementById("resumeBtn");
const stopBtn      = document.getElementById("stopBtn");
const modeSelect   = document.getElementById("modeSelect");
const engineSelect = document.getElementById("engineSelect");
const modeLabel    = document.getElementById("modeLabel");

const micMeter     = document.getElementById("micMeter");
const leadMeter    = document.getElementById("leadMeter");
const micLabelVal  = document.getElementById("micLabelVal");
const leadLabelVal = document.getElementById("leadLabelVal");

const scoreVal     = document.getElementById("scoreVal");
const runScoreVal  = document.getElementById("runScoreVal");
const bestScoreVal = document.getElementById("bestScoreVal");
const recordBtn     = document.getElementById("recordBtn");
const stopRecordBtn  = document.getElementById("stopRecordBtn");
const recordStatus   = document.getElementById("recordStatus");
const replayBtn      = document.getElementById("replayBtn");
const replayMixBtn   = document.getElementById("replayMixBtn");
const stopReplayBtn  = document.getElementById("stopReplayBtn");

const liveMeterFill = document.getElementById("liveMeterFill");

const keySlider    = document.getElementById("keySlider");
const pitchSlider  = document.getElementById("pitchSlider");
const volSlider    = document.getElementById("volSlider");
const keyVal       = document.getElementById("keyVal");
const pitchVal     = document.getElementById("pitchVal");
const volVal       = document.getElementById("volVal");

const scoreMeterFill = document.getElementById("scoreMeterFill");
const scoreMeterLabel = document.getElementById("scoreMeterLabel");

const lyricsListEl  = document.getElementById("lyricsList");
const sustainFillEl = document.getElementById("sustainFill");

if (lyricsListEl) {
  lyricsListEl.innerHTML = "";
  // Static full lyrics list, scrollable, large text
  LYRICS.forEach((entry) => {
    const div = document.createElement("div");
    div.textContent = entry.text;
    div.classList.add("lyric-line");
    div.style.fontSize = "1.2rem";
    lyricsListEl.appendChild(div);
  });
}


function setStatus(msg) {
  statusEl.textContent = msg;
}

function updateModeLabel() {
  let leadInfo;
  if (currentMode === "share") {
    leadInfo = "Lead: up to 100% (ducks with you)";
  } else if (currentMode === "assist") {
    leadInfo = "Lead: 50% support";
  } else {
    leadInfo = "Lead: 0% (ghost)";
  }

  modeLabel.textContent =
    `Mode: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} · ` +
    `Engine: ${engineMode.charAt(0).toUpperCase() + engineMode.slice(1)} · ` +
    leadInfo;
}

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

async function initMic() {
  if (micStream) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Build a separate recording-only mix bus that taps backing, guide, and mic.
function setupRecordingBus() {
  // Use a dedicated AudioContext for recording so we don't disturb the main one.
  if (!recordAudioCtx) {
    recordAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ctx = recordAudioCtx;

  if (!backingAudio || !guideAudio) return;

  if (!mixDestination) {
    mixDestination = ctx.createMediaStreamDestination();
    mixStream = mixDestination.stream;
  }

  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(mixDestination);
  }

  if (!backingSource) {
    try {
      backingSource = ctx.createMediaElementSource(backingAudio);
      backingGain = ctx.createGain();
      backingGain.gain.value = 1.0;
      backingSource.connect(backingGain);
      backingGain.connect(masterGain);
    } catch (e) {
      console.warn("Recording bus: could not create backingSource (maybe already created):", e);
    }
  }

  if (!guideSource) {
    try {
      guideSource = ctx.createMediaElementSource(guideAudio);
      guideGain = ctx.createGain();
      guideGain.gain.value = guideAudio.volume;
      guideSource.connect(guideGain);
      guideGain.connect(masterGain);
    } catch (e) {
      console.warn("Recording bus: could not create guideSource (maybe already created):", e);
    }
  }

  if (micStream && !micBusSource) {
    try {
      micBusSource = ctx.createMediaStreamSource(micStream);
      micGain = ctx.createGain();
      micGain.gain.value = 1.0;
      micBusSource.connect(micGain);
      micGain.connect(masterGain);
    } catch (e) {
      console.warn("Recording bus: could not create micBusSource:", e);
    }
  }
}

    ensureAudioContext();
    micSource = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 2048;
    micSource.connect(micAnalyser);
    setStatus("Mic access granted. You’re ready to sing.");
  } catch (err) {
    console.error(err);
    setStatus("Mic access blocked or unavailable.");
  }
}

function startPlayback() {
  if (isPlaying) return;

  // Reset timings and scores
  backingAudio.currentTime = 0;
  guideAudio.currentTime   = 0;
  runningScore = 0;
  sessionScore = 0;
  scoreVal.textContent    = "0";
  runScoreVal.textContent = "0";
  if (scoreMeterFill) {
    scoreMeterFill.style.width = "0%";
  }
  if (scoreMeterLabel) {
    scoreMeterLabel.textContent = "0%";
  }
  resetAudioTimerDisplay();
  clearAudioTimer();
  if (resumeBtn) {
    resumeBtn.disabled = true;
  }
  if (liveMeterFill) {
    liveMeterFill.style.height = "0%";
    liveMeterFill.style.backgroundColor = "#30e88f";
  }

  // Full volume to start; we will duck guide as you sing
  backingAudio.volume = 1.0;
  guideAudio.volume   = 1.0;
  backingAudio.muted  = false;
  guideAudio.muted    = false;

  backingAudio.play();
  guideAudio.play();
  isPlaying = true;
  startAudioTimer(backingAudio);

  playBtn.disabled = true;
  stopBtn.disabled = false;

  setStatus("Playing – sing into your mic to push the guide vocal down.");
  startDuckingLoop();

  guideAudio.onended = () => {
    stopPlayback();
  };
}

function stopPlayback() {
  if (!isPlaying) return;
  isPlaying = false;

  backingAudio.pause();
  guideAudio.pause();
  clearAudioTimer();

  if (duckingAnimationId) {
    cancelAnimationFrame(duckingAnimationId);
    duckingAnimationId = null;
  }

  // Update bestScore
  if (sessionScore > bestScore) {
    bestScore = sessionScore;
    bestScoreVal.textContent = `${Math.round(bestScore)}`;
  }

  playBtn.disabled = false;
  stopBtn.disabled = true;
  if (resumeBtn && backingAudio && backingAudio.currentTime > 0 && backingAudio.currentTime < (backingAudio.duration || 0)) {
    resumeBtn.disabled = false;
  }

  setStatus("Stopped. Try again to beat your best run.");
}

function resumePlayback() {
  if (isPlaying) return;
  if (!backingAudio || !guideAudio) return;

  // Resume from current time without resetting scores or timer
  backingAudio.muted = false;
  guideAudio.muted   = false;

  backingAudio.play();
  guideAudio.play();
  isPlaying = true;
  startAudioTimer(backingAudio);

  playBtn.disabled = true;
  stopBtn.disabled = false;
  if (resumeBtn) {
    resumeBtn.disabled = true;
  }

  setStatus("Resumed playback — keep going from where you left off.");
}
// ---- Pitch detection via autocorrelation ----
function detectPitchAndQualities(timeDomainData, sampleRate, rms) {
  if (rms < 0.02) {
    return { pitchQuality: 0, keyQuality: 0 };
  }

  const bufLen = timeDomainData.length;
  const floatBuf = new Float32Array(bufLen);
  for (let i = 0; i < bufLen; i++) {
    floatBuf[i] = (timeDomainData[i] - 128) / 128;
  }

  const minFreq = 80;
  const maxFreq = 1000;
  const maxLag = Math.floor(sampleRate / minFreq);
  const minLag = Math.floor(sampleRate / maxFreq);

  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < bufLen - lag; i++) {
      sum += floatBuf[i] * floatBuf[i + lag];
    }
    if (sum > bestCorr) {
      bestCorr = sum;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || bestCorr <= 0) {
    return { pitchQuality: 0, keyQuality: 0 };
  }

  const freq = sampleRate / bestLag;
  if (!isFinite(freq) || freq <= 0) {
    return { pitchQuality: 0, keyQuality: 0 };
  }

  const note = 69 + 12 * Math.log2(freq / 440);
  const nearest = Math.round(note);
  const diffSemitones = Math.abs(note - nearest);

  let pitchQuality = 1 - (diffSemitones / 0.5);
  if (pitchQuality < 0) pitchQuality = 0;
  if (pitchQuality > 1) pitchQuality = 1;

  let relative = ((nearest % 12) - SONG_KEY_ROOT) % 12;
  if (relative < 0) relative += 12;
  const inScale = SONG_SCALE.includes(relative);

  let keyQuality = inScale ? 1 : 0.4;

  return { pitchQuality, keyQuality };
}

// ---- Ducking strength computation ----
function computeDuckingStrength(level, pitchQuality, keyQuality) {
  const kW = (engineMode === "manual") ? keyWeight   : 1.0;
  const pW = (engineMode === "manual") ? pitchWeight : 1.0;
  const vW = (engineMode === "manual") ? volWeight   : 1.0;

  const volFactor   = level * vW;
  const pitchFactor = pitchQuality * pW;
  const keyFactor   = keyQuality * kW;

  let strength = volFactor * (0.5 + 0.5 * pitchFactor) * (0.5 + 0.5 * keyFactor);
  if (strength < 0) strength = 0;
  if (strength > 1) strength = 1;
  return strength;
}

// ---- Lyrics update (scroll + sustain bar) ----
function updateLyrics() {
  // Only keep sustain/progress bar updated; lyrics list is static scroll
  if (!backingAudio || !sustainFillEl) return;
  if (!isFinite(backingAudio.duration) || backingAudio.duration <= 0) {
    sustainFillEl.style.width = "0%";
    return;
  }
  const pct = Math.max(0, Math.min(1, backingAudio.currentTime / backingAudio.duration));
  sustainFillEl.style.width = `${(pct * 100).toFixed(1)}%`;
}

// ---- Main loop ----
function startDuckingLoop() {
  if (!micAnalyser || !audioCtx) return;

  const bufferLength = micAnalyser.fftSize;
  const data = new Uint8Array(bufferLength);
  const sampleRate = audioCtx.sampleRate;

  function loop() {
    if (!isPlaying) return;

    micAnalyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / bufferLength);

    const minRms = 0.02;
    const maxRms = 0.3;
    let level = (rms - minRms) / (maxRms - minRms);
    if (level < 0) level = 0;
    if (level > 1) level = 1;

    micMeter.style.width = `${(level * 100).toFixed(1)}%`;
    micLabelVal.textContent = `${Math.round(level * 100)}%`;

    const { pitchQuality, keyQuality } = detectPitchAndQualities(data, sampleRate, rms);
    const duckStrength = computeDuckingStrength(level, pitchQuality, keyQuality);

    const instantScore = duckStrength * 100;
    runningScore = runningScore * 0.9 + instantScore * 0.1;
    scoreVal.textContent = `${Math.round(runningScore)}`;


    sessionScore += duckStrength * 0.6;
    runScoreVal.textContent = `${Math.round(sessionScore)}`;

    // Update takeover meter (0–100%) based on running score
    if (scoreMeterFill && scoreMeterLabel) {
      const pct = Math.max(0, Math.min(100, Math.round(runningScore)));
      scoreMeterFill.style.width = `${pct}%`;
      scoreMeterLabel.textContent = `${pct}%`;
    }

    // Update small live color meter next to "Live" score
    if (liveMeterFill) {
      const pctSmall = Math.max(0, Math.min(100, Math.round(runningScore)));
      liveMeterFill.style.height = `${pctSmall}%`;
      let color = "#30e88f"; // green
      if (pctSmall >= 75) {
        color = "#ff5252"; // red
      } else if (pctSmall >= 50) {
        color = "#ffb74d"; // orange
      } else if (pctSmall >= 25) {
        color = "#ffd54f"; // yellow
      }
      liveMeterFill.style.backgroundColor = color;
    }

    // Mode behavior for guide vocal level
    let targetVolume;
    if (currentMode === "share") {
      // Full side-chain ducking with a floor
      const baseDuck = 0.5;
      targetVolume = 1.0;
      if (duckStrength > 0.15) {
        targetVolume = 1.0 - duckStrength * (1.0 - baseDuck);
      }
    } else if (currentMode === "assist") {
      // Constant 50% guide vocal for training support
      targetVolume = 0.5;
    } else {
      // Ghost mode – no guide vocal, just instruments
      targetVolume = 0.0;
    }

    guideAudio.volume = targetVolume;
    if (guideGain) {
      guideGain.gain.value = targetVolume;
    }
    const leadPercent = Math.round(targetVolume * 100);
    leadMeter.style.width = `${leadPercent}%`;
    leadLabelVal.textContent = `${leadPercent}%`;

    updateLyrics();

    duckingAnimationId = requestAnimationFrame(loop);
  }

  loop();
}

// ---- UI events ----
modeSelect.addEventListener("change", () => {
  currentMode = modeSelect.value;
  updateModeLabel();
});

engineSelect.addEventListener("change", () => {
  engineMode = engineSelect.value;
  const manual = engineMode === "manual";

  keySlider.disabled   = !manual;
  pitchSlider.disabled = !manual;
  volSlider.disabled   = !manual;

  updateModeLabel();
});

function updateWeightsFromSliders() {
  keyWeight   = Number(keySlider.value)   / 100;
  pitchWeight = Number(pitchSlider.value) / 100;
  volWeight   = Number(volSlider.value)   / 100;

  keyVal.textContent   = keySlider.value;
  pitchVal.textContent = pitchSlider.value;
  volVal.textContent   = volSlider.value;
}

[keySlider, pitchSlider, volSlider].forEach(sl => {
  sl.addEventListener("input", updateWeightsFromSliders);
});

loadBtn.addEventListener("click", async () => {
  await initMic();
  setStatus("Song ready. Hit Play and start singing.");
  playBtn.disabled = false;
  if (resumeBtn) {
    resumeBtn.disabled = true;
  }
});

playBtn.addEventListener("click", startPlayback);
stopBtn.addEventListener("click", stopPlayback);
if (resumeBtn) {
  resumeBtn.addEventListener("click", resumePlayback);
}


// Wire up lyric speed buttons
const speedButtons = document.querySelectorAll(".speed-btn");
if (speedButtons && speedButtons.length > 0) {
  speedButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.getAttribute("data-speed") || "1.0");
      if (isFinite(val) && val > 0.25 && val < 3.0) {
        lyricSpeedFactor = val;
        speedButtons.forEach((b) => b.classList.remove("speed-active"));
        btn.classList.add("speed-active");
        setStatus(`Lyric speed: ${val < 1.0 ? "Slower" : val > 1.0 ? "Faster" : "Normal"}`);
      }
    });
  });
}

// Initial UI state
updateModeLabel();
updateWeightsFromSliders();



// === Recording controls: capture full mix (backing + guide + mic) for takes ===
if (recordBtn && stopRecordBtn && recordStatus) {
  recordBtn.addEventListener("click", async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    try {
      // Ensure mic is initialized
      await initMic();

      // Build recording bus (backing + guide + mic)
      if (typeof setupRecordingBus === "function") {
        setupRecordingBus();
      }

      // Decide which stream to record: prefer full mix, fall back to mic-only
      let streamForRecord = null;
      let modeLabel = "";
      if (mixStream) {
        streamForRecord = mixStream;
        modeLabel = "full mix";
      } else if (micStream) {
        streamForRecord = micStream;
        modeLabel = "mic only (mix unavailable)";
      }

      if (!streamForRecord) {
        recordStatus.textContent = "No audio stream available to record.";
        return;
      }

      recordedChunks = [];

      try {
        mediaRecorder = new MediaRecorder(streamForRecord);
      } catch (err2) {
        console.error("MediaRecorder error on chosen stream", err2);

        // If full mix failed but micStream exists, try falling back to mic-only
        if (streamForRecord === mixStream && micStream) {
          try {
            mediaRecorder = new MediaRecorder(micStream);
            modeLabel = "mic only (fallback)";
          } catch (err3) {
            console.error("MediaRecorder also failed on micStream", err3);
            recordStatus.textContent = "Recorder error: " + (err3.name || "") + " " + (err3.message || "");
            return;
          }
        } else {
          recordStatus.textContent = "Recorder error: " + (err2.name || "") + " " + (err2.message || "");
          return;
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        // Clean up previous URL if any
        if (lastRecordingUrl) {
          URL.revokeObjectURL(lastRecordingUrl);
        }
        lastRecordingUrl = url;
        if (replayBtn) {
          replayBtn.disabled = false;
        }

        // Auto-download as before
        const a = document.createElement("a");
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `karaoke_star_take_${ts}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        recordStatus.textContent = "Saved " + modeLabel + " recording to your device.";
        recordBtn.disabled = false;
        stopRecordBtn.disabled = true;
      };

      mediaRecorder.start();
      recordStatus.textContent = "Recording " + modeLabel + "...";
      recordBtn.disabled = true;
      stopRecordBtn.disabled = false;
    } catch (err) {
      console.error("Error starting recording", err);
      recordStatus.textContent = "Could not start recording: " + (err.name || "") + " " + (err.message || "");
    }
  });

  stopRecordBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  });

  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      if (!lastRecordingUrl) {
        recordStatus.textContent = "No recording to replay yet.";
        return;
      }
      try {
        if (lastRecordingAudio) {
          lastRecordingAudio.pause();
          lastRecordingAudio = null;
        }
        lastRecordingAudio = new Audio(lastRecordingUrl);
        lastRecordingAudio.play().catch(err => {
          console.error("Error playing back recording", err);
          recordStatus.textContent = "Could not replay recording: " + (err.name || "") + " " + (err.message || "");
        });
        recordStatus.textContent = "Replaying last take...";
      
  if (replayMixBtn) {
    replayMixBtn.addEventListener("click", () => {
      if (!lastRecordingUrl) {
        recordStatus.textContent = "No recording to replay yet.";
        return;
      }
      try {
        // Stop any current playback
        if (lastRecordingAudio) {
          lastRecordingAudio.pause();
          lastRecordingAudio = null;
        }
        if (backingAudio) {
          backingAudio.pause();
        }

        // Prepare new audio element for the recorded vocal
        lastRecordingAudio = new Audio(lastRecordingUrl);

        // Reset both to start
        lastRecordingAudio.currentTime = 0;
        if (backingAudio) {
          // For now, just restart backing track from the top to approximate a mix
          backingAudio.currentTime = 0;
        }

        // Set some basic balance: slightly lower backing so vocal is clear
        if (backingAudio) {
          backingAudio.volume = 0.7;
        }
        // Recorded vocal will use default volume of 1.0

        // Start playback of both
        if (backingAudio) {
          backingAudio.play().catch(err => {
            console.error("Error playing backing during mix replay", err);
          });
        }
        lastRecordingAudio.play().catch(err => {
          console.error("Error playing vocal during mix replay", err);
          recordStatus.textContent = "Could not replay mix: " + (err.name || "") + " " + (err.message || "");
        });

        recordStatus.textContent = "Replaying mix (backing + your vocal)...";
        if (stopReplayBtn) {
          stopReplayBtn.disabled = false;
        }
      } catch (err) {
        console.error("Error setting up mix replay", err);
        recordStatus.textContent = "Could not replay mix: " + (err.name || "") + " " + (err.message || "");
      }
    });
  }

  if (stopReplayBtn) {
          stopReplayBtn.disabled = false;
        }
      } catch (err) {
        console.error("Error setting up replay", err);
        recordStatus.textContent = "Could not replay recording: " + (err.name || "") + " " + (err.message || "");
      }
    });
  }


  if (replayMixBtn) {
    replayMixBtn.addEventListener("click", () => {
      if (!lastRecordingUrl) {
        recordStatus.textContent = "No recording to replay yet.";
        return;
      }
      try {
        // Stop any current playback
        if (lastRecordingAudio) {
          lastRecordingAudio.pause();
          lastRecordingAudio = null;
        }
        if (backingAudio) {
          backingAudio.pause();
        }

        // Prepare new audio element for the recorded vocal
        lastRecordingAudio = new Audio(lastRecordingUrl);

        // Reset both to start
        lastRecordingAudio.currentTime = 0;
        if (backingAudio) {
          backingAudio.currentTime = 0;
        }

        // Set some basic balance: slightly lower backing so vocal is clear
        if (backingAudio) {
          backingAudio.volume = 0.7;
        }

        let backingStarted = false;
        if (backingAudio) {
          backingAudio.play().then(() => {
            backingStarted = true;
          }).catch(err => {
            console.error("Error playing backing during mix replay", err);
          });
        }

        lastRecordingAudio.play().catch(err => {
          console.error("Error playing vocal during mix replay", err);
          recordStatus.textContent = "Could not replay mix: " + (err.name || "") + " " + (err.message || "");
        });

        recordStatus.textContent = "Replaying mix (backing + your vocal)...";
        if (stopReplayBtn) {
          stopReplayBtn.disabled = false;
        }
      } catch (err) {
        console.error("Error setting up mix replay", err);
        recordStatus.textContent = "Could not replay mix: " + (err.name || "") + " " + (err.message || "");
      }
    });
  }

  if (stopReplayBtn) {
    stopReplayBtn.addEventListener("click", () => {
      try {
        if (lastRecordingAudio) {
          lastRecordingAudio.pause();
          lastRecordingAudio.currentTime = 0;
        }
        recordStatus.textContent = "Replay stopped.";
        stopReplayBtn.disabled = true;
      } catch (err) {
        console.error("Error stopping replay", err);
        recordStatus.textContent = "Could not stop replay: " + (err.name || "") + " " + (err.message || "");
      }
    });
  }
}



// ==== Banner Song Nav ====
(function() {
  try {
    const banner = document.querySelector(".top-banner");
    if (!banner) return;

    // Avoid injecting twice
    if (banner.querySelector(".ks-banner-nav")) return;

    // Inject minimal styles for the banner nav
    const styleId = "ks-banner-nav-styles";
    if (!document.getElementById(styleId)) {
      const st = document.createElement("style");
      st.id = styleId;
      st.textContent = `
        .ks-banner-nav {
          position: absolute;
          top: 10px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          pointer-events: none;
        }
        .ks-banner-brand {
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(5,5,16,0.85);
          box-shadow: 0 6px 14px rgba(0,0,0,0.6);
        }
        .ks-banner-brand-main {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .ks-banner-brand-sub {
          font-size: 0.7rem;
          opacity: 0.75;
        }
        .ks-banner-nav-list {
          pointer-events: auto;
          display: flex;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(5,5,16,0.85);
          box-shadow: 0 6px 14px rgba(0,0,0,0.6);
          overflow-x: auto;
          max-width: 60%;
        }
        .ks-banner-nav-list::-webkit-scrollbar {
          height: 4px;
        }
        .ks-banner-nav-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.35);
          border-radius: 999px;
        }
        .ks-banner-nav-link {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22);
          font-size: 0.75rem;
          text-decoration: none;
          color: #f5f5f5;
          white-space: nowrap;
          background: rgba(15,15,30,0.9);
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease;
        }
        .ks-banner-nav-link:hover {
          background: rgba(40,40,80,0.95);
          border-color: rgba(255,255,255,0.6);
          transform: translateY(-1px);
        }
        .ks-banner-nav-link.ks-active {
          background: #e6ff4f;
          color: #111;
          border-color: #e6ff4f;
        }
        @media (max-width: 800px) {
          .ks-banner-nav {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .ks-banner-nav-list {
            max-width: 100%;
          }
        }
      `;
      document.head.appendChild(st);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "ks-banner-nav";

    const brand = document.createElement("div");
    brand.className = "ks-banner-brand";
    const bMain = document.createElement("div");
    bMain.className = "ks-banner-brand-main";
    bMain.textContent = "Karaoke Star";
    const bSub = document.createElement("div");
    bSub.className = "ks-banner-brand-sub";
    bSub.textContent = "Vocal Training · Powered by Side-Chain";
    brand.appendChild(bMain);
    brand.appendChild(bSub);

    const navList = document.createElement("div");
    navList.className = "ks-banner-nav-list";

    const songs = [
      { title: "Karaoke Star", slug: "" },
      { title: "Pour It Out", slug: "pour-it-out" },
      { title: "Listen to My Words", slug: "listen-to-my-words" },
      { title: "Popping Up", slug: "popping-up" },
      { title: "We Locked Eyes", slug: "we-locked-eyes" }
    ];

    const basePath = "/karaoke-star";

    const currentPath = window.location.pathname.replace(/\/+/g, "/");
    songs.forEach(song => {
      const a = document.createElement("a");
      const path = song.slug ? `${basePath}/${song.slug}/` : `${basePath}/`;
      a.href = path;
      a.textContent = song.title;
      a.className = "ks-banner-nav-link";
      if (currentPath === path) {
        a.classList.add("ks-active");
      }
      navList.appendChild(a);
    });

    wrapper.appendChild(brand);
    wrapper.appendChild(navList);
    banner.appendChild(wrapper);
  } catch (e) {
    console.warn("Banner nav init failed:", e);
  }
})();

