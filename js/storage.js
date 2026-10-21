
const RIPPLEMAP_STORAGE_KEY = "rippleMapReports";

function getSavedReports() {
  try {
    const saved = localStorage.getItem(RIPPLEMAP_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const reports = JSON.parse(saved);

    if (!Array.isArray(reports)) {
      console.error(
        "Saved report data is not an array. Existing data was left unchanged."
      );
      return [];
    }

    return reports.filter((report) => {
      return (
        report !== null &&
        typeof report === "object" &&
        !Array.isArray(report)
      );
    });
  } catch (error) {
    console.error(
      "Could not read saved reports. Stored data was left unchanged:",
      error
    );
    return [];
  }
}

function saveReport(report) {
  if (
    !report ||
    typeof report !== "object" ||
    Array.isArray(report)
  ) {
    throw new Error("Invalid report. Please provide a report object.");
  }

  if (
    typeof report.category !== "string" ||
    !report.category.trim()
  ) {
    throw new Error("A report category is required.");
  }

  if (
    typeof report.description !== "string" ||
    !report.description.trim()
  ) {
    throw new Error("A report description is required.");
  }

  const reports = getSavedReports();

  if (
    report.id &&
    reports.some((savedReport) => savedReport.id === report.id)
  ) {
    throw new Error("A report with this ID already exists.");
  }

  const updatedReports = [report, ...reports];

  try {
    localStorage.setItem(
      RIPPLEMAP_STORAGE_KEY,
      JSON.stringify(updatedReports)
    );

    return true;
  } catch (error) {
    console.error("Could not save report:", error);

    throw new Error(
      "Could not save the report. Browser storage may be full or unavailable."
    );
  }
}

// Remove exactly one report using its unique ID.
function deleteReport(reportId) {
  if (typeof reportId !== "string" || !reportId.trim()) {
    throw new Error("A valid report ID is required.");
  }

  let storedReports;

  try {
    const saved = localStorage.getItem(RIPPLEMAP_STORAGE_KEY);

    if (saved === null) {
      throw new Error("No saved reports were found.");
    }

    storedReports = JSON.parse(saved);

    if (!Array.isArray(storedReports)) {
      throw new Error(
        "Saved report data is invalid. No reports were deleted."
      );
    }
  } catch (error) {
    console.error("Could not prepare report deletion:", error);
    throw new Error(
      "Could not read saved reports. No reports were deleted."
    );
  }

  const matchingIndex = storedReports.findIndex(
    (report) =>
      report &&
      typeof report === "object" &&
      report.id === reportId
  );

  if (matchingIndex === -1) {
    throw new Error("Report not found. Nothing was deleted.");
  }

  // Remove only the first report with this ID.
  const updatedReports = [...storedReports];
  updatedReports.splice(matchingIndex, 1);

  try {
    localStorage.setItem(
      RIPPLEMAP_STORAGE_KEY,
      JSON.stringify(updatedReports)
    );
  } catch (error) {
    console.error("Could not delete report:", error);
    throw new Error(
      "Could not save the change. The original saved data remains unchanged."
    );
  }

  // Notify listeners on this page.
  window.dispatchEvent(
    new CustomEvent("ripplemap:reports-updated", {
      detail: { reports: updatedReports }
    })
  );

  return true;
}
