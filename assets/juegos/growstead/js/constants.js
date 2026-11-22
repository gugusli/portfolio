const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

const BASE = { x: 1000, y: 1000, radius: 50 };

const BTN = {
  speed:      { x: 930,  y: 1000, r: 20 },
  cap:        { x: 1070, y: 1000, r: 20 },
  helper1:    { x: 1000, y: 1070, r: 20 },
  crystal:    { x: 930,  y: 930,  r: 20 },
  helper2:    { x: 1000, y: 1140, r: 20 },
  zone2:      { x: 1070, y: 930,  r: 20 },
  refinery:   { x: 1000, y: 1210, r: 20 },
  hSpeed:     { x: 930,  y: 1070, r: 20 },
  hCap:       { x: 1070, y: 1070, r: 20 },
  prestige:   { x: 1000, y: 1280, r: 22 },
};

const MAX_OFFLINE_SECONDS = 8 * 3600;
const OFFLINE_EFFICIENCY = 0.5;
const BOOST_DURATION_MS = 120000;

const GOLD_RUSH = {
  minIntervalMs: 90000,
  maxIntervalMs: 180000,
  durationMs: 20000,
  valueMultiplier: 3,
};

const MILESTONES = [
  { id: 'deposit_100_gold', desc: 'Deposita 100 de Oro', target: 100, type: 'gold_deposited', reward: 50 },
  { id: 'buy_droid1', desc: 'Compra Droid 1', target: 1, type: 'buy_helper1', reward: 30 },
  { id: 'unlock_crystal', desc: 'Desbloquea Cristal', target: 1, type: 'unlock_crystal', reward: 60 },
  { id: 'process_50_crystal', desc: 'Procesa 50 Cristales en Refinería', target: 50, type: 'crystals_processed', reward: 100 },
  { id: 'reach_1000_coins', desc: 'Alcanza 1000 monedas', target: 1000, type: 'coins_reached', reward: 150 },
];

const CFG = {
  player: {
    speed: 4,
    maxCapacity: 10,
    radius: 15,
  },
  helper: {
    speed: 2,
    maxCapacity: 5,
    radius: 10,
    depositDelay: 10,
  },
  refinery: {
    sizeX: 60,
    sizeY: 40,
    maxInput: 40,
    maxOutput: 40,
    processingSpeed: 45,
    padRadius: 22,
  },
  timing: {
    depositInterval: 5,
    purchaseCooldown: 60,
    outputInterval: 5,
  },
  resources: {
    gold:    { size: 20, value: 1, harvestInterval: 15, helperHarvestInterval: 20, maxAmount: 100, respawnDelay: 300 },
    crystal: { size: 16, value: 4, harvestInterval: 25, helperHarvestInterval: 30, maxAmount: 100, respawnDelay: 300 },
  },
  upgrades: {
    speed:          { baseCost: 10,  inflation: 1.15 },
    capacity:       { baseCost: 15,  inflation: 1.15 },
    helper1:        { baseCost: 50,  inflation: 1.0 },
    crystal:        { baseCost: 60,  inflation: 1.0 },
    helper2:        { baseCost: 100, inflation: 1.0 },
    unlockZone2:    { baseCost: 180, inflation: 1.0 },
    refinery:       { baseCost: 250, inflation: 1.0 },
    helperSpeed:    { baseCost: 80,  inflation: 1.12 },
    helperCapacity: { baseCost: 80,  inflation: 1.12 },
  },
  prestige: {
    baseCost: 1500,
    costMultiplier: 1.5,
    bonusPerPoint: 0.15,
  },
  camera: {
    lerpFactor: 0.1,
  },
};
