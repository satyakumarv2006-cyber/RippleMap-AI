
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reportForm");
  if (!form) return;

  const message = document.getElementById("formMessage");
  const submitButton = form.querySelector('[type="submit"]');

  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const maxWidth = 800;
        const maxHeight = 600;

        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process the selected photo."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        try {
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        } catch {
          reject(new Error("Could not compress the selected photo."));
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("The selected photo could not be processed."));
      };

      image.src = objectUrl;
    });
  }

  function validateCoordinates(latitude, longitude) {
    if (
      latitude === "" ||
      longitude === "" ||
      latitude === null ||
      longitude === null
    ) {
      return "Please select the issue location on the map or use GPS.";
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return "Invalid location. Please select the location again.";
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return "Location coordinates are outside the valid range.";
    }

    return null;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton?.disabled) return;

    const categoryInput = document.getElementById("issueCategory");
    const descriptionInput = document.getElementById("issueDescription");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");

    const category = categoryInput?.value.trim() || "";
    const description = descriptionInput?.value.trim() || "";
    const photo = window.rippleMapGetSelectedPhoto?.();

    const latitude = latitudeInput?.value ?? "";
    const longitude = longitudeInput?.value ?? "";

    if (!category) {
      message.textContent = "Please select an issue category.";
      return;
    }

    if (!description) {
      message.textContent = "Please enter an issue description.";
      return;
    }

    if (!photo) {
      message.textContent = "Please select an issue photo.";
      return;
    }

    const coordinateError = validateCoordinates(latitude, longitude);

    if (coordinateError) {
      message.textContent = coordinateError;
      return;
    }

    if (
      typeof saveReport !== "function" ||
      typeof getSavedReports !== "function"
    ) {
      message.textContent =
        "Storage module not loaded. Check the script tags in report.html.";
      return;
    }

    if (typeof photo.type === "string" && !photo.type.startsWith("image/")) {
      message.textContent = "Please select a valid image file.";
      return;
    }

    submitButton.disabled = true;
    message.textContent = "Compressing photo and saving your report...";

    try {
      const photoData = await compressPhoto(photo);
      const now = new Date().toISOString();

      const report = {
        id: `RM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category,
        description,
        photo: photoData,
        latitude: Number(latitude),
        longitude: Number(longitude),
        createdAt: now,
        updatedAt: now,
        status: "Reported"
      };

      // Check for potential recurrence before saving.
      const previousReports = getSavedReports();

      if (typeof detectRecurrence === "function") {
        const recurrence = detectRecurrence(report, previousReports);

        report.isRecurring = recurrence.isRecurring;
        report.recurrenceCount = recurrence.matchCount;
        report.previousMatches = recurrence.previousMatches;
      } else {
        report.isRecurring = false;
        report.recurrenceCount = 0;
        report.previousMatches = [];
      }

      saveReport(report);

      message.textContent =
        "Report saved successfully! You can view it on the dashboard.";

      form.reset();

      const previewContainer =
        document.getElementById("photoPreviewContainer");
      const preview = document.getElementById("photoPreview");
      const photoFileName = document.getElementById("photoFileName");
      const photoMessage = document.getElementById("photoMessage");

      if (preview) {
        if (preview.src.startsWith("blob:")) {
          URL.revokeObjectURL(preview.src);
        }

        preview.removeAttribute("src");
      }

      if (previewContainer) previewContainer.hidden = true;
      if (photoFileName) photoFileName.textContent = "";
      if (photoMessage) photoMessage.textContent = "";

      if (latitudeInput) latitudeInput.value = "";
      if (longitudeInput) longitudeInput.value = "";

      const locationStatus =
        document.getElementById("reportLocationStatus");

      if (locationStatus) {
        locationStatus.textContent = "No location selected yet.";
      }

      window.rippleMapSelectedLocation = null;

      // Remove the previous selection marker from the report map.
      if (window.rippleMapInstance) {
        window.rippleMapInstance.closePopup();

        if (window.rippleMapClearSelectedLocation) {
          window.rippleMapClearSelectedLocation();
        }
      }

     
message.textContent =
  "Report submitted successfully! Redirecting to the dashboard...";

if (submitButton) {
  submitButton.disabled = true;
}

// Allow the success message to appear before navigating.
window.setTimeout(() => {
  window.location.href = "index.html";
}, 1200);

    } catch (error) {
      console.error("Report submission failed:", error);

      message.textContent =
        error.message || "Could not save the report. Please try again.";
    } finally {
      submitButton.disabled = false;
    }
  });
});
