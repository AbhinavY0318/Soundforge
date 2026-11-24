import { LicenseType } from '../models/Plan.js';
import { Errors } from './errors.js';

export const LICENSE_CREDIT_COSTS: Record<LicenseType, number> = {
  royalty_free: 1,
  sync: 6,
  full_ownership: 14,
};

export function calculateDurationUnits(durationSec: number): number {
  if (durationSec <= 0) {
    throw Errors.badRequest('Duration must be greater than 0 seconds.', 'invalid_duration', 'duration');
  }
  return Math.ceil(durationSec / 60);
}

export function calculateRequiredCredits(durationSec: number, license: LicenseType): {
  durationUnits: number;
  licenseCreditCost: number;
  totalCredits: number;
} {
  const licenseCreditCost = LICENSE_CREDIT_COSTS[license];
  if (licenseCreditCost === undefined) {
    throw Errors.badRequest(`Invalid license type: ${license}`, 'invalid_license', 'license');
  }

  const durationUnits = calculateDurationUnits(durationSec);
  const totalCredits = durationUnits * licenseCreditCost;

  return {
    durationUnits,
    licenseCreditCost,
    totalCredits,
  };
}
