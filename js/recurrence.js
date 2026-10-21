
/**
 * RippleMap AI — Recurrence Intelligence
 * Rule-based detection of potential recurring civic issues.
 */

const RECURRENCE_DISTANCE_METERS = 50;

function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const earthRadius = 6371000;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lng2 - lng1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const safeA = Math.min(1, Math.max(0, a));

  return 2 * earthRadius *
    Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
}

function detectRecurrence(newReport, previousReports) {
  const matches = previousReports
    .filter((previous) => {
      // A report cannot be a match for itself.
      if (previous.id === newReport.id) return false;

      // Only compare reports in the same category.
      if (
        String(previous.category).toLowerCase() !==
        String(newReport.category).toLowerCase()
      ) {
        return false;
      }

      const oldLat = Number(previous.latitude);
      const oldLng = Number(previous.longitude);
      const newLat = Number(newReport.latitude);
      const newLng = Number(newReport.longitude);

      if (
        !Number.isFinite(oldLat) ||
        !Number.isFinite(oldLng) ||
        !Number.isFinite(newLat) ||
        !Number.isFinite(newLng)
      ) {
        return false;
      }

      const distance = calculateDistanceMeters(
        oldLat,
        oldLng,
        newLat,
        newLng
      );

      return distance <= RECURRENCE_DISTANCE_METERS;
    })
    .map((previous) => ({
      id: previous.id,
      category: previous.category,
      status: previous.status,
      createdAt: previous.createdAt,
      distanceMeters: Math.round(
        calculateDistanceMeters(
          Number(previous.latitude),
          Number(previous.longitude),
          Number(newReport.latitude),
          Number(newReport.longitude)
        )
      )
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return {
    isRecurring: matches.length > 0,
    matchCount: matches.length,
    previousMatches: matches
  };
}


//Temporary test function to demonstrate recurrence detection in the console.
const recurrenceTestReport = {
  id: "TEST-NEW",
  category: "Pothole",
  latitude: 16.5062,
  longitude: 80.6480
};

const recurrenceTestHistory = [
  {
    id: "TEST-OLD",
    category: "Pothole",
    latitude: 16.5063,
    longitude: 80.6481,
    status: "Resolved",
    createdAt: "2026-10-10T10:00:00.000Z"
  },
  {
    id: "TEST-GARBAGE",
    category: "Garbage",
    latitude: 16.5062,
    longitude: 80.6480,
    status: "Reported",
    createdAt: "2026-10-11T10:00:00.000Z"
  }
];

console.log(
  "Recurrence test:",
  detectRecurrence(recurrenceTestReport, recurrenceTestHistory)
);