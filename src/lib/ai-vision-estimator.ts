/**
 * Backward-compatible shim for ai-vision-estimator.ts
 * All existing imports from '@/lib/ai-vision-estimator' remain working.
 * New code should import directly from '@/lib/estimator/*'.
 */

// Types & constants
export type { RoomDimension, MaterialEstimate, EstimatorResult } from './estimator/estimator-types'
export { CONSTRUCTION_STANDARDS, MARKET_PRICES } from './estimator/estimator-types'

// AI analysis functions + recalculateEstimate (orchestration layer)
export { analyzeFloorPlanImage, estimateFromText, recalculateEstimate } from './estimator/vision-estimator'

// Pure calculation utilities
export { calculateMaterials, validateAgainstIndustryStandards } from './estimator/material-calculator'

// Product enricher
export { enrichMaterialsWithProducts } from './estimator/product-enricher'
