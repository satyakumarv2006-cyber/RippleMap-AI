
document.addEventListener("DOMContentLoaded", () => {
  if (typeof getSavedReports !== "function") {
    console.error("Storage module not loaded.");
    return;
  }

  const totalElement = document.getElementById("totalIssues");
  const recurringElement = document.getElementById("recurringIssues");
  const investigatingElement =
    document.getElementById("investigatingIssues");
  const resolvedElement = document.getElementById("resolvedIssues");

  function updateDashboardStatistics(reports) {
    const currentReports = Array.isArray(reports)
      ? reports
      : getSavedReports();

    const totalIssues = currentReports.length;

    const recurringIssues = currentReports.filter(
      report => report.isRecurring === true
    ).length;

    const investigatingIssues = currentReports.filter(
      report => report.status === "Under Investigation"
    ).length;

    const resolvedIssues = currentReports.filter(
      report => report.status === "Resolved"
    ).length;

    if (totalElement) {
      totalElement.textContent = totalIssues;
    }

    if (recurringElement) {
      recurringElement.textContent = recurringIssues;
    }

    if (investigatingElement) {
      investigatingElement.textContent = investigatingIssues;
    }

    if (resolvedElement) {
      resolvedElement.textContent = resolvedIssues;
    }
  }

  // Initial statistics when the dashboard loads.
  updateDashboardStatistics(getSavedReports());

  // Update statistics whenever dashboard.js refreshes the reports.
  window.addEventListener("ripplemap:reports-updated", event => {
    const reports = Array.isArray(event.detail?.reports)
      ? event.detail.reports
      : getSavedReports();

    updateDashboardStatistics(reports);
  });

  // Refresh statistics when returning to the dashboard tab.
  window.addEventListener("focus", () => {
    updateDashboardStatistics(getSavedReports());
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateDashboardStatistics(getSavedReports());
    }
  });

  console.log("RippleMap AI dashboard statistics initialized.");
});
