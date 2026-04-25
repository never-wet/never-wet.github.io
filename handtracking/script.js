const videoElement = document.querySelector("#video");
const effectCanvas = document.querySelector("#effectCanvas");
const canvasElement = document.querySelector("#overlay");
const canvasCtx = canvasElement.getContext("2d");

const emptyState = document.querySelector("#emptyState");
const statusBadge = document.querySelector("#statusBadge");
const errorText = document.querySelector("#errorText");
const handCount = document.querySelector("#handCount");
const fpsValue = document.querySelector("#fpsValue");
const gestureValue = document.querySelector("#gestureValue");
const energyValue = document.querySelector("#energyValue");
const debugReason = document.querySelector("#debugReason");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const maxHandsControl = document.querySelector("#maxHands");
const confidenceControl = document.querySelector("#confidence");
const confidenceValue = document.querySelector("#confidenceValue");
const showSkeletonControl = document.querySelector("#showSkeleton");
const showPointsControl = document.querySelector("#showPoints");
const showEnergyControl = document.querySelector("#showEnergy");

const landmarkConnections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

const fingertipIndexes = new Set([4, 8, 12, 16, 20]);
const jointIndexes = new Set([2, 3, 6, 7, 10, 11, 14, 15, 18, 19]);

const redConfig = {
  trigger: 0.7,
  release: 0.5,
  confirmFrames: 3,
  releaseFrames: 6,
};

const purpleConfig = {
  trigger: 0.7,
  release: 0.5,
  confirmFrames: 3,
  releaseFrames: 7,
};

const shrineConfig = {
  trigger: 0.7,
  release: 0.55,
  confirmFrames: 3,
  releaseFrames: 7,
};

const redGesture = createGestureTracker("red");
const purpleGesture = createGestureTracker("purple");
const shrineGesture = createGestureTracker("shrine");
const particles = [];
const particleBudget = getParticleBudget();
const threeParticleBudget = Math.min(particleBudget + 500, 2800);

let hands;
let renderFrameId = null;
let detectionFrameId = null;
let detectionFrameSource = null;
let stream = null;
let isTracking = false;
let isModelReady = false;
let isSendingFrame = false;
let latestHands = [];
let latestDebug = "No gesture";
let lastDetectionTime = performance.now();
let lastEffectTime = performance.now();
let smoothedDetectionFps = 0;
let threeEffects = null;

function createGestureTracker(kind) {
  return {
    kind,
    active: false,
    confidence: 0,
    rawScore: 0,
    stableFrames: 0,
    releaseFrames: 0,
    energy: 0,
    reason: "No gesture",
    target: { x: 0, y: 0 },
    indexContact: { x: 0, y: 0 },
    pinkyContact: { x: 0, y: 0 },
    details: {},
  };
}

function setStatus(message) {
  statusBadge.textContent = message;
}

function setError(message = "") {
  errorText.textContent = message;
}

function getConfidence() {
  return Number(confidenceControl.value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

function normalize(vector, fallback = { x: 1, y: 0 }) {
  const length = Math.hypot(vector.x, vector.y);

  if (length < 0.00001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function averagePoints(...points) {
  return points.reduce(
    (total, point) => ({
      x: total.x + point.x / points.length,
      y: total.y + point.y / points.length,
      z: total.z + (point.z ?? 0) / points.length,
    }),
    { x: 0, y: 0, z: 0 },
  );
}

function orientation(a, b, c) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  return o1 * o2 < 0 && o3 * o4 < 0;
}

function lineIntersection(a, b, c, d) {
  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);

  if (Math.abs(denominator) < 0.00001) {
    return null;
  }

  const aCross = a.x * b.y - a.y * b.x;
  const cCross = c.x * d.y - c.y * d.x;

  return {
    x: (aCross * (c.x - d.x) - (a.x - b.x) * cCross) / denominator,
    y: (aCross * (c.y - d.y) - (a.y - b.y) * cCross) / denominator,
  };
}

function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distance(point, start);
  }

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  const projection = {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };

  return distance(point, projection);
}

function angleBetweenSegments(a, b, c, d) {
  const ab = subtract(b, a);
  const cd = subtract(d, c);
  const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cd.x, cd.y);

  if (denominator === 0) {
    return 0;
  }

  const cosine = clamp(dot(ab, cd) / denominator, -1, 1);
  const rawAngle = (Math.acos(cosine) * 180) / Math.PI;

  return Math.min(rawAngle, 180 - rawAngle);
}

function scoreFromRange(value, min, max) {
  return clamp((value - min) / (max - min), 0, 1);
}

function inverseScoreFromRange(value, min, max) {
  return 1 - scoreFromRange(value, min, max);
}

function fingerExtensionScore(wrist, mcp, pip, tip) {
  const lengthScore = clamp((distance(tip, mcp) / Math.max(distance(pip, mcp), 0.001) - 1.08) / 0.58, 0, 1);
  const reachScore = clamp((distance(tip, wrist) / Math.max(distance(pip, wrist), 0.001) - 1.02) / 0.34, 0, 1);
  const curlPenalty = clamp((distance(tip, pip) / Math.max(distance(mcp, pip), 0.001) - 0.78) / 0.5, 0, 1);

  return (lengthScore * 0.42 + reachScore * 0.35 + curlPenalty * 0.23);
}

function fingerFoldScore(wrist, mcp, pip, tip) {
  const palmPoint = averagePoints(wrist, mcp);
  const foldByMcp = inverseScoreFromRange(distance(tip, mcp) / Math.max(distance(pip, mcp), 0.001), 1.08, 1.72);
  const foldByWrist = inverseScoreFromRange(distance(tip, wrist) / Math.max(distance(pip, wrist), 0.001), 0.98, 1.42);
  const tipToPalm = inverseScoreFromRange(distance(tip, palmPoint) / Math.max(distance(wrist, mcp), 0.001), 0.65, 1.9);

  return clamp(foldByMcp * 0.52 + foldByWrist * 0.32 + tipToPalm * 0.16, 0, 1);
}

function palmCenter(landmarks) {
  return averagePoints(landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]);
}

function palmScale(landmarks) {
  return Math.max(
    distance(landmarks[0], landmarks[9]),
    distance(landmarks[5], landmarks[17]),
    distance(landmarks[5], landmarks[9]) * 2.4,
    0.001,
  );
}

function resizeCanvas() {
  const { width, height } = canvasElement.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const displayWidth = Math.round(width * pixelRatio);
  const displayHeight = Math.round(height * pixelRatio);

  if (canvasElement.width !== displayWidth || canvasElement.height !== displayHeight) {
    canvasElement.width = displayWidth;
    canvasElement.height = displayHeight;
  }

  canvasCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function initHands() {
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: Number(maxHandsControl.value),
    modelComplexity: 0,
    minDetectionConfidence: getConfidence(),
    minTrackingConfidence: getConfidence(),
  });

  hands.onResults((results) => {
    if (!isTracking) {
      return;
    }

    handleHandResults(results);
  });
}

async function updateHandsOptions() {
  if (!hands) {
    return;
  }

  await hands.setOptions({
    maxNumHands: Number(maxHandsControl.value),
    modelComplexity: 0,
    minDetectionConfidence: getConfidence(),
    minTrackingConfidence: getConfidence(),
  });
}

function getVideoRect(width, height) {
  const videoWidth = videoElement.videoWidth || 16;
  const videoHeight = videoElement.videoHeight || 9;
  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = width / height;

  if (canvasAspect > videoAspect) {
    const drawHeight = height;
    const drawWidth = drawHeight * videoAspect;

    return {
      x: (width - drawWidth) / 2,
      y: 0,
      width: drawWidth,
      height: drawHeight,
    };
  }

  const drawWidth = width;
  const drawHeight = drawWidth / videoAspect;

  return {
    x: 0,
    y: (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
}

function pointToCanvas(landmark, rect) {
  return {
    x: rect.x + landmark.x * rect.width,
    y: rect.y + landmark.y * rect.height,
  };
}

function normalizeHandedness(handedness, index) {
  const classification = handedness?.classification?.[0] ?? handedness?.[0] ?? handedness ?? {};
  const label = classification.label ?? classification.displayName ?? `Hand ${index + 1}`;
  const score = Number.isFinite(classification.score) ? classification.score : 1;

  return {
    label,
    score: clamp(score, 0, 1),
  };
}

function buildHandData(results) {
  const landmarksList = results?.multiHandLandmarks ?? [];
  const handednessList = results?.multiHandedness ?? [];

  return landmarksList.map((landmarks, index) => {
    const handedness = normalizeHandedness(handednessList[index], index);

    return {
      index,
      landmarks,
      label: handedness.label,
      score: handedness.score,
      palm: palmCenter(landmarks),
      scale: palmScale(landmarks),
    };
  });
}

function detectBestRedGesture(handsData, rect) {
  if (handsData.length === 0) {
    return detectionResult(0, null, "Need one visible hand");
  }

  let best = null;

  for (const hand of handsData) {
    const candidate = detectRedOneFingerForHand(hand, rect);

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best ?? detectionResult(0, null, "Need one visible hand");
}

function detectRedOneFingerForHand(hand, rect) {
  const landmarks = hand.landmarks;
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];
  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];
  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];
  const scale = hand.scale;
  const indexExtended = fingerExtensionScore(wrist, indexMcp, indexPip, indexTip);
  const middleFolded = fingerFoldScore(wrist, middleMcp, middlePip, middleTip);
  const ringFolded = fingerFoldScore(wrist, ringMcp, ringPip, ringTip);
  const pinkyFolded = fingerFoldScore(wrist, pinkyMcp, pinkyPip, pinkyTip);
  const foldedScore = Math.min(middleFolded, ringFolded, pinkyFolded);
  const indexSeparation = Math.min(
    distance(indexTip, middleTip),
    distance(indexTip, ringTip),
    distance(indexTip, pinkyTip),
  ) / scale;
  const separationScore = scoreFromRange(indexSeparation, 0.34, 1.05);
  const trackingScore = scoreFromRange(hand.score, 0.55, 0.88);
  const thumbTip = landmarks[4];
  const thumbNeutralScore = inverseScoreFromRange(distance(thumbTip, indexTip) / scale, 0.08, 0.72);

  const score =
    indexExtended * 0.38 +
    middleFolded * 0.2 +
    ringFolded * 0.16 +
    pinkyFolded * 0.16 +
    separationScore * 0.05 +
    trackingScore * 0.04 +
    thumbNeutralScore * 0.01;

  const clearOneFinger =
    hand.score >= 0.58 &&
    indexExtended >= 0.58 &&
    foldedScore >= 0.42 &&
    middleFolded >= 0.45 &&
    separationScore >= 0.22;
  const normalizedPoint = averagePoints(indexTip, indexPip);
  const canvasPoint = pointToCanvas(normalizedPoint, rect);
  const reason = redFailureReason({
    hand,
    indexExtended,
    middleFolded,
    ringFolded,
    pinkyFolded,
    foldedScore,
    separationScore,
    clearOneFinger,
  });

  return detectionResult(clearOneFinger ? score : Math.min(score, 0.69), canvasPoint, reason);
}

function redFailureReason(metrics) {
  if (metrics.hand.score < 0.58) {
    return "Hand confidence is low";
  }

  if (metrics.indexExtended < 0.58) {
    return "Stretch one finger for Red";
  }

  if (metrics.middleFolded < 0.45 || metrics.foldedScore < 0.42) {
    return "Fold the other fingers for Red";
  }

  if (metrics.separationScore < 0.22) {
    return "Keep only one finger clearly extended";
  }

  return metrics.clearOneFinger ? "Red one-finger pose detected" : "Need a clearer Red pose";
}

function detectPurpleEnergyPose(handsData, rect) {
  if (handsData.length === 0) {
    return detectionResult(0, null, "Need one visible hand");
  }

  let best = null;

  for (const hand of handsData) {
    const candidate = detectPurpleEnergyForHand(hand, rect);

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best ?? detectionResult(0, null, "Need one visible hand");
}

function detectPurpleEnergyForHand(hand, rect) {
  const landmarks = hand.landmarks;
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];
  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];
  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];
  const scale = hand.scale;
  const palmAxis = normalize(subtract(pinkyMcp, indexMcp));
  const baseOrder = dot(subtract(indexPip, middlePip), palmAxis) / scale;
  const tipOrder = dot(subtract(indexTip, middleTip), palmAxis) / scale;
  const orderPreserved = baseOrder * tipOrder > 0;
  const pathsCross = segmentsIntersect(indexPip, indexTip, middlePip, middleTip);
  const indexExtended = fingerExtensionScore(wrist, indexMcp, indexPip, indexTip);
  const middleExtended = fingerExtensionScore(wrist, middleMcp, middlePip, middleTip);
  const ringFolded = fingerFoldScore(wrist, ringMcp, ringPip, ringTip);
  const pinkyFolded = fingerFoldScore(wrist, pinkyMcp, pinkyPip, pinkyTip);
  const twoFingerScore = Math.min(indexExtended, middleExtended);
  const fistScore = Math.min(ringFolded, pinkyFolded);
  const crossingAngle = angleBetweenSegments(indexPip, indexTip, middlePip, middleTip);
  const parallelScore = inverseScoreFromRange(crossingAngle, 8, 42);
  const separation = distance(indexTip, middleTip) / scale;
  const separationScore = separation < 0.12 || separation > 0.92 ? 0 : separation < 0.34
    ? scoreFromRange(separation, 0.12, 0.34)
    : inverseScoreFromRange(separation, 0.34, 0.92);
  const noCrossScore = pathsCross || !orderPreserved ? 0 : 1;
  const trackingScore = scoreFromRange(hand.score, 0.55, 0.88);
  const thumbTip = landmarks[4];
  const thumbFoldScore = inverseScoreFromRange(distance(thumbTip, indexMcp) / scale, 0.25, 1.08);

  const score =
    twoFingerScore * 0.34 +
    fistScore * 0.29 +
    noCrossScore * 0.12 +
    separationScore * 0.08 +
    parallelScore * 0.07 +
    trackingScore * 0.07 +
    thumbFoldScore * 0.03;

  const clearPose =
    hand.score >= 0.58 &&
    twoFingerScore >= 0.58 &&
    fistScore >= 0.4 &&
    noCrossScore >= 1 &&
    separationScore >= 0.25 &&
    parallelScore >= 0.18;
  const focalSource = averagePoints(indexTip, middleTip, indexPip, middlePip);
  const canvasPoint = pointToCanvas(focalSource, rect);
  canvasPoint.y -= clamp(scale * rect.height * 0.48, 34, 112);
  const reason = purplePoseFailureReason({
    hand,
    twoFingerScore,
    fistScore,
    noCrossScore,
    separationScore,
    parallelScore,
    clearPose,
  });

  return detectionResult(clearPose ? score : Math.min(score, 0.69), canvasPoint, reason);
}

function purplePoseFailureReason(metrics) {
  if (metrics.hand.score < 0.58) {
    return "Hand confidence is low";
  }

  if (metrics.twoFingerScore < 0.58) {
    return "Stretch index and middle fingers";
  }

  if (metrics.fistScore < 0.4) {
    return "Fold ring and pinky into a fist";
  }

  if (metrics.noCrossScore < 1) {
    return "Keep index and middle uncrossed";
  }

  if (metrics.separationScore < 0.25) {
    return "Separate the two stretched fingers";
  }

  if (metrics.parallelScore < 0.18) {
    return "Hold index and middle in the same direction";
  }

  return metrics.clearPose ? "Two-finger purple pose detected" : "Need a clearer two-finger pose";
}

function detectShrineGesture(handsData, rect) {
  if (handsData.length < 2) {
    return detectionResult(0, null, "Need both hands", {
      bothHands: false,
      indexContact: false,
      pinkyContact: false,
    });
  }

  const left = handsData.find((hand) => hand.label === "Left");
  const right = handsData.find((hand) => hand.label === "Right");

  if (!left || !right) {
    return detectionResult(0.18, null, "Need left and right hands", {
      bothHands: false,
      indexContact: false,
      pinkyContact: false,
    });
  }

  const scale = Math.max((distance(left.landmarks[0], left.landmarks[9]) + distance(right.landmarks[0], right.landmarks[9])) * 0.5, 0.001);
  const leftIndexTip = left.landmarks[8];
  const rightIndexTip = right.landmarks[8];
  const leftPinkyTip = left.landmarks[20];
  const rightPinkyTip = right.landmarks[20];
  const indexContactPoint = averagePoints(leftIndexTip, rightIndexTip);
  const pinkyContactPoint = averagePoints(leftPinkyTip, rightPinkyTip);
  const indexDistance = distance(leftIndexTip, rightIndexTip) / scale;
  const pinkyDistance = distance(leftPinkyTip, rightPinkyTip) / scale;
  const wristDistance = distance(left.landmarks[0], right.landmarks[0]) / scale;
  const contactSpan = distance(indexContactPoint, pinkyContactPoint) / scale;
  const indexContactScore = inverseScoreFromRange(indexDistance, 0.08, 0.34);
  const pinkyContactScore = inverseScoreFromRange(pinkyDistance, 0.08, 0.34);
  const wristWideScore = Math.min(scoreFromRange(wristDistance, 1.05, 1.85), inverseScoreFromRange(wristDistance, 3.35, 4.75));
  const frameSpanScore = Math.min(scoreFromRange(contactSpan, 0.48, 1.25), inverseScoreFromRange(contactSpan, 2.2, 3.15));
  const facingScore = Math.min(handFacingCameraScore(left), handFacingCameraScore(right));
  const trackingScore = Math.min(scoreFromRange(left.score, 0.6, 0.9), scoreFromRange(right.score, 0.6, 0.9));
  const heightOffset = Math.abs(left.landmarks[0].y - right.landmarks[0].y) / scale;
  const wristAlignmentScore = inverseScoreFromRange(heightOffset, 0.18, 0.95);
  const indexContact = indexContactScore >= 0.52;
  const pinkyContact = pinkyContactScore >= 0.52;
  const bothHands = left.score >= 0.6 && right.score >= 0.6;

  const score =
    trackingScore * 0.12 +
    indexContactScore * 0.24 +
    pinkyContactScore * 0.24 +
    wristWideScore * 0.14 +
    frameSpanScore * 0.1 +
    facingScore * 0.1 +
    wristAlignmentScore * 0.06;
  const clearShrine =
    bothHands &&
    indexContact &&
    pinkyContact &&
    wristWideScore >= 0.42 &&
    frameSpanScore >= 0.34 &&
    facingScore >= 0.32 &&
    score >= 0.62;
  const focalSource = averagePoints(indexContactPoint, pinkyContactPoint, left.palm, right.palm);
  const canvasPoint = pointToCanvas(focalSource, rect);
  canvasPoint.y -= clamp(scale * rect.height * 0.2, 18, 70);
  const details = {
    bothHands,
    indexContact,
    pinkyContact,
    indexPercent: Math.round(indexContactScore * 100),
    pinkyPercent: Math.round(pinkyContactScore * 100),
    widePercent: Math.round(wristWideScore * 100),
    facingPercent: Math.round(facingScore * 100),
    indexContactPoint: pointToCanvas(indexContactPoint, rect),
    pinkyContactPoint: pointToCanvas(pinkyContactPoint, rect),
  };
  const reason = shrineFailureReason({
    bothHands,
    indexContact,
    pinkyContact,
    wristWideScore,
    frameSpanScore,
    facingScore,
    trackingScore,
    clearShrine,
  });

  return detectionResult(clearShrine ? score : Math.min(score, 0.74), canvasPoint, reason, details);
}

function handFacingCameraScore(hand) {
  const palmWidth = distance(hand.landmarks[5], hand.landmarks[17]) / hand.scale;
  const palmDepth = Math.abs((hand.landmarks[9].z ?? 0) - (hand.landmarks[0].z ?? 0));
  const widthScore = scoreFromRange(palmWidth, 0.38, 0.72);
  const depthScore = inverseScoreFromRange(palmDepth, 0.03, 0.24);

  return clamp(widthScore * 0.58 + depthScore * 0.42, 0, 1);
}

function shrineFailureReason(metrics) {
  if (!metrics.bothHands || metrics.trackingScore < 0.35) {
    return "Need both hands";
  }

  if (!metrics.indexContact) {
    return "Touch both index fingertips";
  }

  if (!metrics.pinkyContact) {
    return "Touch both pinky fingertips";
  }

  if (metrics.wristWideScore < 0.42) {
    return "Separate wrists into a wider frame";
  }

  if (metrics.frameSpanScore < 0.34) {
    return "Make the hand sign wider";
  }

  if (metrics.facingScore < 0.32) {
    return "Face both hands toward the camera";
  }

  return metrics.clearShrine ? "Shrine Domain gesture detected" : "Need a clearer Shrine gesture";
}

function shrineDebugText(details, reason) {
  const bothHands = details.bothHands ? "yes" : "no";
  const indexContact = details.indexContact ? "yes" : "no";
  const pinkyContact = details.pinkyContact ? "yes" : "no";

  return `Both hands: ${bothHands} | Index contact: ${indexContact} | Pinky contact: ${pinkyContact} | ${reason}`;
}

function detectionResult(score, point, reason, details = {}) {
  return {
    score: clamp(score, 0, 1),
    point,
    reason,
    details,
  };
}

function updateGestureTracker(tracker, detection, config) {
  const score = detection.score;
  const smoothing = score >= tracker.confidence ? 0.5 : 0.28;

  tracker.rawScore = score;
  tracker.confidence = lerp(tracker.confidence, score, smoothing);
  tracker.reason = detection.reason;
  tracker.details = detection.details ?? {};

  if (detection.point && score >= config.release * 0.85) {
    const targetSmoothing = tracker.energy > 0.12 ? 0.32 : 1;
    tracker.target.x = lerp(tracker.target.x, detection.point.x, targetSmoothing);
    tracker.target.y = lerp(tracker.target.y, detection.point.y, targetSmoothing);
  }

  if (detection.details?.indexContactPoint) {
    tracker.indexContact.x = lerp(tracker.indexContact.x, detection.details.indexContactPoint.x, tracker.energy > 0.12 ? 0.36 : 1);
    tracker.indexContact.y = lerp(tracker.indexContact.y, detection.details.indexContactPoint.y, tracker.energy > 0.12 ? 0.36 : 1);
  }

  if (detection.details?.pinkyContactPoint) {
    tracker.pinkyContact.x = lerp(tracker.pinkyContact.x, detection.details.pinkyContactPoint.x, tracker.energy > 0.12 ? 0.36 : 1);
    tracker.pinkyContact.y = lerp(tracker.pinkyContact.y, detection.details.pinkyContactPoint.y, tracker.energy > 0.12 ? 0.36 : 1);
  }

  if (score >= config.trigger) {
    tracker.stableFrames += 1;
    tracker.releaseFrames = 0;
  } else if (!tracker.active) {
    tracker.stableFrames = Math.max(0, tracker.stableFrames - 1);
  }

  if (!tracker.active && tracker.stableFrames >= config.confirmFrames) {
    tracker.active = true;
    tracker.releaseFrames = 0;
  }

  if (tracker.active) {
    if (tracker.confidence < config.release || score < config.release * 0.72) {
      tracker.releaseFrames += 1;
    } else {
      tracker.releaseFrames = 0;
    }

    if (tracker.releaseFrames >= config.releaseFrames) {
      tracker.active = false;
      tracker.stableFrames = 0;
    }
  }
}

function handleHandResults(results) {
  const now = performance.now();
  const delta = now - lastDetectionTime;
  lastDetectionTime = now;

  if (delta > 0) {
    const instantFps = 1000 / delta;
    smoothedDetectionFps = smoothedDetectionFps === 0 ? instantFps : smoothedDetectionFps * 0.88 + instantFps * 0.12;
    fpsValue.textContent = String(Math.round(smoothedDetectionFps));
  }

  const width = canvasElement.clientWidth;
  const height = canvasElement.clientHeight;
  const videoRect = getVideoRect(width, height);
  latestHands = buildHandData(results);

  handCount.textContent = String(latestHands.length);

  const redDetection = detectBestRedGesture(latestHands, videoRect);
  const purpleDetection = detectPurpleEnergyPose(latestHands, videoRect);
  const shrineDetection = detectShrineGesture(latestHands, videoRect);

  updateGestureTracker(redGesture, redDetection, redConfig);
  updateGestureTracker(purpleGesture, purpleDetection, purpleConfig);
  updateGestureTracker(shrineGesture, shrineDetection, shrineConfig);
  updateGestureDebug(redDetection, purpleDetection, shrineDetection);
}

function updateGestureDebug(redDetection, purpleDetection, shrineDetection) {
  const redPercent = Math.round(Math.max(redGesture.confidence, redDetection.score) * 100);
  const purplePercent = Math.round(Math.max(purpleGesture.confidence, purpleDetection.score) * 100);
  const shrinePercent = Math.round(Math.max(shrineGesture.confidence, shrineDetection.score) * 100);
  const shrineIsPrimary =
    shrineGesture.active ||
    shrineGesture.stableFrames > 0 ||
    shrineDetection.score > Math.max(redDetection.score, purpleDetection.score, 0.32);
  const purpleIsPrimary =
    purpleGesture.active ||
    purpleGesture.stableFrames > 0 ||
    purpleDetection.score > Math.max(redDetection.score, 0.32);
  const redIsPrimary = redGesture.active || redGesture.stableFrames > 0 || redDetection.score > 0.32;

  gestureValue.classList.toggle("is-shrine", shrineIsPrimary && shrineGesture.confidence > 0.18);
  gestureValue.classList.toggle("is-purple", !shrineIsPrimary && purpleIsPrimary && purpleGesture.confidence > 0.18);
  gestureValue.classList.toggle("is-active", redGesture.active || purpleGesture.active || shrineGesture.active);

  if (shrineIsPrimary) {
    gestureValue.textContent = `Shrine Gesture: ${shrinePercent}%`;
    latestDebug = shrineDebugText(shrineGesture.details ?? shrineDetection.details, shrineGesture.active || shrineGesture.stableFrames > 0 ? shrineGesture.reason : shrineDetection.reason);
  } else if (purpleIsPrimary) {
    gestureValue.textContent = `Purple Energy: ${purplePercent}%`;
    latestDebug = purpleGesture.active || purpleGesture.stableFrames > 0 ? purpleGesture.reason : purpleDetection.reason;
  } else if (redIsPrimary) {
    gestureValue.textContent = `Red: ${redPercent}%`;
    latestDebug = redGesture.active || redGesture.stableFrames > 0 ? redGesture.reason : redDetection.reason;
  } else {
    gestureValue.textContent = "No gesture";
    latestDebug = latestHands.length >= 2
      ? shrineDebugText(shrineDetection.details, shrineDetection.reason)
      : purpleDetection.reason !== "Need one visible hand" && latestHands.length >= 1
        ? purpleDetection.reason
        : redDetection.reason;
  }

  debugReason.textContent = latestDebug;

  if (isTracking) {
    setStatus(redGesture.active || purpleGesture.active || shrineGesture.active ? activeStatusLabel() : latestDebug);
  }
}

function activeStatusLabel() {
  if (shrineGesture.active) {
    return "Shrine Domain expanding";
  }

  if (purpleGesture.active && purpleGesture.energy >= redGesture.energy * 0.75) {
    return "Purple energy charging";
  }

  if (redGesture.active) {
    return "Red one-finger effect";
  }

  return "Gesture detected";
}

function updateEnergyLevel() {
  const redTarget = redGesture.active && showEnergyControl.checked ? redGesture.confidence : 0;
  const purpleTarget = purpleGesture.active && showEnergyControl.checked ? purpleGesture.confidence : 0;
  const shrineTarget = shrineGesture.active && showEnergyControl.checked ? shrineGesture.confidence : 0;

  redGesture.energy += (redTarget - redGesture.energy) * (redTarget > redGesture.energy ? 0.22 : 0.075);
  purpleGesture.energy += (purpleTarget - purpleGesture.energy) * (purpleTarget > purpleGesture.energy ? 0.18 : 0.07);
  shrineGesture.energy += (shrineTarget - shrineGesture.energy) * (shrineTarget > shrineGesture.energy ? 0.24 : 0.065);
  redGesture.energy = clamp(redGesture.energy, 0, 1);
  purpleGesture.energy = clamp(purpleGesture.energy, 0, 1);
  shrineGesture.energy = clamp(shrineGesture.energy, 0, 1);

  const shrineDominant = shrineGesture.energy > 0.05 && shrineGesture.energy >= Math.max(redGesture.energy, purpleGesture.energy) * 0.72;
  const purpleDominant = purpleGesture.energy > 0.05 && purpleGesture.energy >= redGesture.energy * 0.82;
  const activeEnergy = Math.max(redGesture.energy, purpleGesture.energy, shrineGesture.energy);

  energyValue.textContent = `${Math.round(activeEnergy * 100)}%`;
  energyValue.classList.toggle("is-active", activeEnergy > 0.12);
  energyValue.classList.toggle("is-shrine", shrineDominant);
  energyValue.classList.toggle("is-purple", !shrineDominant && purpleDominant);
}

function getParticleBudget() {
  const deviceMemory = navigator.deviceMemory ?? 4;
  const pixelCount = window.innerWidth * window.innerHeight;

  if (deviceMemory <= 2 || pixelCount < 550000) {
    return 1050;
  }

  if (deviceMemory <= 4 || pixelCount < 1200000) {
    return 1650;
  }

  return 2400;
}

function initThreeEffects() {
  if (threeEffects || !window.THREE || !effectCanvas) {
    return threeEffects;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas: effectCanvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(threeParticleBudget * 3);
  const particleColors = new Float32Array(threeParticleBudget * 3);
  const particleMaterial = new THREE.PointsMaterial({
    size: 4.6,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  const particleState = [];

  for (let index = 0; index < threeParticleBudget; index += 1) {
    particlePositions[index * 3] = 99999;
    particlePositions[index * 3 + 1] = 99999;
    particlePositions[index * 3 + 2] = 0;
    particleState.push(createThreeParticle());
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
  scene.add(particlePoints);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x050001, transparent: true, opacity: 0, depthWrite: false }),
  );
  backdrop.position.z = -50;
  scene.add(backdrop);

  const glowTextures = {
    red: createRadialTexture(["rgba(255,245,220,1)", "rgba(255,44,42,0.58)", "rgba(88,0,10,0)"]),
    purple: createRadialTexture(["rgba(245,255,255,1)", "rgba(178,65,255,0.68)", "rgba(28,0,85,0)"]),
    shrine: createRadialTexture(["rgba(255,226,175,1)", "rgba(255,30,34,0.62)", "rgba(10,0,0,0)"]),
  };
  const beamTexture = createBeamTexture();
  const glyphTexture = createGlyphTexture();
  const auraSprite = createGlowSprite(glowTextures.shrine, 0.72);
  const coreSprite = createGlowSprite(glowTextures.shrine, 0.9);
  const beamSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: beamTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const contactSprites = [createGlowSprite(glowTextures.shrine, 0.85), createGlowSprite(glowTextures.shrine, 0.85)];
  const glyphSprites = [];
  const ringGroup = new THREE.Group();
  const rings = [];

  for (let index = 0; index < 7; index += 1) {
    const line = createRingLine(160);
    ringGroup.add(line);
    rings.push(line);
  }

  const slashGeometry = new THREE.BufferGeometry();
  const slashPositions = new Float32Array(24 * 2 * 3);
  slashGeometry.setAttribute("position", new THREE.BufferAttribute(slashPositions, 3));
  const slashLines = new THREE.LineSegments(
    slashGeometry,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  const shrineGroup = createShrineModel();

  beamSprite.visible = false;
  beamSprite.position.z = 2.5;

  for (let index = 0; index < 18; index += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glyphTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    sprite.visible = false;
    sprite.userData.seed = index * 1.731 + 0.47;
    sprite.position.z = 3;
    glyphSprites.push(sprite);
    scene.add(sprite);
  }

  scene.add(auraSprite, coreSprite, beamSprite, contactSprites[0], contactSprites[1], ringGroup, slashLines, shrineGroup);

  threeEffects = {
    renderer,
    scene,
    camera,
    width: 1,
    height: 1,
    particleState,
    particlePositions,
    particleColors,
    particleGeometry,
    particleMaterial,
    glowTextures,
    beamTexture,
    glyphTexture,
    auraSprite,
    coreSprite,
    beamSprite,
    contactSprites,
    glyphSprites,
    ringGroup,
    rings,
    slashLines,
    slashPositions,
    shrineGroup,
    backdrop,
  };

  renderer.setClearColor(0x000000, 0);

  return threeEffects;
}

function createThreeParticle() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    alpha: 0,
    heat: Math.random(),
    age: 0,
    life: 0,
    orbit: Math.random() * Math.PI * 2,
    orbitSpeed: 0,
    radius: 0,
    mode: "none",
  };
}

function createRadialTexture(stops) {
  const size = 128;
  const textureCanvas = document.createElement("canvas");
  const context = textureCanvas.getContext("2d");
  const center = size / 2;

  textureCanvas.width = size;
  textureCanvas.height = size;

  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, stops[0]);
  gradient.addColorStop(0.36, stops[1]);
  gradient.addColorStop(1, stops[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;

  return texture;
}

function createBeamTexture() {
  const textureCanvas = document.createElement("canvas");
  const context = textureCanvas.getContext("2d");
  const width = 512;
  const height = 128;

  textureCanvas.width = width;
  textureCanvas.height = height;

  const horizontal = context.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, "rgba(35,0,72,0)");
  horizontal.addColorStop(0.12, "rgba(102,28,210,0.35)");
  horizontal.addColorStop(0.5, "rgba(240,235,255,0.96)");
  horizontal.addColorStop(0.82, "rgba(132,34,255,0.58)");
  horizontal.addColorStop(1, "rgba(20,0,48,0)");
  context.fillStyle = horizontal;
  context.fillRect(0, 0, width, height);

  const vertical = context.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "rgba(0,0,0,0)");
  vertical.addColorStop(0.38, "rgba(255,255,255,0.88)");
  vertical.addColorStop(0.5, "rgba(255,255,255,1)");
  vertical.addColorStop(0.62, "rgba(255,255,255,0.88)");
  vertical.addColorStop(1, "rgba(0,0,0,0)");
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = vertical;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;

  return texture;
}

function createGlyphTexture() {
  const textureCanvas = document.createElement("canvas");
  const context = textureCanvas.getContext("2d");
  const width = 64;
  const height = 128;

  textureCanvas.width = width;
  textureCanvas.height = height;
  context.strokeStyle = "rgba(255,55,58,0.95)";
  context.fillStyle = "rgba(20,0,0,0.38)";
  context.lineWidth = 3;
  context.fillRect(18, 4, 28, 120);
  context.strokeRect(18, 4, 28, 120);

  for (let mark = 0; mark < 6; mark += 1) {
    const y = 20 + mark * 15;

    context.beginPath();
    context.moveTo(25, y);
    context.lineTo(39, y + (mark % 2 === 0 ? 8 : -6));
    context.moveTo(30, y + 4);
    context.lineTo(36, y + 12);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;

  return texture;
}

function createGlowSprite(texture, opacity) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  sprite.visible = false;
  sprite.position.z = -3;

  return sprite;
}

function createRingLine(segments) {
  const points = [];

  for (let index = 0; index <= segments; index += 1) {
    const angle = index * ((Math.PI * 2) / segments);
    points.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
  }

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: 0xff2633,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  line.visible = false;

  return line;
}

function createShrineModel() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();

  shape.moveTo(-0.58, -0.12);
  shape.lineTo(-0.38, 0.26);
  shape.lineTo(-0.14, 0.48);
  shape.lineTo(0, 0.58);
  shape.lineTo(0.14, 0.48);
  shape.lineTo(0.38, 0.26);
  shape.lineTo(0.58, -0.12);
  shape.lineTo(0.4, -0.04);
  shape.lineTo(0.32, -0.54);
  shape.lineTo(-0.32, -0.54);
  shape.lineTo(-0.4, -0.04);
  shape.lineTo(-0.58, -0.12);

  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: 0x030000, transparent: true, opacity: 0, depthWrite: false }),
  );
  const outlinePoints = [
    [-0.58, -0.12],
    [-0.38, 0.26],
    [-0.14, 0.48],
    [0, 0.58],
    [0.14, 0.48],
    [0.38, 0.26],
    [0.58, -0.12],
    [0.4, -0.04],
    [0.32, -0.54],
    [-0.32, -0.54],
    [-0.4, -0.04],
    [-0.58, -0.12],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0.02));
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePoints),
    new THREE.LineBasicMaterial({
      color: 0xff2633,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  group.add(mesh, outline);

  for (let index = -1; index <= 1; index += 1) {
    const pillar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.44),
      new THREE.MeshBasicMaterial({ color: 0x080000, transparent: true, opacity: 0, depthWrite: false }),
    );
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(pillar.geometry),
      new THREE.LineBasicMaterial({
        color: 0xff2633,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    pillar.position.set(index * 0.18, -0.28, 0.03);
    edge.position.copy(pillar.position);
    group.add(pillar, edge);
  }

  group.visible = false;
  group.position.z = -1;

  return group;
}

function resizeThreeEffects(width, height) {
  const fx = initThreeEffects();

  if (!fx) {
    return null;
  }

  if (fx.width !== width || fx.height !== height) {
    fx.width = width;
    fx.height = height;
    fx.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    fx.renderer.setSize(width, height, false);
    fx.camera.left = -width / 2;
    fx.camera.right = width / 2;
    fx.camera.top = height / 2;
    fx.camera.bottom = -height / 2;
    fx.camera.updateProjectionMatrix();
    fx.backdrop.scale.set(width, height, 1);
  }

  return fx;
}

function screenToWorld(point, width, height) {
  return {
    x: point.x - width / 2,
    y: height / 2 - point.y,
  };
}

function setSpriteScreen(sprite, point, width, height, size, opacity, texture) {
  const world = screenToWorld(point, width, height);

  if (texture && sprite.material.map !== texture) {
    sprite.material.map = texture;
  }

  sprite.visible = opacity > 0.01;
  sprite.position.set(world.x, world.y, sprite.position.z);
  sprite.scale.set(size, size, 1);
  sprite.material.opacity = opacity;
}

function renderThreeEffects(width, height, now, dt) {
  const fx = resizeThreeEffects(width, height);

  if (!fx) {
    return false;
  }

  const effect = dominantEffect();
  const hasEnergy = effect.energy > 0.01 || shrineGesture.energy > 0.01 || purpleGesture.energy > 0.01 || redGesture.energy > 0.01;

  if (!hasEnergy && fx.particleState.every((particle) => particle.alpha <= 0.01)) {
    clearThreeScene(fx);
    fx.renderer.render(fx.scene, fx.camera);
    return true;
  }

  updateThreeBackdrop(fx, effect);
  updateThreeGlows(fx, width, height, now, effect);
  updateThreeBeamAndGlyphs(fx, width, height, now, effect);
  updateThreeParticles(fx, width, height, now, dt, effect);
  updateThreeSlashes(fx, width, height, now, effect);
  updateThreeShrineModel(fx, width, height, now, effect);
  fx.renderer.render(fx.scene, fx.camera);

  return true;
}

function clearThreeScene(fx) {
  fx.backdrop.material.opacity = 0;
  fx.auraSprite.visible = false;
  fx.coreSprite.visible = false;
  fx.beamSprite.visible = false;
  fx.beamSprite.material.opacity = 0;
  fx.contactSprites[0].visible = false;
  fx.contactSprites[1].visible = false;
  fx.glyphSprites.forEach((sprite) => {
    sprite.visible = false;
    sprite.material.opacity = 0;
  });
  fx.rings.forEach((ring) => {
    ring.visible = false;
    ring.material.opacity = 0;
  });
  fx.slashLines.material.opacity = 0;
  fx.shrineGroup.visible = false;
}

function resetThreeEffects() {
  if (!threeEffects) {
    return;
  }

  clearThreeScene(threeEffects);

  for (let index = 0; index < threeParticleBudget; index += 1) {
    threeEffects.particleState[index].alpha = 0;
    threeEffects.particlePositions[index * 3] = 99999;
    threeEffects.particlePositions[index * 3 + 1] = 99999;
    threeEffects.particlePositions[index * 3 + 2] = 0;
    threeEffects.particleColors[index * 3] = 0;
    threeEffects.particleColors[index * 3 + 1] = 0;
    threeEffects.particleColors[index * 3 + 2] = 0;
  }

  threeEffects.particleGeometry.attributes.position.needsUpdate = true;
  threeEffects.particleGeometry.attributes.color.needsUpdate = true;
  threeEffects.renderer.clear();
}

function updateThreeBackdrop(fx, effect) {
  const shrineEnergy = effect.mode === "shrine" ? effect.energy : shrineGesture.energy;
  const purpleEnergy = effect.mode === "purple" ? effect.energy : purpleGesture.energy;

  fx.backdrop.material.opacity = clamp(shrineEnergy * 0.34 + purpleEnergy * 0.08, 0, 0.42);
}

function updateThreeGlows(fx, width, height, now, effect) {
  const energy = effect.energy;
  const mode = effect.mode;
  const target = effect.target;
  const pulse = (Math.sin(now * 0.009) + 1) * 0.5;
  const texture = fx.glowTextures[mode] ?? fx.glowTextures.red;

  if (mode === "none" || energy <= 0.01) {
    fx.auraSprite.visible = false;
    fx.coreSprite.visible = false;
    fx.contactSprites[0].visible = false;
    fx.contactSprites[1].visible = false;
  } else {
    const base = mode === "shrine"
      ? Math.min(width, height) * (0.58 + energy * 0.22)
      : mode === "purple"
        ? Math.min(width, height) * (0.46 + energy * 0.24)
        : Math.min(width, height) * (0.32 + energy * 0.18);
    const core = mode === "shrine"
      ? Math.min(width, height) * (0.13 + pulse * 0.04)
      : mode === "purple"
        ? Math.min(width, height) * (0.19 + pulse * 0.045)
        : Math.min(width, height) * (0.12 + pulse * 0.035);

    setSpriteScreen(fx.auraSprite, target, width, height, base, clamp(energy * 0.95, 0, 1), texture);
    setSpriteScreen(fx.coreSprite, target, width, height, core, clamp(energy * 1.18, 0, 1), texture);
  }

  if (mode === "shrine" && energy > 0.04) {
    const contactSize = Math.min(width, height) * (0.095 + pulse * 0.025);
    setSpriteScreen(fx.contactSprites[0], shrineGesture.indexContact, width, height, contactSize, clamp(energy, 0, 0.95), fx.glowTextures.shrine);
    setSpriteScreen(fx.contactSprites[1], shrineGesture.pinkyContact, width, height, contactSize, clamp(energy * 0.9, 0, 0.9), fx.glowTextures.shrine);
  } else {
    fx.contactSprites[0].visible = false;
    fx.contactSprites[1].visible = false;
  }

  updateThreeRings(fx, width, height, now, effect);
}

function updateThreeRings(fx, width, height, now, effect) {
  const mode = effect.mode;
  const energy = effect.energy;
  const targetWorld = screenToWorld(effect.target, width, height);
  const color = mode === "shrine" ? 0xff2633 : mode === "purple" ? 0xd65cff : 0xff3138;
  const pulse = (Math.sin(now * 0.006) + 1) * 0.5;

  fx.rings.forEach((ring, index) => {
    if (mode === "none" || energy <= 0.02) {
      ring.visible = false;
      ring.material.opacity = 0;
      return;
    }

    const redWave = (now * 0.0018 + index * 0.19) % 1;
    const shrineScale = Math.min(width, height) * (0.18 + index * 0.115 + energy * 0.17 + pulse * 0.012);
    const purpleScale = Math.min(width, height) * (0.12 + index * 0.052 + energy * 0.055);
    const redScale = Math.min(width, height) * (0.055 + redWave * 0.42 + index * 0.018);
    const radius = mode === "shrine" ? shrineScale : mode === "purple" ? purpleScale : redScale;

    ring.visible = index < (mode === "shrine" ? 7 : 5);
    ring.position.set(targetWorld.x, targetWorld.y, index * 0.05);
    ring.scale.set(radius, radius * (mode === "shrine" ? 0.72 : 1), 1);
    ring.rotation.z = now * (mode === "shrine" ? 0.00025 : 0.00065) + index * 0.7;
    ring.material.color.setHex(color);
    ring.material.opacity = mode === "red"
      ? clamp(energy * (1 - redWave) * 1.0, 0, 0.95)
      : mode === "purple"
        ? clamp(energy * (0.66 - index * 0.065), 0, 0.7)
        : clamp(energy * (0.48 - index * 0.045), 0, 0.5);
  });
}

function updateThreeBeamAndGlyphs(fx, width, height, now, effect) {
  if (effect.mode === "purple" && effect.energy > 0.04) {
    const target = screenToWorld(effect.target, width, height);
    const pulse = (Math.sin(now * 0.014) + 1) * 0.5;
    const length = width * (0.72 + effect.energy * 0.18);
    const beamHeight = Math.min(width, height) * (0.12 + pulse * 0.04 + effect.energy * 0.055);

    fx.beamSprite.visible = true;
    fx.beamSprite.position.set(target.x + length * 0.34, target.y, 2.5);
    fx.beamSprite.scale.set(length, beamHeight, 1);
    fx.beamSprite.material.opacity = clamp(effect.energy * 1.05, 0, 1);
  } else {
    fx.beamSprite.visible = false;
    fx.beamSprite.material.opacity = 0;
  }

  if (effect.mode === "shrine" && effect.energy > 0.04) {
    const target = screenToWorld(effect.target, width, height);
    const spread = Math.min(width, height) * (0.32 + effect.energy * 0.18);

    fx.glyphSprites.forEach((sprite, index) => {
      const seed = sprite.userData.seed;
      const drift = (now * 0.00012 + seed) % 1;
      const angle = seed * 2.4;
      const ring = spread * (0.45 + ((index % 6) / 6) * 0.82);

      sprite.visible = true;
      sprite.position.set(
        target.x + Math.cos(angle) * ring,
        target.y + Math.sin(angle) * ring * 0.62 + (drift - 0.5) * 90,
        3,
      );
      sprite.rotation.z = Math.sin(now * 0.0008 + seed) * 0.35;
      sprite.scale.set(18 + (index % 3) * 4, 42 + (index % 4) * 6, 1);
      sprite.material.opacity = clamp(effect.energy * (0.18 + 0.16 * Math.sin(seed + now * 0.002)), 0.05, 0.32);
    });
  } else {
    fx.glyphSprites.forEach((sprite) => {
      sprite.visible = false;
      sprite.material.opacity = 0;
    });
  }
}

function resetThreeParticle(particle, width, height, effect) {
  if (effect.mode === "red") {
    const angle = Math.random() * Math.PI * 2;
    const startRadius = 10 + Math.random() * 34;
    const speed = 7.2 + Math.random() * 8.8;

    particle.x = effect.target.x + Math.cos(angle) * startRadius;
    particle.y = effect.target.y + Math.sin(angle) * startRadius;
    particle.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 1.6;
    particle.vy = Math.sin(angle) * speed + (Math.random() - 0.5) * 1.6;
    particle.alpha = 0.46 + Math.random() * 0.54;
    particle.heat = Math.random();
    particle.age = 0;
    particle.life = 620 + Math.random() * 1050;
    particle.orbit = Math.random() * Math.PI * 2;
    particle.orbitSpeed = 0;
    particle.radius = 25 + Math.random() * 120;
    particle.mode = effect.mode;
    return;
  }

  const edge = randomEdgePoint(width, height);
  const purpleBeamX = effect.mode === "purple" ? effect.target.x + width * (0.18 + Math.random() * 0.46) : effect.target.x;
  const purpleBeamY = effect.mode === "purple" ? effect.target.y + (Math.random() - 0.5) * height * 0.18 : effect.target.y;
  const angle = Math.atan2(purpleBeamY - edge.y, purpleBeamX - edge.x);
  const speed = effect.mode === "shrine"
    ? 4.0 + Math.random() * 6.2
    : effect.mode === "purple"
      ? 2.6 + Math.random() * 4.5
      : 2.1 + Math.random() * 3.8;

  particle.x = edge.x;
  particle.y = edge.y;
  particle.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 1.3;
  particle.vy = Math.sin(angle) * speed + (Math.random() - 0.5) * 1.3;
  particle.alpha = effect.mode === "purple" ? 0.32 + Math.random() * 0.58 : 0.14 + Math.random() * 0.45;
  particle.heat = Math.random();
  particle.age = 0;
  particle.life = effect.mode === "shrine" ? 900 + Math.random() * 1700 : 1300 + Math.random() * 2400;
  particle.orbit = Math.random() * Math.PI * 2;
  particle.orbitSpeed = (Math.random() < 0.5 ? -1 : 1) * (0.0015 + Math.random() * 0.004);
  particle.radius = effect.mode === "shrine" ? 50 + Math.random() * 170 : 26 + Math.random() * 130;
  particle.mode = effect.mode;
}

function updateThreeParticles(fx, width, height, now, dt, effect) {
  const step = clamp(dt / 16.67, 0.25, 2.4);
  const activeCount = effect.mode === "shrine"
    ? Math.floor(threeParticleBudget * clamp(effect.energy + 0.2, 0.35, 1))
    : effect.mode === "purple"
      ? Math.floor(threeParticleBudget * clamp(effect.energy + 0.28, 0.48, 1))
      : effect.mode === "red"
        ? Math.floor(threeParticleBudget * 0.82 * clamp(effect.energy + 0.3, 0.5, 1))
        : 0;

  for (let index = 0; index < threeParticleBudget; index += 1) {
    const particle = fx.particleState[index];
    const isActive = index < activeCount && effect.energy > 0.03 && effect.mode !== "none";

    if (isActive && particle.alpha <= 0.015) {
      resetThreeParticle(particle, width, height, effect);
    }

    if (isActive) {
      moveThreeParticle(particle, width, height, now, step, effect);
    } else {
      particle.x += particle.vx * 0.55 * step;
      particle.y += particle.vy * 0.55 * step;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.alpha *= Math.pow(0.9, step);
    }

    const offset = index * 3;

    if (particle.alpha <= 0.01) {
      fx.particlePositions[offset] = 99999;
      fx.particlePositions[offset + 1] = 99999;
      fx.particleColors[offset] = 0;
      fx.particleColors[offset + 1] = 0;
      fx.particleColors[offset + 2] = 0;
      continue;
    }

    const world = screenToWorld(particle, width, height);
    const color = threeParticleColor(particle);

    fx.particlePositions[offset] = world.x;
    fx.particlePositions[offset + 1] = world.y;
    fx.particlePositions[offset + 2] = particle.mode === "shrine" ? 1 : 0;
    fx.particleColors[offset] = color.r * particle.alpha;
    fx.particleColors[offset + 1] = color.g * particle.alpha;
    fx.particleColors[offset + 2] = color.b * particle.alpha;
  }

  fx.particleGeometry.attributes.position.needsUpdate = true;
  fx.particleGeometry.attributes.color.needsUpdate = true;
  fx.particleMaterial.size = effect.mode === "shrine" ? 3.8 : effect.mode === "purple" ? 6.2 : effect.mode === "red" ? 6.8 : 4.2;
}

function moveThreeParticle(particle, width, height, now, step, effect) {
  if (effect.mode === "red") {
    const dx = particle.x - effect.target.x;
    const dy = particle.y - effect.target.y;
    const distanceFromTarget = Math.max(Math.hypot(dx, dy), 0.001);
    const outwardX = dx / distanceFromTarget;
    const outwardY = dy / distanceFromTarget;
    const shockPulse = 1 + Math.sin(now * 0.018 + particle.heat * 12) * 0.24;

    particle.age += 16.67 * step;
    particle.vx += outwardX * (1.8 + effect.energy * 2.6) * shockPulse * step;
    particle.vy += outwardY * (1.8 + effect.energy * 2.6) * shockPulse * step;
    particle.vx *= 0.935;
    particle.vy *= 0.935;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.alpha = Math.min(1, particle.alpha + 0.045 * effect.energy * step);

    if (particle.age > particle.life || distanceFromTarget > Math.max(width, height) * 0.55) {
      resetThreeParticle(particle, width, height, effect);
    }

    return;
  }

  const beamPhase = particle.heat;
  const attractX = effect.mode === "purple" ? effect.target.x + width * (0.15 + beamPhase * 0.55) : effect.target.x;
  const attractY = effect.mode === "purple" ? effect.target.y + Math.sin(now * 0.002 + beamPhase * 9) * height * 0.035 : effect.target.y;
  const dx = attractX - particle.x;
  const dy = attractY - particle.y;
  const distanceToTarget = Math.max(Math.hypot(dx, dy), 0.001);
  const tangentX = -dy / distanceToTarget;
  const tangentY = dx / distanceToTarget;
  const pull = effect.mode === "shrine" ? 0.007 : effect.mode === "purple" ? 0.0072 : 0.0045;
  const swirl = effect.mode === "shrine" ? 1.9 : effect.mode === "purple" ? 2.25 : 0.72;
  const orbitRadius = effect.mode === "shrine"
    ? Math.min(width, height) * 0.19 + particle.radius * 0.35
    : effect.mode === "purple"
      ? Math.min(width, height) * 0.05 + particle.radius * 0.16
    : Math.min(width, height) * 0.08 + particle.radius * 0.28;

  particle.age += 16.67 * step;
  particle.orbit += particle.orbitSpeed * 16.67 * step;

  if (distanceToTarget > orbitRadius) {
    particle.vx += dx * pull * step;
    particle.vy += dy * pull * step;
  } else {
    const orbitX = effect.target.x + Math.cos(particle.orbit + now * 0.001) * orbitRadius;
    const orbitY = effect.target.y + Math.sin(particle.orbit + now * 0.001) * orbitRadius * (effect.mode === "shrine" ? 0.55 : 0.8);

    particle.vx += (orbitX - particle.x) * (effect.mode === "shrine" ? 0.016 : 0.012) * step;
    particle.vy += (orbitY - particle.y) * (effect.mode === "shrine" ? 0.016 : 0.012) * step;
  }

  particle.vx += tangentX * swirl * effect.energy * step;
  particle.vy += tangentY * swirl * effect.energy * step;
  particle.vx *= effect.mode === "shrine" ? 0.89 : 0.92;
  particle.vy *= effect.mode === "shrine" ? 0.89 : 0.92;
  particle.x += particle.vx * step;
  particle.y += particle.vy * step;
  particle.alpha = Math.min(1, particle.alpha + (effect.mode === "shrine" ? 0.04 : effect.mode === "purple" ? 0.055 : 0.028) * effect.energy * step);

  if (particle.age > particle.life && Math.random() < 0.06 * effect.energy) {
    resetThreeParticle(particle, width, height, effect);
  }
}

function threeParticleColor(particle) {
  if (particle.mode === "shrine") {
    return particle.heat > 0.88
      ? { r: 1, g: 0.9, b: 0.58 }
      : { r: 1, g: 0.08 + particle.heat * 0.2, b: 0.07 + particle.heat * 0.08 };
  }

  if (particle.mode === "purple") {
    return particle.heat > 0.82
      ? { r: 1.35, g: 1.2, b: 1.55 }
      : particle.heat > 0.48
        ? { r: 1.0 + particle.heat * 0.28, g: 0.25, b: 1.45 }
        : { r: 0.28 + particle.heat * 0.45, g: 0.34, b: 1.35 };
  }

  return particle.heat > 0.82
    ? { r: 1.45, g: 1.05, b: 0.48 }
    : { r: 1.35, g: 0.2 + particle.heat * 0.45, b: 0.12 };
}

function updateThreeSlashes(fx, width, height, now, effect) {
  const isShrine = effect.mode === "shrine" && effect.energy > 0.04;
  const target = screenToWorld(effect.target, width, height);
  const count = isShrine ? 24 : 0;

  for (let index = 0; index < 24; index += 1) {
    const offset = index * 6;

    if (index >= count) {
      fx.slashPositions.fill(99999, offset, offset + 6);
      continue;
    }

    const phase = (now * 0.0018 + index * 0.137) % 1;
    const life = Math.sin(phase * Math.PI);
    const angle = index * 2.399 + now * 0.00045;
    const radius = Math.min(width, height) * (0.18 + phase * 0.44);
    const x = target.x + Math.cos(angle) * radius;
    const y = target.y + Math.sin(angle) * radius * 0.62;
    const slashAngle = angle + Math.PI * 0.36;
    const length = Math.min(width, height) * (0.08 + life * 0.12);

    fx.slashPositions[offset] = x - Math.cos(slashAngle) * length;
    fx.slashPositions[offset + 1] = y - Math.sin(slashAngle) * length;
    fx.slashPositions[offset + 2] = 4;
    fx.slashPositions[offset + 3] = x + Math.cos(slashAngle) * length;
    fx.slashPositions[offset + 4] = y + Math.sin(slashAngle) * length;
    fx.slashPositions[offset + 5] = 4;
  }

  fx.slashLines.material.color.setHex(0xffffff);
  fx.slashLines.material.opacity = isShrine ? clamp(effect.energy * 0.78, 0, 0.86) : 0;
  fx.slashLines.geometry.attributes.position.needsUpdate = true;
}

function updateThreeShrineModel(fx, width, height, now, effect) {
  const energy = effect.mode === "shrine" ? effect.energy : shrineGesture.energy;

  if (energy <= 0.03) {
    fx.shrineGroup.visible = false;
    return;
  }

  const target = screenToWorld(shrineGesture.target, width, height);
  const scale = clamp(Math.min(width, height) * (0.18 + energy * 0.18), 110, 260);
  const flicker = 0.82 + Math.sin(now * 0.021) * 0.08 + Math.sin(now * 0.047) * 0.04;

  fx.shrineGroup.visible = true;
  fx.shrineGroup.position.set(target.x, target.y + scale * 0.72, 2);
  fx.shrineGroup.scale.set(scale, scale, 1);

  fx.shrineGroup.children.forEach((child) => {
    if (child.material) {
      child.material.opacity = child.type === "Line" || child.type === "LineSegments"
        ? clamp(energy * 0.66 * flicker, 0, 0.72)
        : clamp(energy * 0.64, 0, 0.72);
    }
  });
}

function ensureParticles() {
  while (particles.length < particleBudget) {
    particles.push(createParticle());
  }
}

function createParticle() {
  return {
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    vx: 0,
    vy: 0,
    alpha: 0,
    size: 1,
    age: 0,
    maxAge: 0,
    orbitAngle: 0,
    orbitSpeed: 0,
    orbitRadius: 0,
    swirl: 0,
    heat: 0,
    mode: "purple",
    seed: Math.random() * Math.PI * 2,
    driftAngle: Math.random() * Math.PI * 2,
  };
}

function dominantEffect() {
  if (shrineGesture.energy > 0.04 && shrineGesture.energy >= Math.max(redGesture.energy, purpleGesture.energy) * 0.72) {
    return {
      mode: "shrine",
      energy: shrineGesture.energy,
      target: shrineGesture.target,
    };
  }

  if (purpleGesture.energy > 0.04 && purpleGesture.energy >= redGesture.energy * 0.82) {
    return {
      mode: "purple",
      energy: purpleGesture.energy,
      target: purpleGesture.target,
    };
  }

  if (redGesture.energy > 0.04) {
    return {
      mode: "red",
      energy: redGesture.energy,
      target: redGesture.target,
    };
  }

  return {
    mode: "none",
    energy: 0,
    target: shrineGesture.energy >= Math.max(redGesture.energy, purpleGesture.energy)
      ? shrineGesture.target
      : purpleGesture.energy >= redGesture.energy
        ? purpleGesture.target
        : redGesture.target,
  };
}

function randomEdgePoint(width, height) {
  const edge = Math.floor(Math.random() * 4);

  if (edge === 0) {
    return { x: Math.random() * width, y: -40 };
  }

  if (edge === 1) {
    return { x: width + 40, y: Math.random() * height };
  }

  if (edge === 2) {
    return { x: Math.random() * width, y: height + 40 };
  }

  return { x: -40, y: Math.random() * height };
}

function resetParticle(particle, width, height, effect) {
  const edge = randomEdgePoint(width, height);
  const angleToTarget = Math.atan2(effect.target.y - edge.y, effect.target.x - edge.x);
  const speed = effect.mode === "shrine"
    ? 3.1 + Math.random() * 5.2
    : effect.mode === "purple"
      ? 2.4 + Math.random() * 4.2
      : 1.8 + Math.random() * 3.3;

  particle.x = edge.x;
  particle.y = edge.y;
  particle.previousX = edge.x;
  particle.previousY = edge.y;
  particle.vx = Math.cos(angleToTarget) * speed + (Math.random() - 0.5) * 1.4;
  particle.vy = Math.sin(angleToTarget) * speed + (Math.random() - 0.5) * 1.4;
  particle.alpha = 0.05 + Math.random() * 0.34;
  particle.size = effect.mode === "shrine"
    ? 0.55 + Math.random() * 2.8
    : effect.mode === "purple"
      ? 0.65 + Math.random() * 2.4
      : 0.7 + Math.random() * 1.9;
  particle.age = 0;
  particle.maxAge = effect.mode === "shrine"
    ? 900 + Math.random() * 1900
    : effect.mode === "purple"
      ? 1500 + Math.random() * 2500
      : 1100 + Math.random() * 2000;
  particle.orbitAngle = Math.random() * Math.PI * 2;
  particle.orbitSpeed = (Math.random() < 0.5 ? -1 : 1) * (0.002 + Math.random() * 0.0042);
  particle.orbitRadius = effect.mode === "shrine"
    ? 34 + Math.random() * 128
    : effect.mode === "purple"
      ? 26 + Math.random() * 92
      : 20 + Math.random() * 56;
  particle.swirl = (Math.random() < 0.5 ? -1 : 1) * (effect.mode === "shrine"
    ? 0.38 + Math.random() * 1.7
    : effect.mode === "purple"
      ? 0.62 + Math.random() * 1.2
      : 0.28 + Math.random() * 0.7);
  particle.heat = Math.random();
  particle.mode = effect.mode;
  particle.seed = Math.random() * Math.PI * 2;
  particle.driftAngle = Math.random() * Math.PI * 2;
}

function drawEnergyEffect(width, height, now, dt) {
  ensureParticles();

  const effect = dominantEffect();
  const hasParticles = particles.some((particle) => particle.alpha > 0.01);

  if (effect.energy <= 0.01 && !hasParticles) {
    return;
  }

  if (effect.mode === "shrine" || shrineGesture.energy > Math.max(redGesture.energy, purpleGesture.energy)) {
    drawShrineBackdrop(width, height, now, Math.max(effect.energy, shrineGesture.energy));
  }

  canvasCtx.save();
  canvasCtx.globalCompositeOperation = "lighter";

  if (effect.mode === "shrine" || shrineGesture.energy > Math.max(redGesture.energy, purpleGesture.energy)) {
    drawShrineDomain(width, height, now, Math.max(effect.energy, shrineGesture.energy));
  } else if (effect.mode === "purple" || purpleGesture.energy > redGesture.energy) {
    drawPurpleEnergyAura(width, height, now, Math.max(effect.energy, purpleGesture.energy));
  } else {
    drawRedAura(width, height, now, Math.max(effect.energy, redGesture.energy));
  }

  const activeCount = effect.mode === "shrine"
    ? Math.floor(particleBudget * clamp(effect.energy + 0.22, 0.35, 1))
    : effect.mode === "purple"
      ? Math.floor(particleBudget * clamp(effect.energy + 0.16, 0.25, 1))
      : Math.floor(particleBudget * 0.58 * clamp(effect.energy + 0.16, 0.2, 1));

  for (let index = 0; index < particles.length; index += 1) {
    updateParticle(particles[index], width, height, now, dt, effect, index < activeCount);
    drawParticle(particles[index]);
  }

  if (effect.mode === "shrine" || shrineGesture.energy > Math.max(redGesture.energy, purpleGesture.energy)) {
    drawShrineCore(width, height, now, Math.max(effect.energy, shrineGesture.energy));
  } else if (effect.mode === "purple" || purpleGesture.energy > redGesture.energy) {
    drawPurpleEnergyCore(width, height, now, Math.max(effect.energy, purpleGesture.energy));
  } else {
    drawRedCore(width, height, now, Math.max(effect.energy, redGesture.energy));
  }

  canvasCtx.restore();
}

function updateParticle(particle, width, height, now, dt, effect, isActiveSlot) {
  const step = clamp(dt / 16.67, 0.25, 2.4);
  const energy = effect.energy;

  particle.previousX = particle.x;
  particle.previousY = particle.y;

  if (isActiveSlot && energy > 0.035 && particle.alpha <= 0.012) {
    resetParticle(particle, width, height, effect);
  }

  if (isActiveSlot && energy > 0.035 && effect.mode !== "none") {
    const dx = effect.target.x - particle.x;
    const dy = effect.target.y - particle.y;
    const targetDistance = Math.max(Math.hypot(dx, dy), 0.001);
    const unitX = dx / targetDistance;
    const unitY = dy / targetDistance;
    const tangentX = -unitY;
    const tangentY = unitX;
    const isPurple = effect.mode === "purple";
    const isShrine = effect.mode === "shrine";
    const charge = clamp(energy, 0, 1);
    const compression = clamp((energy - 0.35) / 0.5, 0, 1);
    const baseRadius = isShrine
      ? clamp(Math.min(width, height) * (0.16 + compression * 0.08), 62, 170)
      : isPurple
      ? clamp(Math.min(width, height) * (0.118 - compression * 0.038), 42, 116)
      : clamp(Math.min(width, height) * 0.072, 28, 78);
    const orbitRadius = baseRadius + particle.orbitRadius * (isShrine ? 0.45 : isPurple ? 0.32 : 0.24);
    const pull = isShrine ? 0.0062 : isPurple ? 0.0048 : 0.0042;
    const swirl = particle.swirl * (isShrine ? 1.55 : isPurple ? 1.25 : 0.62) * charge;

    particle.age += dt;
    particle.orbitAngle += particle.orbitSpeed * dt * (0.8 + charge * 0.9);

    if (targetDistance > orbitRadius * 1.8) {
      particle.vx += dx * pull * step;
      particle.vy += dy * pull * step;
      particle.vx += tangentX * swirl * step;
      particle.vy += tangentY * swirl * step;
    } else {
      const orbitX = effect.target.x + Math.cos(particle.orbitAngle + now * 0.0012) * orbitRadius;
      const orbitY = effect.target.y + Math.sin(particle.orbitAngle + now * 0.0012) * orbitRadius * (isShrine ? 0.58 : isPurple ? 0.72 : 0.86);

      particle.vx += (orbitX - particle.x) * (isShrine ? 0.016 : isPurple ? 0.014 : 0.011) * step;
      particle.vy += (orbitY - particle.y) * (isShrine ? 0.016 : isPurple ? 0.014 : 0.011) * step;
      particle.vx += tangentX * swirl * 0.36 * step;
      particle.vy += tangentY * swirl * 0.36 * step;
    }

    particle.vx *= isShrine ? 0.895 : isPurple ? 0.91 : 0.925;
    particle.vy *= isShrine ? 0.895 : isPurple ? 0.91 : 0.925;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.alpha = Math.min(1, particle.alpha + (isShrine ? 0.05 : isPurple ? 0.038 : 0.028) * energy * step);

    if (particle.age > particle.maxAge || targetDistance < baseRadius * 0.36) {
      if (Math.random() < (isShrine ? 0.07 : isPurple ? 0.05 : 0.035) * energy) {
        resetParticle(particle, width, height, effect);
      }
    }
  } else {
    particle.vx += Math.cos(particle.driftAngle) * 0.055 * step;
    particle.vy += Math.sin(particle.driftAngle) * 0.055 * step - 0.012 * step;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.alpha *= Math.pow(0.91, step);
  }
}

function drawParticle(particle) {
  if (particle.alpha <= 0.01) {
    return;
  }

  const isPurple = particle.mode === "purple";
  const isShrine = particle.mode === "shrine";
  const alpha = particle.alpha * (isShrine ? 0.86 : isPurple ? 0.82 : 0.74);
  const lineAlpha = alpha * (isShrine ? 0.52 : isPurple ? 0.42 : 0.3);
  const color = isShrine
    ? shrineParticleColor(particle.heat, alpha)
    : isPurple
    ? purpleParticleColor(particle.heat, alpha)
    : redParticleColor(particle.heat, alpha);
  const trailColor = isShrine
    ? shrineParticleColor(particle.heat, lineAlpha)
    : isPurple
    ? purpleParticleColor(particle.heat, lineAlpha)
    : redParticleColor(particle.heat, lineAlpha);

  canvasCtx.lineWidth = Math.max(0.55, particle.size * (isShrine ? 1.05 : isPurple ? 0.82 : 0.64));
  canvasCtx.strokeStyle = trailColor;
  canvasCtx.beginPath();
  canvasCtx.moveTo(particle.previousX, particle.previousY);
  canvasCtx.lineTo(particle.x, particle.y);
  canvasCtx.stroke();

  canvasCtx.fillStyle = color;
  canvasCtx.beginPath();
  canvasCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  canvasCtx.fill();
}

function shrineParticleColor(heat, alpha) {
  if (heat > 0.9) {
    return `rgba(255, 218, 165, ${alpha})`;
  }

  if (heat > 0.55) {
    return `rgba(255, ${40 + heat * 54}, ${24 + heat * 28}, ${alpha})`;
  }

  return `rgba(${130 + heat * 80}, 8, 18, ${alpha})`;
}

function purpleParticleColor(heat, alpha) {
  if (heat > 0.84) {
    return `rgba(205, 246, 255, ${alpha})`;
  }

  if (heat > 0.55) {
    return `rgba(225, 86, 255, ${alpha})`;
  }

  return `rgba(${118 + heat * 60}, ${62 + heat * 36}, 255, ${alpha})`;
}

function redParticleColor(heat, alpha) {
  if (heat > 0.82) {
    return `rgba(255, 226, 160, ${alpha})`;
  }

  return `rgba(255, ${40 + heat * 92}, ${34 + heat * 32}, ${alpha})`;
}

function drawShrineBackdrop(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const pulse = (Math.sin(now * 0.0038) + 1) * 0.5;

  canvasCtx.save();
  canvasCtx.globalCompositeOperation = "source-over";
  canvasCtx.fillStyle = `rgba(3, 0, 2, ${0.18 * energy + pulse * 0.035 * energy})`;
  canvasCtx.fillRect(0, 0, width, height);
  canvasCtx.restore();
}

function drawShrineDomain(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const target = shrineGesture.target;
  const charge = clamp(energy, 0, 1);
  const pulse = (Math.sin(now * 0.007) + 1) * 0.5;
  const expansion = clamp((energy - 0.18) / 0.72, 0, 1);
  const maxRadius = Math.hypot(width, height) * 0.54;
  const ringRadius = clamp(Math.min(width, height) * (0.16 + expansion * 0.52), 60, maxRadius) * (0.96 + pulse * 0.035);
  const innerGlow = canvasCtx.createRadialGradient(target.x, target.y, 6, target.x, target.y, ringRadius * 1.18);

  innerGlow.addColorStop(0, `rgba(255, 50, 42, ${0.3 * energy})`);
  innerGlow.addColorStop(0.26, `rgba(117, 4, 14, ${0.26 * energy})`);
  innerGlow.addColorStop(0.7, `rgba(28, 0, 3, ${0.18 * energy})`);
  innerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

  canvasCtx.fillStyle = innerGlow;
  canvasCtx.beginPath();
  canvasCtx.arc(target.x, target.y, ringRadius * 1.18, 0, Math.PI * 2);
  canvasCtx.fill();

  canvasCtx.save();
  canvasCtx.lineCap = "round";
  canvasCtx.lineJoin = "round";
  canvasCtx.shadowColor = `rgba(255, 24, 32, ${0.62 * energy})`;
  canvasCtx.shadowBlur = 18 + 26 * energy;

  for (let ring = 0; ring < 5; ring += 1) {
    const radius = ringRadius * (0.62 + ring * 0.18 + pulse * 0.012);
    const alpha = clamp(0.42 * energy - ring * 0.045, 0, 1);

    canvasCtx.lineWidth = Math.max(1.2, 6.5 - ring * 0.8) * energy;
    canvasCtx.strokeStyle = ring % 2 === 0 ? `rgba(255, 31, 38, ${alpha})` : `rgba(22, 0, 0, ${alpha * 0.9})`;
    canvasCtx.beginPath();
    canvasCtx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    canvasCtx.stroke();
  }

  drawShrineRadials(target, ringRadius, now, energy);
  drawShrineContactSparks(now, energy);
  drawShrineSlashes(width, height, target, ringRadius, now, energy);
  drawShrineSilhouette(target, ringRadius, now, energy);
  canvasCtx.restore();
}

function drawShrineRadials(target, radius, now, energy) {
  const count = 32;

  for (let index = 0; index < count; index += 1) {
    const angle = index * ((Math.PI * 2) / count) + Math.sin(now * 0.001 + index) * 0.035;
    const phase = (Math.sin(now * 0.004 + index * 1.7) + 1) * 0.5;
    const inner = radius * (0.2 + phase * 0.08);
    const outer = radius * (0.88 + phase * 0.22);

    canvasCtx.lineWidth = (0.8 + phase * 1.3) * energy;
    canvasCtx.strokeStyle = `rgba(255, ${30 + phase * 36}, ${28 + phase * 20}, ${0.12 * energy + phase * 0.13 * energy})`;
    canvasCtx.beginPath();
    canvasCtx.moveTo(target.x + Math.cos(angle) * inner, target.y + Math.sin(angle) * inner);
    canvasCtx.lineTo(target.x + Math.cos(angle) * outer, target.y + Math.sin(angle) * outer);
    canvasCtx.stroke();
  }
}

function drawShrineContactSparks(now, energy) {
  const contacts = [shrineGesture.indexContact, shrineGesture.pinkyContact];

  for (const point of contacts) {
    const pulse = (Math.sin(now * 0.018 + point.x * 0.01) + 1) * 0.5;
    const radius = 10 + pulse * 8;
    const spark = canvasCtx.createRadialGradient(point.x, point.y, 1, point.x, point.y, radius * 3.4);

    spark.addColorStop(0, `rgba(255, 242, 190, ${0.76 * energy})`);
    spark.addColorStop(0.24, `rgba(255, 34, 35, ${0.48 * energy})`);
    spark.addColorStop(1, "rgba(90, 0, 0, 0)");

    canvasCtx.fillStyle = spark;
    canvasCtx.beginPath();
    canvasCtx.arc(point.x, point.y, radius * 3.4, 0, Math.PI * 2);
    canvasCtx.fill();

    for (let ray = 0; ray < 10; ray += 1) {
      const angle = ray * ((Math.PI * 2) / 10) + now * 0.006;
      const length = 14 + Math.sin(now * 0.012 + ray) * 8;

      canvasCtx.lineWidth = 1.2 * energy;
      canvasCtx.strokeStyle = `rgba(255, 88, 64, ${0.32 * energy})`;
      canvasCtx.beginPath();
      canvasCtx.moveTo(point.x + Math.cos(angle) * 3, point.y + Math.sin(angle) * 3);
      canvasCtx.lineTo(point.x + Math.cos(angle) * length, point.y + Math.sin(angle) * length);
      canvasCtx.stroke();
    }
  }
}

function drawShrineSlashes(width, height, target, radius, now, energy) {
  const slashCount = 12;

  for (let slash = 0; slash < slashCount; slash += 1) {
    const phase = (now * 0.0014 + slash * 0.173) % 1;
    const life = Math.sin(phase * Math.PI);

    if (life <= 0.08) {
      continue;
    }

    const angle = slash * 2.399 + Math.sin(now * 0.0008 + slash) * 0.3;
    const distanceFromCenter = radius * (0.2 + phase * 0.72);
    const x = target.x + Math.cos(angle) * distanceFromCenter;
    const y = target.y + Math.sin(angle) * distanceFromCenter * 0.74;
    const slashAngle = angle + Math.PI * 0.42;
    const length = Math.min(width, height) * (0.08 + life * 0.08);

    canvasCtx.lineWidth = (1.2 + life * 3.4) * energy;
    canvasCtx.strokeStyle = `rgba(255, 255, 255, ${0.62 * life * energy})`;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x - Math.cos(slashAngle) * length * 0.5, y - Math.sin(slashAngle) * length * 0.5);
    canvasCtx.lineTo(x + Math.cos(slashAngle) * length * 0.5, y + Math.sin(slashAngle) * length * 0.5);
    canvasCtx.stroke();
  }
}

function drawShrineSilhouette(target, radius, now, energy) {
  const flicker = 0.82 + Math.sin(now * 0.021) * 0.08 + Math.sin(now * 0.049) * 0.04;
  const width = clamp(radius * 0.78, 120, 260);
  const height = clamp(radius * 0.46, 76, 160);
  const baseX = target.x;
  const baseY = target.y - radius * 0.45;
  const roofY = baseY - height * 0.56;
  const edgeAlpha = 0.54 * energy * flicker;

  canvasCtx.save();
  canvasCtx.shadowColor = `rgba(255, 18, 28, ${0.5 * energy})`;
  canvasCtx.shadowBlur = 18 + 18 * energy;
  canvasCtx.fillStyle = `rgba(4, 0, 1, ${0.74 * energy})`;
  canvasCtx.strokeStyle = `rgba(255, 36, 42, ${edgeAlpha})`;
  canvasCtx.lineWidth = 2.2 * energy;

  canvasCtx.beginPath();
  canvasCtx.moveTo(baseX - width * 0.54, baseY - height * 0.12);
  canvasCtx.lineTo(baseX - width * 0.36, roofY + height * 0.08);
  canvasCtx.lineTo(baseX - width * 0.12, roofY - height * 0.1);
  canvasCtx.lineTo(baseX, roofY - height * 0.2);
  canvasCtx.lineTo(baseX + width * 0.12, roofY - height * 0.1);
  canvasCtx.lineTo(baseX + width * 0.36, roofY + height * 0.08);
  canvasCtx.lineTo(baseX + width * 0.54, baseY - height * 0.12);
  canvasCtx.lineTo(baseX + width * 0.38, baseY - height * 0.02);
  canvasCtx.lineTo(baseX + width * 0.32, baseY + height * 0.44);
  canvasCtx.lineTo(baseX - width * 0.32, baseY + height * 0.44);
  canvasCtx.lineTo(baseX - width * 0.38, baseY - height * 0.02);
  canvasCtx.closePath();
  canvasCtx.fill();
  canvasCtx.stroke();

  for (let pillar = -1; pillar <= 1; pillar += 1) {
    const x = baseX + pillar * width * 0.18;

    canvasCtx.fillStyle = `rgba(14, 0, 2, ${0.78 * energy})`;
    canvasCtx.fillRect(x - width * 0.035, baseY - height * 0.02, width * 0.07, height * 0.42);
    canvasCtx.strokeRect(x - width * 0.035, baseY - height * 0.02, width * 0.07, height * 0.42);
  }

  canvasCtx.restore();
}

function drawShrineCore(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const target = shrineGesture.target;
  const pulse = (Math.sin(now * 0.01) + 1) * 0.5;
  const radius = clamp(Math.min(width, height) * (0.06 + energy * 0.035), 28, 86) * (0.94 + pulse * 0.1);
  const core = canvasCtx.createRadialGradient(target.x, target.y, 2, target.x, target.y, radius * 2.3);

  core.addColorStop(0, `rgba(255, 226, 186, ${0.52 * energy})`);
  core.addColorStop(0.18, `rgba(255, 38, 34, ${0.48 * energy})`);
  core.addColorStop(0.62, `rgba(101, 0, 10, ${0.3 * energy})`);
  core.addColorStop(1, "rgba(0, 0, 0, 0)");

  canvasCtx.fillStyle = core;
  canvasCtx.beginPath();
  canvasCtx.arc(target.x, target.y, radius * 2.3, 0, Math.PI * 2);
  canvasCtx.fill();
}

function drawPurpleEnergyAura(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const target = purpleGesture.target;
  const pulse = (Math.sin(now * 0.006) + 1) * 0.5;
  const charge = clamp(energy, 0, 1);
  const compression = clamp((energy - 0.32) / 0.54, 0, 1);
  const orbRadius = clamp(Math.min(width, height) * (0.08 + charge * 0.035 - compression * 0.018), 38, 112);
  const bloomRadius = orbRadius * (3.7 + pulse * 0.65);
  const aura = canvasCtx.createRadialGradient(target.x, target.y, 4, target.x, target.y, bloomRadius);

  aura.addColorStop(0, `rgba(235, 250, 255, ${0.42 * energy})`);
  aura.addColorStop(0.15, `rgba(163, 76, 255, ${0.4 * energy})`);
  aura.addColorStop(0.38, `rgba(111, 24, 255, ${0.32 * energy})`);
  aura.addColorStop(0.64, `rgba(255, 44, 214, ${0.16 * energy})`);
  aura.addColorStop(1, "rgba(41, 0, 96, 0)");

  canvasCtx.fillStyle = aura;
  canvasCtx.beginPath();
  canvasCtx.arc(target.x, target.y, bloomRadius, 0, Math.PI * 2);
  canvasCtx.fill();

  canvasCtx.save();
  canvasCtx.lineCap = "round";
  canvasCtx.shadowColor = `rgba(170, 74, 255, ${0.55 * energy})`;
  canvasCtx.shadowBlur = 26 + 34 * energy;

  for (let ring = 0; ring < 5; ring += 1) {
    const radius = orbRadius * (1.02 + ring * 0.28 + pulse * 0.06);
    const start = now * (0.0011 + ring * 0.00022) + ring * 1.7;
    const arcLength = Math.PI * (1.08 + ring * 0.12);

    canvasCtx.lineWidth = Math.max(1.2, 5.6 - ring * 0.8) * energy;
    canvasCtx.strokeStyle = ring % 2 === 0
      ? `rgba(213, 88, 255, ${0.42 * energy})`
      : `rgba(128, 224, 255, ${0.3 * energy})`;
    canvasCtx.beginPath();
    canvasCtx.arc(target.x, target.y, radius, start, start + arcLength);
    canvasCtx.stroke();
  }

  for (let wave = 0; wave < 4; wave += 1) {
    const radius = orbRadius * (1.75 + wave * 0.72 + pulse * 0.18);

    canvasCtx.lineWidth = 1.1 * energy;
    canvasCtx.strokeStyle = `rgba(180, 80, 255, ${0.13 * energy * (1 - wave * 0.16)})`;
    canvasCtx.beginPath();
    canvasCtx.ellipse(target.x, target.y, radius * 1.28, radius * 0.72, now * 0.0006 + wave, 0, Math.PI * 2);
    canvasCtx.stroke();
  }

  canvasCtx.restore();
}

function drawPurpleEnergyCore(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const target = purpleGesture.target;
  const pulse = (Math.sin(now * 0.011) + 1) * 0.5;
  const ready = clamp((energy - 0.72) / 0.28, 0, 1);
  const orbRadius = clamp(Math.min(width, height) * (0.065 + ready * 0.016), 34, 96) * (0.96 + pulse * 0.08);
  const core = canvasCtx.createRadialGradient(target.x, target.y, 1, target.x, target.y, orbRadius);

  core.addColorStop(0, `rgba(250, 255, 255, ${0.82 * energy})`);
  core.addColorStop(0.22, `rgba(116, 212, 255, ${0.68 * energy})`);
  core.addColorStop(0.46, `rgba(92, 24, 240, ${0.76 * energy})`);
  core.addColorStop(0.78, `rgba(216, 55, 255, ${0.58 * energy})`);
  core.addColorStop(1, `rgba(74, 0, 118, ${0.04 * energy})`);

  canvasCtx.save();
  canvasCtx.shadowColor = `rgba(206, 80, 255, ${0.9 * energy})`;
  canvasCtx.shadowBlur = 38 + ready * 34;
  canvasCtx.fillStyle = core;
  canvasCtx.beginPath();
  canvasCtx.arc(target.x, target.y, orbRadius, 0, Math.PI * 2);
  canvasCtx.fill();

  drawElectricArcs(target, orbRadius, now, energy, ready);
  canvasCtx.restore();
}

function drawElectricArcs(target, radius, now, energy, ready) {
  const arcCount = 5 + Math.floor(ready * 6);

  for (let arc = 0; arc < arcCount; arc += 1) {
    const seed = arc * 2.173;
    const startAngle = now * 0.0032 + seed;
    const sweep = 0.68 + Math.sin(now * 0.004 + seed) * 0.22;
    const segments = 7;

    canvasCtx.lineWidth = (1.2 + ready * 1.8) * energy;
    canvasCtx.strokeStyle = arc % 2 === 0
      ? `rgba(211, 247, 255, ${0.62 * energy})`
      : `rgba(255, 94, 232, ${0.5 * energy})`;
    canvasCtx.beginPath();

    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const angle = startAngle + sweep * t;
      const jitter = Math.sin(now * 0.019 + seed + index * 1.97) * radius * (0.06 + ready * 0.06);
      const pointRadius = radius * (1.02 + 0.24 * Math.sin(seed + t * Math.PI)) + jitter;
      const x = target.x + Math.cos(angle) * pointRadius;
      const y = target.y + Math.sin(angle) * pointRadius * 0.82;

      if (index === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
    }

    canvasCtx.stroke();
  }
}

function drawRedAura(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const target = redGesture.target;
  const pulse = (Math.sin(now * 0.008) + 1) * 0.5;
  const ringRadius = clamp(Math.min(width, height) * 0.075, 34, 92) * (0.94 + pulse * 0.16);
  const bloomRadius = ringRadius * (3.0 + pulse * 0.45) * energy;
  const gradient = canvasCtx.createRadialGradient(target.x, target.y, 2, target.x, target.y, bloomRadius);

  gradient.addColorStop(0, `rgba(255, 245, 226, ${0.44 * energy})`);
  gradient.addColorStop(0.18, `rgba(255, 68, 54, ${0.36 * energy})`);
  gradient.addColorStop(0.48, `rgba(190, 6, 28, ${0.24 * energy})`);
  gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

  canvasCtx.fillStyle = gradient;
  canvasCtx.beginPath();
  canvasCtx.arc(target.x, target.y, bloomRadius, 0, Math.PI * 2);
  canvasCtx.fill();

  canvasCtx.save();
  canvasCtx.shadowColor = `rgba(255, 45, 54, ${0.75 * energy})`;
  canvasCtx.shadowBlur = 34 * energy + pulse * 12;
  canvasCtx.lineCap = "round";

  for (let ring = 0; ring < 4; ring += 1) {
    const radius = ringRadius + ring * 13 + pulse * 8 * (ring + 1);
    const alpha = clamp(0.5 * energy - ring * 0.08, 0, 1);

    canvasCtx.lineWidth = Math.max(1.5, 7 - ring * 1.25) * energy;
    canvasCtx.strokeStyle = `rgba(255, ${76 + ring * 24}, ${48 + ring * 10}, ${alpha})`;
    canvasCtx.beginPath();
    canvasCtx.arc(target.x, target.y, radius, now * 0.0012 + ring, Math.PI * 1.72 + now * 0.0012 + ring);
    canvasCtx.stroke();
  }

  canvasCtx.restore();
}

function drawRedCore(width, height, now, energy) {
  if (energy <= 0.02) {
    return;
  }

  const target = redGesture.target;
  const pulse = (Math.sin(now * 0.012) + 1) * 0.5;
  const coreRadius = clamp(Math.min(width, height) * 0.036, 18, 48) * (0.92 + pulse * 0.14);
  const core = canvasCtx.createRadialGradient(target.x, target.y, 1, target.x, target.y, coreRadius);

  core.addColorStop(0, `rgba(255, 255, 230, ${0.78 * energy})`);
  core.addColorStop(0.35, `rgba(255, 74, 51, ${0.72 * energy})`);
  core.addColorStop(1, `rgba(143, 0, 20, ${0.08 * energy})`);

  canvasCtx.save();
  canvasCtx.shadowColor = `rgba(255, 42, 48, ${0.82 * energy})`;
  canvasCtx.shadowBlur = 28 * energy;
  canvasCtx.fillStyle = core;
  canvasCtx.beginPath();
  canvasCtx.arc(target.x, target.y, coreRadius, 0, Math.PI * 2);
  canvasCtx.fill();
  canvasCtx.restore();
}

function resetGestureAndParticles() {
  Object.assign(redGesture, createGestureTracker("red"));
  Object.assign(purpleGesture, createGestureTracker("purple"));
  Object.assign(shrineGesture, createGestureTracker("shrine"));
  resetThreeEffects();

  for (const particle of particles) {
    particle.alpha = 0;
  }

  latestHands = [];
  latestDebug = "No gesture";
  gestureValue.textContent = "No gesture";
  energyValue.textContent = "0%";
  debugReason.textContent = "No gesture";
  gestureValue.classList.remove("is-active", "is-purple", "is-shrine");
  energyValue.classList.remove("is-active", "is-purple", "is-shrine");
}

function drawResults(now = performance.now()) {
  resizeCanvas();

  const dt = Math.min(64, now - lastEffectTime);
  lastEffectTime = now;
  const width = canvasElement.clientWidth;
  const height = canvasElement.clientHeight;
  const videoRect = getVideoRect(width, height);

  canvasCtx.clearRect(0, 0, width, height);
  updateEnergyLevel();
  if (!renderThreeEffects(width, height, now, dt)) {
    drawEnergyEffect(width, height, now, dt);
  }

  for (const hand of latestHands) {
    if (showSkeletonControl.checked) {
      drawSkeleton(hand, videoRect);
    }

    if (showPointsControl.checked) {
      drawKeypoints(hand, videoRect);
    }
  }
}

function drawSkeleton(hand, rect) {
  const isRight = hand.label === "Right";

  canvasCtx.save();
  canvasCtx.lineCap = "round";
  canvasCtx.lineJoin = "round";
  canvasCtx.lineWidth = Math.max(3, rect.width * 0.004);
  canvasCtx.strokeStyle = isRight ? "rgba(105, 225, 255, 0.88)" : "rgba(225, 110, 255, 0.88)";
  canvasCtx.shadowColor = isRight ? "rgba(105, 225, 255, 0.38)" : "rgba(225, 110, 255, 0.38)";
  canvasCtx.shadowBlur = 10;

  for (const [fromIndex, toIndex] of landmarkConnections) {
    const from = pointToCanvas(hand.landmarks[fromIndex], rect);
    const to = pointToCanvas(hand.landmarks[toIndex], rect);

    canvasCtx.beginPath();
    canvasCtx.moveTo(from.x, from.y);
    canvasCtx.lineTo(to.x, to.y);
    canvasCtx.stroke();
  }

  canvasCtx.restore();
}

function drawKeypoints(hand, rect) {
  for (let index = 0; index < hand.landmarks.length; index += 1) {
    const point = pointToCanvas(hand.landmarks[index], rect);
    const isFingertip = fingertipIndexes.has(index);
    const isJoint = jointIndexes.has(index);
    const radius = isFingertip ? 7 : isJoint ? 5 : 4;

    canvasCtx.beginPath();
    canvasCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    canvasCtx.fillStyle = isFingertip ? "#f4b860" : "#f6f2ea";
    canvasCtx.fill();
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgba(16, 17, 20, 0.85)";
    canvasCtx.stroke();
  }
}

async function startCamera() {
  if (isTracking) {
    return;
  }

  setError();
  startButton.disabled = true;
  setStatus(isModelReady ? "Starting camera" : "Loading model");

  try {
    if (!hands) {
      initHands();
      isModelReady = true;
    }

    await updateHandsOptions();

    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 60 },
      },
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    isTracking = true;
    stopButton.disabled = false;
    videoElement.classList.add("is-active");
    emptyState.classList.add("is-hidden");
    setStatus("Tracking");

    lastDetectionTime = performance.now();
    lastEffectTime = performance.now();
    smoothedDetectionFps = 0;
    isSendingFrame = false;
    renderFrameId = requestAnimationFrame(renderFrame);
    scheduleDetectionFrame();
  } catch (error) {
    startButton.disabled = false;
    stopButton.disabled = true;
    setStatus("Camera idle");
    setError(cameraErrorMessage(error));
  }
}

function renderFrame(now) {
  if (!isTracking) {
    return;
  }

  drawResults(now);
  renderFrameId = requestAnimationFrame(renderFrame);
}

function scheduleDetectionFrame() {
  if (!isTracking || detectionFrameId !== null) {
    return;
  }

  const processNextFrame = () => {
    detectionFrameId = null;
    detectionFrameSource = null;
    processFrame();
  };

  if (typeof videoElement.requestVideoFrameCallback === "function") {
    detectionFrameSource = "video";
    detectionFrameId = videoElement.requestVideoFrameCallback(processNextFrame);
    return;
  }

  detectionFrameSource = "animation";
  detectionFrameId = requestAnimationFrame(processNextFrame);
}

function cancelDetectionFrame() {
  if (detectionFrameId === null) {
    return;
  }

  if (detectionFrameSource === "video" && typeof videoElement.cancelVideoFrameCallback === "function") {
    videoElement.cancelVideoFrameCallback(detectionFrameId);
  } else {
    cancelAnimationFrame(detectionFrameId);
  }

  detectionFrameId = null;
  detectionFrameSource = null;
}

function processFrame() {
  if (!isTracking) {
    return;
  }

  if (isSendingFrame || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    scheduleDetectionFrame();
    return;
  }

  isSendingFrame = true;
  hands
    .send({ image: videoElement })
    .catch(() => {
      stopCamera();
      setError("Hand tracking stopped unexpectedly.");
    })
    .finally(() => {
      isSendingFrame = false;
      scheduleDetectionFrame();
    });
}

function stopCamera() {
  isTracking = false;

  if (renderFrameId) {
    cancelAnimationFrame(renderFrameId);
    renderFrameId = null;
  }

  cancelDetectionFrame();

  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  stream = null;
  isSendingFrame = false;
  resetGestureAndParticles();
  videoElement.srcObject = null;
  videoElement.classList.remove("is-active");
  emptyState.classList.remove("is-hidden");
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  handCount.textContent = "0";
  fpsValue.textContent = "0";
  startButton.disabled = false;
  stopButton.disabled = true;
  setStatus("Camera idle");
}

function cameraErrorMessage(error) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "This browser does not support webcam capture.";
  }

  if (error?.name === "NotAllowedError") {
    return "Camera permission was blocked.";
  }

  if (error?.name === "NotFoundError") {
    return "No camera was found.";
  }

  return "Unable to start the camera.";
}

startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);

maxHandsControl.addEventListener("change", updateHandsOptions);

confidenceControl.addEventListener("input", () => {
  confidenceValue.textContent = getConfidence().toFixed(2);
});

confidenceControl.addEventListener("change", updateHandsOptions);

showSkeletonControl.addEventListener("change", drawResults);
showPointsControl.addEventListener("change", drawResults);
showEnergyControl.addEventListener("change", drawResults);

window.addEventListener("resize", drawResults);
window.addEventListener("beforeunload", stopCamera);

confidenceValue.textContent = getConfidence().toFixed(2);
resizeCanvas();
