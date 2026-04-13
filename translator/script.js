const MORSE_MAP = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "'": ".----.",
  '"': ".-..-.",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  "_": "..--.-",
  "@": ".--.-.",
  $: "...-..-"
};

const REVERSE_MORSE_MAP = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([key, value]) => [value, key])
);

const REFERENCE_GROUPS = [
  {
    title: "Letters",
    note: "A-Z",
    symbols: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
  },
  {
    title: "Numbers",
    note: "0-9",
    symbols: [..."0123456789"]
  },
  {
    title: "Symbols",
    note: "Punctuation",
    symbols: [
      ".",
      ",",
      "?",
      "!",
      "'",
      '"',
      "/",
      "(",
      ")",
      "&",
      ":",
      ";",
      "=",
      "+",
      "-",
      "_",
      "@",
      "$"
    ]
  }
];

const inputText = document.querySelector("#inputText");
const outputText = document.querySelector("#outputText");
const inputLabel = document.querySelector("#inputLabel");
const outputLabel = document.querySelector("#outputLabel");
const inputMeta = document.querySelector("#inputMeta");
const statusText = document.querySelector("#statusText");
const translateBtn = document.querySelector("#translateBtn");
const saveBtn = document.querySelector("#saveBtn");
const modeButtons = [...document.querySelectorAll(".mode-chip")];
const swapBtn = document.querySelector("#swapBtn");
const copyBtn = document.querySelector("#copyBtn");
const playBtn = document.querySelector("#playBtn");
const clearBtn = document.querySelector("#clearBtn");
const referenceGrid = document.querySelector("#referenceGrid");
const historyList = document.querySelector("#historyList");
const historyEmpty = document.querySelector("#historyEmpty");
const historySearch = document.querySelector("#historySearch");
const filterButtons = [...document.querySelectorAll(".filter-btn")];
const sectionLinks = [...document.querySelectorAll('a[href^="#"]')];
const topNavLinks = [...document.querySelectorAll(".top-links a")];
const fabLink = document.querySelector(".fab");

let currentMode = "text-to-morse";
let activeAudioContext = null;
let historyFilter = "all";
let translationHistory = loadHistory();

renderReference();
renderHistory();
translate();

inputText.addEventListener("input", translate);
translateBtn.addEventListener("click", handleTranslateClick);
saveBtn.addEventListener("click", saveCurrentTranslation);
swapBtn.addEventListener("click", swapMode);
clearBtn.addEventListener("click", clearFields);
copyBtn.addEventListener("click", copyOutput);
playBtn.addEventListener("click", playOutputAsMorse);
historySearch.addEventListener("input", renderHistory);
historyList.addEventListener("click", handleHistoryAction);
fabLink.addEventListener("click", () => scrollToSection("referencePanel"));

for (const button of modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode));
}

for (const link of sectionLinks) {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href")?.slice(1);
    if (!id) {
      return;
    }

    event.preventDefault();
    setActiveTopNavLink(id);
    scrollToSection(id);
  });
}

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    historyFilter = button.dataset.filter;
    for (const item of filterButtons) {
      item.classList.toggle("is-active", item === button);
    }
    renderHistory();
  });
}

function setMode(mode) {
  if (mode === currentMode) {
    return;
  }

  currentMode = mode;
  for (const button of modeButtons) {
    button.classList.toggle("is-active", button.dataset.mode === currentMode);
  }

  if (currentMode === "text-to-morse") {
    inputLabel.textContent = "Plain Text";
    outputLabel.textContent = "Morse Code";
    inputMeta.textContent = "EN-US // UTF-8";
    inputText.placeholder = "Type a message like HELLO WORLD";
    outputText.placeholder = "- .... . / ... .. --. -. .- .-..";
  } else {
    inputLabel.textContent = "Morse Code";
    outputLabel.textContent = "Plain Text";
    inputMeta.textContent = "ITU // DOT-DASH";
    inputText.placeholder = "... --- ... / -- .- -.-- -.. .- -.--";
    outputText.placeholder = "SOS MAYDAY";
  }

  translate();
}

function swapMode() {
  const previousOutput = outputText.value;
  setMode(currentMode === "text-to-morse" ? "morse-to-text" : "text-to-morse");
  inputText.value = previousOutput;
  translate();
}

function clearFields() {
  inputText.value = "";
  translate();
}

async function copyOutput() {
  if (!outputText.value.trim()) {
    setStatus("There is no translated output to copy yet.", "error");
    return;
  }

  try {
    await copyText(outputText.value);
    setStatus("Output copied to clipboard.", "success");
  } catch (error) {
    setStatus("Clipboard access was blocked in this browser.", "error");
  }
}

function saveCurrentTranslation() {
  const source = inputText.value.trim();
  const output = outputText.value.trim();

  if (!source || !output) {
    setStatus("Translate a message before saving it to history.", "error");
    return;
  }

  const entry = {
    id: createId(),
    mode: currentMode,
    source,
    output,
    starred: false,
    createdAt: new Date().toISOString()
  };

  translationHistory = upsertHistoryEntry(entry);
  persistHistory();
  renderHistory();
  setStatus("Transmission saved to history.", "success");
  location.hash = "historyPanel";
}

function translate() {
  const source = inputText.value;

  if (!source.trim()) {
    outputText.value = "";
    setStatus("Ready to translate.", "default");
    playBtn.disabled = true;
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    return;
  }

  const result =
    currentMode === "text-to-morse"
      ? textToMorse(source)
      : morseToText(source);

  outputText.value = result.output;
  setStatus(result.message, result.status);
  playBtn.disabled = !result.output.trim() || currentMode !== "text-to-morse";
  copyBtn.disabled = !result.output.trim();
  saveBtn.disabled = !result.output.trim();
}

function textToMorse(text) {
  const warnings = [];
  const words = text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const encodedLetters = [];

      for (const char of word) {
        if (MORSE_MAP[char]) {
          encodedLetters.push(MORSE_MAP[char]);
        } else {
          warnings.push(char);
        }
      }

      return encodedLetters.join(" ");
    })
    .filter(Boolean);

  const output = words.join(" / ");

  if (!output) {
    return {
      output: "",
      message: "No supported characters were found in the input.",
      status: "error"
    };
  }

  if (warnings.length) {
    const unsupported = [...new Set(warnings)].join(" ");
    return {
      output,
      message: `Translated with skipped unsupported characters: ${unsupported}`,
      status: "error"
    };
  }

  return {
    output,
    message: "Text translated to Morse code.",
    status: "success"
  };
}

function morseToText(morse) {
  const normalized = morse.trim().replace(/\s*\/\s*/g, " / ");
  const words = normalized.split(" / ").filter(Boolean);
  const warnings = [];

  const decodedWords = words.map((word) => {
    const letters = word.split(/\s+/).filter(Boolean);

    return letters
      .map((letter) => {
        if (REVERSE_MORSE_MAP[letter]) {
          return REVERSE_MORSE_MAP[letter];
        }

        warnings.push(letter);
        return "";
      })
      .join("");
  });

  const output = decodedWords.filter(Boolean).join(" ");

  if (!output) {
    return {
      output: "",
      message: "No valid Morse symbols were found. Use dots, dashes, spaces, and /.",
      status: "error"
    };
  }

  if (warnings.length) {
    const invalid = [...new Set(warnings)].slice(0, 6).join(", ");
    return {
      output,
      message: `Decoded with unrecognized Morse groups skipped: ${invalid}`,
      status: "error"
    };
  }

  return {
    output,
    message: "Morse code translated to text.",
    status: "success"
  };
}

function setStatus(message, status) {
  statusText.textContent = message;
  statusText.classList.remove("is-error", "is-success");

  if (status === "error") {
    statusText.classList.add("is-error");
  } else if (status === "success") {
    statusText.classList.add("is-success");
  }
}

function renderReference() {
  referenceGrid.innerHTML = REFERENCE_GROUPS.map(
    (group) => `
      <section class="reference-section">
        <div class="reference-section-header">
          <h3>${group.title}</h3>
          <span>${group.note}</span>
        </div>
        <div class="reference-grid">
          ${group.symbols
            .map(
              (symbol) => `
                <article class="reference-item">
                  <strong>${escapeHtml(symbol)}</strong>
                  <span>${MORSE_MAP[symbol]}</span>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `
  ).join("");
}

async function playOutputAsMorse() {
  if (currentMode !== "text-to-morse" || !outputText.value.trim()) {
    return;
  }

  await playMorseValue(outputText.value);
}

async function playMorseValue(value) {
  if (!value.trim()) {
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setStatus("This browser does not support Morse playback.", "error");
      return;
    }

    if (!activeAudioContext) {
      activeAudioContext = new AudioContextClass();
    }

    if (activeAudioContext.state === "suspended") {
      await activeAudioContext.resume();
    }

    const unit = 0.085;
    let cursor = activeAudioContext.currentTime;

    for (const symbol of value) {
      if (symbol === ".") {
        playTone(cursor, unit);
        cursor += unit * 2;
      } else if (symbol === "-") {
        playTone(cursor, unit * 3);
        cursor += unit * 4;
      } else if (symbol === " ") {
        cursor += unit * 2;
      } else if (symbol === "/") {
        cursor += unit * 6;
      }
    }

    setStatus("Playing Morse audio.", "success");
  } catch (error) {
    setStatus("Playback could not be started.", "error");
  }
}

function playTone(startTime, duration) {
  const oscillator = activeAudioContext.createOscillator();
  const gainNode = activeAudioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 620;

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.18, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + duration
  );

  oscillator.connect(gainNode);
  gainNode.connect(activeAudioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function handleHistoryAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const entry = translationHistory.find((item) => item.id === button.dataset.id);
  if (!entry) {
    return;
  }

  const action = button.dataset.action;

  if (action === "toggle-star") {
    entry.starred = !entry.starred;
    persistHistory();
    renderHistory();
    return;
  }

  if (action === "copy") {
    copyText(entry.output)
      .then(() => setStatus("History entry copied to clipboard.", "success"))
      .catch(() => setStatus("Clipboard access was blocked in this browser.", "error"));
    return;
  }

  if (action === "delete") {
    translationHistory = translationHistory.filter((item) => item.id !== entry.id);
    persistHistory();
    renderHistory();
    setStatus("History entry deleted.", "success");
    return;
  }

  if (action === "play") {
    const playable = entry.mode === "text-to-morse" ? entry.output : textToMorse(entry.output).output;
    playMorseValue(playable);
    return;
  }
}

function renderHistory() {
  const searchTerm = historySearch.value.trim().toLowerCase();
  const filteredEntries = translationHistory.filter((entry) => {
    if (historyFilter === "starred" && !entry.starred) {
      return false;
    }

    if (
      historyFilter !== "all" &&
      historyFilter !== "starred" &&
      entry.mode !== historyFilter
    ) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    return `${entry.source} ${entry.output}`.toLowerCase().includes(searchTerm);
  });

  historyEmpty.classList.toggle("is-hidden", filteredEntries.length > 0);
  historyList.classList.toggle("is-hidden", filteredEntries.length === 0);

  historyList.innerHTML = filteredEntries
    .map(
      (entry) => `
        <article class="history-entry ${entry.starred ? "is-starred" : ""}">
          <div class="history-entry-main">
            <div class="history-entry-meta">
              <span class="history-date">${formatHistoryDate(entry.createdAt)}</span>
              <span class="history-mode">${entry.mode === "text-to-morse" ? "sent" : "decoded"}</span>
              ${entry.starred ? '<span class="material-symbols-outlined history-star">star</span>' : ""}
            </div>
            <p class="history-source">${escapeHtml(entry.source)}</p>
            <p class="history-output">${escapeHtml(entry.output)}</p>
          </div>
          <div class="history-actions">
            <button class="history-btn ${entry.starred ? "is-active" : ""}" data-action="toggle-star" data-id="${entry.id}" type="button" aria-label="Star entry">
              <span class="material-symbols-outlined">star</span>
            </button>
            <button class="history-btn play" data-action="play" data-id="${entry.id}" type="button" aria-label="Play history entry">
              <span class="material-symbols-outlined">play_arrow</span>
            </button>
            <button class="history-btn" data-action="copy" data-id="${entry.id}" type="button" aria-label="Copy history entry">
              <span class="material-symbols-outlined">content_copy</span>
            </button>
            <button class="history-btn delete" data-action="delete" data-id="${entry.id}" type="button" aria-label="Delete history entry">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function loadHistory() {
  try {
    const stored = localStorage.getItem("morse-translator-history");
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistHistory() {
  localStorage.setItem(
    "morse-translator-history",
    JSON.stringify(translationHistory)
  );
}

function upsertHistoryEntry(entry) {
  const existingIndex = translationHistory.findIndex(
    (item) =>
      item.mode === entry.mode &&
      item.source === entry.source &&
      item.output === entry.output
  );

  if (existingIndex >= 0) {
    const existing = translationHistory[existingIndex];
    const updated = {
      ...existing,
      createdAt: new Date().toISOString()
    };

    return [
      updated,
      ...translationHistory.filter((_, index) => index !== existingIndex)
    ].slice(0, 50);
  }

  return [entry, ...translationHistory].slice(0, 50);
}

function formatHistoryDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown timestamp";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

function handleTranslateClick() {
  translate();

  const source = inputText.value.trim();
  const output = outputText.value.trim();

  if (!source || !output) {
    return;
  }

  const entry = {
    id: createId(),
    mode: currentMode,
    source,
    output,
    starred: false,
    createdAt: new Date().toISOString()
  };

  translationHistory = upsertHistoryEntry(entry);
  persistHistory();
  renderHistory();
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  history.replaceState(null, "", `#${id}`);
  centerElementInViewport(getScrollAnchor(target), "smooth");
}

function getScrollAnchor(section) {
  return (
    section.querySelector("[data-scroll-anchor]") ||
    section.querySelector("h1, h2") ||
    section
  );
}

function centerElementInViewport(element, behavior) {
  const rect = element.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const elementCenter = absoluteTop + rect.height / 2;
  const viewportCenter = window.innerHeight / 2;
  const navOffset = Number(element.dataset.scrollShift || 10);
  const maxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0
  );
  const nextScroll = Math.min(
    Math.max(elementCenter - viewportCenter - navOffset, 0),
    maxScroll
  );

  window.scrollTo({ top: nextScroll, behavior });
}

function setActiveTopNavLink(id) {
  for (const link of topNavLinks) {
    const targetId = link.getAttribute("href")?.slice(1);
    link.classList.toggle("is-active", targetId === id);
  }
}
