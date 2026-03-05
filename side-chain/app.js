const builtInSongs = [
  { title: "Karaoke Star Demo - Root", lead: "../0 Lead Vocals.mp3", instrumental: "../1 Instrumental.mp3" },
  { title: "Pour It Out - Sample", lead: "../pour-it-out/0 Lead Vocals_01.mp3", instrumental: "../pour-it-out/1 Instrumental_01.mp3" },
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
const downloadWavBtn = document.getElementById("downloadWavBtn");

const micMeter = document.getElementById("micMeter");
const micValue = document.getElementById("micValue");
const leadMeter = document.getElementById("leadMeter");
const leadValue = document.getElementById("leadValue");
const scoreMeter = document.getElementById("scoreMeter");
const scoreValue = document.getElementById("scoreValue");
const scoreDigits = document.getElementById("scoreDigits");
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
backingAudio.preload = "auto";
leadAudio.preload = "auto";

let micCtx;
let micStream;
let micAnalyser;
let micData;
let meterLoop;
let currentSong;
let sessionScore = 0;
let isPaused = false;
let adminAuthed = false;

let recCtx;
let recDestination;
let recMicGain;
let recLeadGain;
let recInstGain;
let recLeadSource;
let recInstSource;
let recMicSource;

let mediaRecorder;
let recordedChunks = [];
let recordingBlob = null;
let recordingUrl = "";

function setStatus(msg) { statusEl.textContent = msg; }
function formatDb(v) { return `${Number(v) >= 0 ? "+" : ""}${Number(v)} dB`; }
function dbToGain(db) { return 10 ** (db / 20); }

function sanitizeForFilename(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "side-chain";
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
  const modeBase = {
    practice: 1.0,
    light: 0.8,
    medium: 0.6,
    ghost: 0.2,
    solo: 0.0,
  };
  const base = modeBase[mode] ?? 1.0;
  if (mode === "practice" || mode === "solo") {
    return base;
  }
  return Math.max(0, base - micLevel * 0.5);
}

function updateRecordingMixGains() {
  if (!recLeadGain || !recMicGain) return;
  const micLevel = getMicLevel();
  const leadLevel = computeLeadVolume(modeSelect.value, micLevel);
  recLeadGain.gain.value = leadLevel;
  recMicGain.gain.value = dbToGain(Number(recordGain.value));
}

function tickMeters() {
  const micLevel = getMicLevel();
  const leadLevel = computeLeadVolume(modeSelect.value, micLevel);

  leadAudio.volume = leadLevel;
  updateRecordingMixGains();

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
  scoreDigits.textContent = String(score).padStart(6, "0");

  meterLoop = requestAnimationFrame(tickMeters);
}

function applyMicGain() {
  recordGainValue.textContent = formatDb(recordGain.value);
  if (recMicGain) {
    recMicGain.gain.value = dbToGain(Number(recordGain.value));
  }
}

async function setupRecordingBus() {
  if (!micStream) return;
  if (recDestination) return;

  recCtx = new (window.AudioContext || window.webkitAudioContext)();
  recDestination = recCtx.createMediaStreamDestination();

  const leadStream = leadAudio.captureStream();
  const instStream = backingAudio.captureStream();

  recLeadSource = recCtx.createMediaStreamSource(leadStream);
  recInstSource = recCtx.createMediaStreamSource(instStream);
  recMicSource = recCtx.createMediaStreamSource(micStream);

  recLeadGain = recCtx.createGain();
  recInstGain = recCtx.createGain();
  recMicGain = recCtx.createGain();

  recInstGain.gain.value = 1;
  recLeadGain.gain.value = 1;
  recMicGain.gain.value = dbToGain(Number(recordGain.value));

  recLeadSource.connect(recLeadGain).connect(recDestination);
  recInstSource.connect(recInstGain).connect(recDestination);
  recMicSource.connect(recMicGain).connect(recDestination);
}

async function enableMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micCtx = micCtx || new (window.AudioContext || window.webkitAudioContext)();
    const micSource = micCtx.createMediaStreamSource(micStream);
    micAnalyser = micCtx.createAnalyser();
    micAnalyser.fftSize = 1024;
    micData = new Uint8Array(micAnalyser.fftSize);
    micSource.connect(micAnalyser);

    await setupRecordingBus();
    applyMicGain();

    micBtn.disabled = true;
    playBtn.disabled = false;
    recordBtn.disabled = false;
    setStatus("Mic enabled. Ready to sing.");
  } catch (err) {
    setStatus("Mic access failed. Check browser permissions.");
    console.error(err);
  }
}

function resetMeters() {
  micMeter.style.width = "0%";
  micValue.textContent = "0";
  leadMeter.style.width = "0%";
  leadValue.textContent = "0";
}

function loadSong(song) {
  currentSong = song;
  leadAudio.src = song.lead;
  backingAudio.src = song.instrumental;
  leadAudio.load();
  backingAudio.load();

  sessionScore = 0;
  scoreMeter.style.width = "0%";
  scoreValue.textContent = "0";
  scoreDigits.textContent = "000000";
  resetMeters();

  playBtn.disabled = !micStream;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  recordBtn.disabled = !micStream;

  setStatus(`Loaded: ${song.title}`);
}

function play() {
  if (!currentSong) return setStatus("Pick a song first.");
  Promise.all([leadAudio.play(), backingAudio.play()])
    .then(() => {
      if (!meterLoop) tickMeters();
      isPaused = false;
      pauseBtn.textContent = "Pause";
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      setStatus(`Playing: ${currentSong.title}`);
    })
    .catch((err) => {
      setStatus("Playback failed. Reload song and try again.");
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
  resetMeters();
  setStatus("Stopped.");
}

function startRecording() {
  if (!recDestination) return setStatus("Enable mic first before recording.");
  if (typeof MediaRecorder === "undefined") return setStatus("Recording not supported in this browser.");
  if (mediaRecorder?.state === "recording") return;

  recordedChunks = [];
  recordingBlob = null;
  replayBtn.disabled = true;
  downloadWavBtn.disabled = true;

  const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? { mimeType: "audio/webm;codecs=opus" }
    : MediaRecorder.isTypeSupported("audio/webm")
      ? { mimeType: "audio/webm" }
      : undefined;

  mediaRecorder = new MediaRecorder(recDestination.stream, options);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data?.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const type = mediaRecorder.mimeType || "audio/webm";
    recordingBlob = new Blob(recordedChunks, { type });
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = URL.createObjectURL(recordingBlob);
    replayBtn.disabled = false;
    downloadWavBtn.disabled = false;
    setStatus("Recording complete. Replay or download WAV.");
  };

  mediaRecorder.start();
  recordBtn.disabled = true;
  stopRecordBtn.disabled = false;
  setStatus("Recording started.");
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") return;
  mediaRecorder.stop();
  stopRecordBtn.disabled = true;
  recordBtn.disabled = false;
}

function replayRecording() {
  if (!recordingUrl) return setStatus("No recording available yet.");
  const audio = new Audio(recordingUrl);
  audio.play().catch((err) => {
    setStatus("Replay failed.");
    console.error(err);
  });
}

function audioBufferToWavBlob(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * channels * 2;
  const wav = new ArrayBuffer(44 + length);
  const view = new DataView(wav);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i += 1) view.setUint8(offset + i, string.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length, true);

  const interleaved = new Float32Array(buffer.length * channels);
  for (let ch = 0; ch < channels; ch += 1) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < buffer.length; i += 1) {
      interleaved[i * channels + ch] = channelData[i];
    }
  }

  let offset = 44;
  for (let i = 0; i < interleaved.length; i += 1) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wav], { type: "audio/wav" });
}

async function downloadWav() {
  if (!recordingBlob) return setStatus("No recording available for download.");

  try {
    const arrayBuffer = await recordingBlob.arrayBuffer();
    const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    const wavBlob = audioBufferToWavBlob(audioBuffer);

    const songName = sanitizeForFilename(currentSong?.title || "side-chain-session");
    const score = String(Math.round(sessionScore)).padStart(3, "0");
    const filename = `${songName}_score-${score}.wav`;

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setStatus(`Downloaded WAV: ${filename}. MP3 export needs external encoder/backend.`);
  } catch (err) {
    console.error(err);
    setStatus("WAV conversion failed in this browser. Try Chrome/Edge.");
  }
}

function loadCustomFiles() {
  const leadFile = leadUpload.files?.[0];
  const instFile = instUpload.files?.[0];
  if (!leadFile || !instFile) return setStatus("Choose both lead and instrument files.");
  loadSong({
    title: `Custom: ${leadFile.name}`,
    lead: URL.createObjectURL(leadFile),
    instrumental: URL.createObjectURL(instFile),
  });
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
  if (!adminAuthed) return setStatus("Admin login required.");
  const title = adminTitle.value.trim();
  const lead = adminLeadPath.value.trim();
  const instrumental = adminInstPath.value.trim();
  if (!title || !lead || !instrumental) return setStatus("Fill in title, lead path, and instrumental path.");
  builtInSongs.push({ title, lead, instrumental });
  hydrateSongMenu();
  songSelect.value = String(builtInSongs.length - 1);
  setStatus(`Added '${title}' to in-app library (not yet committed to repo).`);
}

function exportLibrary() {
  if (!adminAuthed) return setStatus("Admin login required.");
  const blob = new Blob([JSON.stringify(builtInSongs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "side-chain-library.json";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Exported library JSON. Commit this file to GitHub to publish changes.");
}

loadSongBtn.addEventListener("click", () => loadSong(builtInSongs[Number(songSelect.value)]));
loadCustomBtn.addEventListener("click", loadCustomFiles);
micBtn.addEventListener("click", enableMic);
playBtn.addEventListener("click", play);
pauseBtn.addEventListener("click", pause);
stopBtn.addEventListener("click", stop);
recordBtn.addEventListener("click", startRecording);
stopRecordBtn.addEventListener("click", stopRecording);
replayBtn.addEventListener("click", replayRecording);
downloadWavBtn.addEventListener("click", downloadWav);
recordGain.addEventListener("input", applyMicGain);
adminLoginBtn.addEventListener("click", adminLogin);
addLibraryBtn.addEventListener("click", addLibrarySong);
exportLibraryBtn.addEventListener("click", exportLibrary);

applyMicGain();
scoreDigits.textContent = "000000";
hydrateSongMenu();
loadSong(builtInSongs[0]);
