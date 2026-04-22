const bookingForm = document.querySelector("#booking-form");
const serviceSelect = document.querySelector("#service");
const serviceButtons = document.querySelectorAll("[data-service]");
const yearNode = document.querySelector("#year");
const dateField = document.querySelector("#preferred-day");
const formStatus = document.querySelector("#form-status");
const revealItems = document.querySelectorAll(".reveal");

function getTodayInputValue() {
  const now = new Date();
  const localMidnight = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localMidnight.toISOString().split("T")[0];
}

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (dateField) {
  dateField.min = getTodayInputValue();
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function humanizeLabel(field) {
  const label = bookingForm?.querySelector(`label[for="${field.id}"]`);
  return label ? label.textContent.trim().toLowerCase() : "this field";
}

function setFieldError(field, message) {
  const errorNode = document.querySelector(`#${field.id}-error`);
  field.classList.toggle("is-error", Boolean(message));
  field.setAttribute("aria-invalid", message ? "true" : "false");

  if (errorNode) {
    errorNode.textContent = message;
  }
}

function validateField(field) {
  const value = field.value.trim();
  let message = "";

  if (field.validity.valueMissing) {
    message = `Please add ${humanizeLabel(field)}.`;
  } else if (field.type === "tel") {
    const digits = value.replace(/\D/g, "");

    if (digits.length < 10) {
      message = "Please enter a phone number with at least 10 digits.";
    }
  }

  setFieldError(field, message);
  return !message;
}

if (bookingForm) {
  const requiredFields = bookingForm.querySelectorAll("[required]");

  requiredFields.forEach((field) => {
    field.addEventListener("blur", () => {
      validateField(field);
    });

    field.addEventListener("input", () => {
      if (field.classList.contains("is-error")) {
        validateField(field);
      }
    });
  });

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = [...requiredFields].every((field) => validateField(field));

    formStatus.classList.remove("is-error");

    if (!isValid) {
      formStatus.classList.add("is-error");
      formStatus.textContent = "Please check the highlighted fields so we can confirm your booking.";
      return;
    }

    const petName = document.querySelector("#pet-name")?.value.trim() || "your pet";
    const serviceName = serviceSelect?.value || "a grooming service";
    const selectedDate = dateField?.value
      ? new Date(`${dateField.value}T00:00:00`).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })
      : "your preferred day";

    formStatus.textContent =
      `Thanks! We received a ${serviceName} request for ${petName} on ${selectedDate} and will text you shortly.`;

    bookingForm.reset();
    if (dateField) {
      dateField.min = getTodayInputValue();
    }

    requiredFields.forEach((field) => {
      setFieldError(field, "");
    });
  });
}

serviceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (serviceSelect) {
      serviceSelect.value = button.dataset.service || "";
      setFieldError(serviceSelect, "");
    }

    formStatus.classList.remove("is-error");
    formStatus.textContent = `${button.dataset.service} added to the booking form.`;

    const bookingSection = document.querySelector("#booking");

    if (bookingSection) {
      bookingSection.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  });
});

if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
