// backend/src/services/reportingService.js
import db from "../database";
const Unit = db.Unit;
import { Workbook } from "exceljs";
import PDFDocument from "pdfkit";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";

export async function generateAllocationReport() {
  const units = await Unit.findAll({ raw: true }); // Get plain data objects

  const aahdcUnits = units.filter((unit) => unit.owner === "AAHDC");
  const developerUnits = units.filter((unit) => unit.owner === "Developer");

  const totalGrossArea = units.reduce((sum, unit) => sum + unit.grossArea, 0);
  const aahdcGrossArea = aahdcUnits.reduce(
    (sum, unit) => sum + unit.grossArea,
    0
  );
  const developerGrossArea = developerUnits.reduce(
    (sum, unit) => sum + unit.grossArea,
    0
  );

  const aahdcResidentialUnits = aahdcUnits.filter((u) => u.typology !== "Shop");
  const aahdcTotalResidentialArea = aahdcResidentialUnits.reduce(
    (sum, u) => sum + u.grossArea,
    0
  );

  const aahdcTypologyCounts = aahdcResidentialUnits.reduce((acc, unit) => {
    acc[unit.typology] = (acc[unit.typology] || 0) + 1;
    return acc;
  }, {});

  const aahdcTypologyArea = {
    Studio: aahdcResidentialUnits
      .filter((u) => u.typology === "Studio")
      .reduce((sum, u) => sum + u.grossArea, 0),
    "1BR": aahdcResidentialUnits
      .filter((u) => u.typology === "1BR")
      .reduce((sum, u) => sum + u.grossArea, 0),
    "2BR": aahdcResidentialUnits
      .filter((u) => u.typology === "2BR")
      .reduce((sum, u) => sum + u.grossArea, 0),
    "3BR": aahdcResidentialUnits
      .filter((u) => u.typology === "3BR")
      .reduce((sum, u) => sum + u.grossArea, 0),
  };

  // Helper for Excel
  const generateExcel = async () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Allocation Summary");

    // Headers
    worksheet.columns = [
      { header: "Unit ID", key: "unitId", width: 15 },
      { header: "Typology", key: "typology", width: 10 },
      { header: "Net Area", key: "netArea", width: 10 },
      { header: "Gross Area", key: "grossArea", width: 12 },
      { header: "Floor No.", key: "floorNumber", width: 10 },
      { header: "Block Name", key: "blockName", width: 15 },
      { header: "Owner", key: "owner", width: 10 },
    ];

    // Add data
    worksheet.addRows(units);

    // Add summaries
    worksheet.addRow([]);
    worksheet.addRow([
      "Total Gross Area (All Units):",
      "",
      "",
      totalGrossArea.toFixed(2),
    ]);
    worksheet.addRow(["AAHDC Gross Area:", "", "", aahdcGrossArea.toFixed(2)]);
    worksheet.addRow([
      "Developer Gross Area:",
      "",
      "",
      developerGrossArea.toFixed(2),
    ]);
    worksheet.addRow([]);
    worksheet.addRow(["AAHDC Typology Mix (Gross Area % of residential):"]);
    if (aahdcTotalResidentialArea > 0) {
      worksheet.addRow([
        "Studio:",
        "",
        "",
        ((aahdcTypologyArea.Studio / aahdcTotalResidentialArea) * 100).toFixed(
          2
        ) + "%",
      ]);
      worksheet.addRow([
        "1BR:",
        "",
        "",
        ((aahdcTypologyArea["1BR"] / aahdcTotalResidentialArea) * 100).toFixed(
          2
        ) + "%",
      ]);
      worksheet.addRow([
        "2BR:",
        "",
        "",
        ((aahdcTypologyArea["2BR"] / aahdcTotalResidentialArea) * 100).toFixed(
          2
        ) + "%",
      ]);
      worksheet.addRow([
        "3BR:",
        "",
        "",
        ((aahdcTypologyArea["3BR"] / aahdcTotalResidentialArea) * 100).toFixed(
          2
        ) + "%",
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  };

  // Helper for PDF
  const generatePdf = async () => {
    const doc = new PDFDocument();
    const outputFileName = `allocation_report_${Date.now()}.pdf`; // Unique file name
    const outputPath = join(
      __dirname,
      "../../temp_reports",
      outputFileName
    ); // Save to a temp folder

    // Ensure temp_reports directory exists
    if (!existsSync(join(__dirname, "../../temp_reports"))) {
      mkdirSync(join(__dirname, "../../temp_reports"));
    }

    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(16).text("AAHDC Unit Allocation Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text("Allocation Summary:", { underline: true });
    doc.text(`Total Project Gross Area: ${totalGrossArea.toFixed(2)} sqm`);
    doc.text(
      `AAHDC Allocated Gross Area: ${aahdcGrossArea.toFixed(2)} sqm (${(
        (aahdcGrossArea / totalGrossArea) *
        100
      ).toFixed(2)}%)`
    );
    doc.text(
      `Developer Allocated Gross Area: ${developerGrossArea.toFixed(2)} sqm (${(
        (developerGrossArea / totalGrossArea) *
        100
      ).toFixed(2)}%)`
    );
    doc.moveDown();

    doc.text("AAHDC Typology Mix (Residential Gross Area %):");
    if (aahdcTotalResidentialArea > 0) {
      doc.text(
        `  Studio: ${
          aahdcTypologyCounts.Studio || 0
        } units - ${aahdcTypologyArea.Studio.toFixed(2)} sqm (${(
          (aahdcTypologyArea.Studio / aahdcTotalResidentialArea) *
          100
        ).toFixed(2)}%)`
      );
      doc.text(
        `  1BR: ${aahdcTypologyCounts["1BR"] || 0} units - ${aahdcTypologyArea[
          "1BR"
        ].toFixed(2)} sqm (${(
          (aahdcTypologyArea["1BR"] / aahdcTotalResidentialArea) *
          100
        ).toFixed(2)}%)`
      );
      doc.text(
        `  2BR: ${aahdcTypologyCounts["2BR"] || 0} units - ${aahdcTypologyArea[
          "2BR"
        ].toFixed(2)} sqm (${(
          (aahdcTypologyArea["2BR"] / aahdcTotalResidentialArea) *
          100
        ).toFixed(2)}%)`
      );
      doc.text(
        `  3BR: ${aahdcTypologyCounts["3BR"] || 0} units - ${aahdcTypologyArea[
          "3BR"
        ].toFixed(2)} sqm (${(
          (aahdcTypologyArea["3BR"] / aahdcTotalResidentialArea) *
          100
        ).toFixed(2)}%)`
      );
    }
    doc.moveDown();

    doc.text("Detailed Unit Allocation:");
    doc.moveDown();

    // Table for units (simplified)
    const tableHeaders = [
      "Unit ID",
      "Typology",
      "Gross Area",
      "Floor",
      "Block",
      "Owner",
    ];
    const tableRows = units.map((u) => [
      u.unitId,
      u.typology,
      u.grossArea.toFixed(2),
      u.floorNumber,
      u.blockName,
      u.owner || "Unallocated",
    ]);

    // Simple table layout (can be improved with more advanced PDF libraries or manual positioning)
    let y = doc.y;
    doc.font("Helvetica-Bold").fontSize(10);
    tableHeaders.forEach((header, i) => {
      doc.text(header, 50 + i * 90, y);
    });
    doc.font("Helvetica").fontSize(10);
    y += 20;

    tableRows.forEach((row) => {
      row.forEach((cell, i) => {
        doc.text(String(cell), 50 + i * 90, y);
      });
      y += 15;
      if (y > doc.page.height - 50) {
        // New page if content too long
        doc.addPage();
        y = 50;
        doc.font("Helvetica-Bold").fontSize(10);
        tableHeaders.forEach((header, i) => {
          doc.text(header, 50 + i * 90, y);
        });
        doc.font("Helvetica").fontSize(10);
        y += 20;
      }
    });

    doc.end();
    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    });
  };

  return { generateExcel, generatePdf };
}
