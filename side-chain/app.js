const builtInSongs = [
  {
    title: "Karaoke Star Demo - Root",
    lead: "../0 Lead Vocals.mp3",
    instrumental: "../1 Instrumental.mp3",
    artwork: "../ks-app-banner.jpg",
  },
  {
    title: "Pour It Out - Sample",
    lead: "../pour-it-out/0 Lead Vocals_01.mp3",
    instrumental: "../pour-it-out/1 Instrumental_01.mp3",
    artwork: "../pour-it-out/ks-app-banner.jpg",
  },
];

const dropInSongs = [
  {
    title: "A Little Confidence",
    lead: "../a-little-confidence/0 Lead Vocals_01.mp3",
    instrumental: "../a-little-confidence/1 Instrumental_01.mp3",
    artwork: "../a-little-confidence/cover.jpg",
    artworkCandidates: [
      "../a-little-confidence/cover.jpg",
      "../a-little-confidence/cover.jpeg",
      "../a-little-confidence/cover.png",
      "../a-little-confidence/A Little Confidence.jpg",
      "../a-little-confidence/A Little Confidence.jpeg",
      "../a-little-confidence/A Little Confidence.png",
      "../a-little-confidence/ks-app-banner.jpg",
    ],
  },
];

const appRoot = document.getElementById("appRoot");
const accessGate = document.getElementById("accessGate");
const accessCodeInput = document.getElementById("accessCodeInput");
const unlockBtn = document.getElementById("unlockBtn");
const gateStatus = document.getElementById("gateStatus");
const demoUnlockBtn = document.getElementById("demoUnlockBtn");

const songSelect = document.getElementById("songSelect");
const loadSongBtn = document.getElementById("loadSongBtn");
const leadUpload = document.getElementById("leadUpload");
const instUpload = document.getElementById("instUpload");
const loadCustomBtn = document.getElementById("loadCustomBtn");

const bgFx = document.getElementById("bgFx");
const bgPresetSelect = document.getElementById("bgPresetSelect");
const applyBgBtn = document.getElementById("applyBgBtn");
const useSongArtToggle = document.getElementById("useSongArtToggle");
const bgUpload = document.getElementById("bgUpload");
const applyCustomBgBtn = document.getElementById("applyCustomBgBtn");

const micBtn = document.getElementById("micBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const modeSelect = document.getElementById("modeSelect");

const eqLow = document.getElementById("eqLow");
const eqMid = document.getElementById("eqMid");
const eqHigh = document.getElementById("eqHigh");
const autoTune = document.getElementById("autoTune");
const eqReadout = document.getElementById("eqReadout");

const captureModeSelect = document.getElementById("captureModeSelect");
const videoFormatSelect = document.getElementById("videoFormatSelect");
const videoOrientationSelect = document.getElementById("videoOrientationSelect");
const recordGain = document.getElementById("recordGain");
const recordGainValue = document.getElementById("recordGainValue");
const enableCamBtn = document.getElementById("enableCamBtn");
const recordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const replayBtn = document.getElementById("replayBtn");
const downloadWavBtn = document.getElementById("downloadWavBtn");
const resetRecordingBtn = document.getElementById("resetRecordingBtn");
const webcamSideCell = document.getElementById("webcamSideCell");
const webcamPreview = document.getElementById("webcamPreview");
const webcamPlaceholder = document.getElementById("webcamPlaceholder");
const webcamLiveNote = document.getElementById("webcamLiveNote");
const recordCanvas = document.getElementById("recordCanvas");

const micMeter = document.getElementById("micMeter");
const micValue = document.getElementById("micValue");
const leadMeter = document.getElementById("leadMeter");
const leadValue = document.getElementById("leadValue");
const scoreMeter = document.getElementById("scoreMeter");
const scoreValue = document.getElementById("scoreValue");
const scoreDigits = document.getElementById("scoreDigits");
const statusEl = document.getElementById("status");
const lyricsSongLabel = document.getElementById("lyricsSongLabel");
const lyricsEditor = document.getElementById("lyricsEditor");
const loadLyricsBtn = document.getElementById("loadLyricsBtn");
const copyLyricsBtn = document.getElementById("copyLyricsBtn");
const clearLyricsBtn = document.getElementById("clearLyricsBtn");

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
let smoothedMicLevel = 0;
let sessionScore = 0;
let isPaused = false;

let recCtx;
let recDestination;
let recMicGain;
let recLeadGain;
let recInstGain;
let recMicLow;
let recMicMid;
let recMicHigh;
let recMicComp;
let recMicShape;

let mediaRecorder;
let recordedChunks = [];
let recordingBlob = null;
let recordingUrl = "";
let recordingMimeType = "";
let recordingKind = "audio";
let webcamStream;
let canvasStream;
let canvasRenderLoop;
let customBgUrl = "";

const params = new URLSearchParams(window.location.search);
const API_BASE = (params.get("apiBase") || "").replace(/\/$/, "");
accessCodeInput.value = "";
const DEMO_CODES = {
  TryLevel2: "patreon_l2_demo",
};

const DEFAULT_LYRICS = {
  "Karaoke Star Demo - Root": [
    "Sign me up, sign me up, sign me up, fast, I wanna be a karaoke star",
    "A lip singer with the it factor",
    "I can dance, prance,and strut about",
    "Like I was made, just for this",
    "To let this flow state take me to a higher level, above the clouds",
    "I wanna be a karaoke star",
    "A genuine, karaoke star",
    "I wanna be. a karaoke star, karaoke star, karaoke, star",
    "",
    "Since since since since way back when",
    "Rock n roll first came of age bringing in, the",
    "The rhythm the blues, the guitar heroes, with giant hair",
    "And oh so, so so so much make up",
    "I wanna be a karaoke star",
    "A genuine, karaoke star",
    "I wanna be. a karaoke star, karaoke star, karaoke, star",
    "",
    "Check it, Check it, Check it, Check it, i think i can do this",
    "whats the risk, im just having more fun, than anybody else",
    "that’s my cue, time, to take over, the stage",
    "i’ll show them, i know the words, i got the emotions, on lock down",
    "ready to to deliver, entertainment so pure, you'll question your own sanity",
    "what’s the deal there",
    "I wanna be a karaoke star",
    "A bigger than life, karaoke star",
    "I wanna be. a karaoke star, karaoke star, karaoke, star",
    "",
    "Dont let up, dont let up, dont let up, dont let me T up, just yet",
    "there is just a little more work to do, to convince you",
    "i got that look, with all the right stuff, to back it up, back it up, back it up",
    "i said back it up, my friends and family are all in crowd, hey yall",
    "I wanna be a karaoke star",
    "A cuttin edge, glamorous, karaoke star",
    "I wanna be. a karaoke star, karaoke star, karaoke, star, vote me in!",
  ].join("\n"),
  "Pour It Out - Sample": [
    "Heres what Im gonna do , Gonna, Pour it, out while I have something to give, Pour it out, I've got something to prove, I can see my whole life story flashing right  before me, i better do this now, while Im in the mood, Heres what Im gonna do , Gonna, Pour it out , Gonna, Pour it out , here's some more",
    "",
    "Figured it, was gonna be my last chance, to really work this hard, push my limits, see where that takes us, from the beginning that was my motto, and it continues, Here's what I'm gonna do , Gonna, Pour it,  Gonna, Pour it out , for you,",
    "",
    "I found my inspiration ,it was my, desperation, you think I'm joking but I felt like I was staring right at the streets, if things didn't go just as planned, Here's what Im gonna do , Gonna, Pour it out, and let you in on it, Gonna, Pour it out, Gonna, Pour it out,",
    "",
    "If i've learned anything, at this point, it is, you cant ,always ,judge a book by its cover, what’s under the skin is so hard to imagine, when you can't look past, the stereotype, lets try and that break that trend, and let all the people shout, Here’s what Im gonna do , Gonna, Pour it out, and you are in on it, Gonna, Pour it out, Gonna, Pour it out, Gonna, Pour it out,",
  ].join("\n"),
  "A Little Confidence": [
    "It’s Up for grabs, watch out, im getting, a little confidence, ya know, that is a dangerous situation, like a drug, i’m gonna want, some more, Anything is possible, with a little more, confidence, been there, done that, that's why, at this stage, its not surprising, i am still trying, to get some, ya know, loving, money, fall into, the lap, of luxury, ah, she’s so hot, with just a little more, a little more, confidence, ya know, this is becoming, a dangerous situation, with just a little more, a little more, confidence, this could go off",
    "",
    "I'm gonna have to put you, on hold, i just saw a model, extremely hot, VERSION, from my future, let’s see what, I can do with it, ya know, a little more, confidence, lets keep on pushing, it, ya know what, that’s it, don't quit, pumping, pumping, it in, ah yeah, its on now, I figured out the equation to gaining, all the world’s love, with a little more confidence what could we do then, ah bend the rules, just this one time so i can slide on in, i like I did back, in the day, when the bouncer, was my buddy, it’s happening, again with a little more confidence, with a little more confidence this could be, a big hit, for this here boy, yeah boy,",
    "",
    "Listen closely, to this rambling, from a mad man, who’s, off the charts, on his way, up, to the stars, who know, maybe with a little luck I might just do it, the right way, ah yeah dont forget karma, baby, ya owe me, time, to pay up, I’ll take this as far as I can go, with a little more confidence, I think I could rule the school, I’m bored, let all the kids out of class, let em dance, in the big gym, with alittle more, aitel more confidence, we could all be winners, not like them losers, not cuttin, me down",
    "",
    "Last time I felt this good, was when, i ran of out, of that medication they wanted to put me on, but now that I found this rhythm, this blend, I think I got this, on my own, but I'm searching far and wide, for some all stars, to be in my band, of merry men, and oh oh don't forget the ladies, the coming in, from all directions, now that I picked up, from where i left off, before before I took that turn, and went back home, I had to to do it, all, to get to this point, now i’m in, in my, my element, anything is possible, yes way, with a little more, with a little more confidence, Baby, Baby, baby, its here, to stay,",
  ].join("\n"),
};


function setStatus(msg) { statusEl.textContent = msg; }
function formatDb(v) { return `${Number(v) >= 0 ? "+" : ""}${Number(v)} dB`; }
function dbToGain(db) { return 10 ** (db / 20); }
function sanitizeForFilename(text) { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "side-chain"; }
function apiUrl(path) { return `${API_BASE}${path}`; }

function lockApp() {
  document.body.classList.add("locked");
  appRoot.setAttribute("aria-hidden", "true");
  accessGate.style.display = "grid";
}

function unlockApp(tier) {
  document.body.classList.remove("locked");
  appRoot.setAttribute("aria-hidden", "false");
  accessGate.style.display = "none";
  setStatus(`Access granted (${tier}). Ready to sing.`);
}

async function verifySession() {
  try {
    const resp = await fetch(apiUrl("/api/access/verify"), { credentials: "include" });
    if (!resp.ok) {
      lockApp();
      return;
    }
    const data = await resp.json();
    unlockApp(data.tier || "member");
  } catch {
    lockApp();
    gateStatus.textContent = "The room is offline right now. Check your access and try again soon.";
    demoUnlockBtn.hidden = false;
  }
}

async function unlockWithCode() {
  const code = accessCodeInput.value.trim();
  if (!code) {
    gateStatus.textContent = "Enter an access code first.";
    return;
  }

  gateStatus.textContent = "Verifying code...";
  unlockBtn.disabled = true;

  try {
    const resp = await fetch(apiUrl("/api/access/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      gateStatus.textContent = data.error || "Access denied.";
      unlockBtn.disabled = false;
      return;
    }

    gateStatus.textContent = `Access granted for ${data.tier}.`;
    unlockApp(data.tier);
  } catch (err) {
    console.error(err);
    const offlineTier = DEMO_CODES[code];
    if (offlineTier) {
      gateStatus.textContent = "Gateway unavailable. Using offline access.";
      unlockApp(offlineTier);
      return;
    }
    gateStatus.textContent = "That room is still locked. Check your access and try again.";
    demoUnlockBtn.hidden = false;
    unlockBtn.disabled = false;
  }
}

function unlockDemoMode() {
  const code = accessCodeInput.value.trim();
  const tier = DEMO_CODES[code];
  if (!tier) {
    gateStatus.textContent = "That code did not open the room.";
    return;
  }
  gateStatus.textContent = "Offline access granted. Welcome in.";
  unlockApp(tier);
}


function registerDropInSongs() {
  for (const song of dropInSongs) {
    if (!builtInSongs.some((entry) => entry.title === song.title)) builtInSongs.push(song);
  }
}

function loadLyricsForCurrentSong() {
  if (!currentSong) {
    lyricsSongLabel.textContent = "Lyrics: (none loaded)";
    return;
  }
  const text = DEFAULT_LYRICS[currentSong.title] || "";
  lyricsEditor.value = text;
  lyricsSongLabel.textContent = `Lyrics: ${currentSong.title}`;
  if (!text) {
    setStatus("No default lyrics found for this song yet. Paste your lyrics into the editor.");
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
  return Math.min(1, Math.sqrt(sumSquares / micData.length) * 4.2);
}

function getBlendState(mode, micLevel) {
  const blendMap = {
    practice: { guideBase: 1.0, duck: 0.08, guideFloor: 0.8, instBase: 0.9, instLift: 0.05, micLift: 1.05 },
    light: { guideBase: 0.82, duck: 0.26, guideFloor: 0.34, instBase: 0.92, instLift: 0.1, micLift: 1.12 },
    medium: { guideBase: 0.62, duck: 0.42, guideFloor: 0.18, instBase: 0.94, instLift: 0.14, micLift: 1.18 },
    ghost: { guideBase: 0.28, duck: 0.5, guideFloor: 0.06, instBase: 0.97, instLift: 0.16, micLift: 1.22 },
    solo: { guideBase: 0.02, duck: 0.15, guideFloor: 0, instBase: 1.0, instLift: 0.08, micLift: 1.24 },
  };
  const profile = blendMap[mode] || blendMap.practice;
  const guideLevel = Math.max(profile.guideFloor, profile.guideBase - micLevel * profile.duck);
  const instrumentalLevel = Math.min(1.15, profile.instBase + micLevel * profile.instLift);
  const micPresenceGain = profile.micLift + micLevel * 0.24;
  return { guideLevel, instrumentalLevel, micPresenceGain };
}

function makeDriveCurve(amount = 0) {
  const n = 1024;
  const curve = new Float32Array(n);
  const k = 1 + (amount / 100) * 20;
  for (let i = 0; i < n; i += 1) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

function updateMicToneChain() {
  if (!recMicLow) {
    eqReadout.textContent = `Low ${eqLow.value} dB • Mid ${eqMid.value} dB • High ${eqHigh.value} dB • Auto Tune Assist ${autoTune.value}%`;
    return;
  }

  recMicLow.gain.value = Number(eqLow.value);
  recMicMid.gain.value = Number(eqMid.value);
  recMicHigh.gain.value = Number(eqHigh.value);

  const tuneAmt = Number(autoTune.value);
  recMicComp.threshold.value = -30 - tuneAmt * 0.2;
  recMicComp.ratio.value = 2 + tuneAmt * 0.1;
  recMicComp.attack.value = 0.003 + (100 - tuneAmt) * 0.0002;
  recMicComp.release.value = 0.08 + tuneAmt * 0.003;
  recMicShape.curve = makeDriveCurve(tuneAmt);

  eqReadout.textContent = `Low ${eqLow.value} dB • Mid ${eqMid.value} dB • High ${eqHigh.value} dB • Auto Tune Assist ${autoTune.value}%`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}

async function resolveSongArtwork(song) {
  if (!song) return "";
  if (song.resolvedArtwork) return song.resolvedArtwork;

  const candidates = [song.artwork, ...(song.artworkCandidates || [])].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const okUrl = await loadImage(candidate);
      song.resolvedArtwork = okUrl;
      return okUrl;
    } catch {
      // try next candidate
    }
  }
  return "";
}

function setBackgroundPreset(preset) {
  document.body.style.backgroundImage = "";
  document.body.classList.remove("bg-electric-grid", "bg-rain-fern", "bg-starfield", "bg-light-phenomena");
  const fxMap = {
    electric: ["bg-electric-grid", "fx-electric"],
    rain: ["bg-rain-fern", "fx-rain"],
    starfield: ["bg-starfield", "fx-starfield"],
    lights: ["bg-light-phenomena", "fx-lights"],
  };
  const [bodyClass, fxClass] = fxMap[preset] || fxMap.electric;
  document.body.classList.add(bodyClass);
  bgFx.className = `bg-fx ${fxClass}`;
}

async function applySongArtworkBackground(song) {
  const artworkUrl = await resolveSongArtwork(song);
  if (!artworkUrl) return;
  if (customBgUrl) {
    URL.revokeObjectURL(customBgUrl);
    customBgUrl = "";
  }
  document.body.classList.remove("bg-electric-grid", "bg-rain-fern", "bg-starfield", "bg-light-phenomena");
  bgFx.className = "bg-fx";
  document.body.style.backgroundImage = `linear-gradient(rgba(6, 8, 14, 0.46), rgba(6, 8, 14, 0.46)), url('${artworkUrl}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
}

function applyBgPreset() {
  useSongArtToggle.checked = false;
  if (customBgUrl) {
    URL.revokeObjectURL(customBgUrl);
    customBgUrl = "";
  }
  setBackgroundPreset(bgPresetSelect.value);
}

function applyCustomBackground() {
  useSongArtToggle.checked = false;
  const file = bgUpload.files?.[0];
  if (!file) {
    setStatus("Choose an image or GIF for custom background.");
    return;
  }

  if (customBgUrl) URL.revokeObjectURL(customBgUrl);
  customBgUrl = URL.createObjectURL(file);
  document.body.classList.remove("bg-electric-grid", "bg-rain-fern", "bg-starfield", "bg-light-phenomena");
  bgFx.className = "bg-fx";
  document.body.style.backgroundImage = `linear-gradient(rgba(6, 8, 14, 0.42), rgba(6, 8, 14, 0.42)), url('${customBgUrl}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  setStatus(`Applied custom background: ${file.name}`);
}

function updateRecordingMixGains(micLevel = smoothedMicLevel) {
  if (!recLeadGain || !recMicGain || !recInstGain) return;
  const blend = getBlendState(modeSelect.value, micLevel);
  recLeadGain.gain.value = blend.guideLevel;
  recInstGain.gain.value = blend.instrumentalLevel;
  recMicGain.gain.value = dbToGain(Number(recordGain.value)) * blend.micPresenceGain;
}

function tickMeters() {
  const rawMicLevel = getMicLevel();
  smoothedMicLevel = smoothedMicLevel * 0.72 + rawMicLevel * 0.28;
  const blend = getBlendState(modeSelect.value, smoothedMicLevel);
  const leadLevel = blend.guideLevel;
  leadAudio.volume = leadLevel;
  backingAudio.volume = blend.instrumentalLevel;
  updateRecordingMixGains(smoothedMicLevel);

  const micLevel = smoothedMicLevel;

  const micPct = Math.round(micLevel * 100);
  const leadPct = Math.round(leadLevel * 100);
  sessionScore += micPct * 0.035;
  const score = Math.round(sessionScore);

  micMeter.style.width = `${micPct}%`;
  micValue.textContent = String(micPct);
  leadMeter.style.width = `${leadPct}%`;
  leadValue.textContent = String(leadPct);

  scoreMeter.style.width = `${Math.min(100, Math.round(score / 10))}%`;
  scoreValue.textContent = String(score);
  const digits = String(score).padStart(6, "0");
  scoreDigits.textContent = digits;

  meterLoop = requestAnimationFrame(tickMeters);
}

function applyMicGain() {
  recordGainValue.textContent = formatDb(recordGain.value);
  updateRecordingMixGains(smoothedMicLevel);
}

async function setupRecordingBus() {
  if (!micStream || recDestination) return;
  recCtx = new (window.AudioContext || window.webkitAudioContext)();
  recDestination = recCtx.createMediaStreamDestination();

  const recLeadSource = recCtx.createMediaStreamSource(leadAudio.captureStream());
  const recInstSource = recCtx.createMediaStreamSource(backingAudio.captureStream());
  const recMicSource = recCtx.createMediaStreamSource(micStream);

  recLeadGain = recCtx.createGain();
  recInstGain = recCtx.createGain();
  recMicGain = recCtx.createGain();

  recMicLow = recCtx.createBiquadFilter();
  recMicLow.type = "lowshelf";
  recMicLow.frequency.value = 180;
  recMicMid = recCtx.createBiquadFilter();
  recMicMid.type = "peaking";
  recMicMid.frequency.value = 1800;
  recMicMid.Q.value = 1.0;
  recMicHigh = recCtx.createBiquadFilter();
  recMicHigh.type = "highshelf";
  recMicHigh.frequency.value = 5200;
  recMicComp = recCtx.createDynamicsCompressor();
  recMicShape = recCtx.createWaveShaper();

  recLeadSource.connect(recLeadGain).connect(recDestination);
  recInstSource.connect(recInstGain).connect(recDestination);
  recMicSource.connect(recMicLow).connect(recMicMid).connect(recMicHigh).connect(recMicComp).connect(recMicShape).connect(recMicGain).connect(recDestination);

  updateMicToneChain();
  applyMicGain();
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

    micBtn.disabled = true;
    playBtn.disabled = false;
    recordBtn.disabled = false;
    refreshResetRecordingButton();
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
  smoothedMicLevel = 0;
  scoreMeter.style.width = "0%";
  scoreValue.textContent = "0";
  scoreDigits.textContent = "000000";
  backingAudio.volume = 1;
  resetMeters();

  playBtn.disabled = !micStream;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  recordBtn.disabled = !micStream;

  if (useSongArtToggle.checked && song.artwork) {
    applySongArtworkBackground(song).catch(() => {});
  }

  loadLyricsForCurrentSong();
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
  backingAudio.volume = 1;
  setStatus("Stopped.");
}

function showPromoPlaceholder() {
  webcamSideCell.classList.remove("webcam-live");
  webcamPlaceholder.hidden = false;
  webcamPreview.hidden = true;
  webcamLiveNote.hidden = true;
}

function showLiveWebcam() {
  webcamSideCell.classList.add("webcam-live");
  webcamPlaceholder.hidden = true;
  webcamPreview.hidden = false;
  webcamLiveNote.hidden = false;
}

async function ensureWebcam() {
  if (webcamStream) {
    showLiveWebcam();
    return webcamStream;
  }
  webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  webcamPreview.srcObject = webcamStream;
  webcamPreview.muted = true;
  showLiveWebcam();
  return webcamStream;
}

function getVideoFrameSize() {
  return videoOrientationSelect.value === "portrait"
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}

function updatePreviewOrientation() {
  webcamPreview.style.aspectRatio = videoOrientationSelect.value === "portrait" ? "9 / 16" : "16 / 9";
}

function stopCanvasPreviewLoop() {
  if (canvasRenderLoop) {
    cancelAnimationFrame(canvasRenderLoop);
    canvasRenderLoop = null;
  }
}

function drawWebcamFrame() {
  if (!webcamStream || webcamPreview.readyState < 2) {
    canvasRenderLoop = requestAnimationFrame(drawWebcamFrame);
    return;
  }

  const { width, height } = getVideoFrameSize();
  if (recordCanvas.width !== width || recordCanvas.height !== height) {
    recordCanvas.width = width;
    recordCanvas.height = height;
  }

  const ctx = recordCanvas.getContext("2d");
  const sourceWidth = webcamPreview.videoWidth || width;
  const sourceHeight = webcamPreview.videoHeight || height;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(webcamPreview, sx, sy, sw, sh, 0, 0, width, height);
  canvasRenderLoop = requestAnimationFrame(drawWebcamFrame);
}

async function ensureCanvasStream() {
  await ensureWebcam();
  stopCanvasPreviewLoop();
  drawWebcamFrame();
  if (canvasStream) canvasStream.getTracks().forEach((track) => track.stop());
  canvasStream = recordCanvas.captureStream(30);
  return canvasStream;
}

function getCaptureMode() {
  return captureModeSelect.value;
}

function getPreferredVideoMimeType() {
  const preferred = videoFormatSelect.value === "social"
    ? ["video/mp4;codecs=h264,aac", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return preferred.find((type) => MediaRecorder.isTypeSupported(type));
}

async function buildRecordingStream(mode) {
  if (!micStream) throw new Error("Enable mic first before recording.");
  if (!recDestination) throw new Error("Recording bus not ready yet.");

  const wantsCam = mode === "mic_mix_cam" || mode === "mic_cam";
  const wantsMix = mode === "mic_mix" || mode === "mic_mix_cam";

  const stream = new MediaStream();
  const audioSource = wantsMix ? recDestination.stream : micStream;
  audioSource.getAudioTracks().forEach((track) => stream.addTrack(track));

  if (wantsCam) {
    const camStream = await ensureCanvasStream();
    const [videoTrack] = camStream.getVideoTracks();
    if (!videoTrack) throw new Error("Webcam video track unavailable.");
    stream.addTrack(videoTrack);
  }

  return { stream, wantsCam };
}

function refreshResetRecordingButton() {
  resetRecordingBtn.disabled = !recordingBlob && mediaRecorder?.state !== "recording";
}

async function startRecording() {
  if (typeof MediaRecorder === "undefined") return setStatus("Recording not supported in this browser.");
  if (mediaRecorder?.state === "recording") return;

  const mode = getCaptureMode();
  let streamInfo;
  try {
    streamInfo = await buildRecordingStream(mode);
  } catch (err) {
    console.error(err);
    setStatus(err.message);
    return;
  }

  recordedChunks = [];
  recordingBlob = null;
  recordingKind = streamInfo.wantsCam ? "video" : "audio";
  replayBtn.disabled = true;
  downloadWavBtn.disabled = true;

  const options = recordingKind === "video"
    ? (() => {
        const mimeType = getPreferredVideoMimeType();
        return mimeType ? { mimeType } : undefined;
      })()
    : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? { mimeType: "audio/webm;codecs=opus" }
      : MediaRecorder.isTypeSupported("audio/webm")
        ? { mimeType: "audio/webm" }
        : undefined;

  mediaRecorder = new MediaRecorder(streamInfo.stream, options);
  recordingMimeType = options?.mimeType || (recordingKind === "video" ? "video/webm" : "audio/webm");
  mediaRecorder.ondataavailable = (e) => { if (e.data?.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = () => {
    recordingBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || recordingMimeType });
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = URL.createObjectURL(recordingBlob);
    replayBtn.disabled = false;
    downloadWavBtn.disabled = false;
    refreshResetRecordingButton();
    setStatus(`${recordingKind === "video" ? "Video" : "Audio"} recording complete. Replay or download your take.`);
  };

  mediaRecorder.start();
  recordBtn.disabled = true;
  stopRecordBtn.disabled = false;
  refreshResetRecordingButton();
  setStatus(`Recording ${recordingKind === "video" ? `${videoOrientationSelect.value} video + audio` : "audio"}.`);
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") return;
  mediaRecorder.stop();
  stopRecordBtn.disabled = true;
  recordBtn.disabled = false;
  refreshResetRecordingButton();
}

function replayRecording() {
  if (!recordingUrl || !recordingBlob) return setStatus("No recording available yet.");
  const el = recordingKind === "video" ? document.createElement("video") : document.createElement("audio");
  el.src = recordingUrl;
  el.controls = true;
  el.autoplay = true;
  if (recordingKind === "video") {
    el.muted = false;
    el.playsInline = true;
    Object.assign(el.style, {
      position: "fixed", right: "16px", bottom: "16px", width: "min(360px, 88vw)", zIndex: 20,
      borderRadius: "16px", border: "1px solid rgba(120,150,255,0.45)", background: "#050814",
    });
    document.body.appendChild(el);
    el.addEventListener("ended", () => el.remove(), { once: true });
  }
  el.play().catch((err) => {
    console.error(err);
    setStatus("Replay failed.");
  });
}

async function downloadRecording() {
  if (!recordingBlob) return setStatus("No recording available for download.");
  if (recordingKind === "audio") {
    return downloadWav();
  }

  const extension = recordingBlob.type.includes("mp4") ? "mp4" : "webm";
  const filename = `${sanitizeForFilename(currentSong?.title || "side-chain-audition")}_${videoOrientationSelect.value}.${extension}`;
  const a = document.createElement("a");
  a.href = recordingUrl;
  a.download = filename;
  a.click();
  setStatus(`Downloaded recording: ${filename}`);
}

function resetRecordingSession() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  recordedChunks = [];
  recordingBlob = null;
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  recordingUrl = "";
  replayBtn.disabled = true;
  downloadWavBtn.disabled = true;
  stopRecordBtn.disabled = true;
  recordBtn.disabled = !micStream;
  refreshResetRecordingButton();
  setStatus("Recording take cleared. Ready for another pass.");
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

loadSongBtn.addEventListener("click", () => loadSong(builtInSongs[Number(songSelect.value)]));
loadCustomBtn.addEventListener("click", loadCustomFiles);
applyBgBtn.addEventListener("click", applyBgPreset);
applyCustomBgBtn.addEventListener("click", applyCustomBackground);
useSongArtToggle.addEventListener("change", () => {
  if (!currentSong) return;
  if (useSongArtToggle.checked && currentSong.artwork) {
    applySongArtworkBackground(currentSong).catch(() => {});
  } else {
    setBackgroundPreset(bgPresetSelect.value || "electric");
  }
});
micBtn.addEventListener("click", enableMic);
enableCamBtn.addEventListener("click", () => {
  ensureWebcam()
    .then(() => setStatus("Webcam enabled. Preview is live."))
    .catch((err) => {
      console.error(err);
      setStatus(err.message || "Webcam access failed. Check browser permissions.");
    });
});
playBtn.addEventListener("click", play);
pauseBtn.addEventListener("click", pause);
stopBtn.addEventListener("click", stop);
recordBtn.addEventListener("click", startRecording);
stopRecordBtn.addEventListener("click", stopRecording);
replayBtn.addEventListener("click", replayRecording);
downloadWavBtn.addEventListener("click", downloadRecording);
resetRecordingBtn.addEventListener("click", resetRecordingSession);
recordGain.addEventListener("input", applyMicGain);
videoOrientationSelect.addEventListener("change", () => {
  updatePreviewOrientation();
  if (webcamStream) ensureCanvasStream().catch((err) => console.error(err));
});
captureModeSelect.addEventListener("change", () => {
  const needsCam = captureModeSelect.value.includes("cam");
  if (needsCam) ensureWebcam().catch((err) => setStatus(err.message || "Webcam access failed."));
});
eqLow.addEventListener("input", updateMicToneChain);
eqMid.addEventListener("input", updateMicToneChain);
eqHigh.addEventListener("input", updateMicToneChain);
autoTune.addEventListener("input", updateMicToneChain);

loadLyricsBtn.addEventListener("click", loadLyricsForCurrentSong);
copyLyricsBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lyricsEditor.value || "");
    setStatus("Lyrics copied to clipboard.");
  } catch {
    setStatus("Clipboard copy failed. You can manually select/copy lyrics.");
  }
});
clearLyricsBtn.addEventListener("click", () => {
  lyricsEditor.value = "";
  setStatus("Lyrics editor cleared.");
});
unlockBtn.addEventListener("click", unlockWithCode);
demoUnlockBtn.addEventListener("click", unlockDemoMode);
accessCodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") unlockWithCode();
});

setBackgroundPreset("electric");
updatePreviewOrientation();
showPromoPlaceholder();
applyMicGain();
updateMicToneChain();
scoreDigits.textContent = "000000";
lyricsSongLabel.textContent = "Lyrics: (none loaded)";
demoUnlockBtn.hidden = true;
refreshResetRecordingButton();
verifySession();
registerDropInSongs();
hydrateSongMenu();
loadSong(builtInSongs[0]);
