export type StageId =
  | "intake"
  | "compression"
  | "combustion"
  | "exhaust"
  | "rotorIntake"
  | "rotorCompression"
  | "rotorPower"
  | "rotorExhaust"
  | "magnetize"
  | "pull"
  | "rotate"
  | "regen";

export type EngineFamily = "Internal Combustion" | "Advanced / Modern";

export type EngineModelKind =
  | "inline"
  | "v"
  | "boxer"
  | "rotary"
  | "diesel"
  | "hybrid"
  | "electric"
  | "turbocharged"
  | "supercharged";

export type EngineId =
  | "inline-i4"
  | "inline-i6"
  | "v6"
  | "v8"
  | "boxer"
  | "rotary"
  | "diesel"
  | "hybrid"
  | "electric"
  | "turbocharged"
  | "supercharged";

export type ComponentId =
  | "block"
  | "piston"
  | "crankshaft"
  | "connectingRod"
  | "valves"
  | "sparkPlug"
  | "injector"
  | "rotor"
  | "stator"
  | "turbo"
  | "supercharger"
  | "battery"
  | "airflow"
  | "fuel"
  | "exhaust";

export type SpeedMode = "slow" | "normal" | "fast";

export interface EngineStage {
  id: StageId;
  name: string;
  color: string;
  description: string;
}

export interface EngineData {
  id: EngineId;
  name: string;
  shortName: string;
  family: EngineFamily;
  type: string;
  modelKind: EngineModelKind;
  cylinders: number;
  banks: number;
  layout: string;
  color: string;
  torqueColor: string;
  overview: string;
  cycleStages: EngineStage[];
  howItWorks: string[];
  advantages: string[];
  disadvantages: string[];
  usage: string[];
  components: ComponentId[];
  componentNotes: Partial<Record<ComponentId, string>>;
  comparison: {
    structure: string;
    efficiency: string;
    powerDelivery: string;
  };
  metrics: {
    efficiency: number;
    powerDensity: number;
    smoothness: number;
    complexity: number;
  };
  torqueProfile: {
    low: number;
    mid: number;
    high: number;
  };
}

export const fourStrokeStages: EngineStage[] = [
  {
    id: "intake",
    name: "Intake",
    color: "#2f80ed",
    description: "The intake valve opens and the piston moves down, pulling in air or air-fuel mixture."
  },
  {
    id: "compression",
    name: "Compression",
    color: "#f2c94c",
    description: "Valves close and the piston rises, squeezing the charge so it can release more energy."
  },
  {
    id: "combustion",
    name: "Combustion",
    color: "#eb5757",
    description: "Spark or compression ignition forces the piston down and turns the crankshaft."
  },
  {
    id: "exhaust",
    name: "Exhaust",
    color: "#8a8f98",
    description: "The exhaust valve opens and the piston pushes burnt gases out of the cylinder."
  }
];

export const rotaryStages: EngineStage[] = [
  {
    id: "rotorIntake",
    name: "Intake pocket",
    color: "#2f80ed",
    description: "A rotor chamber grows as it passes the intake port and pulls mixture inside."
  },
  {
    id: "rotorCompression",
    name: "Compression pocket",
    color: "#f2c94c",
    description: "The chamber shrinks while the triangular rotor sweeps the charge around the housing."
  },
  {
    id: "rotorPower",
    name: "Power pocket",
    color: "#eb5757",
    description: "Ignition expands the chamber and pushes the rotor around the eccentric shaft."
  },
  {
    id: "rotorExhaust",
    name: "Exhaust pocket",
    color: "#8a8f98",
    description: "The chamber opens to the exhaust port and clears the spent gas."
  }
];

export const electricStages: EngineStage[] = [
  {
    id: "magnetize",
    name: "Energize stator",
    color: "#56ccf2",
    description: "Power electronics energize stator windings in a timed magnetic sequence."
  },
  {
    id: "pull",
    name: "Pull rotor",
    color: "#bb6bd9",
    description: "The magnetic field pulls permanent magnets or induced current on the rotor."
  },
  {
    id: "rotate",
    name: "Torque output",
    color: "#27ae60",
    description: "The rotating field keeps leading the rotor, creating smooth torque at the shaft."
  },
  {
    id: "regen",
    name: "Regeneration",
    color: "#f2994a",
    description: "When coasting or braking, the motor can act as a generator and return energy."
  }
];

export const engines: Record<EngineId, EngineData> = {
  "inline-i4": {
    id: "inline-i4",
    name: "Inline 4-Cylinder Engine",
    shortName: "I4",
    family: "Internal Combustion",
    type: "Gasoline four-stroke piston engine",
    modelKind: "inline",
    cylinders: 4,
    banks: 1,
    layout: "Four cylinders in one straight bank with one crankshaft.",
    color: "#2f80ed",
    torqueColor: "#2f80ed",
    overview:
      "The inline four is compact, efficient, and common. Pistons share one straight cylinder bank and fire at staggered crank angles.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Air and fuel enter through intake valves as each piston moves down.",
      "The piston rises to compress the charge inside the cylinder.",
      "A spark plug fires near top dead center and pressure drives the piston down.",
      "Exhaust valves open so the next upward stroke pushes gases out."
    ],
    advantages: ["Compact packaging", "Good fuel economy", "Low manufacturing cost", "Easy service access"],
    disadvantages: ["More vibration than six-cylinder layouts", "Limited peak power without boosting", "Less premium sound"],
    usage: ["Toyota Corolla", "Honda Civic", "Mazda3", "Volkswagen Golf"],
    components: ["block", "piston", "connectingRod", "crankshaft", "valves", "sparkPlug", "airflow", "exhaust"],
    componentNotes: {
      block: "The cylinder block keeps all four bores aligned and routes coolant around the hot chambers.",
      piston: "Pistons seal combustion pressure with rings and convert expanding gas into linear motion.",
      crankshaft: "The crankshaft turns the staggered piston strokes into a steady rotating output.",
      valves: "Intake and exhaust valves time the gas exchange for each cylinder.",
      sparkPlug: "The spark plug starts combustion in gasoline versions just before peak compression."
    },
    comparison: {
      structure: "Single straight bank, small footprint, one cylinder head.",
      efficiency: "Usually efficient because friction and weight are moderate.",
      powerDelivery: "Responsive and economical, but less naturally smooth than I6 or V8 layouts."
    },
    metrics: { efficiency: 78, powerDensity: 62, smoothness: 58, complexity: 35 },
    torqueProfile: { low: 42, mid: 68, high: 58 }
  },
  "inline-i6": {
    id: "inline-i6",
    name: "Inline 6-Cylinder Engine",
    shortName: "I6",
    family: "Internal Combustion",
    type: "Gasoline four-stroke piston engine",
    modelKind: "inline",
    cylinders: 6,
    banks: 1,
    layout: "Six cylinders in a long single bank.",
    color: "#1f9d8a",
    torqueColor: "#1f9d8a",
    overview:
      "The inline six is naturally balanced. Its long crankshaft and evenly spaced firing pulses make it smooth and strong.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Six pistons move in paired patterns that cancel much of the vibration.",
      "Each cylinder runs the same intake, compression, combustion, and exhaust sequence.",
      "The firing order spreads torque pulses evenly across two crank rotations.",
      "The long crankshaft sends a smooth output to the transmission."
    ],
    advantages: ["Excellent smoothness", "Strong midrange torque", "Simple single-head layout", "Premium engine feel"],
    disadvantages: ["Long engine bay requirement", "Heavier than an I4", "More friction and parts"],
    usage: ["BMW 3 Series", "Toyota Supra", "Jeep Wagoneer", "Mazda CX-90"],
    components: ["block", "piston", "connectingRod", "crankshaft", "valves", "sparkPlug", "airflow", "exhaust"],
    componentNotes: {
      block: "The long block carries six aligned cylinders and needs stiff crank support.",
      crankshaft: "Crank throws are spaced so primary and secondary forces balance naturally.",
      piston: "Opposing piston pairs help cancel vibration without balance shafts."
    },
    comparison: {
      structure: "Long straight bank with six cylinders and one head.",
      efficiency: "Can be efficient for its output, although friction is higher than an I4.",
      powerDelivery: "Very smooth, linear, and strong through the middle of the rev range."
    },
    metrics: { efficiency: 72, powerDensity: 68, smoothness: 91, complexity: 48 },
    torqueProfile: { low: 58, mid: 78, high: 70 }
  },
  v6: {
    id: "v6",
    name: "V6 Engine",
    shortName: "V6",
    family: "Internal Combustion",
    type: "Gasoline four-stroke piston engine",
    modelKind: "v",
    cylinders: 6,
    banks: 2,
    layout: "Two angled cylinder banks sharing one crankshaft.",
    color: "#9b51e0",
    torqueColor: "#9b51e0",
    overview:
      "A V6 folds six cylinders into a shorter package. It is common in crossovers, sedans, and trucks that need more power than an I4.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Two banks alternate firing pulses into one crankshaft.",
      "Each cylinder follows the four-stroke cycle with its own valves and ignition.",
      "The V angle saves length but adds bank-to-bank packaging complexity.",
      "Balance shafts or careful crank design reduce vibration depending on the angle."
    ],
    advantages: ["Shorter than an inline six", "Good power in a compact bay", "Broad vehicle compatibility"],
    disadvantages: ["Two cylinder heads", "More complex exhaust routing", "Usually less smooth than an I6"],
    usage: ["Toyota Camry V6", "Ford F-150 V6", "Nissan Z", "Honda Ridgeline"],
    components: ["block", "piston", "connectingRod", "crankshaft", "valves", "sparkPlug", "airflow", "exhaust"],
    componentNotes: {
      block: "The V block splits cylinders across two banks to reduce total engine length.",
      crankshaft: "Shared crank pins coordinate two angled banks into one rotating output.",
      valves: "Each bank has its own valve train, intake runner, and exhaust path."
    },
    comparison: {
      structure: "Two compact banks in a V, usually with two heads.",
      efficiency: "Efficient for packaging and power, but has more friction than smaller engines.",
      powerDelivery: "Strong and flexible, with more character than an inline four."
    },
    metrics: { efficiency: 66, powerDensity: 75, smoothness: 70, complexity: 62 },
    torqueProfile: { low: 54, mid: 76, high: 72 }
  },
  v8: {
    id: "v8",
    name: "V8 Engine",
    shortName: "V8",
    family: "Internal Combustion",
    type: "Gasoline four-stroke piston engine",
    modelKind: "v",
    cylinders: 8,
    banks: 2,
    layout: "Two four-cylinder banks arranged in a V.",
    color: "#eb5757",
    torqueColor: "#eb5757",
    overview:
      "The V8 uses eight pistons and a short, wide layout to deliver big torque, quick response, and a distinctive exhaust pulse.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Four cylinders on each bank alternate power strokes through a shared crankshaft.",
      "Large displacement creates strong cylinder pressure and torque.",
      "Cross-plane or flat-plane crank design changes vibration, sound, and response.",
      "The exhaust system shapes pulse timing and scavenging."
    ],
    advantages: ["High torque", "Strong power density", "Distinct sound", "Good for heavy loads"],
    disadvantages: ["Higher fuel use", "More heat", "Wide package", "More moving parts"],
    usage: ["Ford Mustang GT", "Chevrolet Corvette", "Dodge Charger", "Mercedes-AMG models"],
    components: ["block", "piston", "connectingRod", "crankshaft", "valves", "sparkPlug", "airflow", "exhaust"],
    componentNotes: {
      crankshaft: "The crankshaft receives frequent power pulses that make the engine feel muscular.",
      exhaust: "Exhaust pulse spacing is a major part of the V8 sound and scavenging behavior.",
      piston: "Eight pistons give more total displacement and torque capacity."
    },
    comparison: {
      structure: "Two banks of four cylinders with a short but wide footprint.",
      efficiency: "Powerful but usually less fuel efficient than smaller engines.",
      powerDelivery: "Immediate, heavy torque with frequent combustion pulses."
    },
    metrics: { efficiency: 52, powerDensity: 88, smoothness: 78, complexity: 72 },
    torqueProfile: { low: 78, mid: 88, high: 82 }
  },
  boxer: {
    id: "boxer",
    name: "Flat / Boxer Engine",
    shortName: "Boxer",
    family: "Internal Combustion",
    type: "Horizontally opposed four-stroke engine",
    modelKind: "boxer",
    cylinders: 4,
    banks: 2,
    layout: "Opposed cylinders lay flat and move away from each other.",
    color: "#f2994a",
    torqueColor: "#f2994a",
    overview:
      "A boxer engine lays cylinders flat on opposite sides of the crankshaft, lowering the center of gravity and balancing piston movement.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Opposed pistons move outward and inward like mirror pairs.",
      "Each cylinder still completes intake, compression, combustion, and exhaust.",
      "The low, wide layout reduces body roll and improves weight placement.",
      "Exhaust and intake routing run across both sides of the engine bay."
    ],
    advantages: ["Low center of gravity", "Good natural balance", "Distinct sound", "Short engine height"],
    disadvantages: ["Wide package", "Service access can be tight", "More complex exhaust routing"],
    usage: ["Subaru WRX", "Subaru Outback", "Porsche 911", "Toyota GR86"],
    components: ["block", "piston", "connectingRod", "crankshaft", "valves", "sparkPlug", "airflow", "exhaust"],
    componentNotes: {
      piston: "Opposed piston motion cancels much of the shaking force.",
      crankshaft: "The crankshaft sits low between the opposing cylinder banks.",
      block: "The flat block is wide but helps lower the vehicle center of gravity."
    },
    comparison: {
      structure: "Flat opposing banks with pistons moving horizontally.",
      efficiency: "Comparable to similar piston engines, with packaging tradeoffs.",
      powerDelivery: "Smooth and planted-feeling because the mass sits low."
    },
    metrics: { efficiency: 64, powerDensity: 66, smoothness: 82, complexity: 64 },
    torqueProfile: { low: 56, mid: 72, high: 67 }
  },
  rotary: {
    id: "rotary",
    name: "Rotary Engine",
    shortName: "Wankel",
    family: "Internal Combustion",
    type: "Wankel rotary engine",
    modelKind: "rotary",
    cylinders: 0,
    banks: 0,
    layout: "A triangular rotor sweeps chambers around an oval housing.",
    color: "#f2c94c",
    torqueColor: "#f2c94c",
    overview:
      "The Wankel rotary replaces pistons with a triangular rotor. Chamber volume changes as the rotor turns inside the housing.",
    cycleStages: rotaryStages,
    howItWorks: [
      "The rotor opens a chamber to the intake port and the chamber grows.",
      "The rotor carries the trapped mixture forward and compresses it.",
      "Spark ignition expands the pocket and turns the eccentric shaft.",
      "The rotor uncovers the exhaust port and clears the spent gases."
    ],
    advantages: ["Compact size", "Very smooth rotation", "High rpm potential", "Few reciprocating parts"],
    disadvantages: ["Apex seal wear", "Fuel economy challenges", "Oil consumption", "Emissions difficulty"],
    usage: ["Mazda RX-7", "Mazda RX-8", "Mazda Cosmo", "Mazda MX-30 R-EV range extender"],
    components: ["block", "rotor", "sparkPlug", "airflow", "fuel", "exhaust", "crankshaft"],
    componentNotes: {
      rotor: "The triangular rotor creates three moving chambers that each perform the engine cycle.",
      block: "The epitrochoid housing changes chamber volume as the rotor sweeps around.",
      sparkPlug: "Many rotary designs use two plugs per chamber region for more complete burn."
    },
    comparison: {
      structure: "A rotor and eccentric shaft instead of pistons, rods, and cylinders.",
      efficiency: "Compact and smooth, but thermal shape and sealing hurt economy.",
      powerDelivery: "Smooth, high-revving, and light, with modest low-speed torque."
    },
    metrics: { efficiency: 45, powerDensity: 82, smoothness: 90, complexity: 55 },
    torqueProfile: { low: 36, mid: 62, high: 86 }
  },
  diesel: {
    id: "diesel",
    name: "Diesel Engine",
    shortName: "Diesel",
    family: "Internal Combustion",
    type: "Compression-ignition piston engine",
    modelKind: "diesel",
    cylinders: 4,
    banks: 1,
    layout: "Strong piston engine with high compression and direct fuel injection.",
    color: "#6f7d8c",
    torqueColor: "#6f7d8c",
    overview:
      "Diesel engines compress air until it is hot enough for injected fuel to ignite without a spark plug.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Only air enters during the intake stroke.",
      "Very high compression heats the air inside the cylinder.",
      "Fuel is injected at high pressure and auto-ignites in the hot air.",
      "The exhaust stroke clears gases, often through a turbocharger."
    ],
    advantages: ["High efficiency", "Strong low-end torque", "Durable construction", "Good towing range"],
    disadvantages: ["More noise and vibration", "Aftertreatment complexity", "Higher engine mass", "NOx and particulate control"],
    usage: ["Ford Power Stroke trucks", "Ram Cummins trucks", "Volkswagen TDI models", "Mercedes-Benz diesels"],
    components: ["block", "piston", "connectingRod", "crankshaft", "valves", "injector", "airflow", "exhaust"],
    componentNotes: {
      injector: "The injector sprays fuel into hot compressed air at precise timing and pressure.",
      piston: "Diesel pistons withstand higher compression and often include a bowl for air-fuel mixing.",
      block: "The block and crank are reinforced for high cylinder pressure."
    },
    comparison: {
      structure: "Similar piston layout, but stronger and built around compression ignition.",
      efficiency: "Excellent thermal efficiency because compression ratio is high.",
      powerDelivery: "Heavy low-rpm torque, slower revving than many gasoline engines."
    },
    metrics: { efficiency: 86, powerDensity: 64, smoothness: 54, complexity: 74 },
    torqueProfile: { low: 86, mid: 76, high: 48 }
  },
  hybrid: {
    id: "hybrid",
    name: "Hybrid Engine",
    shortName: "Hybrid",
    family: "Advanced / Modern",
    type: "Internal combustion engine plus electric motor",
    modelKind: "hybrid",
    cylinders: 4,
    banks: 1,
    layout: "A piston engine works with an electric motor, inverter, and battery.",
    color: "#27ae60",
    torqueColor: "#27ae60",
    overview:
      "A hybrid blends an internal combustion engine with electric torque and regenerative braking to reduce fuel use.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "The electric motor can launch the car or assist the engine during acceleration.",
      "The combustion engine runs when efficient or when more power is needed.",
      "A power split device, clutch, or transmission blends both torque sources.",
      "Regenerative braking sends energy back to the battery."
    ],
    advantages: ["Excellent city efficiency", "Instant electric assist", "Regenerative braking", "Reduced engine load"],
    disadvantages: ["Battery and inverter cost", "More control complexity", "More mass than a simple ICE"],
    usage: ["Toyota Prius", "Toyota RAV4 Hybrid", "Honda Accord Hybrid", "Ford Maverick Hybrid"],
    components: ["block", "piston", "crankshaft", "valves", "sparkPlug", "stator", "battery", "airflow"],
    componentNotes: {
      battery: "The traction battery stores recovered energy and supplies assist power.",
      stator: "The motor stator creates rotating magnetic fields for launch, assist, and regeneration.",
      crankshaft: "The engine crankshaft may be blended with motor torque through a transaxle or clutch."
    },
    comparison: {
      structure: "Combines a normal engine with motor-generator hardware and energy storage.",
      efficiency: "Very efficient in stop-and-go driving because it recovers braking energy.",
      powerDelivery: "Electric torque fills low-speed response while the engine handles sustained power."
    },
    metrics: { efficiency: 90, powerDensity: 72, smoothness: 84, complexity: 88 },
    torqueProfile: { low: 90, mid: 78, high: 60 }
  },
  electric: {
    id: "electric",
    name: "Electric Motor Drivetrain",
    shortName: "EV Motor",
    family: "Advanced / Modern",
    type: "Battery-electric motor and reduction drive",
    modelKind: "electric",
    cylinders: 0,
    banks: 0,
    layout: "A stator, rotor, inverter, and reduction gear deliver direct wheel torque.",
    color: "#56ccf2",
    torqueColor: "#56ccf2",
    overview:
      "An EV motor uses timed magnetic fields instead of combustion. It can make high torque from zero rpm.",
    cycleStages: electricStages,
    howItWorks: [
      "The inverter converts battery power into controlled three-phase current.",
      "Stator coils create a rotating magnetic field.",
      "The rotor follows the field and turns the output shaft.",
      "During braking, the spinning rotor can generate electricity back into the pack."
    ],
    advantages: ["Instant torque", "Few moving parts", "High efficiency", "Quiet operation", "Regenerative braking"],
    disadvantages: ["Battery mass", "Charging time", "Thermal management demands", "Rare-earth material concerns in some designs"],
    usage: ["Tesla Model 3", "Hyundai Ioniq 5", "Ford Mustang Mach-E", "Porsche Taycan"],
    components: ["stator", "rotor", "battery"],
    componentNotes: {
      stator: "The stator stays fixed and creates the rotating magnetic field.",
      rotor: "The rotor turns with the magnetic field and sends torque to a reduction gear.",
      battery: "The battery stores DC energy that the inverter meters into the motor."
    },
    comparison: {
      structure: "No pistons, valves, fuel, or exhaust. One rotating motor shaft drives gears.",
      efficiency: "Very high drivetrain efficiency compared with combustion engines.",
      powerDelivery: "Maximum torque arrives immediately and stays smooth."
    },
    metrics: { efficiency: 96, powerDensity: 90, smoothness: 98, complexity: 58 },
    torqueProfile: { low: 100, mid: 86, high: 58 }
  },
  turbocharged: {
    id: "turbocharged",
    name: "Turbocharged Engine",
    shortName: "Turbo",
    family: "Advanced / Modern",
    type: "Forced-induction piston engine",
    modelKind: "turbocharged",
    cylinders: 4,
    banks: 1,
    layout: "A turbine uses exhaust energy to drive an intake compressor.",
    color: "#2d9cdb",
    torqueColor: "#2d9cdb",
    overview:
      "A turbocharger recovers exhaust energy to compress intake air, letting a smaller engine burn more fuel-air charge when needed.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "Exhaust gas spins a turbine wheel.",
      "The turbine shaft spins a compressor wheel on the intake side.",
      "Compressed intake air increases oxygen entering the cylinders.",
      "Wastegate and boost control prevent over-pressure."
    ],
    advantages: ["High power from small displacement", "Better altitude performance", "Potential efficiency gains", "Strong midrange torque"],
    disadvantages: ["Heat management", "Lag if poorly matched", "More plumbing", "Higher stress under boost"],
    usage: ["Ford EcoBoost models", "Volkswagen GTI", "Hyundai N models", "Porsche 911 Turbo"],
    components: ["block", "piston", "crankshaft", "valves", "sparkPlug", "turbo", "airflow", "exhaust"],
    componentNotes: {
      turbo: "The turbo has an exhaust turbine and intake compressor connected by a shaft.",
      airflow: "Boost pressure packs more air mass into the cylinder before compression.",
      exhaust: "Exhaust energy that would be wasted drives the turbine wheel."
    },
    comparison: {
      structure: "Base piston engine plus turbine, compressor, intercooler, and boost controls.",
      efficiency: "Can downsize displacement while keeping power, but heat and boost strategy matter.",
      powerDelivery: "Strong surge as boost builds, with torque shaped by turbo sizing."
    },
    metrics: { efficiency: 76, powerDensity: 90, smoothness: 64, complexity: 82 },
    torqueProfile: { low: 48, mid: 92, high: 78 }
  },
  supercharged: {
    id: "supercharged",
    name: "Supercharged Engine",
    shortName: "Supercharger",
    family: "Advanced / Modern",
    type: "Mechanically forced-induction piston engine",
    modelKind: "supercharged",
    cylinders: 8,
    banks: 2,
    layout: "A belt-driven compressor forces air into the intake manifold.",
    color: "#bb6bd9",
    torqueColor: "#bb6bd9",
    overview:
      "A supercharger is driven by the crankshaft, so it can build boost immediately instead of waiting for exhaust flow.",
    cycleStages: fourStrokeStages,
    howItWorks: [
      "A belt or gear drive spins the compressor from the crankshaft.",
      "The compressor pushes denser air into the intake manifold.",
      "More oxygen allows more fuel and pressure during combustion.",
      "Boost arrives quickly because the compressor is mechanically linked."
    ],
    advantages: ["Immediate boost", "Linear throttle response", "High torque", "Dramatic sound and feel"],
    disadvantages: ["Parasitic power draw", "Heat generation", "Lower peak efficiency than a well-matched turbo", "Packaging height"],
    usage: ["Dodge Hellcat", "Chevrolet Corvette Z06/ZR1 variants", "Jaguar F-Type V8", "Audi 3.0T models"],
    components: ["block", "piston", "crankshaft", "valves", "sparkPlug", "supercharger", "airflow", "exhaust"],
    componentNotes: {
      supercharger: "The compressor is mechanically driven, so boost follows engine speed closely.",
      crankshaft: "The crankshaft powers both the wheels and the supercharger drive.",
      airflow: "Pressurized intake air fills the cylinders earlier and more forcefully."
    },
    comparison: {
      structure: "Piston engine plus belt-driven compressor, often above the intake valley.",
      efficiency: "Trades some crank power for instant airflow and torque.",
      powerDelivery: "Immediate, linear, and muscular with little boost delay."
    },
    metrics: { efficiency: 58, powerDensity: 94, smoothness: 78, complexity: 80 },
    torqueProfile: { low: 86, mid: 92, high: 84 }
  }
};

export const engineList = Object.values(engines);

export const engineGroups: Record<EngineFamily, EngineId[]> = {
  "Internal Combustion": ["inline-i4", "inline-i6", "v6", "v8", "boxer", "rotary", "diesel"],
  "Advanced / Modern": ["hybrid", "electric", "turbocharged", "supercharged"]
};

export const componentLabels: Record<ComponentId, string> = {
  block: "Engine block / housing",
  piston: "Piston",
  crankshaft: "Crankshaft",
  connectingRod: "Connecting rod",
  valves: "Valves",
  sparkPlug: "Spark plug",
  injector: "Injector",
  rotor: "Rotary rotor",
  stator: "Motor stator",
  turbo: "Turbocharger",
  supercharger: "Supercharger",
  battery: "Battery",
  airflow: "Airflow",
  fuel: "Fuel flow",
  exhaust: "Exhaust"
};
