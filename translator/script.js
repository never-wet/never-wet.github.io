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

const REFERENCE_SYMBOLS = [
  "A",
  "B",
  "C",
  "S",
  "O",
  "1",
  "2",
  "3",
  "0",
  ".",
  "?",
  "/"
];

const inputText = document.querySelector("#inputText");
const outputText = document.querySelector("#outputText");
const inputLabel = document.querySelector("#inputLabel");
const outputLabel = document.querySelector("#outputLabel");
const statusText = document.querySelector("#statusText");
const modeButtons = [...document.querySelectorAll(".mode-btn")];
const swapBtn = document.querySelector("#swapBtn");
const copyBtn = document.querySelector("#copyBtn");
const playBtn = document.querySelector("#playBtn");
const clearBtn = document.querySelector("#clearBtn");
const referenceGrid = document.querySelector("#referenceGrid");

let currentMode = "text-to-morse";
let activeAudioContext = null;

renderReference();
translate();

inputText.addEventListener("input", translate);
swapBtn.addEventListener("click", swapMode);
clearBtn.addEventListener("click", clearFields);
copyBtn.addEventListener("click", copyOutput);
playBtn.addEventListener("click", playOutputAsMorse);

for (const button of modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode));
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
    inputText.placeholder = "Type a message like HELLO WORLD";
    outputText.placeholder = ".... . .-.. .-.. --- / .-- --- .-. .-.. -..";
  } else {
    inputLabel.textContent = "Morse Code";
    outputLabel.textContent = "Plain Text";
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
    await navigator.clipboard.writeText(outputText.value);
    setStatus("Output copied to clipboard.", "success");
  } catch (error) {
    setStatus("Clipboard access was blocked in this browser.", "error");
  }
}

function translate() {
  const source = inputText.value;

  if (!source.trim()) {
    outputText.value = "";
    setStatus("Ready to translate.", "default");
    playBtn.disabled = true;
    copyBtn.disabled = true;
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
  referenceGrid.innerHTML = REFERENCE_SYMBOLS.map(
    (symbol) => `
      <article class="reference-item">
        <strong>${symbol}</strong>
        <span>${MORSE_MAP[symbol]}</span>
      </article>
    `
  ).join("");
}

async function playOutputAsMorse() {
  if (currentMode !== "text-to-morse" || !outputText.value.trim()) {
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

    for (const symbol of outputText.value) {
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
