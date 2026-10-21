
document.addEventListener("DOMContentLoaded", () => {
  const dashboardMap = document.getElementById("map");
  const reportMap = document.getElementById("reportMap");
  const mapElement = reportMap || dashboardMap;

  if (!mapElement || typeof L === "undefined") return;

  const isReportPage = Boolean(reportMap);
  const map = L.map(mapElement).setView([16.5062, 80.6480], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);

  const locationStatus = document.getElementById(
    isReportPage ? "reportLocationStatus" : "selectedLocation"
  );

  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");
  const gpsButton = document.getElementById("getCurrentLocation");

  let selectedMarker = null;

  // Dashboard layers are separate from the report-page selection marker.
  const dashboardLayers = L.layerGroup().addTo(map);
  let hasFittedInitialReports = false;

  function selectLocation(lat, lng, zoom = true) {
    window.rippleMapSelectedLocation = { lat, lng };

    if (selectedMarker) {
      selectedMarker.setLatLng([lat, lng]);
    } else {
      selectedMarker = L.marker([lat, lng]).addTo(map);
    }

    selectedMarker.bindPopup("Selected location for your report");

    if (zoom) {
      map.setView([lat, lng], 16);
      selectedMarker.openPopup();
    }

    if (latitudeInput) latitudeInput.value = lat.toFixed(6);
    if (longitudeInput) longitudeInput.value = lng.toFixed(6);

    if (locationStatus) {
      locationStatus.textContent =
        `Selected coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  map.on("click", (event) => {
    if (isReportPage) {
      selectLocation(event.latlng.lat, event.latlng.lng, false);
      selectedMarker.openPopup();
    }
  });

  if (gpsButton) {
    gpsButton.addEventListener("click", () => {
      if (!navigator.geolocation) {
        if (locationStatus) {
          locationStatus.textContent =
            "GPS is not supported. Select a location on the map instead.";
        }
        return;
      }

      gpsButton.disabled = true;
      gpsButton.textContent = "Getting your location...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          selectLocation(
            position.coords.latitude,
            position.coords.longitude
          );

          gpsButton.disabled = false;
          gpsButton.textContent = "📍 Use My Current Location";
        },
        (error) => {
          const messages = {
            1: "Location permission was denied. Allow location access or select a map location.",
            2: "Your location is unavailable. Try again or select a map location.",
            3: "Getting your location timed out. Try again or select a map location."
          };

          if (locationStatus) {
            locationStatus.textContent =
              messages[error.code] || "Could not get your location.";
          }

          gpsButton.disabled = false;
          gpsButton.textContent = "📍 Use My Current Location";
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }

  function isValidCoordinates(lat, lng) {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  function renderDashboardMap(reports) {
    if (isReportPage) return;

    // Remove old report markers and hotspot circles before redrawing.
    dashboardLayers.clearLayers();

    const validPoints = [];

    // Recalculate hotspots using the latest report data.
    let hotspots = [];

    if (
      window.RippleMapHotspots &&
      typeof window.RippleMapHotspots.detectHotspots === "function"
    ) {
      hotspots = window.RippleMapHotspots.detectHotspots(reports);
    } else {
      console.warn(
        "Hotspot module is unavailable. Check the hotspots.js script tag."
      );
    }

    // Draw hotspots first so individual markers remain easy to click.
    hotspots.forEach((hotspot) => {
      const lat = Number(hotspot.latitude);
      const lng = Number(hotspot.longitude);
      const radius = Number(hotspot.radiusMeters);

      if (
        !isValidCoordinates(lat, lng) ||
        !Number.isFinite(radius) ||
        radius <= 0
      ) {
        return;
      }

      const circle = L.circle([lat, lng], {
        radius,
        color: "#dc2626",
        weight: 2,
        opacity: 0.9,
        fillColor: "#ef4444",
        fillOpacity: 0.18
      }).addTo(dashboardLayers);

      const popup = document.createElement("div");

      const heading = document.createElement("strong");
      heading.textContent = "🔥 Civic Issue Hotspot";
      popup.appendChild(heading);

      const count = document.createElement("p");
      count.textContent =
        `Reports in this hotspot: ${hotspot.reportCount}`;
      popup.appendChild(count);

      const radiusText = document.createElement("p");
      radiusText.textContent = `Detection radius: ${radius} metres`;
      popup.appendChild(radiusText);

      const categoryHeading = document.createElement("p");
      categoryHeading.textContent = "Issue categories:";
      popup.appendChild(categoryHeading);

      const categoryList = document.createElement("ul");

      (Array.isArray(hotspot.categories) ? hotspot.categories : [])
        .forEach((category) => {
          const item = document.createElement("li");
          item.textContent = String(category);
          categoryList.appendChild(item);
        });

      popup.appendChild(categoryList);
      circle.bindPopup(popup);
    });

    // Draw the latest individual report markers.
    reports.forEach((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      if (!isValidCoordinates(lat, lng)) return;

      const recurring = report.isRecurring === true;
      const status = report.status || "Reported";

      const markerColor =
        status === "Resolved" ? "#16803c" :
        status === "Under Investigation" ? "#d97706" :
        "#2563eb";

      const marker = L.circleMarker([lat, lng], {
        radius: recurring ? 10 : 7,
        color: recurring ? "#b91c1c" : markerColor,
        fillColor: recurring ? "#ef4444" : markerColor,
        fillOpacity: 0.85,
        weight: recurring ? 3 : 2
      }).addTo(dashboardLayers);

      const popup = document.createElement("div");

      const heading = document.createElement("strong");
      heading.textContent = report.category || "Civic issue";
      popup.appendChild(heading);

      const description = document.createElement("p");
      description.textContent =
        report.description || "No description provided.";
      popup.appendChild(description);

      const statusLine = document.createElement("p");
      statusLine.textContent = `Status: ${status}`;
      popup.appendChild(statusLine);

      if (recurring) {
        const recurrenceLine = document.createElement("p");
        recurrenceLine.textContent =
          `⚠ Potential recurrence (${report.recurrenceCount ?? 0} matching reports)`;
        popup.appendChild(recurrenceLine);
      }

      marker.bindPopup(popup);
      validPoints.push([lat, lng]);
    });

    // Fit to report locations only on the initial render.
    // Refreshing won't unexpectedly move the user's map view.
    if (!hasFittedInitialReports && validPoints.length > 0) {
      map.fitBounds(validPoints, {
        padding: [30, 30],
        maxZoom: 15
      });

      hasFittedInitialReports = true;
    }
  }

  if (!isReportPage) {
    if (typeof getSavedReports === "function") {
      renderDashboardMap(getSavedReports());

      // Listen for dashboard refreshes from dashboard.js.
      window.addEventListener("ripplemap:reports-updated", (event) => {
        const updatedReports = Array.isArray(event.detail?.reports)
          ? event.detail.reports
          : getSavedReports();

        renderDashboardMap(updatedReports);
      });
    } else {
      console.warn(
        "Storage module is unavailable; report markers were not loaded."
      );
    }
  }

  window.rippleMapInstance = map;
window.rippleMapSelectLocation = selectLocation;

window.rippleMapClearSelectedLocation = () => {
  if (selectedMarker) {
    map.removeLayer(selectedMarker);
    selectedMarker = null;
  }

  window.rippleMapSelectedLocation = null;
};

  setTimeout(() => map.invalidateSize(), 150);
});
