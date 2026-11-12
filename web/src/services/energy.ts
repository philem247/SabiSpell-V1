import { Config } from '../config';

export interface EnergyRefillResult {
  energy: number;
  lastRefillTs: number;
}

export interface EnergyDeductResult {
  success: boolean;
  energy: number;
  lastRefillTs: number;
}

export function calculateEnergyRefill(
  currentEnergy: number,
  lastRefillTs: number,
  now: number,
): EnergyRefillResult {
  if (currentEnergy >= Config.ENERGY_CAP) {
    return { energy: Config.ENERGY_CAP, lastRefillTs: now };
  }
  const pips = Math.floor((now - lastRefillTs) / Config.ENERGY_REFILL_INTERVAL_MS);
  if (pips <= 0) return { energy: currentEnergy, lastRefillTs };

  const energy = Math.min(Config.ENERGY_CAP, currentEnergy + pips);
  if (energy >= Config.ENERGY_CAP) return { energy, lastRefillTs: now };
  return { energy, lastRefillTs: lastRefillTs + pips * Config.ENERGY_REFILL_INTERVAL_MS };
}

export function deductEnergy(
  currentEnergy: number,
  amount: number,
  lastRefillTs: number,
  now: number,
): EnergyDeductResult {
  const refilled = calculateEnergyRefill(currentEnergy, lastRefillTs, now);
  if (refilled.energy < amount) {
    return { success: false, energy: refilled.energy, lastRefillTs: refilled.lastRefillTs };
  }
  const wasFull = refilled.energy >= Config.ENERGY_CAP;
  return {
    success: true,
    energy: refilled.energy - amount,
    lastRefillTs: wasFull ? now : refilled.lastRefillTs,
  };
}
