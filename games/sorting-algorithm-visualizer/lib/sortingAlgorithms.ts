import {
  type AnimationStep,
  compareStep,
  markEveryIndex,
  markSortedStep,
  overwriteStep,
  swapStep,
} from "@/lib/animationSteps";

export type AlgorithmKey =
  | "bubble"
  | "selection"
  | "insertion"
  | "merge"
  | "quick"
  | "heap"
  | "counting"
  | "radix"
  | "shell"
  | "tim";

export interface AlgorithmMeta {
  key: AlgorithmKey;
  name: string;
  summary: string;
  time: {
    best: string;
    average: string;
    worst: string;
  };
  space: string;
  stable: string;
  bestUseCase: string;
  pseudocode: string[];
}

export const algorithmOrder: AlgorithmKey[] = [
  "bubble",
  "selection",
  "insertion",
  "merge",
  "quick",
  "heap",
  "counting",
  "radix",
  "shell",
  "tim",
];

export const algorithmMetadata: Record<AlgorithmKey, AlgorithmMeta> = {
  bubble: {
    key: "bubble",
    name: "Bubble Sort",
    summary: "Repeatedly compares neighboring values and bubbles the largest unsorted value to the end.",
    time: { best: "O(n)", average: "O(n^2)", worst: "O(n^2)" },
    space: "O(1)",
    stable: "Yes",
    bestUseCase: "Good for learning adjacent comparisons, not practical for large arrays.",
    pseudocode: [
      "repeat passes while values are out of order",
      "  compare each adjacent pair",
      "  if left value is greater than right value",
      "    swap the pair",
      "  mark the last unsorted position",
    ],
  },
  selection: {
    key: "selection",
    name: "Selection Sort",
    summary: "Scans the unsorted region, selects the smallest value, and moves it into place.",
    time: { best: "O(n^2)", average: "O(n^2)", worst: "O(n^2)" },
    space: "O(1)",
    stable: "No",
    bestUseCase: "Useful when swaps are expensive and the input is small.",
    pseudocode: [
      "for each position in the array",
      "  scan the unsorted region",
      "  remember the smallest value seen",
      "  swap it into the current position",
      "  mark that position as sorted",
    ],
  },
  insertion: {
    key: "insertion",
    name: "Insertion Sort",
    summary: "Builds a sorted prefix by inserting one new value into the correct position each pass.",
    time: { best: "O(n)", average: "O(n^2)", worst: "O(n^2)" },
    space: "O(1)",
    stable: "Yes",
    bestUseCase: "Great for tiny arrays or nearly sorted data.",
    pseudocode: [
      "for each value after the first",
      "  hold the current value",
      "  shift larger sorted values right",
      "  insert the held value",
      "  grow the sorted prefix",
    ],
  },
  merge: {
    key: "merge",
    name: "Merge Sort",
    summary: "Recursively splits the array, then merges sorted halves back together.",
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
    stable: "Yes",
    bestUseCase: "Reliable when stable O(n log n) sorting matters.",
    pseudocode: [
      "split the array into halves",
      "sort the left half",
      "sort the right half",
      "compare the front values of both halves",
      "overwrite the next output position",
      "copy any remaining values",
    ],
  },
  quick: {
    key: "quick",
    name: "Quick Sort",
    summary: "Partitions around a pivot so smaller values go left and larger values go right.",
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n^2)" },
    space: "O(log n)",
    stable: "No",
    bestUseCase: "Fast general-purpose sorting when stable order is not required.",
    pseudocode: [
      "choose a pivot in the active range",
      "scan values before the pivot",
      "if a value belongs on the left side",
      "  swap it into the left partition",
      "place the pivot between both partitions",
      "sort the left and right ranges",
    ],
  },
  heap: {
    key: "heap",
    name: "Heap Sort",
    summary: "Turns the array into a max heap, then repeatedly extracts the largest value.",
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(1)",
    stable: "No",
    bestUseCase: "Useful when worst-case O(n log n) time and constant extra space are important.",
    pseudocode: [
      "build a max heap",
      "compare a parent with its children",
      "swap the larger child upward",
      "move the heap root to the end",
      "shrink the heap and repair it",
    ],
  },
  counting: {
    key: "counting",
    name: "Counting Sort",
    summary: "Counts how often each value appears, then writes values back in order.",
    time: { best: "O(n + k)", average: "O(n + k)", worst: "O(n + k)" },
    space: "O(k)",
    stable: "Yes with stable output",
    bestUseCase: "Excellent for integer data with a small value range.",
    pseudocode: [
      "count each value",
      "walk through counts from low to high",
      "write each value back into the array",
      "mark each written position sorted",
    ],
  },
  radix: {
    key: "radix",
    name: "Radix Sort",
    summary: "Sorts integers digit by digit from least significant to most significant.",
    time: { best: "O(d(n + b))", average: "O(d(n + b))", worst: "O(d(n + b))" },
    space: "O(n + b)",
    stable: "Yes",
    bestUseCase: "Great for fixed-width positive integers.",
    pseudocode: [
      "for each digit place",
      "  count digit frequencies",
      "  build stable digit positions",
      "  write values in digit order",
      "mark the fully sorted array",
    ],
  },
  shell: {
    key: "shell",
    name: "Shell Sort",
    summary: "Performs insertion-sort style passes across shrinking gaps.",
    time: { best: "O(n log n)", average: "Depends on gaps", worst: "O(n^2)" },
    space: "O(1)",
    stable: "No",
    bestUseCase: "A compact in-place sort that improves on insertion sort for medium arrays.",
    pseudocode: [
      "start with a large gap",
      "run gapped insertion sort",
      "compare values gap positions apart",
      "shift larger values forward",
      "shrink the gap until it is 1",
    ],
  },
  tim: {
    key: "tim",
    name: "Tim Sort",
    summary: "A practical hybrid that insertion-sorts small runs and merges them efficiently.",
    time: { best: "O(n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
    stable: "Yes",
    bestUseCase: "Real-world lists with existing ordered runs, similar to Python and JavaScript engines.",
    pseudocode: [
      "split input into small runs",
      "insertion sort each run",
      "merge neighboring runs",
      "double the run size",
      "mark the completed array",
    ],
  },
};

export function getAnimationSteps(algorithm: AlgorithmKey, input: number[]): AnimationStep[] {
  switch (algorithm) {
    case "bubble":
      return bubbleSortSteps(input);
    case "selection":
      return selectionSortSteps(input);
    case "insertion":
      return insertionSortSteps(input);
    case "merge":
      return mergeSortSteps(input);
    case "quick":
      return quickSortSteps(input);
    case "heap":
      return heapSortSteps(input);
    case "counting":
      return countingSortSteps(input);
    case "radix":
      return radixSortSteps(input);
    case "shell":
      return shellSortSteps(input);
    case "tim":
      return timSortSteps(input);
  }
}

function bubbleSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const n = arr.length;

  for (let pass = 0; pass < n; pass += 1) {
    let swapped = false;
    for (let index = 0; index < n - pass - 1; index += 1) {
      steps.push(compareStep([index, index + 1], 1, { activeRange: [0, n - pass - 1] }));
      if (arr[index] > arr[index + 1]) {
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        steps.push(swapStep([index, index + 1], 3, { activeRange: [0, n - pass - 1] }));
        swapped = true;
      }
    }
    steps.push(markSortedStep([n - pass - 1], 4));
    if (!swapped) {
      steps.push(markEveryIndex(n, 4));
      break;
    }
  }

  return finishSteps(steps, n, 4);
}

function selectionSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const n = arr.length;

  for (let index = 0; index < n; index += 1) {
    let minIndex = index;
    for (let scan = index + 1; scan < n; scan += 1) {
      steps.push(compareStep([minIndex, scan], 1, { activeRange: [index, n - 1] }));
      if (arr[scan] < arr[minIndex]) {
        minIndex = scan;
      }
    }
    if (minIndex !== index) {
      [arr[index], arr[minIndex]] = [arr[minIndex], arr[index]];
      steps.push(swapStep([index, minIndex], 3, { activeRange: [index, n - 1] }));
    }
    steps.push(markSortedStep([index], 4));
  }

  return finishSteps(steps, n, 4);
}

function insertionSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const n = arr.length;

  if (n > 0) {
    steps.push(markSortedStep([0], 4, { activeRange: [0, 0] }));
  }

  for (let index = 1; index < n; index += 1) {
    const key = arr[index];
    let scan = index - 1;

    while (scan >= 0) {
      steps.push(compareStep([scan, scan + 1], 2, { activeRange: [0, index] }));
      if (arr[scan] <= key) break;
      arr[scan + 1] = arr[scan];
      steps.push(overwriteStep([scan + 1], [arr[scan]], 2, { activeRange: [0, index] }));
      scan -= 1;
    }

    arr[scan + 1] = key;
    steps.push(overwriteStep([scan + 1], [key], 3, { activeRange: [0, index] }));
    steps.push(markSortedStep(range(0, index), 4, { activeRange: [0, index] }));
  }

  return finishSteps(steps, n, 4);
}

function mergeSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];

  function mergeSort(left: number, right: number) {
    if (left >= right) return;
    const middle = Math.floor((left + right) / 2);
    mergeSort(left, middle);
    mergeSort(middle + 1, right);
    merge(left, middle, right);
  }

  function merge(left: number, middle: number, right: number) {
    const leftValues = arr.slice(left, middle + 1);
    const rightValues = arr.slice(middle + 1, right + 1);
    let leftIndex = 0;
    let rightIndex = 0;
    let writeIndex = left;

    while (leftIndex < leftValues.length && rightIndex < rightValues.length) {
      const sourceLeft = left + leftIndex;
      const sourceRight = middle + 1 + rightIndex;
      steps.push(compareStep([sourceLeft, sourceRight], 3, { activeRange: [left, right] }));
      if (leftValues[leftIndex] <= rightValues[rightIndex]) {
        arr[writeIndex] = leftValues[leftIndex];
        steps.push(overwriteStep([writeIndex], [leftValues[leftIndex]], 4, { activeRange: [left, right] }));
        leftIndex += 1;
      } else {
        arr[writeIndex] = rightValues[rightIndex];
        steps.push(overwriteStep([writeIndex], [rightValues[rightIndex]], 4, { activeRange: [left, right] }));
        rightIndex += 1;
      }
      writeIndex += 1;
    }

    while (leftIndex < leftValues.length) {
      arr[writeIndex] = leftValues[leftIndex];
      steps.push(overwriteStep([writeIndex], [leftValues[leftIndex]], 5, { activeRange: [left, right] }));
      leftIndex += 1;
      writeIndex += 1;
    }

    while (rightIndex < rightValues.length) {
      arr[writeIndex] = rightValues[rightIndex];
      steps.push(overwriteStep([writeIndex], [rightValues[rightIndex]], 5, { activeRange: [left, right] }));
      rightIndex += 1;
      writeIndex += 1;
    }
  }

  mergeSort(0, arr.length - 1);
  return finishSteps(steps, arr.length, 5);
}

function quickSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];

  function quickSort(low: number, high: number) {
    if (low > high) return;
    if (low === high) {
      steps.push(markSortedStep([low], 5, { activeRange: [low, high] }));
      return;
    }

    const pivotIndex = partition(low, high);
    steps.push(markSortedStep([pivotIndex], 4, { pivotIndex, activeRange: [low, high] }));
    quickSort(low, pivotIndex - 1);
    quickSort(pivotIndex + 1, high);
  }

  function partition(low: number, high: number) {
    const pivotValue = arr[high];
    let storeIndex = low;

    for (let scan = low; scan < high; scan += 1) {
      steps.push(compareStep([scan, high], 1, { pivotIndex: high, activeRange: [low, high] }));
      if (arr[scan] <= pivotValue) {
        if (scan !== storeIndex) {
          [arr[storeIndex], arr[scan]] = [arr[scan], arr[storeIndex]];
          steps.push(swapStep([storeIndex, scan], 3, { pivotIndex: high, activeRange: [low, high] }));
        }
        storeIndex += 1;
      }
    }

    [arr[storeIndex], arr[high]] = [arr[high], arr[storeIndex]];
    steps.push(swapStep([storeIndex, high], 4, { pivotIndex: high, activeRange: [low, high] }));
    return storeIndex;
  }

  quickSort(0, arr.length - 1);
  return finishSteps(steps, arr.length, 5);
}

function heapSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const n = arr.length;

  function heapify(size: number, root: number) {
    let largest = root;
    const left = root * 2 + 1;
    const right = root * 2 + 2;

    if (left < size) {
      steps.push(compareStep([largest, left], 1, { activeRange: [0, size - 1] }));
      if (arr[left] > arr[largest]) largest = left;
    }

    if (right < size) {
      steps.push(compareStep([largest, right], 1, { activeRange: [0, size - 1] }));
      if (arr[right] > arr[largest]) largest = right;
    }

    if (largest !== root) {
      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      steps.push(swapStep([root, largest], 2, { activeRange: [0, size - 1] }));
      heapify(size, largest);
    }
  }

  for (let index = Math.floor(n / 2) - 1; index >= 0; index -= 1) {
    heapify(n, index);
  }

  for (let end = n - 1; end > 0; end -= 1) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    steps.push(swapStep([0, end], 3, { activeRange: [0, end] }));
    steps.push(markSortedStep([end], 3));
    heapify(end, 0);
  }

  if (n > 0) steps.push(markSortedStep([0], 4));
  return finishSteps(steps, n, 4);
}

function countingSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const counts = Array.from({ length: max - min + 1 }, () => 0);

  arr.forEach((value, index) => {
    counts[value - min] += 1;
    steps.push(compareStep([index], 0));
  });

  let writeIndex = 0;
  counts.forEach((count, offset) => {
    for (let copy = 0; copy < count; copy += 1) {
      const value = offset + min;
      arr[writeIndex] = value;
      steps.push(overwriteStep([writeIndex], [value], 2));
      steps.push(markSortedStep([writeIndex], 3));
      writeIndex += 1;
    }
  });

  return finishSteps(steps, arr.length, 3);
}

function radixSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const max = Math.max(...arr);

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const output = Array.from({ length: arr.length }, () => 0);
    const counts = Array.from({ length: 10 }, () => 0);

    for (let index = 0; index < arr.length; index += 1) {
      const digit = Math.floor(arr[index] / exp) % 10;
      counts[digit] += 1;
      steps.push(compareStep([index], 1));
    }

    for (let index = 1; index < 10; index += 1) {
      counts[index] += counts[index - 1];
    }

    for (let index = arr.length - 1; index >= 0; index -= 1) {
      const digit = Math.floor(arr[index] / exp) % 10;
      output[counts[digit] - 1] = arr[index];
      counts[digit] -= 1;
    }

    for (let index = 0; index < arr.length; index += 1) {
      arr[index] = output[index];
      steps.push(overwriteStep([index], [output[index]], 3));
    }
  }

  return finishSteps(steps, arr.length, 4);
}

function shellSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const n = arr.length;

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let index = gap; index < n; index += 1) {
      const temp = arr[index];
      let scan = index;

      while (scan >= gap) {
        steps.push(compareStep([scan - gap, scan], 2, { activeRange: [0, n - 1] }));
        if (arr[scan - gap] <= temp) break;
        arr[scan] = arr[scan - gap];
        steps.push(overwriteStep([scan], [arr[scan - gap]], 3, { activeRange: [0, n - 1] }));
        scan -= gap;
      }

      arr[scan] = temp;
      steps.push(overwriteStep([scan], [temp], 3, { activeRange: [0, n - 1] }));
    }
  }

  return finishSteps(steps, n, 4);
}

function timSortSteps(input: number[]): AnimationStep[] {
  const arr = [...input];
  const steps: AnimationStep[] = [];
  const n = arr.length;
  const run = 32;

  for (let start = 0; start < n; start += run) {
    insertionRun(start, Math.min(start + run - 1, n - 1));
  }

  for (let size = run; size < n; size *= 2) {
    for (let left = 0; left < n; left += size * 2) {
      const middle = Math.min(left + size - 1, n - 1);
      const right = Math.min(left + size * 2 - 1, n - 1);
      if (middle < right) merge(left, middle, right);
    }
  }

  function insertionRun(left: number, right: number) {
    for (let index = left + 1; index <= right; index += 1) {
      const key = arr[index];
      let scan = index - 1;
      while (scan >= left) {
        steps.push(compareStep([scan, scan + 1], 1, { activeRange: [left, right] }));
        if (arr[scan] <= key) break;
        arr[scan + 1] = arr[scan];
        steps.push(overwriteStep([scan + 1], [arr[scan]], 1, { activeRange: [left, right] }));
        scan -= 1;
      }
      arr[scan + 1] = key;
      steps.push(overwriteStep([scan + 1], [key], 1, { activeRange: [left, right] }));
    }
  }

  function merge(left: number, middle: number, right: number) {
    const leftValues = arr.slice(left, middle + 1);
    const rightValues = arr.slice(middle + 1, right + 1);
    let leftIndex = 0;
    let rightIndex = 0;
    let writeIndex = left;

    while (leftIndex < leftValues.length && rightIndex < rightValues.length) {
      const sourceLeft = left + leftIndex;
      const sourceRight = middle + 1 + rightIndex;
      steps.push(compareStep([sourceLeft, sourceRight], 2, { activeRange: [left, right] }));
      if (leftValues[leftIndex] <= rightValues[rightIndex]) {
        arr[writeIndex] = leftValues[leftIndex];
        steps.push(overwriteStep([writeIndex], [leftValues[leftIndex]], 2, { activeRange: [left, right] }));
        leftIndex += 1;
      } else {
        arr[writeIndex] = rightValues[rightIndex];
        steps.push(overwriteStep([writeIndex], [rightValues[rightIndex]], 2, { activeRange: [left, right] }));
        rightIndex += 1;
      }
      writeIndex += 1;
    }

    while (leftIndex < leftValues.length) {
      arr[writeIndex] = leftValues[leftIndex];
      steps.push(overwriteStep([writeIndex], [leftValues[leftIndex]], 2, { activeRange: [left, right] }));
      leftIndex += 1;
      writeIndex += 1;
    }

    while (rightIndex < rightValues.length) {
      arr[writeIndex] = rightValues[rightIndex];
      steps.push(overwriteStep([writeIndex], [rightValues[rightIndex]], 2, { activeRange: [left, right] }));
      rightIndex += 1;
      writeIndex += 1;
    }
  }

  return finishSteps(steps, n, 4);
}

function finishSteps(steps: AnimationStep[], length: number, pseudocodeLine: number): AnimationStep[] {
  const last = steps.at(-1);
  const alreadyMarkedAll = last?.type === "markSorted" && last.indices.length === length;
  return alreadyMarkedAll ? steps : [...steps, markEveryIndex(length, pseudocodeLine)];
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
}
