// backend/src/controllers/allocationController.js
import db from "../database";
const Unit = db.Unit;
import { fullLottery, hybridLottery, blockByBlockAssignment, floorBasedLottery } from "../services/lotteryService";
import { checkPreAllocationCompliance, checkPostAllocationCompliance } from "../services/complianceService";

export async function runAllocation(req, res) {
  try {
    const { distributionMethod } = req.body;

    if (!distributionMethod) {
      return res
        .status(400)
        .json({ message: "Distribution method is required." });
    }

    const unitsToAllocate = await Unit.findAll({ where: { allocated: false } });

    if (unitsToAllocate.length === 0) {
      return res
        .status(400)
        .json({ message: "No unallocated units available for distribution." });
    }

    // Pre-allocation compliance checks
    const preCompliance = await checkPreAllocationCompliance(
      unitsToAllocate
    );
    if (!preCompliance.isCompliant) {
      return res
        .status(403)
        .json({
          message: "Pre-allocation compliance failed.",
          issues: preCompliance.issues,
        });
    }

    let aahdcAllocatedUnits = [];
    let devAllocatedUnits = [];
    let allocationResult;

    switch (distributionMethod) {
      case "Full Lottery":
        allocationResult = await fullLottery(unitsToAllocate);
        aahdcAllocatedUnits = allocationResult.aahdcUnits;
        devAllocatedUnits = allocationResult.devUnits;
        break;
      case "Hybrid Lottery":
        allocationResult = await hybridLottery(unitsToAllocate);
        aahdcAllocatedUnits = allocationResult.aahdcUnits;
        devAllocatedUnits = allocationResult.devUnits;
        break;
      case "Block-by-Block Assignment":
        allocationResult = await blockByBlockAssignment(
          unitsToAllocate
        );
        aahdcAllocatedUnits = allocationResult.aahdcUnits;
        devAllocatedUnits = allocationResult.devUnits;
        break;
      case "Lottery Based on Floor Number":
        allocationResult = await floorBasedLottery(
          unitsToAllocate
        );
        aahdcAllocatedUnits = allocationResult.aahdcUnits;
        devAllocatedUnits = allocationResult.devUnits;
        break;
      default:
        return res
          .status(400)
          .json({ message: "Invalid distribution method specified." });
    }

    // Post-allocation compliance checks
    const postCompliance =
      await checkPostAllocationCompliance(
        aahdcAllocatedUnits,
        devAllocatedUnits
      );
    if (!postCompliance.isCompliant) {
      // If post-allocation compliance fails, you might want to revert the changes
      // and inform the user, or log it as a critical issue for manual review.
      console.warn(
        "Post-allocation compliance failed, but allocating anyway for demonstration. In production, this might trigger a rollback or alert.",
        postCompliance.issues
      );
      // return res.status(403).json({ message: 'Post-allocation compliance failed.', issues: postCompliance.issues });
    }

    // Update units in the database within a transaction
    const transaction = await db.sequelize.transaction();
    try {
      // Mark all allocated units with their owner
      for (const unit of [...aahdcAllocatedUnits, ...devAllocatedUnits]) {
        await Unit.update(
          { owner: unit.owner, allocated: true },
          { where: { unitId: unit.unitId }, transaction }
        );
      }
      await transaction.commit();
    } catch (transError) {
      await transaction.rollback();
      console.error("Error updating units in transaction:", transError);
      return res
        .status(500)
        .json({
          message: "Failed to save allocation results due to database error.",
        });
    }

    res.status(200).json({
      message: `${distributionMethod} executed successfully.`,
      aahdcUnits: aahdcAllocatedUnits,
      developerUnits: devAllocatedUnits,
      complianceIssues: postCompliance.issues, // Report any post-allocation issues
    });
  } catch (error) {
    console.error("Error during allocation:", error);
    res
      .status(500)
      .json({
        message: "Server error during allocation process",
        error: error.message,
      });
  }
}

export async function getAllocatedUnits(req, res) {
  try {
    const allocatedUnits = await Unit.findAll({ where: { allocated: true } });
    res.status(200).json(allocatedUnits);
  } catch (error) {
    console.error("Error fetching allocated units:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching allocated units",
        error: error.message,
      });
  }
}

export async function getUnallocatedUnits(req, res) {
  try {
    const unallocatedUnits = await Unit.findAll({
      where: { allocated: false },
    });
    res.status(200).json(unallocatedUnits);
  } catch (error) {
    console.error("Error fetching unallocated units:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching unallocated units",
        error: error.message,
      });
  }
}
