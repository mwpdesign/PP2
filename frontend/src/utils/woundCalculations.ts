/**
 * Wound care calculation utilities for Q code products
 */

export interface WoundMeasurement {
  length: number; // in cm
  width: number;  // in cm
  depth?: number; // in cm (optional)
}

export interface QCodeProduct {
  id: string;
  name: string;
  sku: string;
  qCode: string;
  size: string;
  surfaceAreaCm2: number;
  dimensions: string;
  unitPrice: number;
  category: 'Wound Care Matrix' | 'Amniotic Membrane';
}

/**
 * Calculate surface area from wound measurements
 */
export function calculateSurfaceArea(measurement: WoundMeasurement): number {
  return measurement.length * measurement.width;
}

/**
 * Calculate volume from wound measurements (if depth is provided)
 */
export function calculateVolume(measurement: WoundMeasurement): number | null {
  if (!measurement.depth) return null;
  return measurement.length * measurement.width * measurement.depth;
}

/**
 * Find the best fitting Q code product for a wound measurement
 */
export function findBestFitProduct(
  woundArea: number,
  products: QCodeProduct[],
  category?: 'Wound Care Matrix' | 'Amniotic Membrane'
): QCodeProduct | null {
  // Filter by category if specified
  let filteredProducts = category
    ? products.filter(p => p.category === category)
    : products;

  // Find products that can cover the wound (surface area >= wound area)
  const suitableProducts = filteredProducts.filter(p => p.surfaceAreaCm2 >= woundArea);

  if (suitableProducts.length === 0) {
    // If no product is large enough, return the largest available
    return filteredProducts.reduce((largest, current) =>
      current.surfaceAreaCm2 > largest.surfaceAreaCm2 ? current : largest
    );
  }

  // Return the smallest product that can cover the wound (most cost-effective)
  return suitableProducts.reduce((smallest, current) =>
    current.surfaceAreaCm2 < smallest.surfaceAreaCm2 ? current : smallest
  );
}

/**
 * Get product recommendations for a wound measurement
 */
export function getProductRecommendations(
  measurement: WoundMeasurement,
  products: QCodeProduct[]
): {
  woundArea: number;
  rampartRecommendation: QCodeProduct | null;
  amnioRecommendation: QCodeProduct | null;
  costComparison: {
    rampart: number | null;
    amnio: number | null;
    savings?: number;
    preferred?: 'rampart' | 'amnio';
  };
} {
  const woundArea = calculateSurfaceArea(measurement);

  const rampartRecommendation = findBestFitProduct(woundArea, products, 'Wound Care Matrix');
  const amnioRecommendation = findBestFitProduct(woundArea, products, 'Amniotic Membrane');

  const rampartCost = rampartRecommendation?.unitPrice || null;
  const amnioCost = amnioRecommendation?.unitPrice || null;

  let savings: number | undefined;
  let preferred: 'rampart' | 'amnio' | undefined;

  if (rampartCost && amnioCost) {
    if (rampartCost < amnioCost) {
      savings = amnioCost - rampartCost;
      preferred = 'rampart';
    } else {
      savings = rampartCost - amnioCost;
      preferred = 'amnio';
    }
  }

  return {
    woundArea,
    rampartRecommendation,
    amnioRecommendation,
    costComparison: {
      rampart: rampartCost,
      amnio: amnioCost,
      savings,
      preferred
    }
  };
}

/**
 * Format surface area for display
 */
export function formatSurfaceArea(area: number): string {
  return `${area.toFixed(1)} cm²`;
}

/**
 * Format dimensions for display
 */
export function formatDimensions(length: number, width: number): string {
  return `${length}cm × ${width}cm`;
}

/**
 * Parse Q code size string (e.g., "2X3") into dimensions
 */
export function parseQCodeSize(size: string): { length: number; width: number } | null {
  const match = size.match(/^(\d+)X(\d+)$/);
  if (!match) return null;

  return {
    length: parseInt(match[1], 10),
    width: parseInt(match[2], 10)
  };
}

/**
 * Mock Q code products data (this would typically come from an API)
 */
export const MOCK_Q_CODE_PRODUCTS: QCodeProduct[] = [
  // RAMPART Q-4347 Products
  {
    id: '550e8400-e29b-41d4-a716-446655440301',
    name: 'RAMPART Q-4347 Wound Care Matrix 2X2',
    sku: 'RAMPART-Q4347-2X2',
    qCode: 'Q-4347',
    size: '2X2',
    surfaceAreaCm2: 4,
    dimensions: '2cm x 2cm',
    unitPrice: 125.00,
    category: 'Wound Care Matrix'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440302',
    name: 'RAMPART Q-4347 Wound Care Matrix 2X3',
    sku: 'RAMPART-Q4347-2X3',
    qCode: 'Q-4347',
    size: '2X3',
    surfaceAreaCm2: 6,
    dimensions: '2cm x 3cm',
    unitPrice: 175.00,
    category: 'Wound Care Matrix'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440303',
    name: 'RAMPART Q-4347 Wound Care Matrix 2X4',
    sku: 'RAMPART-Q4347-2X4',
    qCode: 'Q-4347',
    size: '2X4',
    surfaceAreaCm2: 8,
    dimensions: '2cm x 4cm',
    unitPrice: 225.00,
    category: 'Wound Care Matrix'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440304',
    name: 'RAMPART Q-4347 Wound Care Matrix 4X4',
    sku: 'RAMPART-Q4347-4X4',
    qCode: 'Q-4347',
    size: '4X4',
    surfaceAreaCm2: 16,
    dimensions: '4cm x 4cm',
    unitPrice: 425.00,
    category: 'Wound Care Matrix'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440305',
    name: 'RAMPART Q-4347 Wound Care Matrix 4X6',
    sku: 'RAMPART-Q4347-4X6',
    qCode: 'Q-4347',
    size: '4X6',
    surfaceAreaCm2: 24,
    dimensions: '4cm x 6cm',
    unitPrice: 625.00,
    category: 'Wound Care Matrix'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440306',
    name: 'RAMPART Q-4347 Wound Care Matrix 4X8',
    sku: 'RAMPART-Q4347-4X8',
    qCode: 'Q-4347',
    size: '4X8',
    surfaceAreaCm2: 32,
    dimensions: '4cm x 8cm',
    unitPrice: 825.00,
    category: 'Wound Care Matrix'
  },
  // AMNIO-AMP Q-4250 Products
  {
    id: '550e8400-e29b-41d4-a716-446655440401',
    name: 'AMNIO-AMP Q-4250 Amniotic Membrane 2X2',
    sku: 'AMNIO-AMP-Q4250-2X2',
    qCode: 'Q-4250',
    size: '2X2',
    surfaceAreaCm2: 4,
    dimensions: '2cm x 2cm',
    unitPrice: 185.00,
    category: 'Amniotic Membrane'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440402',
    name: 'AMNIO-AMP Q-4250 Amniotic Membrane 2X3',
    sku: 'AMNIO-AMP-Q4250-2X3',
    qCode: 'Q-4250',
    size: '2X3',
    surfaceAreaCm2: 6,
    dimensions: '2cm x 3cm',
    unitPrice: 265.00,
    category: 'Amniotic Membrane'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440403',
    name: 'AMNIO-AMP Q-4250 Amniotic Membrane 2X4',
    sku: 'AMNIO-AMP-Q4250-2X4',
    qCode: 'Q-4250',
    size: '2X4',
    surfaceAreaCm2: 8,
    dimensions: '2cm x 4cm',
    unitPrice: 345.00,
    category: 'Amniotic Membrane'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440404',
    name: 'AMNIO-AMP Q-4250 Amniotic Membrane 4X4',
    sku: 'AMNIO-AMP-Q4250-4X4',
    qCode: 'Q-4250',
    size: '4X4',
    surfaceAreaCm2: 16,
    dimensions: '4cm x 4cm',
    unitPrice: 685.00,
    category: 'Amniotic Membrane'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440405',
    name: 'AMNIO-AMP Q-4250 Amniotic Membrane 4X6',
    sku: 'AMNIO-AMP-Q4250-4X6',
    qCode: 'Q-4250',
    size: '4X6',
    surfaceAreaCm2: 24,
    dimensions: '4cm x 6cm',
    unitPrice: 1025.00,
    category: 'Amniotic Membrane'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440406',
    name: 'AMNIO-AMP Q-4250 Amniotic Membrane 4X8',
    sku: 'AMNIO-AMP-Q4250-4X8',
    qCode: 'Q-4250',
    size: '4X8',
    surfaceAreaCm2: 32,
    dimensions: '4cm x 8cm',
    unitPrice: 1365.00,
    category: 'Amniotic Membrane'
  }
];