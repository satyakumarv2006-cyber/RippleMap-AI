
document.addEventListener("DOMContentLoaded", () => {
  const reportsContainer = document.getElementById("adminReports");
  const message = document.getElementById("adminMessage");

  if (!reportsContainer) return;

  const validStatuses = [
    "Reported",
    "Under Investigation",
    "Resolved"
  ];

  function updateCounts(reports) {
    const totalElement = document.getElementById("adminTotalReports");
    const reportedElement = document.getElementById("adminReportedCount");
    const investigatingElement =
      document.getElementById("adminInvestigatingCount");
    const resolvedElement = document.getElementById("adminResolvedCount");

    if (totalElement) totalElement.textContent = reports.length;

    if (reportedElement) {
      reportedElement.textContent =
        reports.filter(r => (r.status || "Reported") === "Reported").length;
    }

    if (investigatingElement) {
      investigatingElement.textContent =
        reports.filter(r => r.status === "Under Investigation").length;
    }

    if (resolvedElement) {
      resolvedElement.textContent =
        reports.filter(r => r.status === "Resolved").length;
    }
  }

  function renderReports() {
    const reports = getSavedReports();

    updateCounts(reports);
    reportsContainer.replaceChildren();

    if (reports.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No reports have been submitted yet.";
      reportsContainer.appendChild(empty);
      return;
    }

    reports.forEach(report => {
      const card = document.createElement("article");
      card.className = "admin-report-card";

      const details = document.createElement("div");
      details.className = "admin-report-details";

      const heading = document.createElement("h3");
      heading.textContent = report.category || "Uncategorized issue";

      const description = document.createElement("p");
      description.textContent =
        report.description || "No description provided.";

      const reportId = document.createElement("p");
      reportId.className = "report-meta";
      reportId.textContent = `Report ID: ${report.id || "Unavailable"}`;

      const date = document.createElement("p");
      date.className = "report-meta";

      const createdAt = new Date(report.createdAt);
      date.textContent = `Submitted: ${
        Number.isNaN(createdAt.getTime())
          ? "Date unavailable"
          : createdAt.toLocaleString()
      }`;

      const coordinates = document.createElement("p");
      coordinates.className = "report-meta";

      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      coordinates.textContent =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
          ? `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : "Coordinates unavailable";

      const updatedAt = document.createElement("p");
      updatedAt.className = "report-meta";

      const updateDate = new Date(report.updatedAt);
      updatedAt.textContent = `Last updated: ${
        Number.isNaN(updateDate.getTime())
          ? "Not available"
          : updateDate.toLocaleString()
      }`;

      details.append(
        heading,
        description,
        reportId,
        date,
        coordinates,
        updatedAt
      );

      if (report.photo) {
        const image = document.createElement("img");
        image.className = "admin-report-photo";
        image.src = report.photo;
        image.alt = `Photo of ${report.category || "reported issue"}`;
        image.loading = "lazy";
        card.appendChild(image);
      }

      const statusLabel = document.createElement("label");
      statusLabel.textContent = "Report status";

      const statusSelect = document.createElement("select");
      statusSelect.className = "admin-status-select";
      statusSelect.setAttribute(
        "aria-label",
        `Status for ${report.id || "report"}`
      );

      validStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
      });

      statusSelect.value = validStatuses.includes(report.status)
        ? report.status
        : "Reported";

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "primary-button admin-save-button";
      saveButton.textContent = "Save Status";

      saveButton.addEventListener("click", () => {
        const selectedStatus = statusSelect.value;

        if (!validStatuses.includes(selectedStatus)) {
          if (message) message.textContent = "Please select a valid status.";
          return;
        }

        const latestReports = getSavedReports();
        const reportIndex = latestReports.findIndex(
          item => item.id === report.id
        );

        if (reportIndex === -1) {
          if (message) {
            message.textContent =
              "This report could not be found. Refresh the page and try again.";
          }
          return;
        }

        const updatedReport = {
          ...latestReports[reportIndex],
          status: selectedStatus,
          updatedAt: new Date().toISOString()
        };

        latestReports[reportIndex] = updatedReport;

        saveButton.disabled = true;

        try {
          localStorage.setItem(
            "rippleMapReports",
            JSON.stringify(latestReports)
          );

          if (message) {
            message.textContent =
              `Report ${report.id} updated to "${selectedStatus}".`;
          }

          renderReports();

          // Notify any listeners on this page.
          window.dispatchEvent(
            new CustomEvent("ripplemap:reports-updated", {
              detail: { reports: latestReports }
            })
          );
        } catch (error) {
          console.error("Could not update report status:", error);

          if (message) {
            message.textContent =
              "Could not save the status. Browser storage may be full or unavailable.";
          }
        } finally {
          saveButton.disabled = false;
        }
      });

      
const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "admin-delete-button";
deleteButton.textContent = "🗑 Delete Report";

deleteButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete report ${report.id}?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  if (typeof deleteReport !== "function") {
    if (message) {
      message.textContent = "Delete function is unavailable.";
    }
    return;
  }

  deleteButton.disabled = true;

  try {
    deleteReport(report.id);

    if (message) {
      message.textContent = `Report ${report.id} was deleted successfully.`;
    }

    // Reload the admin report list and counts.
    renderReports();
  } catch (error) {
    console.error("Report deletion failed:", error);

    if (message) {
      message.textContent =
        error.message || "Could not delete the report.";
    }

    deleteButton.disabled = false;
  }
});

const controls = document.createElement("div");
controls.className = "admin-report-controls";
controls.append(statusLabel, statusSelect, saveButton, deleteButton);


      card.append(details, controls);
      reportsContainer.appendChild(card);
    });
  }

  if (typeof getSavedReports !== "function") {
    reportsContainer.textContent =
      "Storage module not loaded. Please check the script tags.";
    return;
  }

  renderReports();
});
