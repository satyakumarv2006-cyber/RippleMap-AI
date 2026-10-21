
document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. DOM ELEMENTS
  // ==========================================
  const container = document.getElementById("savedReports");
  const searchInput = document.getElementById("reportSearch");
  const statusFilter = document.getElementById("reportStatusFilter");
  const categoryFilter = document.getElementById("reportCategoryFilter");
  const clearButton = document.getElementById("clearReportFilters");
  const resultCount = document.getElementById("reportResultCount");
  const sortSelect = document.getElementById("reportSortOrder");
  const refreshButton = document.getElementById("refreshDashboard");
  const lastUpdated = document.getElementById("dashboardLastUpdated");
  const recurringContainer = document.getElementById("recurringList");

  // ==========================================
  // 2. LOAD SAVED REPORTS
  // ==========================================
  if (typeof getSavedReports !== "function") {
    if (container) {
      container.textContent =
        "Could not load reports. Check that storage.js is included.";
    }
    return;
  }

  let reports = getSavedReports();

  // ==========================================
  // 3. POPULATE CATEGORY FILTER
  // ==========================================
  function updateCategoryOptions() {
    if (!categoryFilter) return;

    const previousCategory = categoryFilter.value;

    const categories = [
      ...new Set(
        reports
          .map(report => String(report.category || "").trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));

    categoryFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All categories";
    categoryFilter.appendChild(allOption);

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    categoryFilter.value =
      previousCategory === "all" ||
      categories.includes(previousCategory)
        ? previousCategory
        : "all";
  }

  // ==========================================
  // 4. DISPLAY AND FILTER REPORTS
  // ==========================================
  function renderReports() {
    if (!container) return;

    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedStatus = statusFilter?.value || "all";
    const selectedCategory = categoryFilter?.value || "all";
    const sortOrder = sortSelect?.value || "newest";

    const filteredReports = reports.filter(report => {
      const category = String(report.category || "");
      const description = String(report.description || "");
      const status = String(report.status || "Reported");
      const reportId = String(report.id || "");

      const matchesSearch =
        category.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        reportId.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      const matchesCategory =
        selectedCategory === "all" || category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort without changing the original reports array.
    filteredReports.sort((a, b) => {
      if (sortOrder === "recurring") {
        const aRecurring = a.isRecurring === true ? 1 : 0;
        const bRecurring = b.isRecurring === true ? 1 : 0;

        if (aRecurring !== bRecurring) {
          return bRecurring - aRecurring;
        }
      }

      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();

      const dateA = Number.isFinite(timeA) ? timeA : 0;
      const dateB = Number.isFinite(timeB) ? timeB : 0;

      if (sortOrder === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    container.replaceChildren();

    if (resultCount) {
      resultCount.textContent =
        `Showing ${filteredReports.length} of ${reports.length} reports`;
    }

    if (filteredReports.length === 0) {
      const empty = document.createElement("div");
      empty.className = "report-empty";

      const heading = document.createElement("h3");
      heading.textContent =
        reports.length === 0 ? "No reports yet" : "No matching reports";

      const message = document.createElement("p");
      message.textContent =
        reports.length === 0
          ? "Submit your first civic issue to see it here."
          : "Try another search or clear your filters.";

      empty.append(heading, message);

      if (reports.length === 0) {
        const link = document.createElement("a");
        link.href = "report.html";
        link.textContent = "Report an Issue";
        empty.appendChild(link);
      }

      container.appendChild(empty);
      return;
    }

    filteredReports.forEach(report => {
      const card = document.createElement("article");
      card.className = "report-card";

      if (report.photo) {
        const image = document.createElement("img");
        image.src = report.photo;
        image.alt = `Photo of reported ${report.category || "issue"}`;
        image.loading = "lazy";
        card.appendChild(image);
      }

      const content = document.createElement("div");
      content.className = "report-card-content";

      const heading = document.createElement("h3");
      heading.textContent = report.category || "Civic issue";

      const description = document.createElement("p");
      description.textContent =
        report.description || "No description provided.";

      const status = document.createElement("span");
      status.className = "report-status";
      status.textContent = report.status || "Reported";

      const date = new Date(report.createdAt);
      const formattedDate = Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString();

      const id = document.createElement("p");
      id.className = "report-meta";
      id.textContent = `Report ID: ${report.id || "Unavailable"}`;

      const submitted = document.createElement("p");
      submitted.className = "report-meta";
      submitted.textContent = `Submitted: ${formattedDate}`;

      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      const coordinates = document.createElement("p");
      coordinates.className = "report-meta";
      coordinates.textContent =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
          ? `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : "Coordinates unavailable";

      content.append(
        heading,
        description,
        status,
        id,
        submitted,
        coordinates
      );

      
      // Add a delete button to each report card.
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "report-delete-button";
      deleteButton.textContent = "Delete Report";
      deleteButton.setAttribute(
        "aria-label",
        `Delete report ${report.id || "with unavailable ID"}`
      );

      deleteButton.addEventListener("click", () => {
        if (!report.id) {
          alert("This report has no valid ID and cannot be deleted.");
          return;
        }

        const confirmed = window.confirm(
          `Are you sure you want to delete this report?\n\n` +
          `Category: ${report.category || "Civic issue"}\n` +
          `Report ID: ${report.id}\n\n` +
          "This action cannot be undone."
        );

        if (!confirmed) return;

        if (typeof deleteReport !== "function") {
          alert("Delete function is unavailable. Check storage.js.");
          return;
        }

        try {
          deleteReport(report.id);

          // Reload data and refresh report/recurring cards.
          refreshDashboardData();
        } catch (error) {
          console.error("Could not delete report:", error);
          alert(error.message || "Could not delete this report.");
        }
      });

      card.append(content, deleteButton);
      container.appendChild(card);

    });
  }

  // ==========================================
  // 5. DISPLAY RECURRING ISSUES
  // ==========================================
  function renderRecurringIssues() {
    if (!recurringContainer) return;

    recurringContainer.replaceChildren();

    const recurringReports = reports.filter(
      report => report.isRecurring === true
    );

    if (recurringReports.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-state";
      emptyMessage.textContent =
        "No recurring issues detected yet. New reports will be checked against previous reports.";

      recurringContainer.appendChild(emptyMessage);
      return;
    }

    recurringReports.forEach(report => {
      const card = document.createElement("article");
      card.className = "recurring-card";

      const heading = document.createElement("h3");
      heading.textContent = report.category || "Civic issue";

      const badge = document.createElement("span");
      badge.className = "recurring-badge";
      badge.textContent = "Potential recurrence";

      const description = document.createElement("p");
      description.textContent =
        report.description || "No description provided.";

      const count = document.createElement("p");
      count.textContent =
        `Matching previous reports: ${report.recurrenceCount ?? 0}`;

      card.append(heading, badge, description, count);

      const matches = Array.isArray(report.previousMatches)
        ? report.previousMatches
        : [];

      matches.forEach(match => {
        const details = document.createElement("p");
        details.className = "recurring-details";

        const distance = Number(match.distanceMeters);
        const distanceText = Number.isFinite(distance)
          ? `${distance} metres away`
          : "Distance unavailable";

        details.textContent =
          `Previous report: ${match.id || "Unknown"} | ` +
          `Status: ${match.status || "Unavailable"} | ${distanceText}`;

        card.appendChild(details);
      });

      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      const location = document.createElement("p");
      location.className = "recurring-details";
      location.textContent =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
          ? `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : "Coordinates unavailable";

      card.appendChild(location);
      recurringContainer.appendChild(card);
    });
  }

  // ==========================================
  // 6. REFRESH DASHBOARD DATA
  // ==========================================
  function refreshDashboardData() {
    // Read the latest saved reports from localStorage.
    reports = getSavedReports();

    // Update available categories and keep the current selection
    // when that category still exists.
    updateCategoryOptions();

    // Refresh the report and recurring issue cards.
    renderReports();
    renderRecurringIssues();

    // Tell other dashboard components that the saved data changed.
    window.dispatchEvent(
      new CustomEvent("ripplemap:reports-updated", {
        detail: { reports }
      })
    );

    if (lastUpdated) {
      lastUpdated.textContent =
        `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }

  // ==========================================
  // 7. SEARCH, FILTER, SORT AND RESET
  // ==========================================
  searchInput?.addEventListener("input", renderReports);
  statusFilter?.addEventListener("change", renderReports);
  categoryFilter?.addEventListener("change", renderReports);
  sortSelect?.addEventListener("change", renderReports);

  clearButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "all";
    if (categoryFilter) categoryFilter.value = "all";
    if (sortSelect) sortSelect.value = "newest";

    renderReports();
  });

  refreshButton?.addEventListener("click", refreshDashboardData);

  // Refresh after returning from another tab or window.
  window.addEventListener("focus", refreshDashboardData);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshDashboardData();
    }
  });

  // ==========================================
  // 8. INITIAL DASHBOARD RENDER
  // ==========================================
  updateCategoryOptions();
  renderReports();
  renderRecurringIssues();

  if (lastUpdated) {
    lastUpdated.textContent =
      `Last updated: ${new Date().toLocaleTimeString()}`;
  }
});
