import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import type { Availability, HoursRule } from "./types.ts";

export const TIME_ZONE = "America/Santiago";

export function localClock(now = new Date()): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function datesInMonth(month: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(month) || !isDate(`${month}-01`)) return [];
  const [year, number] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year!, number!, 0)).getUTCDate();
  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}

export function minutes(value: unknown): number {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    return NaN;
  const [hour, minute] = value.split(":").map(Number);
  return hour! * 60 + minute!;
}

export function validRule(rule: Partial<HoursRule>): rule is HoursRule {
  return (
    minutes(rule.opens) < minutes(rule.closes) &&
    Number.isInteger(rule.interval) &&
    rule.interval! >= 15 &&
    rule.interval! <= 120 &&
    Number.isInteger(rule.tableCapacity) &&
    rule.tableCapacity! >= 1 &&
    rule.tableCapacity! <= 20 &&
    Number.isInteger(rule.eventCapacity) &&
    rule.eventCapacity! >= 1 &&
    rule.eventCapacity! <= 80
  );
}

export function lastDate(config: Availability, now = new Date()): string {
  const day = new Date(`${localClock(now).date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + config.horizonDays);
  return day.toISOString().slice(0, 10);
}

export function getSlots(
  config: Availability,
  date: string,
  type: string,
  people: number,
  now = new Date(),
): string[] {
  if (
    !isDate(date) ||
    !["table", "event"].includes(type) ||
    !Number.isInteger(people) ||
    people < 1
  )
    return [];
  if (
    !Number.isInteger(config.horizonDays) ||
    config.horizonDays < 1 ||
    config.horizonDays > 180
  )
    return [];
  const clock = localClock(now);
  if (
    date < clock.date ||
    date > lastDate(config, now) ||
    config.closedDates.includes(date)
  )
    return [];
  const exception = config.exceptions.find((item) => item.date === date);
  if (exception?.closed) return [];
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const rule =
    exception ?? config.weekly.find((item) => item.weekday === weekday);
  if (!rule || !validRule(rule)) return [];
  const capacity = type === "table" ? rule.tableCapacity : rule.eventCapacity;
  if (people > capacity) return [];
  const slots: string[] = [];
  for (
    let start = minutes(rule.opens);
    start + rule.interval <= minutes(rule.closes);
    start += rule.interval
  ) {
    const time = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
    if (date !== clock.date || time > clock.time) slots.push(time);
  }
  return slots;
}

export type RequestErrors = Partial<
  Record<"name" | "date" | "time" | "people" | "type", string>
>;

export function validateRequest(
  request: Record<string, unknown>,
  config: Availability,
  now = new Date(),
): RequestErrors {
  const errors: RequestErrors = {};
  const { name, date, time, people, type } = request;
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 80 ||
    /[\u0000-\u001f\u007f-\u009f]/.test(name)
  ) {
    errors.name =
      "Escribe un nombre de entre 2 y 80 caracteres, sin saltos de línea.";
  }
  if (
    typeof date !== "string" ||
    !isDate(date) ||
    date < localClock(now).date ||
    date > lastDate(config, now)
  ) {
    errors.date = "Selecciona una fecha dentro del calendario de demostración.";
  }
  if (
    typeof people !== "number" ||
    !Number.isInteger(people) ||
    people < 1 ||
    people > 80
  ) {
    errors.people =
      "Indica una cantidad entera de entre 1 y 80 personas; los cupos dependen del tipo y la fecha.";
  }
  if (type !== "table" && type !== "event")
    errors.type = "Selecciona mesa o grupo/evento.";
  if (
    typeof time !== "string" ||
    typeof date !== "string" ||
    typeof type !== "string" ||
    typeof people !== "number" ||
    !getSlots(config, date, type, people, now).includes(time)
  ) {
    errors.time =
      "Selecciona un horario disponible para esa fecha, tipo y cantidad de personas.";
  }
  return errors;
}

export function validWhatsAppNumber(number: unknown): number is string {
  if (typeof number !== "string" || !/^[1-9]\d{7,14}$/.test(number))
    return false;
  const parsed = parsePhoneNumberFromString(`+${number}`);
  return Boolean(parsed?.isValid() && parsed.number === `+${number}`);
}

export function whatsappLink(
  number: string,
  request: Record<string, unknown>,
  config: Availability,
  now = new Date(),
): string | null {
  if (
    !validWhatsAppNumber(number) ||
    Object.keys(validateRequest(request, config, now)).length
  )
    return null;
  const type = request.type === "table" ? "mesa" : "grupo/evento";
  const message = [
    "Solicitud de demostración — Bruma (no confirma una reserva).",
    `Nombre: ${(request.name as string).trim()}`,
    `Fecha: ${request.date}`,
    `Hora: ${request.time} (${TIME_ZONE})`,
    `Personas: ${request.people}`,
    `Tipo: ${type}`,
    "Quiero consultar esta solicitud ilustrativa. Revisaré el mensaje antes de enviarlo.",
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
