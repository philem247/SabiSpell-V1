import { AppConfig } from '../constants/AppConfig';

export interface EnergyRefillResult {
  energy: number;
  lastRefillTs: number;
}

export interface EnergyDeductResult {
  success: boolean;
  energy: number;
  lastRefillTs: number;
}

/**
 * Returns the maximum energy capacity for the player.
 */
export function getEnergyCap(): number {
  return AppConfig.ENERGY_CAP;
}

/**
 * Computes energy levels and the next-pip timestamp based on elapsed wall-clock time.
 *
 * Rules:
 * - If current energy is already at or above cap, return current energy and update refill timestamp to now.
 * - Compute elapsed time since last refill timestamp.
 * - Add energy pips based on full 15-minute intervals elapsed.
 * - Cap the energy at AppConfig.ENERGY_CAP.
 * - Shift the last refill timestamp forward by the exact elapsed pip intervals to preserve fractional progress.
 */
export function calculateEnergyRefill(
  currentEnergy: number,
  lastRefillTs: number,
  now: number
): EnergyRefillResult {
  const cap = getEnergyCap();

  if (currentEnergy >= cap) {
    return { energy: currentEnergy, lastRefillTs: now };
  }

  const elapsedMs = now - lastRefillTs;
  const intervalMs = AppConfig.ENERGY_REFILL_INTERVAL_MS;

  if (elapsedMs >= intervalMs) {
    const pipsToAdd = Math.floor(elapsedMs / intervalMs);
    const newEnergy = Math.min(cap, currentEnergy + pipsToAdd);
    const newRefillTs = lastRefillTs + pipsToAdd * intervalMs;

    return {
      energy: newEnergy,
      lastRefillTs: newEnergy === cap ? now : newRefillTs,
    };
  }

  return { energy: currentEnergy, lastRefillTs };
}

/**
 * Attempts to deduct energy, first applying any pending wall-clock refills.
 *
 * Rules:
 * - Run calculateEnergyRefill first to catch up on any offline pips.
 * - Check if the refilled energy has enough pips to cover the amount.
 * - If insufficient, return success = false with unchanged refilled states.
 * - If sufficient, subtract amount, and if energy was at capacity, update last refill timestamp to now.
 */
export function deductEnergy(
  currentEnergy: number,
  amount: number,
  lastRefillTs: number,
  now: number
): EnergyDeductResult {
  // 1. Catch up on wall-clock energy additions first
  const refilled = calculateEnergyRefill(currentEnergy, lastRefillTs, now);

  // 2. Check if player has enough energy to deduct
  if (refilled.energy < amount) {
    return {
      success: false,
      energy: refilled.energy,
      lastRefillTs: refilled.lastRefillTs,
    };
  }

  // 3. Deduct energy
  const newEnergy = refilled.energy - amount;
  const cap = getEnergyCap();

  return {
    success: true,
    energy: newEnergy,
    // If energy drops from capacity, start the refill timer now. Otherwise, preserve progress.
    lastRefillTs: refilled.energy === cap ? now : refilled.lastRefillTs,
  };
}
