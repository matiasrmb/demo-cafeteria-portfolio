import {
  datesInMonth,
  getSlots,
  lastDate,
  localClock,
  validateRequest,
  validWhatsAppNumber,
  whatsappLink,
} from "../lib/availability";
import type { Availability } from "../lib/types";

const form = document.querySelector<HTMLFormElement>("#request-form");
if (form) {
  const config = JSON.parse(form.dataset.config!) as {
    availability: Availability;
    whatsapp: string;
  };
  const fields = {
    name: form.querySelector<HTMLInputElement>("#request-name")!,
    type: form.querySelector<HTMLSelectElement>("#request-type")!,
    people: form.querySelector<HTMLInputElement>("#request-people")!,
    date: form.querySelector<HTMLInputElement>("#request-date")!,
    time: form.querySelector<HTMLSelectElement>("#request-time")!,
  };
  const submit = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  )!;
  const days = form.querySelector<HTMLDivElement>("#calendar-days")!;
  const title = form.querySelector<HTMLHeadingElement>("#calendar-title")!;
  const previous = form.querySelector<HTMLButtonElement>("#previous-month")!;
  const next = form.querySelector<HTMLButtonElement>("#next-month")!;
  const status = form.querySelector<HTMLParagraphElement>("#form-status")!;
  const summary = document.querySelector<HTMLElement>("#request-summary")!;
  const summaryText = document.querySelector<HTMLElement>("#summary-text")!;
  const link = document.querySelector<HTMLAnchorElement>("#whatsapp-link")!;
  const destination = document.querySelector<HTMLElement>(
    "#destination-status",
  )!;
  let month = localClock().date.slice(0, 7);
  const touched = new Set<string>();
  const recipientValid = validWhatsAppNumber(config.whatsapp);
  if (recipientValid)
    destination.textContent =
      "Destinatario configurado. WhatsApp se abrirá solo si eliges continuar; tú revisas y envías el mensaje.";
  if (new URLSearchParams(location.search).get("tipo") === "evento")
    fields.type.value = "event";

  const request = () => ({
    name: fields.name.value,
    type: fields.type.value,
    people: Number(fields.people.value),
    date: fields.date.value,
    time: fields.time.value,
  });
  function clearSummary() {
    summary.hidden = true;
    summaryText.textContent = "";
    link.hidden = true;
    link.removeAttribute("href");
  }
  function validate() {
    const errors = validateRequest(request(), config.availability);
    for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
      const show = touched.has(key) && errors[key];
      fields[key].setAttribute("aria-invalid", show ? "true" : "false");
      document.querySelector<HTMLElement>(`#error-${key}`)!.textContent =
        show || "";
    }
    submit.disabled = Object.keys(errors).length > 0;
    status.textContent = submit.disabled
      ? "Completa los campos y selecciona un horario disponible para revisar tu solicitud."
      : "Datos válidos para una solicitud ilustrativa. Todavía no se ha enviado nada.";
  }
  function refreshTimes() {
    const selected = fields.time.value;
    const slots = getSlots(
      config.availability,
      fields.date.value,
      fields.type.value,
      Number(fields.people.value),
    );
    fields.time.replaceChildren(
      new Option(
        slots.length
          ? "Selecciona un horario"
          : "No hay horarios para esta selección",
        "",
      ),
    );
    for (const slot of slots) fields.time.add(new Option(slot, slot));
    if (slots.includes(selected)) fields.time.value = selected;
  }
  function renderCalendar() {
    const dates = datesInMonth(month);
    title.textContent = new Intl.DateTimeFormat("es-CL", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    }).format(new Date(`${month}-01T12:00:00Z`));
    days.replaceChildren();
    const padding = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
    for (let i = 0; i < padding; i++) {
      const blank = document.createElement("span");
      blank.setAttribute("aria-hidden", "true");
      days.append(blank);
    }
    for (const date of dates) {
      const available =
        getSlots(
          config.availability,
          date,
          fields.type.value,
          Number(fields.people.value),
        ).length > 0;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(Number(date.slice(-2)));
      button.dataset.date = date;
      button.disabled = !available;
      button.setAttribute("aria-pressed", String(fields.date.value === date));
      const label = new Intl.DateTimeFormat("es-CL", {
        timeZone: "UTC",
        dateStyle: "full",
      }).format(new Date(`${date}T12:00:00Z`));
      button.setAttribute(
        "aria-label",
        `${label}: ${available ? "disponible de ejemplo" : "no disponible"}`,
      );
      button.addEventListener("click", () => {
        fields.date.value = date;
        touched.add("date");
        clearSummary();
        refreshTimes();
        validate();
        renderCalendar();
        days.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus();
      });
      days.append(button);
    }
    const clock = localClock();
    fields.date.min = clock.date;
    fields.date.max = lastDate(config.availability);
    previous.disabled = month <= clock.date.slice(0, 7);
    next.disabled = month >= fields.date.max.slice(0, 7);
  }
  function changeMonth(delta: number) {
    const date = new Date(`${month}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + delta);
    month = date.toISOString().slice(0, 7);
    renderCalendar();
  }
  previous.addEventListener("click", () => changeMonth(-1));
  next.addEventListener("click", () => changeMonth(1));
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    fields[key].addEventListener("input", () => {
      touched.add(key);
      clearSummary();
      if (["date", "type", "people"].includes(key)) refreshTimes();
      if (["type", "people"].includes(key)) renderCalendar();
      if (key === "date" && fields.date.value) {
        month = fields.date.value.slice(0, 7);
        renderCalendar();
      }
      validate();
    });
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Object.keys(fields).forEach((key) => touched.add(key));
    refreshTimes();
    validate();
    if (submit.disabled) return;
    const data = request();
    summaryText.textContent = `${data.name.trim()} · ${data.date} · ${data.time} (Chile) · ${data.people} personas · ${data.type === "table" ? "Mesa" : "Grupo/evento"}`;
    const href = whatsappLink(config.whatsapp, data, config.availability);
    if (href) {
      link.href = href;
      link.hidden = false;
    }
    summary.hidden = false;
  });
  link.addEventListener("click", (event) => {
    const href = whatsappLink(config.whatsapp, request(), config.availability);
    if (!href) {
      event.preventDefault();
      clearSummary();
      refreshTimes();
      renderCalendar();
      validate();
      return;
    }
    link.href = href;
  });
  // Clear transient personal fields when restoring this page from browser history.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      form.reset();
      touched.clear();
      clearSummary();
      month = localClock().date.slice(0, 7);
      refreshTimes();
      renderCalendar();
      validate();
    }
  });
  refreshTimes();
  renderCalendar();
  validate();
}
