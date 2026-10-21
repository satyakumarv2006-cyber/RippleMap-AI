
document.addEventListener("DOMContentLoaded", () => {
  const totalElement = document.getElementById("totalHotspots");
  const listElement = document.getElementById("hotspotSummaryList");

  if (!totalElement || !listElement) return;

  if (
    typeof getSavedReports !== "function" ||
    !window.RippleMapHotspots ||
    typeof window.RippleMapHotspots.detectHotspots !== "function"
  ) {
    listElement.textContent =
      "Hotspot detection is unavailable. Please check the script files.";
    return;
  }

  function renderHotspotPanel(reports) {
    const hotspots =
      window.RippleMapHotspots.detectHotspots(reports);

    // Highest report count first, then sort by location.
    hotspots.sort((a, b) => {
      if (b.reportCount !== a.reportCount) {
        return b.reportCount - a.reportCount;
      }

      if (a.latitude !== b.latitude) {
        return a.latitude - b.latitude;
      }

      return a.longitude - b.longitude;
    });

    totalElement.textContent = hotspots.length;
    listElement.replaceChildren();

    if (hotspots.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-state";
      emptyMessage.textContent =
        "No hotspots detected yet. At least 3 nearby reports are needed.";
      listElement.appendChild(emptyMessage);
      return;
    }

    hotspots.forEach((hotspot, index) => {
      const card = document.createElement("article");
      card.className = "hotspot-summary-card";

      const heading = document.createElement("h4");
      heading.textContent = `Hotspot ${index + 1}`;
      card.appendChild(heading);

      const count = document.createElement("p");
      count.textContent = `Reports: ${hotspot.reportCount}`;
      card.appendChild(count);

      const categories = document.createElement("p");
      categories.textContent =
        `Categories: ${
          Array.isArray(hotspot.categories)
            ? hotspot.categories.join(", ")
            : "Unavailable"
        }`;
      card.appendChild(categories);

   
      const priority = document.createElement("p");
      priority.className = "hotspot-priority";

      // Use the priority calculated by hotspots.js.
      const priorityLevel = hotspot.priority || "Low";

      if (priorityLevel === "High") {
        priority.textContent = "🔴 High Priority — Review this area first";
        priority.classList.add("priority-high");
      } else if (priorityLevel === "Medium") {
        priority.textContent = "🟠 Medium Priority — Monitor this area";
        priority.classList.add("priority-medium");
      } else {
        priority.textContent = "🟢 Low Priority — Routine monitoring";
        priority.classList.add("priority-low");
      }

      card.appendChild(priority);


      const location = document.createElement("p");
      const lat = Number(hotspot.latitude);
      const lng = Number(hotspot.longitude);

      location.textContent =
        Number.isFinite(lat) && Number.isFinite(lng)
          ? `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : "Coordinates unavailable";

      card.appendChild(location);
      listElement.appendChild(card);
    });
  }

  // Initial render when the dashboard loads.
  renderHotspotPanel(getSavedReports());

  // Recalculate when dashboard.js announces refreshed report data.
  window.addEventListener("ripplemap:reports-updated", (event) => {
    const reports = Array.isArray(event.detail?.reports)
      ? event.detail.reports
      : getSavedReports();

    renderHotspotPanel(reports);
  });

  // Recalculate if the user returns to the dashboard tab.
  window.addEventListener("focus", () => {
    renderHotspotPanel(getSavedReports());
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      renderHotspotPanel(getSavedReports());
    }
  });
});
