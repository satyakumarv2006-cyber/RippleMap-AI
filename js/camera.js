
document.addEventListener("DOMContentLoaded", () => {
  const photoInput = document.getElementById("issuePhoto");
  const previewContainer =
    document.getElementById("photoPreviewContainer");
  const preview = document.getElementById("photoPreview");
  const fileName = document.getElementById("photoFileName");
  const photoMessage = document.getElementById("photoMessage");
  const removeButton = document.getElementById("removePhoto");

  // This script may be loaded on pages without a photo input.
  if (
    !photoInput ||
    !previewContainer ||
    !preview ||
    !fileName ||
    !photoMessage ||
    !removeButton
  ) {
    return;
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  let currentPreviewUrl = null;

  function clearPreview() {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = null;
    }

    preview.removeAttribute("src");
    previewContainer.hidden = true;
    fileName.textContent = "";
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];

    clearPreview();

    if (!file) {
      photoMessage.textContent = "No photo selected.";
      return;
    }

    if (!file.type.startsWith("image/")) {
      photoInput.value = "";
      photoMessage.textContent =
        "Please select a valid image file.";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      photoInput.value = "";
      photoMessage.textContent =
        "Image is too large. Please select an image under 5 MB.";
      return;
    }

    currentPreviewUrl = URL.createObjectURL(file);
    preview.src = currentPreviewUrl;
    fileName.textContent =
      `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;

    previewContainer.hidden = false;
    photoMessage.textContent = "Photo selected successfully.";
  });

  removeButton.addEventListener("click", () => {
    photoInput.value = "";
    clearPreview();
    photoMessage.textContent = "Photo removed. Select another image.";
  });

  // Other modules can inspect the selected File object.
  window.rippleMapGetSelectedPhoto = () =>
    photoInput.files?.[0] ?? null;
});
