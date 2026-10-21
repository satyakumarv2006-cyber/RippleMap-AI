
/*
  RippleMap AI — Phase 5.4.1
  Hotspot Detection Logic

  Rules:
  - Reports within 200 metres are considered nearby.
  - At least 3 reports are required to form a hotspot.
  - Uses saved report coordinates.
*/

window.RippleMapHotspots = (() => {
  const HOTSPOT_RADIUS_METERS = 200;
  const MIN_REPORTS = 3;

  // Calculate distance between two GPS coordinates.
  function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
    const earthRadius = 6371000;
    const toRadians = degrees => degrees * Math.PI / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

    const safeA = Math.min(1, Math.max(0, a));

    return 2 * earthRadius *
      Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
  }

  // Find areas with enough nearby reports.
  function detectHotspots(reports) {
    if (!Array.isArray(reports)) return [];

    const validReports = reports.filter(report => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });

    const hotspots = [];
    const assignedReportIds = new Set();

    validReports.forEach((report, index) => {
      const reportId = report.id ?? `report-${index}`;

      if (assignedReportIds.has(reportId)) return;

      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      // Collect reports within 200 metres of this report.
      const nearbyReports = validReports.filter(otherReport => {
        const distance = calculateDistanceMeters(
          lat,
          lng,
          Number(otherReport.latitude),
          Number(otherReport.longitude)
        );

        return distance <= HOTSPOT_RADIUS_METERS;
      });

      if (nearbyReports.length < MIN_REPORTS) return;

      // Prevent the same report being counted in multiple hotspots.
      nearbyReports.forEach(otherReport => {
        if (otherReport.id != null) {
          assignedReportIds.add(otherReport.id);
        }
      });

      // Use the average coordinates as the hotspot centre.
      const centerLat =
        nearbyReports.reduce(
          (sum, item) => sum + Number(item.latitude), 0
        ) / nearbyReports.length;

      const centerLng =
        nearbyReports.reduce(
          (sum, item) => sum + Number(item.longitude), 0
        ) / nearbyReports.length;

      const categories = [
        ...new Set(
          nearbyReports.map(item => item.category || "Other")
        )
      ];

      
      // Assign a prototype priority based on the number of nearby reports.
      const reportCount = nearbyReports.length;

      let priority;

      if (reportCount >= 8) {
        priority = "High";
      } else if (reportCount >= 5) {
        priority = "Medium";
      } else {
        priority = "Low";
      }

      hotspots.push({
        id: `hotspot-${hotspots.length + 1}`,
        latitude: centerLat,
        longitude: centerLng,
        radiusMeters: HOTSPOT_RADIUS_METERS,
        reportCount,
        priority,
        categories,
        reportIds: nearbyReports.map(
          (item, nearbyIndex) =>
            item.id ?? `anonymous-${nearbyIndex}`
        )
      });

    });

    return hotspots;
  }

  return {
    calculateDistanceMeters,
    detectHotspots,
    HOTSPOT_RADIUS_METERS,
    MIN_REPORTS
  };
})();
