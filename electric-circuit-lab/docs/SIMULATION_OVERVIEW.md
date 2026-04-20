# Simulation Overview

## Goal

The current engine is intentionally educational first. It aims to show why a circuit works, where the active path is, and what the learner should inspect next, instead of behaving like an opaque black box.

## Runtime Stages

### 1. Validation

`src/simulation/validation.ts` checks for:

- duplicate wires
- missing wire endpoints
- floating components
- partially connected components

### 2. Node Resolution

`src/simulation/engine.ts` assigns each connected set of wire-linked terminals to the same node. This gives the simulator a graph of electrical connection points instead of raw SVG geometry.

### 3. Source and Edge Extraction

The engine turns supported component instances into:

- sources: battery or voltage source
- conductive analog edges: resistor, lamp, LED, switch, push button, output indicator, diode
- digital producers: sensors and logic gates

Preview components such as capacitors, inductors, and transistors still exist in the builder and library, but they only emit learning notes in phase 1.

### 4. Analog Path Search

For each source, the engine searches for positive-to-return paths through conductive components. For every valid path it estimates:

- whether the circuit is closed
- branch current
- equivalent resistance
- voltage drops
- short-circuit risk

This is a phase-1 approximation aimed at simple series and branch circuits, not a full SPICE solver.

### 5. Digital Pass

After analog solving, the engine evaluates:

- threshold sensors
- AND, OR, NOT, NAND, NOR, and XOR gates
- output indicators and LEDs driven by digital high and low states

This lets logic lessons and challenges feel interactive without needing a separate app mode.

## Output

The engine returns a `SimulationResult` with:

- closed or open loop state
- current and equivalent resistance estimates
- per-component states
- powered or grounded node hints
- warnings and a readable log

## Expand Later

The engine is ready to grow into:

- transient capacitor and inductor behavior
- richer diode and transistor models
- more accurate branch solving
- timing and signal propagation
- microcontroller-style component blocks
