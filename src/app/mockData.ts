/**
 * Mock data for the Weekly Schedule 2.0 app.
 * All department/unit/employee names are natively in Ukrainian.
 * Structured to match the real retail store layout.
 */
import type { Department } from "./components/WeeklyTable";
import type { ShiftData } from "./components/ShiftCard";

// ── Helper: create a normal shift ──────────────────────────────────────
function ns(
  id: string,
  timeRange: string,
  subUnits: { time: string; unit: string }[],
  brk?: { breakStart: string; breakDuration: number },
): ShiftData {
  return {
    id,
    timeRange,
    subUnits,
    status: "normal",
    ...(brk
      ? {
          breakText: `перерва ${brk.breakDuration} хв`,
          breakStart: brk.breakStart,
          breakDuration: brk.breakDuration,
        }
      : {}),
  };
}

// ── Helper: create a fact shift ────────────────────────────────────────
function fs(
  base: ShiftData,
  actualTimeRange: string,
  factStatus: "matched" | "overtime" | "missing" | "no-show",
  deltaHours: number,
  actualSubUnits?: { time: string; unit: string }[],
): ShiftData {
  return {
    ...base,
    actualTimeRange,
    actualSubUnits: actualSubUnits || base.subUnits,
    factStatus,
    deltaHours,
  };
}

// ── Helper: resource control row ───────────────────────────────────────
type RC = { forecast: number; scheduled: number; actual?: number };
function rc7(arr: [number, number, number?][]): RC[] {
  return arr.map(([f, s, a]) => (a !== undefined ? { forecast: f, scheduled: s, actual: a } : { forecast: f, scheduled: s }));
}

// ══════════════════════════════════════════════════════════════════════
// PLAN DEPARTMENTS
// ══════════════════════════════════════════════════════════════════════

export const MOCK_DEPARTMENTS: Department[] = [
  // ─── 1. ВІДДІЛ ВИПІЧКИ ───────────────────────────────────────────────
  {
    id: "dept-vypichka",
    name: "Відділ випічки",
    openShifts: [
      {
        id: "os-v1",
        dayIndex: 3,
        shift: { id: "os-vs1", timeRange: "06:00–14:00", subUnits: [{ time: "06:00–14:00", unit: "Пекарня - Виробництво" }], status: "open", exchangeStatus: "on-exchange" },
      },
    ],
    employees: [
      {
        id: "ev1",
        name: "Олександр Коваль",
        position: "Старший пекар",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 152,
        shifts: {
          "0": [ns("sv1", "05:00–13:00", [{ time: "05:00–09:00", unit: "Пекарня - Виробництво" }, { time: "09:00–13:00", unit: "Пекарня" }], { breakStart: "09:00", breakDuration: 30 })],
          "1": [ns("sv2", "05:00–13:00", [{ time: "05:00–13:00", unit: "Пекарня - Виробництво" }], { breakStart: "09:00", breakDuration: 30 })],
          "2": [ns("sv3", "05:00–13:00", [{ time: "05:00–13:00", unit: "Пекарня" }], { breakStart: "09:00", breakDuration: 30 })],
          "3": [ns("sv4", "05:00–13:00", [{ time: "05:00–13:00", unit: "Пекарня - Виробництво" }], { breakStart: "09:00", breakDuration: 30 })],
          "4": [ns("sv5", "05:00–13:00", [{ time: "05:00–09:00", unit: "Пекарня" }, { time: "09:00–13:00", unit: "Пекарня - Виробництво" }], { breakStart: "09:00", breakDuration: 30 })],
        },
      },
      {
        id: "ev2",
        name: "Ірина Петренко",
        position: "Пекар",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 136,
        shifts: {
          "0": [ns("sv6", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "1": [ns("sv7", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("sv8", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня" }], { breakStart: "10:00", breakDuration: 30 })],
          "4": [ns("sv9", "13:00–21:00", [{ time: "13:00–21:00", unit: "Пекарня" }], { breakStart: "17:00", breakDuration: 30 })],
          "5": [ns("sv10", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
        },
      },
      // ── Demo: employee from another department (Каса → Випічка) ──
      {
        id: "ev-origin-dept",
        name: "Олена Ковальчук",
        position: "Продавець продовольчих товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 120,
        origin: { type: "another-department", label: "Відділ каса" },
        shifts: {
          "1": [ns("sv-od1", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("sv-od2", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня" }], { breakStart: "10:00", breakDuration: 30 })],
          "5": [ns("sv-od3", "05:00–13:00", [{ time: "05:00–13:00", unit: "Пекарня - Виробництво" }], { breakStart: "09:00", breakDuration: 30 })],
        },
      },
      // ── Demo: employee from another store ──
      {
        id: "ev-origin-store",
        name: "Марія Лисенко",
        position: "Продавець продовольчих товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 48,
        origin: { type: "another-store", label: "Сільпо №124" },
        marketplaceHours: 22.5,
        shifts: {
          "0": [{ ...ns("sv-os1", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня" }], { breakStart: "10:00", breakDuration: 30 }), marketplaceSource: true }],
          "2": [{ ...ns("sv-os2", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня - Виробництво" }], { breakStart: "10:00", breakDuration: 30 }), marketplaceSource: true }],
          "4": [{ ...ns("sv-os3", "05:00–13:00", [{ time: "05:00–09:00", unit: "Пекарня - Виробництво" }, { time: "09:00–13:00", unit: "Пекарня" }], { breakStart: "09:00", breakDuration: 30 }), marketplaceSource: true }],
        },
      },
      // ── Demo: employee from marketplace ──
      {
        id: "ev-origin-marketplace",
        name: "Андрій Бондаренко",
        position: "Пекар",
        fte: 50,
        monthlyNorm: 88,
        workedHours: 24,
        marketplaceHours: 24,
        origin: { type: "marketplace", label: "Біржі змін" },
        shifts: {
          "1": [ns("sv-mp1", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("sv-mp2", "06:00–14:00", [{ time: "06:00–14:00", unit: "Пекарня - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "5": [ns("sv-mp3", "07:00–15:00", [{ time: "07:00–11:00", unit: "Пекарня - Виробництво" }, { time: "11:00–15:00", unit: "Пекарня" }], { breakStart: "11:00", breakDuration: 30 })],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[16, 16], [16, 14], [8, 8], [16, 8], [16, 16], [8, 8], [0, 0]]),
      subUnits: [
        { name: "Пекарня - Виробництво", daily: rc7([[8, 8], [8, 8], [0, 0], [8, 8], [8, 4], [8, 8], [0, 0]]) },
        { name: "Пекарня", daily: rc7([[4, 4], [8, 6], [8, 8], [8, 0], [8, 12], [0, 0], [0, 0]]) },
        { name: "Старший пекар", daily: rc7([[4, 4], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]) },
      ],
    },
  },
  // ─── 2. ВІДДІЛ КАСА ──────────────────────────────────────────────────
  {
    id: "dept-kasa",
    name: "Відділ каса",
    openShifts: [
      {
        id: "os-k1",
        dayIndex: 5,
        shift: { id: "os-ks1", timeRange: "10:00–18:00", subUnits: [{ time: "10:00–18:00", unit: "Додаткова каса" }], status: "open" },
      },
    ],
    employees: [
      {
        id: "ek1",
        name: "Наталія Шевченко",
        position: "Касир центральної каси",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 160,
        shifts: {
          "0": [ns("sk1", "08:00–16:00", [{ time: "08:00–12:00", unit: "Касир ЦК" }, { time: "12:00–16:00", unit: "Каса" }], { breakStart: "12:00", breakDuration: 30 })],
          "1": [ns("sk2", "08:00–16:00", [{ time: "08:00–16:00", unit: "Касир ЦК" }], { breakStart: "12:00", breakDuration: 30 })],
          "2": [ns("sk3", "10:00–18:00", [{ time: "10:00–18:00", unit: "Каса" }], { breakStart: "14:00", breakDuration: 30 })],
          "3": [ns("sk4", "08:00–16:00", [{ time: "08:00–16:00", unit: "Асистент КСО" }], { breakStart: "12:00", breakDuration: 30 })],
          "4": [ns("sk5", "08:00–16:00", [{ time: "08:00–16:00", unit: "Касир ЦК" }], { breakStart: "12:00", breakDuration: 30 })],
        },
      },
      {
        id: "ek2",
        name: "Марина Бондаренко",
        position: "Продавець-консультант",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 144,
        shifts: {
          "0": [ns("sk6", "14:00–22:00", [{ time: "14:00–22:00", unit: "Каса" }], { breakStart: "18:00", breakDuration: 30 })],
          "1": [ns("sk7", "14:00–22:00", [{ time: "14:00–18:00", unit: "Каса" }, { time: "18:00–22:00", unit: "Додаткова каса" }], { breakStart: "18:00", breakDuration: 30 })],
          "2": [ns("sk8", "08:00–16:00", [{ time: "08:00–16:00", unit: "Асистент КСО" }], { breakStart: "12:00", breakDuration: 30 })],
          "4": [ns("sk9", "14:00–22:00", [{ time: "14:00–22:00", unit: "Додаткова каса" }], { breakStart: "18:00", breakDuration: 30 })],
          "5": [ns("sk10", "10:00–18:00", [{ time: "10:00–18:00", unit: "Каса" }], { breakStart: "14:00", breakDuration: 30 })],
        },
      },
      {
        id: "ek3",
        name: "Оксана Литвин",
        position: "Продавець-консультант",
        fte: 75,
        monthlyNorm: 132,
        workedHours: 104,
        isMinor: true,
        shifts: {
          "0": [ns("sk11", "10:00–18:00", [{ time: "10:00–18:00", unit: "Додаткова каса" }], { breakStart: "14:00", breakDuration: 30 })],
          "2": [ns("sk12", "14:00–22:00", [{ time: "14:00–22:00", unit: "Касир ЦК" }], { breakStart: "18:00", breakDuration: 30 })],
          "3": [ns("sk13", "10:00–18:00", [{ time: "10:00–14:00", unit: "Каса" }, { time: "14:00–18:00", unit: "Додаткова каса" }], { breakStart: "14:00", breakDuration: 30 })],
          "6": [ns("sk14", "10:00–18:00", [{ time: "10:00–18:00", unit: "Каса" }], { breakStart: "14:00", breakDuration: 30 })],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[24, 24], [24, 22], [24, 24], [24, 24], [24, 22], [16, 10], [8, 8]]),
      subUnits: [
        { name: "Касир ЦК", daily: rc7([[8, 4], [8, 8], [0, 8], [8, 8], [8, 8], [0, 0], [0, 0]]) },
        { name: "Асистент КСО", daily: rc7([[0, 0], [0, 0], [8, 8], [8, 8], [0, 0], [0, 0], [0, 0]]) },
        { name: "Додаткова каса", daily: rc7([[8, 8], [8, 8], [0, 0], [8, 4], [8, 8], [8, 0], [0, 0]]) },
        { name: "Каса", daily: rc7([[8, 12], [8, 6], [8, 8], [0, 4], [8, 6], [8, 10], [8, 8]]) },
      ],
    },
  },
  // ─── 3. ВІДДІЛ КУЛІНАРІЇ ─────────────────────────────────────────────
  {
    id: "dept-kulinaria",
    name: "Відділ кулінарії",
    openShifts: [],
    employees: [
      {
        id: "ekul1",
        name: "Павло Горбач",
        position: "Старший кухар",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 184,
        shifts: {
          "0": [ns("skul1", "06:00–15:00", [{ time: "06:00–10:00", unit: "Кулінарія - Виробництво" }, { time: "10:00–15:00", unit: "Кулінарія" }], { breakStart: "10:00", breakDuration: 45 })],
          "1": [ns("skul2", "06:00–15:00", [{ time: "06:00–15:00", unit: "Кулінарія - Виробництво" }], { breakStart: "10:30", breakDuration: 45 })],
          "2": [ns("skul3", "10:00–19:00", [{ time: "10:00–19:00", unit: "Піца" }], { breakStart: "14:00", breakDuration: 45 })],
          "3": [ns("skul4", "06:00–15:00", [{ time: "06:00–15:00", unit: "Кулінарія - Виробництво" }], { breakStart: "10:30", breakDuration: 45 })],
          "4": [ns("skul5", "06:00–15:00", [{ time: "06:00–15:00", unit: "Кулінарія" }], { breakStart: "10:30", breakDuration: 45 })],
          "5": [ns("skul6", "06:00–15:00", [{ time: "06:00–15:00", unit: "Піца" }], { breakStart: "10:30", breakDuration: 45 })],
        },
      },
      {
        id: "ekul2",
        name: "Юлія Савченко",
        position: "Помічник кухаря",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 96,
        shifts: {
          "0": [ns("skul7", "11:00–19:00", [{ time: "11:00–19:00", unit: "Помічник кухаря" }], { breakStart: "15:00", breakDuration: 30 })],
          "2": [ns("skul8", "11:00–19:00", [{ time: "11:00–19:00", unit: "Кулінарія" }], { breakStart: "15:00", breakDuration: 30 })],
          "3": [{ id: "skul9-temp", timeRange: "08:00–16:00", subUnits: [], status: "temp-assignment", absenceLabel: "Філія #42 – Центр" }],
          "4": [ns("skul10", "16:00–23:00", [{ time: "16:00–20:00", unit: "Піца" }, { time: "20:00–23:00", unit: "Кулінарія" }], { breakStart: "19:30", breakDuration: 30 })],
          "5": [{ id: "skul11-reserved", timeRange: "00:00–24:00", subUnits: [], status: "reserved", absenceLabel: "Резерв" }],
          "6": [{ id: "skul12-reserved", timeRange: "00:00–24:00", subUnits: [], status: "reserved", absenceLabel: "Резерв" }],
        },
      },
      {
        id: "ekul3",
        name: "Віталій Кравчук",
        position: "Кухар",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 144,
        shifts: {
          "0": [ns("skul13", "06:00–14:00", [{ time: "06:00–14:00", unit: "Кулінарія - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "1": [ns("skul14", "06:00–14:00", [{ time: "06:00–10:00", unit: "Кулінарія - Виробництво" }, { time: "10:00–14:00", unit: "Кулінарія" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("skul15", "06:00–14:00", [{ time: "06:00–14:00", unit: "Кулінарія - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "5": [ns("skul16", "06:00–14:00", [{ time: "06:00–14:00", unit: "Кулінарія - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
        },
      },
      {
        id: "ekul4",
        name: "Ганна Ткачук",
        position: "Пекар з приготування піци",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 128,
        shifts: {
          "0": [ns("skul17", "10:00–18:00", [{ time: "10:00–18:00", unit: "Піца" }], { breakStart: "14:00", breakDuration: 30 })],
          "1": [ns("skul18", "10:00–18:00", [{ time: "10:00–18:00", unit: "Піца" }], { breakStart: "14:00", breakDuration: 30 })],
          "3": [ns("skul19", "10:00–18:00", [{ time: "10:00–18:00", unit: "Піца" }], { breakStart: "14:00", breakDuration: 30 })],
          "5": [ns("skul20", "10:00–18:00", [{ time: "10:00–18:00", unit: "Піца" }], { breakStart: "14:00", breakDuration: 30 })],
        },
      },
      {
        id: "ekul5",
        name: "Людмила Коломієць",
        position: "Продавець продовольчих товарів",
        fte: 75,
        monthlyNorm: 132,
        workedHours: 88,
        shifts: {
          "0": [ns("skul21", "08:00–14:00", [{ time: "08:00–14:00", unit: "Кулінарія" }])],
          "2": [ns("skul22", "08:00–14:00", [{ time: "08:00–14:00", unit: "Кулінарія" }])],
          "4": [ns("skul23", "08:00–14:00", [{ time: "08:00–14:00", unit: "Кулінарія" }])],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[18, 17], [18, 9], [18, 17], [18, 9], [18, 16], [12, 9], [0, 0]]),
      subUnits: [
        { name: "Кулінарія - Виробництво", daily: rc7([[4, 4], [9, 9], [0, 0], [9, 9], [0, 0], [0, 0], [0, 0]]) },
        { name: "Піца", daily: rc7([[0, 0], [0, 0], [9, 9], [0, 0], [4, 4], [9, 9], [0, 0]]) },
        { name: "Помічник кухаря", daily: rc7([[8, 8], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]) },
        { name: "Кулінарія", daily: rc7([[6, 5], [9, 0], [9, 8], [0, 0], [9, 9], [3, 0], [0, 0]]) },
        { name: "Старший кухар", daily: rc7([[0, 0], [0, 0], [0, 0], [0, 0], [5, 3], [0, 0], [0, 0]]) },
      ],
    },
  },
  // ─── 4. ВІДДІЛ СВІЖИХ ПРОДУКТІВ ──────────────────────────────────────
  {
    id: "dept-svizhi",
    name: "Відділ свіжих продуктів",
    openShifts: [
      {
        id: "os-sp1",
        dayIndex: 6,
        shift: { id: "os-sps1", timeRange: "06:00–14:00", subUnits: [{ time: "06:00–14:00", unit: "Гастрономія" }], status: "open" },
      },
    ],
    employees: [
      {
        id: "esp1",
        name: "Наталія Ткачук",
        position: "Продавець продовольчих товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 160,
        shifts: {
          "0": [ns("ssp1", "06:00–14:00", [{ time: "06:00–10:00", unit: "Гастрономія" }, { time: "10:00–14:00", unit: "Кондитерка" }], { breakStart: "10:00", breakDuration: 30 })],
          "1": [ns("ssp2", "06:00–14:00", [{ time: "06:00–14:00", unit: "Гастрономія" }], { breakStart: "10:00", breakDuration: 30 })],
          "2": [ns("ssp3", "06:00–14:00", [{ time: "06:00–14:00", unit: "Продавець прод.товарів \"Лавки традицій\"" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("ssp4", "06:00–14:00", [{ time: "06:00–14:00", unit: "Кондитерка" }], { breakStart: "10:00", breakDuration: 30 })],
          "4": [ns("ssp5", "06:00–14:00", [{ time: "06:00–14:00", unit: "Гастрономія" }], { breakStart: "10:00", breakDuration: 30 })],
        },
      },
      {
        id: "esp2",
        name: "Дмитро Мельник",
        position: "Продавець продовольчих товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 128,
        shifts: {
          "0": [ns("ssp6", "14:00–22:00", [{ time: "14:00–22:00", unit: "Кондитерка" }], { breakStart: "18:00", breakDuration: 30 })],
          "1": [ns("ssp7", "14:00–22:00", [{ time: "14:00–18:00", unit: "Продавець прод.товарів \"Лавки традицій\"" }, { time: "18:00–22:00", unit: "Гастрономія" }], { breakStart: "18:00", breakDuration: 30 })],
          "3": [ns("ssp8", "06:00–14:00", [{ time: "06:00–14:00", unit: "Продавець прод.товарів \"Лавки традицій\"" }], { breakStart: "10:00", breakDuration: 30 })],
          "5": [ns("ssp9", "06:00–14:00", [{ time: "06:00–14:00", unit: "Гастрономія" }])],
          "6": [ns("ssp10", "06:00–14:00", [{ time: "06:00–14:00", unit: "Кондитерка" }])],
        },
      },
      {
        id: "esp3",
        name: "Анна Лисенко",
        position: "Продавець прод.товарів \"Лавки традицій\"",
        fte: 50,
        monthlyNorm: 88,
        workedHours: 72,
        shifts: {
          "1": [ns("ssp11", "08:00–14:00", [{ time: "08:00–14:00", unit: "Кондитерка" }])],
          "3": [ns("ssp12", "08:00–14:00", [{ time: "08:00–14:00", unit: "Гастрономія" }])],
          "4": [{ id: "ssp13-sick", timeRange: "00:00–24:00", subUnits: [], status: "sick", absenceLabel: "Лікарняний" }],
          "5": [ns("ssp14", "08:00–16:00", [{ time: "08:00–12:00", unit: "Кондитерка" }, { time: "12:00–16:00", unit: "Продавець прод.товарів \"Лавки традицій\"" }], { breakStart: "12:00", breakDuration: 30 })],
        },
      },
      // ── Оброблювач риби (was in dept-ryba) ──
      {
        id: "er1",
        name: "Артем Козловський",
        position: "Оброблювач риби",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 152,
        shifts: {
          "0": [ns("sr1", "06:00–14:00", [{ time: "06:00–10:00", unit: "Риба - Виробництво" }, { time: "10:00–14:00", unit: "Риба" }], { breakStart: "10:00", breakDuration: 30 })],
          "1": [ns("sr2", "06:00–14:00", [{ time: "06:00–14:00", unit: "Риба - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "2": [ns("sr3", "06:00–14:00", [{ time: "06:00–14:00", unit: "Риба" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("sr4", "06:00–14:00", [{ time: "06:00–14:00", unit: "Риба" }], { breakStart: "10:00", breakDuration: 30 })],
          "4": [ns("sr5", "06:00–14:00", [{ time: "06:00–14:00", unit: "Риба - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
        },
      },
      // ── Продавець риби ──
      {
        id: "er2",
        name: "Катерина Шульга",
        position: "Продавець продовольчих товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 128,
        shifts: {
          "0": [ns("sr6", "10:00–18:00", [{ time: "10:00–18:00", unit: "Риба" }], { breakStart: "14:00", breakDuration: 30 })],
          "1": [ns("sr7", "10:00–18:00", [{ time: "10:00–14:00", unit: "Риба" }, { time: "14:00–18:00", unit: "Гастрономія" }], { breakStart: "14:00", breakDuration: 30 })],
          "3": [ns("sr8", "10:00–18:00", [{ time: "10:00–18:00", unit: "Риба" }], { breakStart: "14:00", breakDuration: 30 })],
          "5": [ns("sr9", "08:00–16:00", [{ time: "08:00–16:00", unit: "Риба" }], { breakStart: "12:00", breakDuration: 30 })],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[24, 24], [24, 22], [16, 16], [24, 22], [16, 16], [24, 24], [8, 8]]),
      subUnits: [
        { name: "Гастрономія", daily: rc7([[4, 4], [8, 12], [0, 0], [8, 6], [8, 8], [8, 8], [8, 0]]) },
        { name: "Кондитерка", daily: rc7([[8, 12], [8, 6], [0, 0], [8, 8], [0, 0], [4, 4], [0, 8]]) },
        { name: "Продавець прод.товарів \"Лавки традицій\"", daily: rc7([[0, 0], [0, 4], [8, 8], [0, 8], [0, 0], [4, 4], [0, 0]]) },
        { name: "Риба - Виробництво", daily: rc7([[4, 4], [8, 8], [0, 0], [0, 0], [8, 8], [0, 0], [0, 0]]) },
        { name: "Риба", daily: rc7([[4, 4], [4, 4], [8, 8], [8, 8], [0, 0], [8, 8], [0, 0]]) },
      ],
    },
  },
  // ─── 5. ВІДДІЛ ТОВАРНИЙ ──────────────────────────────────────────────
  {
    id: "dept-tovarnyj",
    name: "Відділ товарний",
    openShifts: [
      {
        id: "os-tz1",
        dayIndex: 2,
        shift: { id: "os-tzs1", timeRange: "14:00–22:00", subUnits: [{ time: "14:00–22:00", unit: "Стелажна торгівля" }], status: "open", exchangeStatus: "on-exchange" },
      },
    ],
    employees: [
      // Бариста (was in Кафе)
      {
        id: "ekf1",
        name: "Софія Кравченко",
        position: "Бариста",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 152,
        shifts: {
          "0": [ns("skf1", "07:00–15:00", [{ time: "07:00–15:00", unit: "Бариста" }], { breakStart: "11:00", breakDuration: 30 })],
          "1": [ns("skf2", "07:00–15:00", [{ time: "07:00–15:00", unit: "Бариста" }], { breakStart: "11:00", breakDuration: 30 })],
          "2": [ns("skf3", "12:00–20:00", [{ time: "12:00–16:00", unit: "Бариста" }, { time: "16:00–20:00", unit: "Стелажна торгівля" }], { breakStart: "16:00", breakDuration: 30 })],
          "3": [ns("skf4", "07:00–15:00", [{ time: "07:00–15:00", unit: "Бариста" }], { breakStart: "11:00", breakDuration: 30 })],
          "4": [ns("skf5", "07:00–15:00", [{ time: "07:00–15:00", unit: "Бариста" }], { breakStart: "11:00", breakDuration: 30 })],
        },
      },
      // Вантажник (was Комірник in Логістика)
      {
        id: "elog1",
        name: "Віктор Романенко",
        position: "Вантажник",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 168,
        shifts: {
          "0": [ns("slog1", "06:00–14:00", [{ time: "06:00–14:00", unit: "Склад" }], { breakStart: "10:00", breakDuration: 30 })],
          "1": [ns("slog2", "06:00–14:00", [{ time: "06:00–10:00", unit: "Фахівець з приймання та обліку товарів" }, { time: "10:00–14:00", unit: "Склад" }], { breakStart: "10:00", breakDuration: 30 })],
          "2": [ns("slog3", "06:00–14:00", [{ time: "06:00–14:00", unit: "Склад" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("slog4", "06:00–14:00", [{ time: "06:00–14:00", unit: "Фахівець з приймання та обліку товарів" }], { breakStart: "10:00", breakDuration: 30 })],
          "4": [ns("slog5", "06:00–14:00", [{ time: "06:00–14:00", unit: "Склад" }], { breakStart: "10:00", breakDuration: 30 })],
          "5": [ns("slog6", "06:00–14:00", [{ time: "06:00–14:00", unit: "Склад" }])],
        },
      },
      // Фахівець з приймання та обліку товарів (was Приймальник товару)
      {
        id: "elog2",
        name: "Олег Захарченко",
        position: "Фахівець з приймання та обліку товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 120,
        shifts: {
          "0": [ns("slog7", "04:00–12:00", [{ time: "04:00–12:00", unit: "Фахівець з приймання та обліку товарів" }], { breakStart: "08:00", breakDuration: 30 })],
          "2": [ns("slog8", "04:00–12:00", [{ time: "04:00–12:00", unit: "Фахівець з приймання та обліку товарів" }], { breakStart: "08:00", breakDuration: 30 })],
          "4": [ns("slog9", "04:00–12:00", [{ time: "04:00–12:00", unit: "Фахівець з приймання та обліку товарів" }], { breakStart: "08:00", breakDuration: 30 })],
          "5": [{ id: "slog10-leave", timeRange: "00:00–24:00", subUnits: [], status: "leave", absenceLabel: "Відпустка" }],
          "6": [{ id: "slog11-leave", timeRange: "00:00–24:00", subUnits: [], status: "leave", absenceLabel: "Відпустка" }],
        },
      },
      // Продавець-консультант (was Мерчендайзер)
      {
        id: "etz1",
        name: "Олена Коваленко",
        position: "Продавець-консультант",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 112,
        shifts: {
          "0": [ns("stz1", "08:00–16:00", [{ time: "08:00–12:00", unit: "Мобільна бригада" }, { time: "12:00–16:00", unit: "Стелажна торгівля" }], { breakStart: "12:00", breakDuration: 30 })],
          "1": [ns("stz2", "08:00–16:00", [{ time: "08:00–16:00", unit: "Мобільна бригада" }], { breakStart: "12:00", breakDuration: 30 })],
          "2": [ns("stz3", "09:00–17:00", [{ time: "09:00–13:00", unit: "Молоко / Хліб" }, { time: "13:00–17:00", unit: "Овочі і фрукти" }], { breakStart: "13:00", breakDuration: 45 })],
          "3": [ns("stz4", "08:00–16:00", [{ time: "08:00–16:00", unit: "Стелажна торгівля" }], { breakStart: "12:00", breakDuration: 30 })],
          "4": [ns("stz5", "10:00–18:00", [{ time: "10:00–18:00", unit: "Мобільна бригада" }], { breakStart: "14:00", breakDuration: 30 })],
        },
      },
      // Продавець-консультант (was Продавець торгового залу)
      {
        id: "etz2",
        name: "Іван Шевченко",
        position: "Продавець-консультант",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 140,
        shifts: {
          "0": [ns("stz6", "14:00–22:00", [{ time: "14:00–22:00", unit: "Овочі і фрукти" }], { breakStart: "18:00", breakDuration: 30 })],
          "1": [ns("stz7", "14:00–22:00", [{ time: "14:00–22:00", unit: "Молоко / Хліб" }], { breakStart: "18:00", breakDuration: 30 })],
          "3": [ns("stz8", "14:00–22:00", [{ time: "14:00–19:00", unit: "Молоко / Хліб" }, { time: "19:00–22:00", unit: "Стелажна торгівля" }], { breakStart: "18:00", breakDuration: 30 })],
          "4": [ns("stz9", "08:00–16:00", [{ time: "08:00–16:00", unit: "Овочі і фрукти" }], { breakStart: "12:00", breakDuration: 30 })],
          "5": [ns("stz10", "10:00–18:00", [{ time: "10:00–18:00", unit: "Своя доставка" }])],
        },
      },
      // Продавець-консультант (was Флорист → Своя доставка)
      {
        id: "etz3",
        name: "Марія Бондар",
        position: "Продавець-консультант",
        fte: 75,
        monthlyNorm: 132,
        workedHours: 88,
        shifts: {
          "0": [ns("stz11", "08:00–16:00", [{ time: "08:00–16:00", unit: "Своя доставка" }], { breakStart: "12:00", breakDuration: 30 })],
          "2": [ns("stz12", "08:00–16:00", [{ time: "08:00–16:00", unit: "Своя доставка" }], { breakStart: "12:00", breakDuration: 30 })],
          "4": [ns("stz13", "08:00–16:00", [{ time: "08:00–16:00", unit: "Стелажна торгівля" }], { breakStart: "12:00", breakDuration: 30 })],
          "5": [{ id: "stz14-leave", timeRange: "00:00–24:00", subUnits: [], status: "leave", absenceLabel: "Відпустка" }],
          "6": [{ id: "stz15-leave", timeRange: "00:00–24:00", subUnits: [], status: "leave", absenceLabel: "Відпустка" }],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[40, 38], [32, 28], [32, 28], [32, 28], [40, 38], [24, 18], [8, 0]]),
      subUnits: [
        { name: "Бариста", daily: rc7([[8, 8], [8, 8], [4, 4], [8, 8], [8, 8], [0, 0], [0, 0]]) },
        { name: "Склад", daily: rc7([[8, 8], [4, 4], [8, 8], [0, 0], [8, 8], [8, 8], [0, 0]]) },
        { name: "Фахівець з приймання та обліку товарів", daily: rc7([[8, 8], [4, 4], [8, 8], [8, 8], [8, 8], [0, 0], [0, 0]]) },
        { name: "Мобільна бригада", daily: rc7([[8, 4], [8, 8], [0, 0], [0, 0], [8, 8], [0, 0], [0, 0]]) },
        { name: "Молоко / Хліб", daily: rc7([[0, 0], [8, 8], [4, 4], [8, 5], [0, 0], [0, 0], [0, 0]]) },
        { name: "Овочі і фрукти", daily: rc7([[8, 8], [0, 0], [4, 4], [0, 0], [8, 8], [0, 0], [0, 0]]) },
        { name: "Своя доставка", daily: rc7([[0, 8], [0, 0], [0, 8], [8, 3], [0, 0], [8, 10], [8, 0]]) },
        { name: "Стелажна торгівля", daily: rc7([[8, 4], [0, 0], [8, 0], [8, 8], [0, 0], [0, 0], [0, 0]]) },
      ],
    },
  },
  // ─── 6. ВІДДІЛ ОХОРОНИ ───────────────────────────────────────────────
  {
    id: "dept-ohorona",
    name: "Відділ охорони",
    openShifts: [],
    employees: [
      {
        id: "eb1",
        name: "Олексій Дорошенко",
        position: "Охоронник",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 168,
        shifts: {
          "0": [ns("sb1", "06:00–18:00", [{ time: "06:00–18:00", unit: "Охорона" }], { breakStart: "12:00", breakDuration: 45 })],
          "1": [ns("sb2", "06:00–18:00", [{ time: "06:00–18:00", unit: "Охорона" }], { breakStart: "12:00", breakDuration: 45 })],
          "3": [ns("sb3", "06:00–18:00", [{ time: "06:00–18:00", unit: "Охорона" }], { breakStart: "12:00", breakDuration: 45 })],
          "4": [ns("sb4", "06:00–18:00", [{ time: "06:00–18:00", unit: "Охорона" }], { breakStart: "12:00", breakDuration: 45 })],
          "5": [ns("sb5", "08:00–20:00", [{ time: "08:00–20:00", unit: "Охорона" }], { breakStart: "14:00", breakDuration: 45 })],
        },
      },
      {
        id: "eb2",
        name: "Роман Хоменко",
        position: "Охоронник",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 144,
        shifts: {
          "0": [ns("sb6", "18:00–06:00", [{ time: "18:00–06:00", unit: "Охорона" }], { breakStart: "00:00", breakDuration: 45 })],
          "2": [ns("sb7", "06:00–18:00", [{ time: "06:00–18:00", unit: "Охорона" }], { breakStart: "12:00", breakDuration: 45 })],
          "4": [ns("sb8", "18:00–06:00", [{ time: "18:00–06:00", unit: "Охорона" }], { breakStart: "00:00", breakDuration: 45 })],
          "6": [ns("sb9", "08:00–20:00", [{ time: "08:00–20:00", unit: "Охорона" }], { breakStart: "14:00", breakDuration: 45 })],
        },
      },
      {
        id: "eb3",
        name: "Микола Савчук",
        position: "Паркувальник",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 136,
        shifts: {
          "0": [ns("sb10", "08:00–16:00", [{ time: "08:00–16:00", unit: "Паркувальник" }], { breakStart: "12:00", breakDuration: 30 })],
          "1": [ns("sb11", "08:00–16:00", [{ time: "08:00–16:00", unit: "Паркувальник" }], { breakStart: "12:00", breakDuration: 30 })],
          "3": [ns("sb12", "08:00–16:00", [{ time: "08:00–16:00", unit: "Паркувальник" }], { breakStart: "12:00", breakDuration: 30 })],
          "5": [ns("sb13", "08:00–16:00", [{ time: "08:00–16:00", unit: "Паркувальник" }], { breakStart: "12:00", breakDuration: 30 })],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[32, 32], [20, 20], [20, 12], [20, 20], [32, 32], [20, 20], [12, 12]]),
      subUnits: [
        { name: "Охорона", daily: rc7([[24, 24], [12, 12], [12, 12], [12, 12], [24, 24], [12, 12], [12, 12]]) },
        { name: "Паркувальник", daily: rc7([[8, 8], [8, 8], [8, 0], [8, 8], [8, 8], [8, 8], [0, 0]]) },
      ],
    },
  },
  // ─── 7. М'ЯСНИЙ ВІДДІЛ ───────────────────────────────────────────────
  {
    id: "dept-myaso",
    name: "М\u02BCясний відділ",
    openShifts: [],
    employees: [
      {
        id: "em1",
        name: "Сергій Полтавець",
        position: "Обвалювальник м\u02BCяса",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 160,
        shifts: {
          "0": [ns("sm1", "06:00–14:00", [{ time: "06:00–10:00", unit: "М\u02BCясо - Виробництво" }, { time: "10:00–14:00", unit: "М\u02BCясо" }], { breakStart: "10:00", breakDuration: 30 })],
          "1": [ns("sm2", "06:00–14:00", [{ time: "06:00–14:00", unit: "М\u02BCясо - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "2": [ns("sm3", "06:00–14:00", [{ time: "06:00–14:00", unit: "М\u02BCясо" }], { breakStart: "10:00", breakDuration: 30 })],
          "3": [ns("sm4", "06:00–14:00", [{ time: "06:00–14:00", unit: "М\u02BCясо - Виробництво" }], { breakStart: "10:00", breakDuration: 30 })],
          "4": [ns("sm5", "06:00–14:00", [{ time: "06:00–14:00", unit: "М\u02BCясо" }], { breakStart: "10:00", breakDuration: 30 })],
        },
      },
      {
        id: "em2",
        name: "Тетяна Гриценко",
        position: "Продавець продовольчих товарів",
        fte: 100,
        monthlyNorm: 176,
        workedHours: 120,
        shifts: {
          "0": [ns("sm6", "10:00–18:00", [{ time: "10:00–18:00", unit: "М\u02BCясо" }], { breakStart: "14:00", breakDuration: 30 })],
          "2": [ns("sm7", "10:00–18:00", [{ time: "10:00–18:00", unit: "М\u02BCясо" }], { breakStart: "14:00", breakDuration: 30 })],
          "4": [ns("sm8", "10:00–18:00", [{ time: "10:00–14:00", unit: "М\u02BCясо - Виробництво" }, { time: "14:00–18:00", unit: "М\u02BCясо" }], { breakStart: "14:00", breakDuration: 30 })],
          "5": [ns("sm9", "08:00–16:00", [{ time: "08:00–16:00", unit: "М\u02BCясо" }], { breakStart: "12:00", breakDuration: 30 })],
        },
      },
    ],
    resourceControl: {
      daily: rc7([[16, 16], [8, 8], [16, 16], [8, 8], [16, 16], [8, 8], [0, 0]]),
      subUnits: [
        { name: "М\u02BCясо - Виробництво", daily: rc7([[4, 4], [8, 8], [0, 0], [8, 8], [4, 4], [0, 0], [0, 0]]) },
        { name: "М\u02BCясо", daily: rc7([[12, 12], [0, 0], [16, 16], [0, 0], [12, 12], [8, 8], [0, 0]]) },
      ],
    },
  },
];

// ══════════════════════════════════════════════════════════════════════
// FACT DEPARTMENTS — mirrors plan with actual deviations
// ══════════════════════════════════════════════════════════════════════

function buildFactDepts(planDepts: Department[]): Department[] {
  // Deep clone plan and add fact metadata with random deviations
  return planDepts.map((dept) => ({
    ...dept,
    openShifts: [], // No open shifts in fact view
    employees: dept.employees.map((emp) => ({
      ...emp,
      shifts: Object.fromEntries(
        Object.entries(emp.shifts).map(([dayKey, shifts]) => [
          dayKey,
          shifts.map((sh) => {
            if (sh.status && sh.status !== "normal") return sh; // leave/sick/etc unchanged
            // Randomly assign fact status
            const roll = Math.random();
            if (roll < 0.55) {
              // matched
              return fs(sh, sh.timeRange, "matched", 0, sh.subUnits);
            } else if (roll < 0.75) {
              // overtime +0.5..+1.5h
              const delta = Math.round((0.5 + Math.random()) * 2) / 2;
              const endParts = sh.timeRange.split("–")[1]?.trim();
              if (endParts) {
                const [h, m] = endParts.split(":").map(Number);
                const newM = (m || 0) + delta * 60;
                const newH = (h || 0) + Math.floor(newM / 60);
                const finalH = newH % 24;
                const finalM = newM % 60;
                const newEnd = `${String(finalH).padStart(2, "0")}:${String(finalM).padStart(2, "0")}`;
                const newRange = sh.timeRange.split("–")[0] + "–" + newEnd;
                return fs(sh, newRange, "overtime", delta);
              }
              return fs(sh, sh.timeRange, "matched", 0);
            } else if (roll < 0.9) {
              // missing -0.5...-1h
              const delta = -(Math.round((0.5 + Math.random() * 0.5) * 2) / 2);
              return fs(sh, sh.timeRange, "missing", delta);
            } else {
              // no-show
              return fs(sh, sh.timeRange, "no-show", -8);
            }
          }),
        ])
      ),
    })),
    // Add actual values to resource control
    resourceControl: dept.resourceControl
      ? {
          daily: dept.resourceControl.daily.map((d) => ({
            ...d,
            actual: d.actual ?? Math.round((d.scheduled + (Math.random() - 0.3) * 4) * 2) / 2,
          })),
          subUnits: dept.resourceControl.subUnits.map((su) => ({
            ...su,
            daily: su.daily.map((d) => ({
              ...d,
              actual: d.actual ?? Math.max(0, Math.round((d.scheduled + (Math.random() - 0.3) * 3) * 2) / 2),
            })),
          })),
        }
      : undefined,
  }));
}

// Use a seeded approach: build once and export
export const MOCK_FACT_DEPARTMENTS: Department[] = buildFactDepts(MOCK_DEPARTMENTS);

// ── Department → Units mapping (for filters) ───────────────────────────
export const DEPT_UNITS_MAP: Record<string, string[]> = {
  "dept-vypichka": ["Пекарня - Виробництво", "Пекарня", "Старший пекар"],
  "dept-kasa": ["Касир ЦК", "Асистент КСО", "Додаткова каса", "Каса"],
  "dept-kulinaria": ["Кулінарія - Виробництво", "Піца", "Помічник кухаря", "Кулінарія", "Старший кухар"],
  "dept-svizhi": ["Гастрономія", "Кондитерка", "Продавець прод.товарів \"Лавки традицій\"", "Риба - Виробництво", "Риба"],
  "dept-tovarnyj": ["Бариста", "Склад", "Фахівець з приймання та обліку товарів", "Мобільна бригада", "Молоко / Хліб", "Овочі і фрукти", "Своя доставка", "Стелажна торгівля"],
  "dept-ohorona": ["Охорона", "Паркувальник"],
  "dept-myaso": ["М\u02BCясо - Виробництво", "М\u02BCясо"],
};

// ── Empty week generator (for future week planning canvas) ──────────────
export function buildEmptyWeekDepartments(sourceDepts: Department[]): Department[] {
  return sourceDepts.map((dept) => ({
    ...dept,
    openShifts: [],
    employees: dept.employees.map((emp) => ({
      ...emp,
      workedHours: 0,
      shifts: {},
    })),
    resourceControl: dept.resourceControl
      ? {
          daily: dept.resourceControl.daily.map((d) => ({ forecast: d.forecast, scheduled: 0 })),
          subUnits: dept.resourceControl.subUnits.map((su) => ({
            ...su,
            daily: su.daily.map((d) => ({ forecast: d.forecast, scheduled: 0 })),
          })),
        }
      : undefined,
  }));
}
