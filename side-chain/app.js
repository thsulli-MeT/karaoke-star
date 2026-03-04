const builtInSongs = [
  {
    title: "Karaoke Star Demo - Root",
    lead: "../0 Lead Vocals.mp3",
    instrumental: "../1 Instrumental.mp3",
  },
  {
    title: "Pour It Out - Sample",
    lead: "../pour-it-out/0 Lead Vocals_01.mp3",
    instrumental: "../pour-it-out/1 Instrumental_01.mp3",
  },
];

const ADMIN_ALLOWLIST = ["you@example.com"];

const songSelect = document.getElementById("songSelect");
const loadSongBtn = document.getElementById("loadSongBtn");
const leadUpload = document.getElementById("leadUpload");
const instUpload = document.getElementById("instUpload");
const loadCustomBtn = document.getElementById("loadCustomBtn");
const micBtn = document.getElementById("micBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const modeSelect = document.getElementById("modeSelect");

const recordGain = document.getElementById("recordGain");
const recordGainValue = document.getElementById("recordGainValue");
const recordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const replayBtn = document.getElementById("replayBtn");
const downloadBtn = document.getElementById("downloadBtn");

const micMeter = document.getElementById("micMeter");
const micValue = document.getElementById("micValue");
const leadMeter = document.getElementById("leadMeter");
const leadValue = document.getElementById("leadValue");
const scoreMeter = document.getElementById("scoreMeter");
const scoreValue = document.getElementById("scoreValue");
const statusEl = document.getElementById("status");

const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminState = document.getElementById("adminState");
const adminForm = document.getElementById("adminForm");
const adminTitle = document.getElementById("adminTitle");
const adminLeadPath = document.getElementById("adminLeadPath");
const adminInstPath = document.getElementById("adminInstPath");
const addLibraryBtn = document.getElementById("addLibraryBtn");
const exportLibraryBtn = document.getElementById("exportLibraryBtn");

const backingAudio = new Audio();
const leadAudio = new Audio();
backingAudio.crossOrigin = "anonymous";
leadAudio.crossOrigin = "anonymous";
backingAudio.muted = true;
leadAudio.muted = true;

let audioCtx;
let micAnalyser;
let micData;
let micSource;
let micStream;
let meterLoop;
let currentSong;
let sessionScore = 0;
let isPaused = false;
let adminAuthed = false;

let backingSource;
let leadSource;
let backingGain;
let leadGainNode;
let micGainNode;
let masterGain;
let recordDestination;

let mediaRecorder;
let recordedChunks = [];
let recordingBlob = null;
let recordingUrl = "";

function setStatus(msg) {
  statusEl.textContent = msg;
}

function formatDb(value) {
  const num = Number(value);
  return `${num >= 0 ? "+" : ""}${num} dB`;
}

function dbToGain(db) {
  return 10 ** (db / 20);
}

function applyMicGain() {
  const db = Number(recordGain.value);
  recordGainValue.textContent = formatDb(db);
  if (micGainNode) {
    micGainNode.gain.value = dbToGain(db);
  }
}

function hydrateSongMenu() {
  songSelect.innerHTML = "";
  builtInSongs.forEach((song, idx) => {
    const option = document.createElement("option");
    option.value = String(idx);
    option.textContent = song.title;
    songSelect.appendChild(option);
  });
}

function getMicLevel() {
  if (!micAnalyser) return 0;
  micAnalyser.getByteTimeDomainData(micData);
  let sumSquares = 0;
  for (let i = 0; i < micData.length; i += 1) {
    const centered = (micData[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  const rms = Math.sqrt(sumSquares / micData.length);
  return Math.min(1, rms * 4.2);
}

function computeLeadVolume(mode, micLevel) {
  if (mode === "ghost") return 0;
  if (mode === "assist") return 0.5;
  return Math.max(0, 1 - micLevel * 1.35);
}

function setupAudioGraph() {
  if (!audioCtx || !micSource || !leadAudio.src || !backingAudio.src) return;
  if (masterGain) return;

  backingSource = audioCtx.createMediaElementSource(backingAudio);
  leadSource = audioCtx.createMediaElementSource(leadAudio);

  backingGain = audioCtx.createGain();
  leadGainNode = audioCtx.createGain();
  micGainNode = audioCtx.createGain();
  masterGain = audioCtx.createGain();
  recordDestination = audioCtx.createMediaStreamDestination();

  backingGain.gain.value = 1;
  leadGainNode.gain.value = 1;
  micGainNode.gain.value = dbToGain(Number(recordGain.value));
  masterGain.gain.value = 1;

  backingSource.connect(backingGain);
  leadSource.connect(leadGainNode);
  micSource.connect(micGainNode);

  backingGain.connect(masterGain);
  leadGainNode.connect(masterGain);
  micGainNode.connect(masterGain);

  masterGain.connect(audioCtx.destination);
  masterGain.connect(recordDestination);
}

function tickMeters() {
  const micLevel = getMicLevel();
  const mode = modeSelect.value;
  const leadLevel = computeLeadVolume(mode, micLevel);

  if (leadGainNode) {
    leadGainNode.gain.value = leadLevel;
  }

  const micPct = Math.round(micLevel * 100);
  const leadPct = Math.round(leadLevel * 100);
  sessionScore += micPct * 0.035;
  const score = Math.round(sessionScore);

  micMeter.style.width = `${micPct}%`;
  micValue.textContent = String(micPct);

  leadMeter.style.width = `${leadPct}%`;
  leadValue.textContent = String(leadPct);

  const scorePct = Math.min(100, Math.round(score / 10));
  scoreMeter.style.width = `${scorePct}%`;
  scoreValue.textContent = String(score);

  meterLoop = requestAnimationFrame(tickMeters);
}

async function enableMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    micSource = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 1024;
    micData = new Uint8Array(micAnalyser.fftSize);
    micSource.connect(micAnalyser);

    setupAudioGraph();
    applyMicGain();

    micBtn.disabled = true;
    playBtn.disabled = false;
    recordBtn.disabled = false;
    setStatus("Mic enabled. Load stems and start singing.");
  } catch (err) {
    setStatus("Mic access failed. Check browser permission settings.");
    console.error(err);
  }
}

function loadSong(song) {
  currentSong = song;
  leadAudio.src = song.lead;
  backingAudio.src = song.instrumental;
  leadAudio.load();
  backingAudio.load();

  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  playBtn.disabled = !micStream;
  recordBtn.disabled = !micStream;

  sessionScore = 0;
  scoreMeter.style.width = "0%";
  scoreValue.textContent = "0";

  if (meterLoop) {
    cancelAnimationFrame(meterLoop);
    meterLoop = null;
  }

  if (micSource && !masterGain) {
    setupAudioGraph();
  }

  setStatus(`Loaded: ${song.title}`);
}

function play() {
  if (!currentSong) {
    setStatus("Pick a song first.");
    return;
  }

  if (!masterGain) {
    setStatus("Enable mic first.");
    return;
  }

  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }

  Promise.all([leadAudio.play(), backingAudio.play()])
    .then(() => {
      if (!meterLoop) {
        tickMeters();
      }
      isPaused = false;
      pauseBtn.textContent = "Pause";
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      setStatus(`Playing: ${currentSong.title}`);
    })
    .catch((err) => {
      setStatus("Playback failed. Try reloading the song.");
      console.error(err);
    });
}

function pause() {
  if (!currentSong) return;

  if (!isPaused) {
    leadAudio.pause();
    backingAudio.pause();
    isPaused = true;
    pauseBtn.textContent = "Resume";
    setStatus("Paused.");
  } else {
    play();
  }
}

function stop() {
  leadAudio.pause();
  backingAudio.pause();
  leadAudio.currentTime = 0;
  backingAudio.currentTime = 0;
  isPaused = false;
  pauseBtn.textContent = "Pause";
  pauseBtn.disabled = true;
  stopBtn.disabled = true;

  if (meterLoop) {
    cancelAnimationFrame(meterLoop);
    meterLoop = null;
  }

  micMeter.style.width = "0%";
  micValue.textContent = "0";
  leadMeter.style.width = "0%";
  leadValue.textContent = "0";

  setStatus("Stopped.");
}

function startRecording() {
  if (!recordDestination) {
    setStatus("Enable mic first before recording.");
    return;
  }

  if (mediaRecorder && mediaRecorder.state === "recording") {
    return;
  }

  recordedChunks = [];
  recordingBlob = null;
  replayBtn.disabled = true;
  downloadBtn.disabled = true;

  const options = MediaRecorder.isTypeSupported("audio/webm")
    ? { mimeType: "audio/webm" }
    : undefined;

  mediaRecorder = new MediaRecorder(recordDestination.stream, options);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const type = mediaRecorder.mimeType || "audio/webm";
    recordingBlob = new Blob(recordedChunks, { type });
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
    recordingUrl = URL.createObjectURL(recordingBlob);
    replayBtn.disabled = false;
    downloadBtn.disabled = false;
    setStatus("Recording complete. Replay or download your mix.");
  };

  mediaRecorder.start();
  recordBtn.disabled = true;
  stopRecordBtn.disabled = false;
  setStatus("Recording started.");
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    return;
  }
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopRecordBtn.disabled = true;
}

function replayRecording() {
  if (!recordingUrl) {
    setStatus("No recording available yet.");
    return;
  }
  const replayAudio = new Audio(recordingUrl);
  replayAudio.play().catch((err) => {
    setStatus("Replay failed.");
    console.error(err);
  });
}

function sanitizeForFilename(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "side-chain";
}

function downloadRecording() {
  if (!recordingBlob) {
    setStatus("No recording available for download.");
    return;
  }

  const songName = sanitizeForFilename(currentSong?.title || "side-chain-session");
  const score = String(Math.round(sessionScore)).padStart(3, "0");
  const filename = `${songName}_score-${score}.webm`;

  const link = document.createElement("a");
  link.href = recordingUrl;
  link.download = filename;
  link.click();

  setStatus(`Downloaded mix: ${filename}`);
}

function loadCustomFiles() {
  const leadFile = leadUpload.files?.[0];
  const instFile = instUpload.files?.[0];

  if (!leadFile || !instFile) {
    setStatus("Choose both lead and instrument files.");
    return;
  }

  const customSong = {
    title: `Custom: ${leadFile.name}`,
    lead: URL.createObjectURL(leadFile),
    instrumental: URL.createObjectURL(instFile),
  };

  loadSong(customSong);
}

function adminLogin() {
  const email = window.prompt("Admin email (prototype check)");
  if (!email) return;

  if (ADMIN_ALLOWLIST.includes(email.trim().toLowerCase())) {
    adminAuthed = true;
    adminState.textContent = `Signed in as ${email}`;
    adminForm.hidden = false;
    setStatus("Admin mode enabled.");
  } else {
    adminAuthed = false;
    adminState.textContent = "Not signed in";
    adminForm.hidden = true;
    setStatus("Admin access denied.");
  }
}

function addLibrarySong() {
  if (!adminAuthed) {
    setStatus("Admin login required.");
    return;
  }

  const title = adminTitle.value.trim();
  const lead = adminLeadPath.value.trim();
  const instrumental = adminInstPath.value.trim();

  if (!title || !lead || !instrumental) {
    setStatus("Fill in title, lead path, and instrumental path.");
    return;
  }

  builtInSongs.push({ title, lead, instrumental });
  hydrateSongMenu();
  songSelect.value = String(builtInSongs.length - 1);
  setStatus(`Added '${title}' to in-app library (not yet committed to repo).`);
}

function exportLibrary() {
  if (!adminAuthed) {
    setStatus("Admin login required.");
    return;
  }

  const blob = new Blob([JSON.stringify(builtInSongs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "side-chain-library.json";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Exported library JSON. Commit this file to GitHub to publish changes.");
}

loadSongBtn.addEventListener("click", () => {
  const idx = Number(songSelect.value);
  loadSong(builtInSongs[idx]);
});
loadCustomBtn.addEventListener("click", loadCustomFiles);
micBtn.addEventListener("click", enableMic);
playBtn.addEventListener("click", play);
pauseBtn.addEventListener("click", pause);
stopBtn.addEventListener("click", stop);
recordBtn.addEventListener("click", startRecording);
stopRecordBtn.addEventListener("click", stopRecording);
replayBtn.addEventListener("click", replayRecording);
downloadBtn.addEventListener("click", downloadRecording);
recordGain.addEventListener("input", applyMicGain);
adminLoginBtn.addEventListener("click", adminLogin);
addLibraryBtn.addEventListener("click", addLibrarySong);
exportLibraryBtn.addEventListener("click", exportLibrary);

applyMicGain();
hydrateSongMenu();
loadSong(builtInSongs[0]);
