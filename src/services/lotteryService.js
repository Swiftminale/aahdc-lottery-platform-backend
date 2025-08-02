// backend/src/services/lotteryService.js
import { Unit as _Unit } from '../database';
const Unit = _Unit;
import { checkPostAllocationCompliance } from './complianceService'; // Import for internal checks

// Helper to check typology caps for AAHDC's allocation
const checkTypologyCaps = (currentUnits, unitToAdd, totalResidentialArea) => {
  const typologyLimits = {
    Studio: 0.15,
    '1BR': 0.40,
    '2BR': 0.25,
    '3BR': 0.20,
  };

  // Calculate current distribution for residential units already allocated to AAHDC
  const currentResidentialUnits = currentUnits.filter(u => u.typology !== 'Shop');
  const currentResidentialArea = currentResidentialUnits.reduce((acc, unit) => acc + unit.grossArea, 0);

  const typologyAreaCurrent = {
    Studio: currentResidentialUnits.filter(u => u.typology === 'Studio').reduce((sum, u) => sum + u.grossArea, 0),
    '1BR': currentResidentialUnits.filter(u => u.typology === '1BR').reduce((sum, u) => sum + u.grossArea, 0),
    '2BR': currentResidentialUnits.filter(u => u.typology === '2BR').reduce((sum, u) => sum + u.grossArea, 0),
    '3BR': currentResidentialUnits.filter(u => u.typology === '3BR').reduce((sum, u) => sum + u.grossArea, 0),
  };

  // Calculate if adding the new unit would exceed the cap for AAHDC
  if (typologyLimits[unitToAdd.typology]) {
    const projectedAreaForTypology = typologyAreaCurrent[unitToAdd.typology] + unitToAdd.grossArea;
    const projectedTotalResidentialArea = currentResidentialArea + unitToAdd.grossArea;

    // Avoid division by zero if no residential units yet
    if (projectedTotalResidentialArea > 0 && (projectedAreaForTypology / projectedTotalResidentialArea) > typologyLimits[unitToAdd.typology]) {
      return false; // Exceeds typology cap
    }
  }
  return true;
};


// Full Lottery Algorithm
export async function fullLottery(units) {
  const totalGrossArea = units.reduce((sum, unit) => sum + unit.grossArea, 0);
  const targetAahdcArea = totalGrossArea * 0.30;
  let allocatedAahdcArea = 0;
  let aahdcUnits = [];
  let devUnits = [];

  // Create a mutable copy and shuffle
  let shuffledUnits = [...units].sort(() => 0.5 - Math.random());

  for (const unit of shuffledUnits) {
    if (unit.typology === 'Shop') {
      // For full lottery, shops are also randomly assigned.
      // The 30% commercial area rule will be checked in post-allocation compliance.
      if (allocatedAahdcArea + unit.grossArea <= targetAahdcArea) {
        aahdcUnits.push({ ...unit, owner: 'AAHDC', allocated: true });
        allocatedAahdcArea += unit.grossArea;
      } else {
        devUnits.push({ ...unit, owner: 'Developer', allocated: true });
      }
    } else { // Residential units
      if (allocatedAahdcArea + unit.grossArea <= targetAahdcArea && checkTypologyCaps(aahdcUnits, unit, totalGrossArea)) {
        aahdcUnits.push({ ...unit, owner: 'AAHDC', allocated: true });
        allocatedAahdcArea += unit.grossArea;
      } else {
        devUnits.push({ ...unit, owner: 'Developer', allocated: true });
      }
    }
  }

  // If AAHDC hasn't met its target, try to swap units from devUnits if possible and compliant
  // This is a simplified balancing act. A real system might use more complex optimization.
  let remainingTarget = targetAahdcArea - allocatedAahdcArea;
  if (remainingTarget > 0) {
    // Try to take smaller units from devUnits to meet the target without overshooting too much
    devUnits.sort((a, b) => a.grossArea - b.grossArea); // Sort by size

    for (let i = 0; i < devUnits.length; i++) {
      const unit = devUnits[i];
      if (remainingTarget - unit.grossArea >= -0.01 && checkTypologyCaps(aahdcUnits, unit, totalGrossArea)) { // Allow slight undershoot
        aahdcUnits.push({ ...unit, owner: 'AAHDC', allocated: true });
        allocatedAahdcArea += unit.grossArea;
        devUnits.splice(i, 1); // Remove from devUnits
        i--; // Adjust index due to removal
        remainingTarget = targetAahdcArea - allocatedAahdcArea;
        if (remainingTarget <= 0.01) break; // Target met
      }
    }
  }

  return { aahdcUnits, devUnits, allocatedAahdcArea };
}

// Hybrid Lottery Algorithm
export async function hybridLottery(units) {
  const residentialUnits = units.filter(unit => unit.typology !== 'Shop');
  const commercialUnits = units.filter(unit => unit.typology === 'Shop');

  // Lottery for residential units (similar to full lottery, but only for houses)
  const totalResidentialGrossArea = residentialUnits.reduce((sum, unit) => sum + unit.grossArea, 0);
  const targetAahdcResidentialArea = totalResidentialGrossArea * 0.30; // 30% of residential goes to AAHDC
  let allocatedAahdcResidentialArea = 0;
  let aahdcResidentialUnits = [];
  let devResidentialUnits = [];

  let shuffledResidentialUnits = [...residentialUnits].sort(() => 0.5 - Math.random());

  for (const unit of shuffledResidentialUnits) {
    if (allocatedAahdcResidentialArea + unit.grossArea <= targetAahdcResidentialArea && checkTypologyCaps(aahdcResidentialUnits, unit, totalResidentialGrossArea)) {
      aahdcResidentialUnits.push({ ...unit, owner: 'AAHDC', allocated: true });
      allocatedAahdcResidentialArea += unit.grossArea;
    } else {
      devResidentialUnits.push({ ...unit, owner: 'Developer', allocated: true });
    }
  }

  // Shops are "negotiated" - for this simulation, we'll assume a 30% split for AAHDC
  const totalCommercialGrossArea = commercialUnits.reduce((sum, unit) => sum + unit.grossArea, 0);
  const targetAahdcCommercialArea = totalCommercialGrossArea * 0.30;
  let allocatedAahdcCommercialArea = 0;
  let aahdcCommercialUnits = [];
  let devCommercialUnits = [];

  // Simple distribution for shops (e.g., take first 30% by area after sorting)
  commercialUnits.sort((a, b) => a.grossArea - b.grossArea); // Sort by size to try and hit target precisely

  for (const unit of commercialUnits) {
    if (allocatedAahdcCommercialArea + unit.grossArea <= targetAahdcCommercialArea) {
      aahdcCommercialUnits.push({ ...unit, owner: 'AAHDC', allocated: true });
      allocatedAahdcCommercialArea += unit.grossArea;
    } else {
      devCommercialUnits.push({ ...unit, owner: 'Developer', allocated: true });
    }
  }

  return {
    aahdcUnits: [...aahdcResidentialUnits, ...aahdcCommercialUnits],
    devUnits: [...devResidentialUnits, ...devCommercialUnits],
    allocatedAahdcResidentialArea,
    allocatedAahdcCommercialArea
  };
}

// Block-by-Block Assignment (simplified)
export async function blockByBlockAssignment(units) {
  // This method would require explicit input from AAHDC on which blocks/floors they want.
  // For demonstration, let's say AAHDC gets blocks based on their gross area until 30% is met.
  // Blocks are sorted by name for consistent, but arbitrary, selection.
  const blocks = {};
  units.forEach(unit => {
    if (!blocks[unit.blockName]) {
      blocks[unit.blockName] = [];
    }
    blocks[unit.blockName].push(unit);
  });

  const blockNames = Object.keys(blocks).sort(); // Sort block names alphabetically for deterministic demo
  let aahdcUnits = [];
  let devUnits = [];
  let allocatedAahdcArea = 0;
  const totalGrossArea = units.reduce((sum, unit) => sum + unit.grossArea, 0);
  const targetAahdcArea = totalGrossArea * 0.30;

  for (const blockName of blockNames) {
    const blockUnits = blocks[blockName];
    const blockGrossArea = blockUnits.reduce((sum, unit) => sum + unit.grossArea, 0);

    // If adding this entire block doesn't overshoot AAHDC's target too much, assign to AAHDC
    // This is a greedy approach. In a real system, AAHDC would select blocks.
    if (allocatedAahdcArea + blockGrossArea <= targetAahdcArea * 1.05) { // Allow 5% overshoot for full blocks
      // Check if adding this block's residential units would violate typology caps for AAHDC
      let canAllocateBlock = true;
      for(const unit of blockUnits.filter(u => u.typology !== 'Shop')) {
          if (!checkTypologyCaps(aahdcUnits, unit, totalGrossArea)) {
              canAllocateBlock = false;
              break;
          }
      }

      if (canAllocateBlock) {
          aahdcUnits.push(...blockUnits.map(unit => ({ ...unit, owner: 'AAHDC', allocated: true })));
          allocatedAahdcArea += blockGrossArea;
      } else {
          devUnits.push(...blockUnits.map(unit => ({ ...unit, owner: 'Developer', allocated: true })));
      }
    } else {
      devUnits.push(...blockUnits.map(unit => ({ ...unit, owner: 'Developer', allocated: true })));
    }
  }
  // Re-distribute any units if AAHDC is significantly under target and dev has many small units
  // This logic can be complex and depends on strictness of 30% rule vs. block integrity.
  return { aahdcUnits, devUnits, allocatedAahdcArea };
}

// Lottery Based on Floor Number (simplified)
export async function floorBasedLottery(units) {
  // This would typically involve AAHDC specifying which floors they prefer (e.g., lower, middle, higher)
  // For demonstration, let's assume AAHDC gets units from a mix of floors, prioritizing lower floors.
  const unitsByFloor = {};
  units.forEach(unit => {
    if (!unitsByFloor[unit.floorNumber]) {
      unitsByFloor[unit.floorNumber] = [];
    }
    unitsByFloor[unit.floorNumber].push(unit);
  });

  const sortedFloorNumbers = Object.keys(unitsByFloor).map(Number).sort((a, b) => a - b); // Prioritize lower floors

  let aahdcUnits = [];
  let devUnits = [];
  let allocatedAahdcArea = 0;
  const totalGrossArea = units.reduce((sum, unit) => sum + unit.grossArea, 0);
  const targetAahdcArea = totalGrossArea * 0.30;

  for (const floorNum of sortedFloorNumbers) {
    const floorUnits = unitsByFloor[floorNum];
    // Randomize units within the floor
    let shuffledFloorUnits = [...floorUnits].sort(() => 0.5 - Math.random());

    for (const unit of shuffledFloorUnits) {
      if (allocatedAahdcArea + unit.grossArea <= targetAahdcArea && checkTypologyCaps(aahdcUnits, unit, totalGrossArea)) {
        aahdcUnits.push({ ...unit, owner: 'AAHDC', allocated: true });
        allocatedAahdcArea += unit.grossArea;
      } else {
        devUnits.push({ ...unit, owner: 'Developer', allocated: true });
      }
    }
  }
  // Similar to block-by-block, this needs more precise rules from AAHDC
  return { aahdcUnits, devUnits, allocatedAahdcArea };
}
