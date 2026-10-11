import { useEffect, useLayoutEffect, useRef, useState } from "react";

/*
  CVS Silent Check-In prototype — iteration matched to the current CVS app (reference screenshots, 2026-10-06).

  Component labels used in comments:
  - "CVS R#"  = recreated from the current CVS app. The source screenshot is named next to each one.
  - "EXT E#"  = extended component for this concept (not shown in the current app). Each one says which
                CVS components it reuses. See CVS-APP-MATCH-COMPONENTS.md for the full inventory.
*/

type Screen = "home" | "visit" | "identity" | "questions" | "communication" | "review" | "status" | "canceled" | "messages" | "chat" | "shop" | "savings" | "order" | "ready" | "done";
type ShopView = "low" | "frequent" | "deals";
type CouponStatus = "loading" | "ready" | "error" | "none";
type ChatTopic = "question" | "private" | "meet" | "language" | "free";
type ChatMessage = { from: "me" | "pharmacy"; text: string };
type YesNo = "" | "yes" | "no";
type Communication = "" | "writing" | "speaking" | "none";
/* Answers collected by the check-in questions (asked one topic per screen, like the CVS vaccine flow) */
type Preferences = {
  question: YesNo;
  questionText: string;
  privateDiscussion: YesNo;
  communication: Communication;
  languageSupport: YesNo;
  language: string;
  otherLanguage: string;
};
/* Identity confirmed at the start of check-in (name + date of birth, as the CVS app confirms identity) */
type Identity = { name: string; dob: string };

type Product = {
  id: number;
  name: string;
  price: string;
  original?: string;
  coupon?: string;
  lastBought?: string;
  timesBought?: number;
  dueAgain?: boolean;
  aisle: string;
  shelf: "Top shelf" | "Eye level" | "Middle shelf" | "Bottom shelf";
  section: string;
  image: string;
  keywords?: string;
};

/*
  Product data. Every product, name, packshot and shelf price comes from the designer's CVS app screenshots
  (IMG_1765, IMG_1766, IMG_1768, IMG_1769, IMG_1794, IMG_1795, IMG_1798, IMG_1818, ScreenRecording 11-28-01).
  Coupon amounts, purchase history and aisle locations are prototype data. For coupon items, original = shelf price.
  Items with lastBought are the shopper's purchase history:
  - Frequently bought = every item bought here before.
  - Buy it again = history items the shopper usually rebuys around now, based on how often they buy them.
  Items without lastBought are only reachable through search.
*/
const products: Product[] = [
  { id: 1, name: "CVS Health B Complex + Energy Gummies, 60 ct", price: "$9.19", original: "$11.19", coupon: "$2 off", lastBought: "9 weeks ago", timesBought: 6, dueAgain: true, aisle: "Aisle 12", shelf: "Eye level", section: "Section B", image: "products/real/cvs-vitamin-b-energy-gummy.png", keywords: "vitamins supplement gummy energy" },
  { id: 2, name: "Natrol Methyl B-12 Tablets, Lemon, 60 ct", price: "$10.99", original: "$13.99", coupon: "$3 off", lastBought: "8 weeks ago", timesBought: 4, dueAgain: true, aisle: "Aisle 12", shelf: "Middle shelf", section: "Section C", image: "products/real/natrol-methyl-b12-lemon.png", keywords: "vitamins supplement b12" },
  { id: 3, name: "Vicks PainQuil Nighttime Pain Reliever & Sleep Aid, Honey, 12 fl oz", price: "$13.79", lastBought: "7 weeks ago", timesBought: 3, dueAgain: true, aisle: "Aisle 9", shelf: "Eye level", section: "Section A", image: "products/real/vicks-painquil-nighttime.png", keywords: "pain relief medicine sleep night" },
  { id: 4, name: "Cepacol Extra Strength Sore Throat & Cough Lozenges, Mixed Berry, 16 ct", price: "$4.19", original: "$5.69", coupon: "$1.50 off", lastBought: "6 weeks ago", timesBought: 5, dueAgain: true, aisle: "Aisle 8", shelf: "Eye level", section: "Section C", image: "products/real/cepacol-extra-strength-lozenges.png", keywords: "cold cough sore throat medicine" },
  { id: 5, name: "Gain Liquid Laundry Detergent, Original, 81 fl oz", price: "$7.99", original: "$9.99", coupon: "$2 off", lastBought: "7 weeks ago", timesBought: 9, dueAgain: true, aisle: "Aisle 16", shelf: "Bottom shelf", section: "Section A", image: "products/real/gain-liquid-detergent-original.png", keywords: "household laundry cleaning" },
  { id: 6, name: "Biofreeze Ultraflex Lidocaine + Menthol Patch, 4 ct", price: "$13.49", original: "$17.49", coupon: "$4 off", lastBought: "10 weeks ago", timesBought: 3, dueAgain: true, aisle: "Aisle 10", shelf: "Middle shelf", section: "Section B", image: "products/real/biofreeze-ultraflex-patch.png", keywords: "pain relief patch" },
  { id: 7, name: "Vicks VapoInhaler On-the-Go Portable Inhaler, Menthol", price: "$7.99", original: "$11.99", coupon: "$4 off", lastBought: "3 months ago", timesBought: 2, aisle: "Aisle 8", shelf: "Top shelf", section: "Section C", image: "products/real/vicks-vapoinhaler.png", keywords: "cold congestion medicine" },
  { id: 8, name: "CVS Health Menthol 5% Pain Relief Roll-On Gel, 3 fl oz", price: "$10.49", original: "$13.49", coupon: "$3 off", lastBought: "4 weeks ago", timesBought: 7, aisle: "Aisle 10", shelf: "Eye level", section: "Section A", image: "products/real/cvs-menthol-roll-on-gel.png", keywords: "pain relief gel" },
  { id: 9, name: "ThermaCare Heat & Lidocaine Spray, 3 oz", price: "$16.49", lastBought: "2 months ago", timesBought: 2, aisle: "Aisle 10", shelf: "Top shelf", section: "Section D", image: "products/real/thermacare-heat-lidocaine-spray.png", keywords: "pain relief spray" },
  { id: 10, name: "Revlon Glimmer Super Balm, Just A Girl", price: "$10.99", original: "$13.99", coupon: "$3 off", lastBought: "5 weeks ago", timesBought: 4, aisle: "Aisle 3", shelf: "Eye level", section: "Section B", image: "products/real/revlon-glimmer-super-balm.png", keywords: "makeup beauty cosmetics lip" },
  { id: 11, name: "Moira Icy Glow Jelly Stick, 003 Peach Sour", price: "$8.99", lastBought: "2 months ago", timesBought: 2, aisle: "Aisle 3", shelf: "Middle shelf", section: "Section D", image: "products/real/moira-icy-glow-jelly-stick.png", keywords: "makeup beauty cosmetics blush" },
  { id: 12, name: "Garden Veggie Potato and Vegetable Ghosts + Bats, 12 ct", price: "$8.99", original: "$11.99", coupon: "$3 off", lastBought: "2 weeks ago", timesBought: 12, aisle: "Aisle 18", shelf: "Eye level", section: "Section C", image: "products/real/garden-veggie-chips.png", keywords: "chips snacks food halloween" },
  { id: 13, name: "Vicks PainQuil LiquiCaps, 100 ct", price: "$22.99", aisle: "Aisle 9", shelf: "Eye level", section: "Section B", image: "products/real/vicks-painquil-liquicaps.png", keywords: "pain relief medicine" },
  { id: 14, name: "Boiron Oscillococcinum, 6 ct", price: "$19.99", aisle: "Aisle 8", shelf: "Middle shelf", section: "Section A", image: "products/real/boiron-oscillococcinum.png", keywords: "cold flu medicine" },
  { id: 15, name: "BinaxNOW COVID-19/Flu A&B Combo Self Test, 2 ct", price: "$21.99", aisle: "Aisle 7", shelf: "Eye level", section: "Section C", image: "products/real/binaxnow-covid-flu-test.png", keywords: "covid flu test home" },
];
const history = products.filter((product) => product.lastBought);
const frequentlyBought = [...history].sort((a, b) => (b.timesBought ?? 0) - (a.timesBought ?? 0));
const buyAgain = history.filter((product) => product.dueAgain);
const offers = history.filter((product) => product.original);
const money = (value: string) => Number(value.replace("$", ""));
const saving = (product: Product) => (product.original ? money(product.original) - money(product.price) : 0);
const offersTotal = offers.reduce((sum, product) => sum + saving(product), 0);
const emptyPreferences: Preferences = { question: "", questionText: "", privateDiscussion: "", communication: "", languageSupport: "", language: "", otherLanguage: "" };
const emptyIdentity: Identity = { name: "", dob: "" };
const defaultPatient = "Margaret T.";
const languageLabel = (preferences: { language: string; otherLanguage: string }) => (preferences.language === "Another language" ? preferences.otherLanguage || "Another language" : preferences.language);
const firstName = (identity: Identity) => (identity.name.trim().split(/\s+/)[0] || defaultPatient.split(" ")[0]);
const displayName = (identity: Identity) => identity.name.trim() || defaultPatient;
const initials = (identity: Identity) => displayName(identity).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const communicationLabel: Record<Communication, string> = { writing: "In writing", speaking: "Speaking is fine", none: "No preference", "": "Not answered" };
const questionSummary = (p: Preferences) => (p.question === "yes" ? (p.questionText.trim() ? `"${p.questionText.trim()}"` : "I have a question for the pharmacist") : "No questions for the pharmacist");
const languageSummary = (p: Preferences) => (p.languageSupport === "yes" ? `Language support: ${languageLabel(p)}` : "No language support needed");
/* Date of birth typed as digits and shown as MM/DD/YYYY (IMG_1807 "Example: MMDDYYYY") */
const formatDob = (raw: string) => { const d = raw.replace(/\D/g, "").slice(0, 8); return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join("/"); };
const validDob = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day && year >= 1900 && date <= new Date();
};
const pickupStore = { name: "CVS #4471 · Shadyside", street: "4610 Centre Ave", city: "Pittsburgh, PA 15213", hours: "Pharmacy open until 9 PM" };
const today = () => new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
const clock = (date: Date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const items = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;

/* Prototype test modes for the coupon request (not shown in the interface): ?coupons=error or ?coupons=none */
const couponMode = new URLSearchParams(window.location.search).get("coupons");
/* ?checkin=error fails the first check-in attempt (shows the check-in failure state) */
const checkinMode = new URLSearchParams(window.location.search).get("checkin");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
  EXT E26 Live pickup estimate. The estimate starts at 12 min and counts down while the shopper uses the app.
  Prototype pace: one estimate minute passes every 15 seconds, so a full wait fits in a 3-minute test session.
  ?pace=real runs it at real time (60 s per minute).
*/
const PICKUP_MINUTES = 12;
const SECONDS_PER_MINUTE = new URLSearchParams(window.location.search).get("pace") === "real" ? 60 : 15;
type Pickup = { minutesLeft: number; progress: number; ready: boolean };
function usePickup(active: boolean, since: Date): Pickup {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active, since]);
  const elapsedMinutes = Math.max(0, (now - since.getTime()) / 1000 / SECONDS_PER_MINUTE);
  const progress = Math.min(1, elapsedMinutes / PICKUP_MINUTES);
  return { minutesLeft: Math.max(0, Math.ceil(PICKUP_MINUTES - elapsedMinutes)), progress, ready: progress >= 1 };
}
/* ExtraBucks Rewards available on the shopper's ExtraCare card (IMG_1815: "$0.93 Available"). Once sent to the card they come off the total at the register. */
const EXTRABUCKS = 0.93;
const pickupLine = (pickup: Pickup) => (pickup.ready ? "Ready now · Register 2" : `Ready in about ${pickup.minutesLeft} min`);

/*
  Icons. Outline icons are drawn at a 1.5 stroke to match the current CVS app's line icons
  (IMG_1789 "Shop essentials", IMG_1801 detail-row icons, IMG_1790 tab bar). Red tab icons are
  simplified reproductions of the current app's tab icons (IMG_1785, IMG_1790).
*/
type IconName =
  | "back" | "chevron" | "chevronDown" | "search" | "barcode" | "mic" | "check" | "minus" | "plus" | "info" | "close" | "send" | "cart" | "cartPlus" | "trash"
  | "warning" | "edit" | "sliders" | "doc" | "chat" | "clock" | "pin" | "mail" | "profile" | "muted" | "globe" | "rx" | "heart" | "tag"
  | "homeRed" | "rxRed" | "healthRed" | "shopTagRed" | "benefitsRed" | "savings" | "shopBag" | "photo" | "orders" | "scanStore" | "buyAgain" | "frequentlyBought";

const icons: Record<IconName, { vb: number; body: React.ReactNode }> = {
  back: { vb: 24, body: <path d="M15 5L8 12L15 19" /> },
  chevron: { vb: 20, body: <path d="M7.5 4.17L13.33 10L7.5 15.83" /> },
  chevronDown: { vb: 20, body: <path d="M5 7.5L10 12.5L15 7.5" /> },
  search: { vb: 20, body: <><circle cx="9.17" cy="9.17" r="5.83" /><path d="M16.67 16.67L13.75 13.75" /></> },
  barcode: { vb: 20, body: <path d="M3.33 4.17V15.83M5.83 4.17V15.83M8.33 4.17V15.83M10.83 4.17V15.83M14.17 4.17V15.83M16.67 4.17V15.83" /> },
  mic: { vb: 16, body: <><path d="M10 4a2 2 0 1 0-4 0v3.33a2 2 0 1 0 4 0V4Z" /><path d="M3.33 7.33a4.67 4.67 0 0 0 9.34 0M8 12v2" /></> },
  check: { vb: 16, body: <path d="M3.33 8L6.67 11.33L12.67 4.67" /> },
  minus: { vb: 16, body: <path d="M4 8H12" /> },
  plus: { vb: 16, body: <path d="M8 4V12M4 8H12" /> },
  info: { vb: 20, body: <><circle cx="10" cy="10" r="7.5" /><path d="M10 9.17V14.17M10 6.25V6.67" /></> },
  close: { vb: 20, body: <path d="M5 5L15 15M15 5L5 15" /> },
  send: { vb: 24, body: <path d="M4 20L21 12L4 4L6.5 12L4 20ZM6.5 12H12" /> },
  cart: { vb: 24, body: <><path d="M3 5H5L7 16H18L20 8H6" /><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></> },
  cartPlus: { vb: 24, body: <><path d="M2.5 5H4.5L6.5 16H17.5" /><path d="M6 8H11" /><circle cx="8.5" cy="20" r="1.3" /><circle cx="16.5" cy="20" r="1.3" /><circle cx="17" cy="8" r="4.5" /><path d="M17 6V10M15 8H19" /></> },
  trash: { vb: 24, body: <><path d="M5 7H19M10 7V5H14V7M7 7L8 19H16L17 7" /><path d="M10.5 10V16M13.5 10V16" /></> },
  warning: { vb: 24, body: <><path d="M12 3.5L22 20.5H2L12 3.5Z" fill="currentColor" stroke="none" /><path d="M12 10V14.5M12 17.2V17.4" stroke="#fff" strokeWidth={2} /></> },
  sliders: { vb: 24, body: <><path d="M4 7H20M4 17H20" /><circle cx="9" cy="7" r="2.2" fill="#fff" /><circle cx="15" cy="17" r="2.2" fill="#fff" /></> },
  edit: { vb: 24, body: <><path d="M13 4H5V19H20V11" /><path d="M18 3.5L20.5 6L12.5 14H10V11.5L18 3.5Z" /></> },
  doc: { vb: 24, body: <><path d="M6 3H15L19 7V21H6V3Z" /><path d="M9 11H16M9 15H16M9 7H12" /></> },
  chat: { vb: 24, body: <path d="M12 4a8 8 0 0 0-6.93 12L4 20l4-1.07A8 8 0 1 0 12 4Z" /> },
  clock: { vb: 24, body: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></> },
  pin: { vb: 24, body: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><path d="M10.6 9.4c.5-.6 1.4-.6 1.4.1 0-.7.9-.7 1.4-.1.5.7-1.4 2-1.4 2s-1.9-1.3-1.4-2Z" fill="currentColor" stroke="none" /></> },
  mail: { vb: 24, body: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5L12 13L20.5 6.5M3.5 18L10 12M20.5 18L14 12" /></> },
  muted: { vb: 24, body: <><path d="M4 9h3l5-4v14l-5-4H4V9Z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></> },
  profile: { vb: 24, body: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.3-3.5 4.4-5 8-5s6.7 1.5 8 5H4Z" /></> },
  globe: { vb: 24, body: <><circle cx="12" cy="12" r="9" /><path d="M3 12H21M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z" /></> },
  rx: { vb: 24, body: <><path d="M6 3H15L19 7V21H6V3Z" /><path d="M9 10h2.5a1.5 1.5 0 0 1 0 3H9v-3Zm0 3v4m2.5-4 3 4m0-4-3 4" /></> },
  heart: { vb: 24, body: <path d="M12 20s-7-4.4-7-9a4.3 4.3 0 0 1 7-2.6A4.3 4.3 0 0 1 19 11c0 4.6-7 9-7 9Z" /> },
  tag: { vb: 24, body: <><path d="M3 12L11 4H20V13L12 21L3 12Z" /><circle cx="16" cy="8" r="1.2" /></> },
  // Global tab bar icons (IMG_1785) — red line icons with heart detail
  homeRed: { vb: 24, body: <><path d="M4 11L12 4L20 11V20H4V11Z" /><path d="M10 20v-5h4v5" /><path d="M10.6 9.4c.5-.6 1.4-.6 1.4.1 0-.7.9-.7 1.4-.1.5.7-1.4 2-1.4 2s-1.9-1.3-1.4-2Z" fill="currentColor" stroke="none" /></> },
  rxRed: { vb: 24, body: <><path d="M6 3H15L19 7V21H6V3Z" /><path d="M15 3V7H19" /><path d="M9 10h2.5a1.5 1.5 0 0 1 0 3H9v-3Zm0 3v4m2.5-4 3 4m0-4-3 4" /></> },
  healthRed: { vb: 24, body: <><path d="M12 4v16" /><path d="M12 9c-2-2.5-6-2-6 .5S9 12 12 12s6-.5 6-2.5-4-3-6-.5Z" /><path d="M12 15c-1.5-1.5-4-1-4 .5s2 1.5 4 1.5 4 0 4-1.5-2.5-2-4-.5Z" /><circle cx="12" cy="4" r="1" /></> },
  shopTagRed: { vb: 24, body: <><path d="M3 12L11 4H20V13L12 21L3 12Z" /><circle cx="16.5" cy="7.5" r="1.2" /><path d="M10.6 12.2c.6-.7 1.6-.7 1.6.1 0-.8 1-.8 1.6-.1.6.8-1.6 2.3-1.6 2.3s-2.2-1.5-1.6-2.3Z" fill="currentColor" stroke="none" /></> },
  benefitsRed: { vb: 24, body: <><path d="M12 21s-7-3.5-7-9V6l7-3 7 3v6c0 5.5-7 9-7 9Z" /><path d="M10.3 10.3c.8-.9 1.7-.6 1.7.2 0-.8.9-1.1 1.7-.2.9 1-1.7 3-1.7 3s-2.6-2-1.7-3Z" fill="currentColor" stroke="none" /></> },
  // Shop-area tab bar icons (IMG_1790)
  savings: { vb: 24, body: <><path d="M9 4h6l-1.5 3h-3L9 4Z" /><path d="M10.5 7C6.5 9 5 12.5 5 15.5 5 18.5 7.5 20 12 20s7-1.5 7-4.5c0-3-1.5-6.5-5.5-8.5" /><path d="M13.5 11.5c-.4-.6-1-.9-1.6-.9-.9 0-1.6.5-1.6 1.2 0 1.7 3.4.9 3.4 2.7 0 .7-.7 1.2-1.7 1.2-.7 0-1.4-.3-1.8-.9M12 10v.6M12 15.6v.6" /></> },
  shopBag: { vb: 24, body: <><path d="M5 8H19L18 21H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M10.6 12.4c.6-.7 1.4-.6 1.4.2 0-.8.8-.9 1.4-.2.7.8-1.4 2.4-1.4 2.4s-2.1-1.6-1.4-2.4Z" fill="currentColor" stroke="none" /></> },
  photo: { vb: 24, body: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><circle cx="9" cy="10" r="1.6" /><path d="M3 17L8 13L12 16L15 14L21 18" /></> },
  orders: { vb: 24, body: <><path d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z" /><path d="M9 8H15M9 12H15M9 16H12" /></> },
  // "Scan in store" button icon (ScreenRecording 11-28-01) — register with barcode and a card
  // "While you wait" card icons — drawn in the style of the red tab icons (IMG_1785, IMG_1790): 1.5 stroke line art + small filled heart.
  // Buy it again = a redo arrow around the Shop bag; Frequently bought = the Orders receipt (purchase history) with the heart.
  buyAgain: { vb: 24, body: <><path d="M18 6A8.5 8.5 0 1 1 9.8 3.8" /><path d="M7.9 2.6L10.3 3.7L8.8 5.8" /><path d="M8.5 11H15.5L15 17.5H9L8.5 11Z" /><path d="M10.5 11V10a1.5 1.5 0 0 1 3 0v1" /><path d="M11.02 13.6c.42-.49.98-.42.98.14 0-.56.56-.63.98-.14.49.56-.98 1.68-.98 1.68s-1.47-1.12-.98-1.68Z" fill="currentColor" stroke="none" /></> },
  frequentlyBought: { vb: 24, body: <><path d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z" /><path d="M9 7.5H15M9 11H15" /><path d="M10.6 13.8c.6-.7 1.4-.6 1.4.2 0-.8.8-.9 1.4-.2.7.8-1.4 2.4-1.4 2.4s-2.1-1.6-1.4-2.4Z" fill="currentColor" stroke="none" /></> },
  scanStore: { vb: 24, body: <><path d="M3.5 10.5H20.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19v-8.5Z" /><path d="M6 10.5L8 4.5H17.5L16 10.5" /><path d="M7 13.5v4M9.5 13.5v4M12 13.5v4M14.5 13.5v4M17 13.5v4" /></> },
};

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const icon = icons[name];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${icon.vb} ${icon.vb}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon.body}
    </svg>
  );
}

/* CVS R28 illustration: store icon used in the location bar (IMG_1790 "Find a location near you") */
function StoreIllustration({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="9" width="24" height="18" rx="1.5" fill="#3d8fc4" />
      <rect x="3" y="6" width="26" height="4" rx="1" fill="#2a6f9e" />
      <rect x="7" y="13" width="5" height="4" fill="#fff" /><rect x="20" y="13" width="5" height="4" fill="#fff" />
      <rect x="13.5" y="18" width="5" height="9" fill="#fff" />
      <path d="M14.2 12.6c.7-.8 1.8-.7 1.8.2 0-.9 1.1-1 1.8-.2.8 1-1.8 2.8-1.8 2.8s-2.6-1.8-1.8-2.8Z" fill="#cc0000" />
    </svg>
  );
}

/* Device status bar (utility) + EXT E2 Pickup status strip (reuses the R28 location-bar layout) */
function PhoneStatus({ pickup }: { pickup: Pickup | null }) {
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="phone-chrome">
      <div className="system-status" aria-label={`${time}, cellular signal, Wi-Fi, battery 86 percent`}>
        <strong>{time.replace(/\s?[AP]M$/i, "")}</strong>
        <span className="dynamic-island" aria-hidden="true" />
        <div className="system-icons" aria-hidden="true">
          <span className="cellular"><i /><i /><i /><i /></span>
          <svg viewBox="0 0 24 18"><path d="M2 6.5C7.8 1.5 16.2 1.5 22 6.5M5.5 10c3.8-3.1 9.2-3.1 13 0M9.5 13.5c1.5-1.2 3.5-1.2 5 0M12 16h.01" /></svg>
          <span className="battery"><i /></span>
        </div>
      </div>
      {pickup && (
        <div className={`pickup-strip${pickup.ready ? " ready" : ""}`}>
          <span className="dot" aria-hidden="true" />
          <span className="copy"><b className="t-label">Pharmacy pickup</b><span className="t-caption" aria-live="polite">{pickupLine(pickup)}</span></span>
          <Icon name={pickup.ready ? "check" : "clock"} size={20} />
          <span className="strip-progress" aria-hidden="true"><i style={{ transform: `scaleX(${pickup.progress})` }} /></span>
        </div>
      )}
    </div>
  );
}

/*
  CVS R3 Button
  - primary: filled #004D99 pill (IMG_1799 "Next", IMG_1819 "Check out")
  - secondary: white pill, 1 pt dark outline, blue label (IMG_1804 "Reschedule vaccine(s)", IMG_1816 "Shop this deal")
  - tinted: light-blue pill with blue outline (IMG_1797 "Buy now")
  - add: compact filled pill with cart icon (IMG_1767 "Add")
  - text: blue bold text link (IMG_1799 "Exit to home")
  - disabled: warm-gray fill, dashed outline, gray label (IMG_1796, Screenshot 10.36.32 "Check in at 15:10")
*/
function Button({ children, onClick, variant = "primary", size = "lg", disabled = false, busy = false, className = "", type = "button", focusReturn = false }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "tinted" | "add" | "text"; size?: "lg" | "md" | "sm"; disabled?: boolean; busy?: boolean; className?: string; type?: "button" | "submit"; focusReturn?: boolean }) {
  return <button type={type} disabled={disabled || busy} aria-busy={busy || undefined} data-focus-return={focusReturn || undefined} onClick={onClick} className={`btn ${variant} ${size}${busy ? " busy" : ""} ${className}`}>{busy && <Spinner size={18} />}{children}</button>;
}

/* CVS R34 Spinner (IMG_1809 loading dialog) */
function Spinner({ size = 40 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

/*
  CVS R1 App header (secondary navigation)
  - flow: back + bold title + CVS assistant button, soft shadow under the bar (IMG_1799, IMG_1800, IMG_1801)
  - shop: back + bold title + assistant + cart button with red count badge, search bar below (IMG_1790, IMG_1765)
  - cart: back + regular-weight title, soft shadow (IMG_1818 "Cart", IMG_1823 "Checkout")
  - centered: centred title, no back button (Screenshot 10.36.32 "Visit checklist")
  The assistant (chat) button is shown as in the current app; it has no function in this prototype.
*/
function AppHeader({ title, back, variant = "flow", cartCount, onCart, children }: { title: string; back?: () => void; variant?: "flow" | "shop" | "cart" | "centered" | "mint"; cartCount?: number; onCart?: () => void; children?: React.ReactNode }) {
  return (
    <header className={`app-header ${variant}`}>
      <div className="bar">
        {back && variant !== "centered" && <button type="button" className="header-back" onClick={back} aria-label="Go back"><Icon name="back" /></button>}
        <h1 className="title" tabIndex={-1}>{title}</h1>
        {(variant === "flow" || variant === "shop" || variant === "mint") && <button type="button" className="header-assistant" aria-label="Chat with CVS (not part of this prototype)"><Icon name="chat" size={22} /></button>}
        {onCart && <button type="button" className="header-round" onClick={onCart} aria-label={`In-store cart, ${items(cartCount ?? 0)}`}><Icon name="cart" />{!!cartCount && <i className="count-badge">{cartCount}</i>}</button>}
      </div>
      {children}
    </header>
  );
}

/* CVS R2 Search bar — warm fill, search icon, barcode icon (IMG_1790). A clear button replaces the barcode while typing (inferred). */
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="search-bar">
      <Icon name="search" size={22} />
      <input type="search" aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value ? <button type="button" className="clear" onClick={() => onChange("")} aria-label="Clear search"><Icon name="close" size={20} /></button> : <Icon name="barcode" size={22} />}
    </div>
  );
}

/* CVS R20a Global tab bar — glass pill, red icons (IMG_1785). Also used on Pharmacy screens with Pharmacy selected (inferred: no Pharmacy-area bar in the references). */
function GlobalTabBar({ active, navigate, goShop, pharmacyTarget }: { active: "home" | "pharmacy"; navigate: (screen: Screen) => void; goShop: (view: ShopView) => void; pharmacyTarget: Screen }) {
  const tabs: [IconName, string, "home" | "pharmacy" | null, (() => void) | undefined][] = [
    ["homeRed", "Home", "home", () => navigate("home")],
    ["rxRed", "Pharmacy", "pharmacy", () => navigate(pharmacyTarget)],
    ["healthRed", "Health", null, undefined],
    ["shopTagRed", "Shop", null, () => goShop("low")],
    ["benefitsRed", "Benefits", null, undefined],
  ];
  return (
    <nav className="global-tab-bar" aria-label="Main navigation">
      {tabs.map(([icon, label, key, onClick]) => (
        <button type="button" key={label} className={key === active ? "active" : ""} aria-current={key === active ? "page" : undefined} onClick={key === active ? undefined : onClick}>
          <Icon name={icon} size={26} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* CVS R20b Shop-area tab bar — separate Home button + glass pill; selected item has a red icon, bar above and bold label (IMG_1790) */
function ShopTabBar({ active, navigate, goShop }: { active: "savings" | "shop"; navigate: (screen: Screen) => void; goShop: (view: ShopView) => void }) {
  const tabs: [IconName, string, boolean, (() => void) | undefined][] = [["savings", "Savings", active === "savings", () => navigate("savings")], ["shopBag", "Shop", active === "shop", () => goShop("low")], ["photo", "Photo", false, undefined], ["orders", "Orders", false, undefined]];
  return (
    <nav className="shop-tab-bar" aria-label="Main navigation">
      <button type="button" className="home-button" onClick={() => navigate("home")}><Icon name="homeRed" size={26} /><span>Home</span></button>
      <div className="pill">
        {tabs.map(([icon, label, isActive, onClick]) => (
          <button type="button" key={label} className={isActive ? "active" : ""} aria-current={isActive ? "page" : undefined} onClick={isActive ? undefined : onClick}>
            <Icon name={icon} size={26} /><span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/*
  CVS R10 Page heading — task-flow question heading (32/44 Bold, IMG_1799–1801) or confirmation heading
  (30/38 Bold, ScreenRecording 11-33-18 "Sonakshi is all set"), optional body and thin divider.
*/
function PageHeading({ title, children, divider = true, id, size = "xl" }: { title: string; children?: React.ReactNode; divider?: boolean; id?: string; size?: "xl" | "lg" }) {
  return (
    <div className={`page-heading${divider ? " divided" : ""}`}>
      <h2 id={id} className={size === "xl" ? "t-display-xl" : "t-display"}>{title}</h2>
      {children}
    </div>
  );
}

/* CVS R31 Task-flow footer — primary action + "Exit to home" link (IMG_1799–1801) */
function FlowFooter({ label, onNext, onExit, busy = false, note }: { label: string; onNext: () => void; onExit: () => void; busy?: boolean; note?: string }) {
  return (
    <div className="sticky-footer">
      {note && <p className="t-caption c-secondary">{note}</p>}
      <Button onClick={onNext} busy={busy}>{label}</Button>
      <Button variant="text" size="md" onClick={onExit}>Exit to home</Button>
    </div>
  );
}

/* CVS R35 Option tile — single-choice tile; selected = light-blue fill + 2 pt blue outline (IMG_1799) */
function OptionTiles<T extends string>({ name, label, options, value, onChange, error }: { name: string; label: string; options: { value: T; label: string }[]; value: T | ""; onChange: (value: T) => void; error?: string }) {
  return (
    <fieldset className="tile-group" aria-invalid={!!error || undefined}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className={`option-tile${value === option.value ? " selected" : ""}${error ? " error" : ""}`}>
          <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
          <span className="t-body-lg">{option.label}</span>
        </label>
      ))}
      {error && <p className="field-error t-caption" role="alert">{error}</p>}
    </fieldset>
  );
}

/* CVS R35 Yes / No tiles — question text above two side-by-side tiles (IMG_1800 "Have you received a COVID-19 vaccine…") */
function YesNoQuestion({ name, question, value, onChange, error }: { name: string; question: string; value: YesNo; onChange: (value: YesNo) => void; error?: boolean }) {
  return (
    <fieldset className="yes-no-question" aria-invalid={error || undefined}>
      <legend className="t-body-lg">{question}</legend>
      <div className="yes-no">
        {(["yes", "no"] as const).map((option) => (
          <label key={option} className={`option-tile compact${value === option ? " selected" : ""}${error ? " error" : ""}`}>
            <input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} />
            <span className="t-body-lg">{option === "yes" ? "Yes" : "No"}</span>
          </label>
        ))}
      </div>
      {error && <p className="field-error t-caption" role="alert">Choose Yes or No.</p>}
    </fieldset>
  );
}

/* CVS R36 Info link — blue filled info icon + bold blue link text (IMG_1800) */
function InfoLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" className="info-link" onClick={onClick}><span className="info-dot" aria-hidden="true">i</span><span>{children}</span></button>;
}

/* CVS R27 Avatar row — initials avatar + name (IMG_1800 "SM Sonakshi M.") */
function AvatarRow({ identity }: { identity: Identity }) {
  return <div className="avatar-row"><span className="avatar" aria-hidden="true">{initials(identity)}</span><span className="t-body-lg">{displayName(identity)}</span></div>;
}

/* CVS R37 Checkbox — dark filled square with white check (IMG_1807 "Show date of birth") */
function SquareCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="square-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="box" aria-hidden="true"><Icon name="check" size={16} /></span>
      <span className="t-body-lg">{label}</span>
    </label>
  );
}

/* CVS R26 Text field with error (error state inferred: red outline + message) */
function FormField({ id, label, helper, value, onChange, placeholder, error, type = "text", inputMode, autoComplete, multiline = false }: { id: string; label: string; helper?: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; type?: string; inputMode?: "numeric" | "text"; autoComplete?: string; multiline?: boolean }) {
  const describedBy = [helper && `${id}-helper`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`text-field${error ? " has-error" : ""}`}>
      <label className="label" htmlFor={id}>{label}</label>
      {helper && <span id={`${id}-helper`} className="helper t-body">{helper}</span>}
      {multiline
        ? <textarea id={id} value={value} maxLength={500} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-describedby={describedBy} />
        : <input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={!!error || undefined} aria-describedby={describedBy} />}
      {error && <p id={`${id}-error`} className="field-error t-caption" role="alert">{error}</p>}
    </div>
  );
}

/*
  CVS R26 Date-of-birth field (IMG_1807 "Example: MMDDYYYY"). Digits are formatted as MM/DD/YYYY while typing.
  Handles autofilled or pasted dates such as 1/4/2004 or 01-04-2004, backspacing over a "/", and keeps the
  cursor in place when editing in the middle.
*/
function DobField({ value, onChange, show, error }: { value: string; onChange: (value: string) => void; show: boolean; error?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (caret.current == null || !ref.current || document.activeElement !== ref.current) return;
    try { ref.current.setSelectionRange(caret.current, caret.current); } catch { /* some input types don't support selection */ }
    caret.current = null;
  });
  const handle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const loose = /^\s*(\d{1,2})\s*[/.\- ]\s*(\d{1,2})\s*[/.\- ]\s*(\d{4})\s*$/.exec(raw);
    if (loose) { const next = `${loose[1].padStart(2, "0")}/${loose[2].padStart(2, "0")}/${loose[3]}`; caret.current = next.length; onChange(next); return; }
    const position = event.target.selectionStart ?? raw.length;
    let digits = raw.replace(/\D/g, "");
    let before = raw.slice(0, position).replace(/\D/g, "").length;
    // Backspace removed only a "/": remove the digit in front of it instead
    if (raw.length < value.length && digits === value.replace(/\D/g, "") && before > 0) { digits = digits.slice(0, before - 1) + digits.slice(before); before -= 1; }
    digits = digits.slice(0, 8);
    const next = formatDob(digits);
    let index = 0; let seen = 0;
    while (index < next.length && seen < Math.min(before, digits.length)) { if (/\d/.test(next[index])) seen += 1; index += 1; }
    caret.current = index;
    onChange(next);
  };
  return (
    <div className={`text-field${error ? " has-error" : ""}`}>
      <label className="label" htmlFor="patient-dob">Date of birth</label>
      <span id="patient-dob-helper" className="helper t-body">Example: MMDDYYYY</span>
      <input ref={ref} id="patient-dob" name="bday" type={show ? "text" : "password"} inputMode="numeric" autoComplete="bday" maxLength={14} value={value} onChange={handle} placeholder="__/__/____" aria-invalid={!!error || undefined} aria-describedby={`patient-dob-helper${error ? " patient-dob-error" : ""}`} />
      {error && <p id="patient-dob-error" className="field-error t-caption" role="alert">{error}</p>}
    </div>
  );
}

/* CVS R38 Brand lockup — red heart + "CVS pharmacy" (IMG_1802, IMG_1813 "Where") */
function CvsLockup() {
  return <span className="cvs-lockup" aria-label="CVS pharmacy"><svg width="18" height="16" viewBox="0 0 24 21" aria-hidden="true"><path d="M12 21S0 13.6 0 6.4C0 2.8 2.7 0 6.2 0 8.7 0 10.8 1.4 12 3.5 13.2 1.4 15.3 0 17.8 0 21.3 0 24 2.8 24 6.4 24 13.6 12 21 12 21Z" fill="currentColor" /></svg><b>CVS</b><span>pharmacy</span></span>;
}

/* CVS R39 Bulleted list — "Things to know" (ScreenRecording 11-33-18) */
function ThingsToKnow({ title = "Things to know", items: list }: { title?: string; items: string[] }) {
  return (
    <section className="things-to-know">
      <h2 className="t-title">{title}</h2>
      <ul className="t-body">{list.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

/* CVS R40 Options panel — "Looking for other options?" with two outline buttons (IMG_1804) */
function OptionsPanel({ title, body, actions }: { title: string; body: string; actions: { label: string; onClick: () => void }[] }) {
  return (
    <section className="options-panel">
      <h2 className="t-title">{title}</h2>
      <p className="t-body-lg">{body}</p>
      {actions.map((action) => <Button key={action.label} variant="secondary" onClick={action.onClick}>{action.label}</Button>)}
    </section>
  );
}

/* CVS R12 Loading dialog — white rounded dialog, blue spinner, "Loading" (IMG_1809) */
function LoadingDialog({ label = "Loading" }: { label?: string }) {
  return (
    <div className="sheet-backdrop modal-backdrop loading-backdrop fade-in" role="presentation">
      <div className="loading-dialog" role="alertdialog" aria-modal="true" aria-label={label} aria-busy="true" tabIndex={-1} ref={(node) => node?.focus()}>
        <Spinner size={52} />
        <span className="t-title regular" role="status">{label}</span>
      </div>
    </div>
  );
}

/*
  EXT E16 Pharmacy heart icon — the CVS heart (as in the app's tab icons and "Vaccine appointment" card, IMG_1803)
  with a capsule inside. Used on the "Check in to pharmacy" Activity card.
*/
function HeartPill({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 80 72" aria-hidden="true">
      <path d="M40 70S2 47.5 2 23.5C2 11.6 11.1 2.5 22.6 2.5c7.7 0 13.7 4 17.4 10.2C43.7 6.5 49.7 2.5 57.4 2.5 68.9 2.5 78 11.6 78 23.5 78 47.5 40 70 40 70Z" fill="#CC0000" />
      <g transform="rotate(-40 40 33)">
        <rect x="21" y="24" width="38" height="18" rx="9" fill="#FFFFFF" />
        <path d="M40 24h10a9 9 0 0 1 0 18H40V24Z" fill="#F6C6C6" />
        <path d="M40 24V42" stroke="#CC0000" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/* CVS R9 Section title + optional action link (IMG_1792 "Shop by category · See All", IMG_1815 "Coupons · Weekly Ad") */
function SectionTitle({ title, action, onAction, id }: { title: string; action?: string; onAction?: () => void; id?: string }) {
  return (
    <div className="section-title">
      <h2 id={id} className="t-heading-lg">{title}</h2>
      {action && <button type="button" className="action" onClick={onAction}>{action}</button>}
    </div>
  );
}

/* CVS R8 Detail row — warm-gray icon circle, bold title, detail lines, optional edit action (IMG_1801, IMG_1804, Screenshot 10.37.39) */
function DetailRow({ icon, title, children, value, onEdit, editLabel }: { icon?: IconName; title: string; children?: React.ReactNode; value?: string; onEdit?: () => void; editLabel?: string }) {
  return (
    <div className="detail-row">
      {icon && <span className="icon-circle" aria-hidden="true"><Icon name={icon} size={24} /></span>}
      <div className="body"><b className="t-heading-sm">{title}</b>{children}</div>
      {value && <span className="value t-body">{value}</span>}
      {onEdit && <button type="button" className="edit" onClick={onEdit} aria-label={editLabel ?? `Edit ${title}`}><Icon name="edit" size={24} /></button>}
    </div>
  );
}

/*
  CVS R6 Navigation list row — line icon, bold label, chevron, divider (IMG_1789 "Shop essentials").
  EXT E14 when a description is passed: adds a secondary line under the label (not shown in the reference).
*/
function NavRow({ icon, label, description, onClick }: { icon: IconName; label: string; description?: string; onClick: () => void }) {
  return (
    <button type="button" className="nav-row" onClick={onClick}>
      <Icon name={icon} size={26} />
      <span className="body"><b className="t-heading-sm">{label}</b>{description && <span className="t-caption">{description}</span>}</span>
      <Icon name="chevron" size={22} />
    </button>
  );
}

/* CVS R18 Plain list row with chevron (IMG_1822 policy rows) */
function PlainRow({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="plain-row t-body" onClick={onClick}><span>{label}</span><Icon name="chevron" size={22} /></button>;
}

/* CVS R7 Link card — bordered card, bold title, blue link with chevron (IMG_1812 "Need more help?") */
function LinkCard({ title, link, onClick }: { title: string; link: string; onClick: () => void }) {
  return (
    <button type="button" className="link-card" onClick={onClick}>
      <b className="t-heading-md">{title}</b>
      <span className="link">{link}<Icon name="chevron" size={18} /></span>
    </button>
  );
}

/*
  CVS R11 Notices
  - warning: bordered card, icon circle with warning triangle (IMG_1786 "Slow connection"), orange triangle (IMG_1810, IMG_1818)
  - info: warm-gray box with info icon (inferred from IMG_1821 box + IMG_1800 info icon)
  - success: green check circle + text (inferred — no success banner in the references; green check from the Health Check list)
*/
function Notice({ type = "info", title, children, role, onClose }: { type?: "info" | "success" | "warning"; title?: string; children?: React.ReactNode; role?: "status" | "alert"; onClose?: () => void }) {
  return (
    <div className={`notice ${type}`} role={role}>
      <span className="notice-icon" aria-hidden="true">{type === "warning" ? <Icon name="warning" size={22} /> : type === "success" ? <Icon name="check" size={16} /> : <Icon name="info" size={22} />}</span>
      <p className="t-body">{title && <b>{title} </b>}{children}</p>
      {onClose && <button type="button" className="close" onClick={onClose} aria-label="Dismiss"><Icon name="close" size={22} /></button>}
    </div>
  );
}

/* CVS R4 Check row — label left, circle right; selected = green filled circle with white check (ScreenRecording 11-33-18 "Health Check", IMG_1802 consent row) */
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="check-row">
      <span className="t-body">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="check-circle" aria-hidden="true"><Icon name="check" size={16} /></span>
    </label>
  );
}

/* CVS R26 Text field — bold label above, optional helper, 1 pt outlined field (IMG_1807, IMG_1810) */
function TextField({ label, helper, value, onChange, placeholder, multiline = false }: { label: string; helper?: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <label className="text-field">
      <span className="label">{label}</span>
      {helper && <span className="helper t-caption">{helper}</span>}
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
    </label>
  );
}

const supportLanguages = ["Spanish / Español", "Chinese, Mandarin / 普通话", "Chinese, Cantonese / 廣東話", "Vietnamese / Tiếng Việt", "Korean / 한국어", "Arabic / العربية", "Russian / Русский", "Tagalog / Wikang Tagalog", "American Sign Language (ASL)", "Another language"];

/*
  EXT E9 Staff-language field — CVS R25 dropdown (IMG_1810: outlined field, blue value, chevron; opens the
  native iOS menu as in IMG_1811) + CVS R26 text field for "Another language".
  Error state is inferred (red outline + message); the references don't show a field error.
*/
function StaffLanguageField({ language, other, onChange, error }: { language: string; other: string; onChange: (language: string, other: string) => void; error?: boolean }) {
  return (
    <div className="stack-12">
      <label className="dropdown-field">
        <span className="label">Language for the pharmacy team</span>
        <span className="helper t-caption">Availability can vary by store and time.</span>
        <span className={`dropdown${error ? " error" : ""}${language ? " filled" : ""}`}>
          <select value={language} onChange={(event) => onChange(event.target.value, event.target.value === "Another language" ? other : "")} aria-invalid={error || undefined} aria-describedby={error ? "language-error" : undefined}>
            <option value="">Choose a language</option>
            {supportLanguages.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <Icon name="chevronDown" size={22} />
        </span>
      </label>
      {error && <p id="language-error" className="field-error t-caption" role="alert">{language === "Another language" ? "Type the language you need, or choose one from the list." : 'Choose a language, or clear "I need language support".'}</p>}
      {language === "Another language" && <TextField label="Which language?" value={other} onChange={(value) => onChange(language, value)} placeholder="Type the language" />}
    </div>
  );
}

/* CVS R5 Segmented control — gray track, white selected segment (IMG_1815 "All / On card / For you") */
const categories: { view: ShopView; label: string }[] = [
  { view: "low", label: "Buy it again" },
  { view: "frequent", label: "Frequently bought" },
  { view: "deals", label: "Deals" },
];
function SegmentedControl({ selected, onSelect, label }: { selected: ShopView; onSelect: (view: ShopView) => void; label: string }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {categories.map((category) => (
        <button key={category.view} type="button" role="tab" aria-selected={selected === category.view} onClick={() => onSelect(category.view)}>{category.label}</button>
      ))}
    </div>
  );
}

/* CVS R22 Deal tag — yellow tag with heart (IMG_1769 "extra big deals"); the label carries this item's coupon */
/*
  EXT E30 Coupon "clips" to the card — the yellow tag changes in place to a check and "On your card" when its item is
  added, the way CVS's "Send to card" pill turns into a sent state (IMG_1769). The Scan in store button answers it.
*/
function DealTag({ children, onCard = false }: { children: React.ReactNode; onCard?: boolean }) {
  return (
    <span className={`deal-tag${onCard ? " on-card" : ""}`}>
      <span key={onCard ? "on" : "off"} className="deal-tag-face">{onCard ? <><Icon name="check" size={12} />On your card</> : <><Icon name="heart" size={12} />{children}</>}</span>
    </span>
  );
}

/* CVS R33 Price block — red "SALE" label and red sale price with the regular price struck through (IMG_1795, IMG_1769). The app's separate black price line is left out because it repeats the sale price. */
function Price({ product }: { product: Product }) {
  if (!product.original) return <div className="price-block"><span className="price">{product.price}</span></div>;
  return (
    <div className="price-block">
      <span className="sale-label">SALE</span>
      <span className="price-line"><span className="price sale">Sale {product.price}</span><del><span className="sr-only">was </span>{product.original}</del></span>
    </div>
  );
}

/* CVS R42 Gray tag — warm-gray rounded tag (IMG_1816 "In store or online", IMG_1768 "Sponsored") */
function GrayTag({ children }: { children: React.ReactNode }) {
  return <span className="gray-tag">{children}</span>;
}

/*
  EXT E6 Coupon state — modified CVS R24 "Send to card" pill (IMG_1769). Same pill shape and colours, but
  informational (no + button): coupons are added with the item, not sent to the card separately.
*/
function CouponState({ product, inCart }: { product: Product; inCart: boolean }) {
  if (!product.coupon) return null;
  return (
    <p className={`coupon-state${inCart ? " added" : ""}`}>
      {inCart ? <><span className="mark" aria-hidden="true"><Icon name="check" size={12} /></span>On your card: saves ${saving(product).toFixed(2)}</> : <>Coupon available: save ${saving(product).toFixed(2)}</>}
    </p>
  );
}

/*
  Shared dialog behaviour for every overlay: moves focus in, traps Tab, closes on Escape,
  and returns focus to the control that opened it (or a logical fallback on the current screen).
*/
function useDialog<T extends HTMLElement>(close: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    (node?.querySelector<HTMLElement>("[data-autofocus]") ?? node)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select, textarea, [href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement) || document.activeElement === node)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.setTimeout(() => {
        if (previous && previous !== document.body && previous.isConnected) { previous.focus({ preventScroll: true }); return; }
        (document.querySelector<HTMLElement>("[data-focus-return]") ?? document.querySelector<HTMLElement>(".app-screen h1"))?.focus({ preventScroll: true });
      }, 0);
    };
  }, []);
  return ref;
}

/* CVS R13 Bottom sheet — 24 pt top radius, grabber; centred title (ScreenRecording 11-28-01 "Added to cart") or left title (Screenshot 10.37.39 "Visit details") */
function BottomSheet({ title, label, close, align = "left", children }: { title: string; label?: string; close: () => void; align?: "left" | "center"; children: React.ReactNode }) {
  const ref = useDialog<HTMLElement>(close);
  return (
    <div className="sheet-backdrop" role="presentation" onClick={close}>
      <section ref={ref} tabIndex={-1} className="bottom-sheet" role="dialog" aria-modal="true" aria-label={label ?? title} onClick={(event) => event.stopPropagation()}>
        <div className={`sheet-head ${align}`}><div className="grabber" /><h2 className={align === "center" ? "t-heading-sm regular" : "t-heading-md"} tabIndex={-1} data-autofocus>{title}</h2></div>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}

/* CVS R13 sheet content as in the current app's "Added to cart" sheet (ScreenRecording 11-28-01): product, pickup line, note, centred subtotal, primary + outline buttons */
function CartAddedSheet({ product, cartCount, subtotal, onViewCart, onContinue }: { product: Product; cartCount: number; subtotal: number; onViewCart: () => void; onContinue: () => void }) {
  return (
    <BottomSheet title="Added to in-store cart" align="center" close={onContinue}>
      <div className="summary-product">
        <Packshot product={product} size={72} />
        <div className="body">
          <span className="t-body">{product.name}</span>
          <span className={`t-body${product.original ? " sale-text" : ""}`}>{product.price}</span>
          <span className="stock-line">{product.aisle} | {product.shelf}</span>
          <CouponState product={product} inCart />
        </div>
      </div>
      <p className="t-body c-secondary">This is a list for shopping in this store. You pay at the register, not in the app.</p>
      <p className="subtotal t-heading-sm">Estimated subtotal: ${subtotal.toFixed(2)}</p>
      <div className="stack-12">
        <Button onClick={onViewCart}>View in-store cart ({items(cartCount)})</Button>
        <Button variant="secondary" onClick={onContinue}>Continue shopping</Button>
      </div>
    </BottomSheet>
  );
}

/* Current CVS homepage (CVS R32, IMG_1785): header actions, search, chips, Health & Pharmacy / Shop selector, Activity, Discover more */
/* Area selector icons — the app's own artwork, cropped from IMG_1785 and ScreenRecording 11-28-01: full colour when selected, grey when not */
function AreaIcon({ area, selected }: { area: "health" | "shop"; selected: boolean }) {
  return <img className={`area-icon ${area}`} src={`home/icon-${area}-${selected ? "on" : "off"}.png`} alt="" width={32} height={area === "health" ? 25 : 21} />;
}

function Home({ navigate, cartCount, checkedIn, pickup }: { navigate: (screen: Screen) => void; cartCount: number; checkedIn: boolean; pickup: Pickup }) {
  // The area selector pins under the status bar once the header scrolls away (ScreenRecording 11-28-01, 0:02).
  const [stuck, setStuck] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const node = selectorRef.current;
    if (!node) return;
    // Sticky offsets are measured inside the page's top padding (status bar, and the pickup bar when checked in).
    const stickTop = (parseFloat(getComputedStyle(event.currentTarget).paddingTop) || 0) + (parseFloat(getComputedStyle(node).top) || 0);
    setStuck(node.getBoundingClientRect().top <= stickTop + 0.5);
  };
  return (
    <div className="page home-page" onScroll={onScroll}>
      <header className="home-head">
        <div className="home-actions">
          <button className="home-round" aria-label="Account"><Icon name="profile" size={20} /></button>
          <div>
            <button className="home-round assistant" aria-label="Chat with CVS"><Icon name="chat" size={20} /></button>
            <button className="home-round" aria-label="Messages"><Icon name="mail" size={20} /></button>
            <button className="home-round" onClick={() => navigate("order")} aria-label={`Cart with ${items(cartCount)}`}><Icon name="cart" size={20} />{!!cartCount && <i className="count-badge">{cartCount}</i>}</button>
          </div>
        </div>
        <button className="home-search" aria-label="Search or ask a question">
          <Icon name="search" size={20} />
          <span className="placeholder">Search or ask a question</span>
          <Icon name="barcode" size={20} />
          <span className="mic" aria-hidden="true"><Icon name="mic" size={16} /></span>
        </button>
        <div className="home-chips"><button className="home-chip">Vaccines</button><button className="home-chip">Find a store</button><button className="home-chip">Photo</button><button className="home-chip">Weekly Ad</button></div>
      </header>
      <div ref={selectorRef} className={`home-selector${stuck ? " stuck" : ""}`} role="group" aria-label="Choose an area">
        <button aria-pressed="true"><AreaIcon area="health" selected /> Health & Pharmacy</button>
        {/* Shop area is not part of this prototype (inactive, as in the brief) */}
        <button aria-pressed="false" aria-label="Shop (not part of this prototype)"><AreaIcon area="shop" selected={false} /> Shop</button>
      </div>
      {/* Health & Pharmacy area, as in the current app: Activity + vaccine promo (IMG_1785) */}
      <main className="home-content">
        <>
          <h2 className="t-display home-section-title">Activity</h2>
          <div className="activity-row">
            {/* EXT E17 "Check in to pharmacy" Activity card — current-app Activity card layout (IMG_1803 "Vaccine appointment") + E16 heart-pill icon */}
            <button type="button" className="activity-card checkin-activity" onClick={() => navigate(checkedIn ? "status" : "visit")}>
              <header><b className="t-heading-md">Check in to pharmacy</b></header>
              <div className="activity-body">
                <HeartPill size={76} />
                <b className="t-heading-md">{checkedIn ? (pickup.ready ? "Ready for pickup" : "You're checked in") : "2 prescriptions ready"}</b>
              </div>
              <span className="activity-foot t-caption">{checkedIn ? pickupLine(pickup) : "CVS Pharmacy #4471"}</span>
            </button>
            <article className="activity-card" aria-hidden="true">
              <header><b className="t-heading-md">Chat with a physician</b></header>
              <div className="activity-body"><img src="home/activity-physician.png" alt="" width={163} height={61} /><p>Get fast medical support from expert providers.</p></div>
            </article>
          </div>
          <h2 className="t-display home-section-title">Discover more</h2>
          {/* Vaccine promo (IMG_1785). The card copy sits under the tab bar in the screenshot; the title is legible there, the body line is written from the "$5 off $20" badge. */}
          <div className="discover-row">
            <article className="discover-card blue">
              <img src="home/discover-vaccine.png" alt="" width={221} height={144} />
              <b className="discover-title">Get a vaccine.</b>
              <p>Get $5 off a $20 purchase when you get vaccinated at CVS.*</p>
            </article>
          </div>
        </>
      </main>
    </div>
  );
}

/*
  Silent Check-In flow. Layout, wording pattern and step order follow the current CVS app's COVID-19 vaccine
  check-in / scheduling flow (designer's screenshots):
  pickup checklist (Screenshot 10.36.32) → confirm identity (IMG_1807, IMG_1809) → questions with Yes / No tiles
  (IMG_1800) → option tiles (IMG_1799) → review with consent (IMG_1801, IMG_1802) → confirmation and details
  (ScreenRecording 11-33-18, IMG_1804) → cancel (IMG_1810, IMG_1812).
*/

/* Step 0 — pickup checklist (Screenshot 10.36.32 "Visit checklist") */
function PickupChecklist({ identity, onStart, onDetails, goHome }: { identity: Identity; onStart: () => void; onDetails: () => void; goHome: () => void }) {
  return (
    <div className="page flow-page">
      <AppHeader variant="centered" title="Pickup checklist" />
      {/* CVS R41 Hero illustration — cropped from the designer's screenshot of the current app (Screenshot 10.36.32) */}
      <img className="flow-hero" src="checkin/pickup-hero.png" alt="" />
      <main className="content flow">
        <PageHeading title="Check in for pickup at CVS #4471" divider={false}>
          <p className="t-body">Looking forward to seeing you, {firstName(identity)}. Your 2 prescriptions are ready. Check in to let the pharmacy team know you're here, without speaking at the counter.</p>
        </PageHeading>
        <div className="checklist-actions">
          <Button onClick={onStart}>Check in</Button>
          <Button variant="secondary" onClick={onDetails}>Review your pickup details</Button>
          <Button variant="text" size="md" onClick={goHome}>Back to home</Button>
        </div>
      </main>
    </div>
  );
}

/* Step 1 — confirm identity: name + date of birth (IMG_1807 "Let's confirm it's Sonakshi"), then the loading dialog (IMG_1809) */
function ConfirmIdentity({ initial, onBack, onNext, goHome }: { initial: Identity; onBack: () => void; onNext: (identity: Identity) => void; goHome: () => void }) {
  const [name, setName] = useState(initial.name);
  const [dob, setDob] = useState(initial.dob);
  const [showDob, setShowDob] = useState(true);
  const [tried, setTried] = useState(false);
  const nameError = tried && !name.trim() ? "Enter your full name." : undefined;
  const dobError = tried && !validDob(dob) ? (dob ? "Enter a real date of birth as MM/DD/YYYY." : "Enter your date of birth.") : undefined;
  const next = () => { setTried(true); if (name.trim() && validDob(dob)) onNext({ name: name.trim(), dob }); };
  return (
    <div className="page flow-page with-footer">
      <AppHeader title="Confirm Identity" back={onBack} />
      <main className="content flow">
        <PageHeading title="Let's confirm it's you">
          <p className="t-body-lg">All fields required.</p>
        </PageHeading>
        <FormField id="patient-name" label="Full name" helper="As it appears on your prescription" value={name} onChange={setName} autoComplete="name" error={nameError} />
        <DobField value={dob} onChange={setDob} show={showDob} error={dobError} />
        <SquareCheckbox label="Show date of birth" checked={showDob} onChange={setShowDob} />
      </main>
      <FlowFooter label="Next" onNext={next} onExit={goHome} />
    </div>
  );
}

/* Step 2 — pharmacist questions (IMG_1800 layout: heading, "All fields required.", divider, avatar row, question + Yes/No tiles, info link) */
function QuestionsStep({ draft, update, identity, onBack, onNext, goHome, openPrivateInfo, returning }: { draft: Preferences; update: (changes: Partial<Preferences>) => void; identity: Identity; onBack: () => void; onNext: () => void; goHome: () => void; openPrivateInfo: () => void; returning: boolean }) {
  const [tried, setTried] = useState(false);
  const missingPrivate = draft.question === "yes" && !draft.privateDiscussion;
  const next = () => { setTried(true); if (draft.question && !missingPrivate) onNext(); };
  return (
    <div className="page flow-page with-footer">
      <AppHeader title="Pharmacist Questions" back={onBack} />
      <main className="content flow">
        <PageHeading title={`Let's get you checked in, ${firstName(identity)}`}>
          <p className="t-body-lg">All fields required.</p>
        </PageHeading>
        <AvatarRow identity={identity} />
        <YesNoQuestion name="has-question" question="Do you have a question for the pharmacist today?" value={draft.question} onChange={(value) => update({ question: value, questionText: value === "yes" ? draft.questionText : "", privateDiscussion: value === "yes" ? draft.privateDiscussion : "" })} error={tried && !draft.question} />
        {draft.question === "yes" && <>
          <FormField id="question-text" label="Your question (optional)" helper="500 character max" value={draft.questionText} onChange={(value) => update({ questionText: value })} multiline />
          <YesNoQuestion name="private" question="Would you like to discuss it privately?" value={draft.privateDiscussion} onChange={(value) => update({ privateDiscussion: value })} error={tried && missingPrivate} />
        </>}
        <InfoLink onClick={openPrivateInfo}>Learn how private consultations work at the pharmacy</InfoLink>
      </main>
      <FlowFooter label={returning ? "Save" : "Next"} onNext={next} onExit={goHome} />
    </div>
  );
}

/* Step 3 — communication + language (IMG_1799 option tiles, IMG_1800 Yes/No, IMG_1810 dropdown) */
function CommunicationStep({ draft, update, onBack, onNext, goHome, returning }: { draft: Preferences; update: (changes: Partial<Preferences>) => void; onBack: () => void; onNext: () => void; goHome: () => void; returning: boolean }) {
  const [tried, setTried] = useState(false);
  const languageMissing = draft.languageSupport === "yes" && (!draft.language || (draft.language === "Another language" && !draft.otherLanguage.trim()));
  const next = () => { setTried(true); if (draft.communication && draft.languageSupport && !languageMissing) onNext(); };
  return (
    <div className="page flow-page with-footer">
      <AppHeader title="Communication" back={onBack} />
      <main className="content flow">
        <PageHeading title="How should the team communicate with you?" />
        <p className="t-body flow-helper">We'll only share this with the pharmacy team at CVS #4471.</p>
        <OptionTiles<Exclude<Communication, "">> name="communication" label="How the pharmacy team should communicate with you" value={draft.communication} onChange={(value) => update({ communication: value })} error={tried && !draft.communication ? "Choose an option." : undefined} options={[{ value: "writing", label: "In writing" }, { value: "speaking", label: "Speaking is fine" }, { value: "none", label: "No preference" }]} />
        <YesNoQuestion name="language" question="Do you need language support?" value={draft.languageSupport} onChange={(value) => update({ languageSupport: value, language: value === "yes" ? draft.language : "", otherLanguage: value === "yes" ? draft.otherLanguage : "" })} error={tried && !draft.languageSupport} />
        {draft.languageSupport === "yes" && <StaffLanguageField language={draft.language} other={draft.otherLanguage} error={tried && languageMissing} onChange={(language, other) => update({ language, otherLanguage: other })} />}
      </main>
      <FlowFooter label={returning ? "Save" : "Next"} onNext={next} onExit={goHome} />
    </div>
  );
}

/* Shared check-in detail rows (IMG_1801 "Visit details" rows; edit icons as in IMG_1801) */
function CheckinDetailRows({ identity, preferences, onEdit }: { identity: Identity; preferences: Preferences; onEdit?: (screen: Screen) => void }) {
  return (
    <div>
      <div className="detail-row person">
        <span className="avatar large" aria-hidden="true">{initials(identity)}</span>
        <div className="body"><b className="t-heading-md">{displayName(identity)}</b>{identity.dob && <span className="t-body">Date of birth: {identity.dob}</span>}</div>
        {onEdit && <button type="button" className="edit" onClick={() => onEdit("identity")} aria-label="Edit name and date of birth"><Icon name="edit" size={24} /></button>}
      </div>
      <DetailRow icon="rx" title="What"><span className="t-body">Prescription pickup · 2 prescriptions</span></DetailRow>
      <DetailRow icon="chat" title="Questions" onEdit={onEdit && (() => onEdit("questions"))} editLabel="Edit questions"><span className="t-body">{questionSummary(preferences)}</span>{preferences.question === "yes" && <span className="t-body">{preferences.privateDiscussion === "yes" ? "Discuss privately" : "Fine to discuss at the counter"}</span>}</DetailRow>
      <DetailRow icon="globe" title="Communication" onEdit={onEdit && (() => onEdit("communication"))} editLabel="Edit communication"><span className="t-body">{communicationLabel[preferences.communication]}</span><span className="t-body">{languageSummary(preferences)}</span></DetailRow>
    </div>
  );
}

function DateAndLocation({ when, whenDetail }: { when: string; whenDetail: string }) {
  return (
    <section>
      <h2 className="t-title">Date and location</h2>
      <DetailRow icon="clock" title="When"><span className="t-body">{when}</span><span className="t-body">{whenDetail}</span></DetailRow>
      <DetailRow icon="pin" title="Where"><span className="t-body">{pickupStore.street}</span><span className="t-body">{pickupStore.city}</span><CvsLockup /></DetailRow>
    </section>
  );
}

/* Step 4 — review + consent (IMG_1801 "Confirm your visit details", IMG_1802 "Consents") */
function ReviewCheckin({ identity, draft, editing, failed, busy, onBack, onEdit, onSubmit, goHome }: { identity: Identity; draft: Preferences; editing: boolean; failed: boolean; busy: boolean; onBack: () => void; onEdit: (screen: Screen) => void; onSubmit: () => void; goHome: () => void }) {
  const [consent, setConsent] = useState(editing);
  const [tried, setTried] = useState(false);
  const submit = () => { setTried(true); if (consent) onSubmit(); };
  return (
    <div className="page flow-page with-footer">
      <AppHeader title="Review Details" back={onBack} />
      <main className="content flow">
        {failed && <Notice type="warning" title="We couldn't check you in." role="alert">Check your connection and try again, or let the pharmacy counter know you're here.</Notice>}
        <PageHeading title={editing ? "Update your check-in details" : "Confirm your check-in details"} />
        <section>
          <h2 className="t-title">Check-in details</h2>
          <CheckinDetailRows identity={identity} preferences={draft} onEdit={onEdit} />
        </section>
        <DateAndLocation when={`Today, ${today()}`} whenDetail={editing ? "You're already checked in" : "Checking in now"} />
        <section className="consents">
          <h2 className="t-title">Consents</h2>
          <p className="t-body-lg">Silent Check-In shares your name and the answers above with the pharmacy team at {pickupStore.name}.</p>
          <CheckRow label="I agree to share these details with the pharmacy team. (required)" checked={consent} onChange={(checked) => { setConsent(checked); }} />
          {tried && !consent && <p className="field-error t-caption" role="alert">Agree to share your details to check in.</p>}
        </section>
      </main>
      <FlowFooter label={editing ? "Save changes" : failed ? "Try again" : "Check in"} onNext={submit} onExit={goHome} busy={busy} />
    </div>
  );
}

/* Pickup details sheet (Screenshot 10.37.39 "Visit details" sheet) */
function PickupDetailsSheet({ identity, close, onStart }: { identity: Identity; close: () => void; onStart: () => void }) {
  return (
    <BottomSheet title="Pickup details" close={close}>
      <div className="detail-row person"><span className="avatar large gray" aria-hidden="true">{initials(identity)}</span><div className="body"><b className="t-heading-md">{displayName(identity)}</b></div></div>
      <DetailRow icon="rx" title="Prescriptions"><span className="t-body">2 prescriptions ready for pickup</span><span className="t-body">Pharmacy counter, back of the store</span></DetailRow>
      <div className="divider" />
      <h2 className="t-heading-md">Date and location</h2>
      <DetailRow icon="clock" title="When"><span className="t-body">Ready now</span><span className="t-body">{pickupStore.hours}</span></DetailRow>
      <DetailRow icon="pin" title="Where"><span className="t-label caps">{pickupStore.street.toUpperCase()}</span><span className="t-label caps">{pickupStore.city.toUpperCase()}</span><CvsLockup /></DetailRow>
      <Button onClick={onStart}>Check in</Button>
    </BottomSheet>
  );
}

/* Info sheet opened from the info link on the questions step */
function PrivateInfoSheet({ close }: { close: () => void }) {
  return (
    <BottomSheet title="Private consultations" close={close}>
      <p className="t-body-lg">A pharmacist can talk with you in the private consultation area next to the pickup counter. Choose "Yes" when we ask, and the team will meet you there when your prescriptions are ready.</p>
      <p className="t-body-lg">Only the pharmacy team sees the question you type.</p>
      <Button variant="secondary" onClick={close}>Got it</Button>
    </BottomSheet>
  );
}

/*
  Checked-in details — current CVS confirmation + visit-details layout (ScreenRecording 11-33-18 "Sonakshi is all set" /
  "Visit Details", IMG_1804 "Looking for other options?"), with extensions E3 (green check) and E4 (progress card).
*/
/* EXT E26 Pickup timeline — CVS step-progress pattern (Checked in › Preparing › Ready) driven by the live estimate */
function PickupTimeline({ pickup }: { pickup: Pickup }) {
  const step = pickup.ready ? 3 : 2;
  const steps = ["Checked in", "Preparing", "Ready"];
  return (
    <div className="pickup-timeline" role="group" aria-label={`Pickup progress: step ${step} of 3, ${steps[step - 1]}. ${pickupLine(pickup)}.`}>
      <div className="track" aria-hidden="true">
        <span className="fill" style={{ transform: `scaleX(${pickup.ready ? 1 : 0.5 * (1 + pickup.progress)})` }} />
        {steps.map((label, index) => <i key={label} className={index < step - 1 || pickup.ready ? "done" : index === step - 1 ? "current" : ""} />)}
      </div>
      <div className="labels t-caption" aria-hidden="true">{steps.map((label, index) => <span key={label} className={index === step - 1 ? "current" : ""}>{label}</span>)}</div>
    </div>
  );
}

/* EXT E28 — CVS R45 Category card (IMG_1792 "Shop by category"): circle image, bold label, one-line description. The coupon card uses the same parts laid out in a row so the three shopping options read as one group (similarity). */
function ShopCard({ title, caption, art, tone, wide = false, onClick }: { title: string; caption: string; art: React.ReactNode; tone: "rose" | "blue" | "teal"; wide?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`shop-card${wide ? " wide" : ""}`} onClick={onClick}>
      <span className={`shop-card-circle ${tone}`} aria-hidden="true">{art}</span>
      <span className="shop-card-copy"><b className="t-heading-sm">{title}</b><span className="t-caption">{caption}</span></span>
      {wide && <Icon name="chevron" size={20} />}
    </button>
  );
}

/*
  Checked-in details — current CVS confirmation + visit-details layout (ScreenRecording 11-33-18 "Sonakshi is all set" /
  "Visit Details", IMG_1804 "Looking for other options?"). Shopping comes first: a compact confirmation with the live
  pickup timeline (E3, E4), then the three "While you wait" cards, then the check-in details.
*/
function Status({ goBack, navigate, goShop, identity, preferences, checkedInAt, pickup, couponStatus, retryCoupons, onEdit, onCancel }: { goBack: () => void; navigate: (screen: Screen) => void; goShop: (view: ShopView, transition?: "forward" | "fade", jump?: boolean) => void; identity: Identity; preferences: Preferences; checkedInAt: Date; pickup: Pickup; couponStatus: CouponStatus; retryCoupons: () => void; onEdit: () => void; onCancel: () => void }) {
  // The live region is filled after mount so screen readers announce the confirmation.
  const [announce, setAnnounce] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setAnnounce(true), 150); return () => window.clearTimeout(timer); }, []);
  return (
    <div className="page flow-page status-page">
      <AppHeader title="Check-In Details" back={goBack} />
      <main className="content flow">
        <p className="sr-only" role="status">{announce ? `You're checked in. The pharmacy team at CVS 4471 knows you're here.` : ""}</p>
        {/* EXT E27 Compact confirmation — green check + heading, with the live pickup timeline underneath */}
        <section className="checkin-summary" aria-labelledby="confirm-title">
          <div className="summary-head">
            <span className="confirm-mark" aria-hidden="true"><Icon name="check" size={18} /></span>
            <div className="stack-4">
              <h2 id="confirm-title" className="t-heading-md">{firstName(identity)} is checked in</h2>
              <p className="t-body c-secondary">No need to tell the counter. <b className="pickup-eta">{pickupLine(pickup)}</b></p>
            </div>
          </div>
          <PickupTimeline pickup={pickup} />
        </section>
        <section aria-labelledby="while-you-wait" className="while-you-wait">
          <SectionTitle id="while-you-wait" title="While you wait" />
          <div className="shop-cards">
            <ShopCard tone="rose" title="Buy it again" caption="Items you usually buy around now" art={<Icon name="buyAgain" size={40} />} onClick={() => goShop("low", "forward", true)} />
            <ShopCard tone="blue" title="Frequently bought" caption="Everything you've bought here" art={<Icon name="frequentlyBought" size={40} />} onClick={() => goShop("frequent", "forward", true)} />
            {couponStatus === "ready" && <ShopCard wide tone="teal" title={`${offers.length} coupons for you`} caption={`Up to $${offersTotal.toFixed(2)} off items you buy`} art={<CouponArt size={40} />} onClick={() => goShop("deals", "forward", true)} />}
          </div>
          {couponStatus === "loading" && <div className="loading-line t-body c-secondary" role="status"><Spinner size={20} />Loading your coupons…</div>}
          {couponStatus === "error" && (
            <div className="stack-12">
              <Notice type="warning" title="Coupons didn't load.">Your check-in isn't affected.</Notice>
              <Button variant="secondary" onClick={retryCoupons}>Try loading coupons again</Button>
            </div>
          )}
        </section>
        <section>
          <h2 className="t-title">Check-in details</h2>
          <CheckinDetailRows identity={identity} preferences={preferences} />
        </section>
        <DateAndLocation when={`Today, ${today()}`} whenDetail={`Checked in at ${clock(checkedInAt)}`} />
        <ThingsToKnow items={[
          "Stay in the store. This screen and the bar at the top update when your prescriptions are ready.",
          "Wait times are estimates.",
          "Bring your ID. You may be asked to confirm your date of birth at pickup.",
          "You pay at the register. The app doesn't take payment.",
        ]} />
        {/* Pharmacy Help is offered only here — CVS R7 link card (IMG_1812 "Need more help?") */}
        <section>
          <SectionTitle title="Need more help?" />
          <LinkCard title="Pharmacy Help" link="Message the pharmacy team" onClick={() => navigate("messages")} />
        </section>
      </main>
      <OptionsPanel title="Looking for other options?" body="You can update what you shared or cancel your check-in." actions={[{ label: "Edit check-in details", onClick: onEdit }, { label: "Cancel check-in", onClick: onCancel }]} />
    </div>
  );
}

/* Cancel check-in — CVS R12 alert modal with dropdown + textarea (IMG_1810, IMG_1811) */
const cancelReasons = ["I need to leave the store", "I'll come back later", "I'd rather speak at the counter", "I checked in by mistake", "Other"];
function CancelCheckinModal({ close, onConfirm }: { close: () => void; onConfirm: (reason: string) => void }) {
  const ref = useDialog<HTMLElement>(close);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="sheet-backdrop modal-backdrop fade-in" role="presentation" onClick={close}>
      <section ref={ref} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onClick={(event) => event.stopPropagation()}>
        <span className="modal-icon warning" aria-hidden="true"><Icon name="warning" size={28} /></span>
        <h2 id="cancel-title" className="t-title" data-autofocus tabIndex={-1}>Did you want to cancel your check-in?</h2>
        <p className="t-body-lg">The pharmacy team will see that you're no longer waiting. Your prescriptions stay ready for pickup.</p>
        <label className="dropdown-field">
          <span className="label">Why are you canceling?</span>
          <span className={`dropdown${reason ? " filled" : ""}`}>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="">Choose an option</option>
              {cancelReasons.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <Icon name="chevronDown" size={22} />
          </span>
        </label>
        <FormField id="cancel-note" label="Anything else you'd like us to know? (optional)" helper="500 character max" value={note} onChange={setNote} multiline />
        <Button onClick={() => onConfirm(reason)}>Cancel check-in</Button>
        <Button variant="text" size="md" onClick={close}>Keep my check-in</Button>
      </section>
    </div>
  );
}

/* Check-in canceled — IMG_1812–1814 "Visit canceled" layout */
function CheckinCanceled({ identity, canceledAt, goHome, startAgain }: { identity: Identity; canceledAt: Date; goHome: () => void; startAgain: () => void }) {
  return (
    <div className="page flow-page">
      <AppHeader variant="centered" title="Check-In Canceled" />
      <main className="content flow">
        <PageHeading size="lg" title="Consider it done — your check-in has been canceled">
          <p className="t-body-lg">The pharmacy team knows you're no longer waiting.</p>
          <p className="t-body-lg">Don't worry, your prescriptions stay ready for pickup.</p>
        </PageHeading>
        <section>
          <h2 className="t-display">Need more help?</h2>
          <div className="stack-16">
            <LinkCard title="Check in again" link="Start a new Silent Check-In" onClick={startAgain} />
            <LinkCard title="Browse the app" link="Back to home" onClick={goHome} />
          </div>
        </section>
        <section>
          <h2 className="t-title">Canceled check-in details</h2>
          <div className="avatar-row"><span className="avatar" aria-hidden="true">{initials(identity)}</span><span className="t-body-lg">{displayName(identity)}</span></div>
          <DetailRow icon="rx" title="What"><span className="t-body">Prescription pickup · 2 prescriptions</span></DetailRow>
        </section>
        <DateAndLocation when={`Today, ${today()}`} whenDetail={`Canceled at ${clock(canceledAt)}`} />
      </main>
    </div>
  );
}

const helpTopics: { topic: ChatTopic; label: string }[] = [
  { topic: "question", label: "I have a question about my medication" },
  { topic: "private", label: "I'd like to talk to a pharmacist privately" },
  { topic: "meet", label: "Where should I meet the pharmacist?" },
  { topic: "language", label: "I need language support" },
];


/* Pharmacy Help — CVS R10 heading, R27 avatar, R18 plain rows, R4 check rows, R3 button */
function Messages({ goBack, startChat, preferences, updatePreferences }: { goBack: () => void; startChat: (topic: ChatTopic) => void; preferences: Preferences; updatePreferences: (changes: Partial<Preferences>) => void }) {
  return (
    <div className="page flow-page">
      <AppHeader title="Pharmacy Help" back={goBack} />
      <main className="content flow">
        <PageHeading title="How can we help?">
          <div className="sender"><span className="avatar" aria-hidden="true">DK</span><span className="t-body-lg">Dana K. · Pharmacy team</span></div>
          <p className="t-body-lg">Message the pharmacy team in writing. A pharmacist replies here, usually within a few minutes.</p>
        </PageHeading>
        <section>
          <h2 className="t-title">What do you need?</h2>
          <div className="plain-list">{helpTopics.map(({ topic, label }) => <PlainRow key={topic} label={label} onClick={() => startChat(topic)} />)}</div>
        </section>
        <section>
          <h2 className="t-title">How we reply</h2>
          <div className="check-list">
            <CheckRow label="Reply to me in writing" checked={preferences.communication === "writing"} onChange={(checked) => updatePreferences({ communication: checked ? "writing" : "none" })} />
            <CheckRow label="Keep my conversation private" checked={preferences.privateDiscussion === "yes"} onChange={(checked) => updatePreferences({ privateDiscussion: checked ? "yes" : "no" })} />
          </div>
        </section>
        <Button onClick={() => startChat("free")}>Write my own message</Button>
      </main>
    </div>
  );
}

/* EXT E10 Pharmacy Help chat — message bubbles and composer (no chat UI in the references); reuses R27 avatar, R26 field geometry, E9 language field */
function Chat({ goBack, messages, topic, typing, send, shareLanguage, preferences }: { goBack: () => void; messages: ChatMessage[]; topic: ChatTopic; typing: boolean; send: (text: string) => void; shareLanguage: (language: string, other: string) => void; preferences: Preferences }) {
  const [draft, setDraft] = useState("");
  const [language, setLanguage] = useState({ language: "", other: "" });
  const [languageError, setLanguageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (topic === "question" || topic === "free") inputRef.current?.focus(); }, [topic]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, typing]);
  const awaitingLanguage = topic === "language" && !preferences.language;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    send(draft.trim());
    setDraft("");
  };
  const settings = [preferences.communication === "writing" && "Written replies", preferences.privateDiscussion === "yes" && "Private"].filter(Boolean).join(" · ");
  return (
    <div className="page chat-page">
      <AppHeader title="Pharmacy Help" back={goBack} />
      <main className="content flow">
        <div className="stack-8">
          <div className="sender"><span className="avatar" aria-hidden="true">DK</span><b className="t-heading-sm">Dana K. · Pharmacy</b></div>
          <p className="t-caption c-secondary">{settings ? `${settings} · ` : ""}For urgent medical help, call 911.</p>
        </div>
        <ol className="chat-log" aria-label="Conversation" aria-live="polite">
          {messages.map((message, index) => (
            <li key={index} className={message.from === "me" ? "user-bubble t-body" : "assistant-bubble t-body"}>
              <span className="sr-only">{message.from === "me" ? "You: " : "Pharmacy: "}</span>{message.text}
            </li>
          ))}
        </ol>
        {messages.some((message) => message.from === "me") && !typing && <p className="t-caption c-secondary" style={{ textAlign: "right", marginTop: -8 }}>Delivered</p>}
        {typing && <p className="t-caption c-secondary" role="status">Pharmacy is typing…</p>}
        {awaitingLanguage && (
          <div className="stack-12">
            <StaffLanguageField language={language.language} other={language.other} error={languageError} onChange={(value, other) => { setLanguageError(false); setLanguage({ language: value, other }); }} />
            <Button variant="secondary" onClick={() => { if (!language.language || (language.language === "Another language" && !language.other.trim())) { setLanguageError(true); return; } shareLanguage(language.language, language.other.trim()); }}>Share language</Button>
          </div>
        )}
        <div ref={endRef} />
      </main>
      <form className="composer" onSubmit={submit}>
        <input ref={inputRef} aria-label={topic === "question" ? "Your question" : "Message"} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={topic === "question" ? "Type your question" : "Type a message"} />
        <button type="submit" aria-label="Send message" disabled={!draft.trim()}><Icon name="send" size={22} /></button>
      </form>
    </div>
  );
}

/* EXT E33 Product packshots — the product photos the CVS app shows, on white, centred, uncropped (IMG_1765, IMG_1769, IMG_1795) */
function Packshot({ product, size = 108 }: { product: Product; size?: number }) {
  return <img className="packshot" src={product.image} alt="" width={size} height={size} />;
}

/*
  EXT E7 In-store product row — CVS R21 product list row (IMG_1765, IMG_1769) + R22 deal tag + R33 price
  + R23 aisle line (IMG_1797 "15 in stock | Aisle 10") + R3 Add button (IMG_1767) + R3 text link + E6.
  New: "In cart" state, purchase count or last-bought tag, "View shelf location".
*/
function ProductRow({ product, inCart, add, locate, showCount }: { product: Product; inCart: boolean; add: () => void; locate: () => void; showCount: boolean }) {
  return (
    <article className="product-row" aria-labelledby={`product-${product.id}`}>
      <div className="media">
        {product.coupon && <DealTag onCard={inCart}>{product.coupon}<span className="sr-only"> coupon</span></DealTag>}
        <button type="button" className="product-image" onClick={locate} tabIndex={-1} aria-hidden="true"><Packshot product={product} size={112} /></button>
      </div>
      <div className="info">
        <h3 id={`product-${product.id}`} className="t-heading-sm">{product.name}</h3>
        {showCount && product.timesBought ? <GrayTag>Bought {product.timesBought} times</GrayTag> : product.lastBought ? <GrayTag>Last bought {product.lastBought}</GrayTag> : null}
        <Price product={product} />
        <CouponState product={product} inCart={inCart} />
        <span className="stock-line">{product.aisle} | {product.shelf}</span>
        <div className="row-actions">
          <Button size="sm" variant={inCart ? "tinted" : "add"} onClick={add}>{inCart ? <><Icon name="check" size={16} />In cart</> : <><Icon name="cartPlus" size={20} />Add</>}<span className="sr-only">{inCart ? `: ${product.name}. Remove from cart` : ` to cart: ${product.name}`}</span></Button>
          <Button variant="secondary" size="sm" onClick={locate}><Icon name="pin" size={18} />Shelf location<span className="sr-only"> for {product.name}</span></Button>
        </div>
      </div>
    </article>
  );
}


/* CVS R43 coupon artwork — yellow receipt with a blue "$" coin (IMG_1816, IMG_1817). Redrawn approximation. */
function CouponArt({ size = 56 }: { size?: number }) {
  return (
    <svg className="coupon-art-svg" width={size} height={size * 1.2} viewBox="0 0 60 72" aria-hidden="true">
      <path d="M12 3h36a6 6 0 0 1 6 6v54H18a6 6 0 0 1-6-6V3Z" fill="#F7C326" stroke="#1A1A19" strokeWidth="3" strokeLinejoin="round" />
      <path d="M4 9a6 6 0 0 1 12 0v5H4V9Z" fill="#8A5A2B" stroke="#1A1A19" strokeWidth="3" strokeLinejoin="round" />
      <path d="M25 18h21M25 26h21M25 34h13" stroke="#1A1A19" strokeWidth="3" strokeLinecap="round" />
      <circle cx="17" cy="58" r="11" fill="#7FC6D6" stroke="#1A1A19" strokeWidth="3" />
      <path d="M20.5 53.5c-.8-1-2-1.5-3.3-1.5-1.8 0-3.2 1-3.2 2.4 0 3.4 6.8 1.8 6.8 5.4 0 1.4-1.4 2.4-3.4 2.4-1.4 0-2.8-.6-3.6-1.7M17.2 50v2m0 10.4v2" stroke="#1A1A19" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const couponExpiry = "Exp 10/31/2026"; // prototype data

/*
  CVS R43 Coupon card (IMG_1816, IMG_1817), used as in the app: coupon artwork, "New", gray "In store or online" tag,
  red amount, offer text, expiry, outline "Shop this deal", round blue "+". EXT E20 changes only the behaviour and two
  labels: the offer line adds the item's aisle, "Shop this deal" opens the item's shelf location, and the round button
  reads "Add to cart" (coupons apply when the item is in the in-store cart) instead of "Send to Card".
*/
function CouponCard({ product, inCart, add, locate }: { product: Product; inCart: boolean; add: () => void; locate: () => void }) {
  const amount = `$${saving(product).toFixed(2)}`;
  return (
    <article className="cvs-coupon" aria-labelledby={`coupon-${product.id}`}>
      <div className="coupon-main">
        <span className="coupon-art"><CouponArt /></span>
        <div className="coupon-copy">
          <span className="t-body-lg">{inCart ? "On your card" : "New"}</span>
          <GrayTag>In store or online</GrayTag>
          <b className="coupon-amount">{amount} off</b>
          <p id={`coupon-${product.id}`} className="coupon-offer">{amount} Off {product.name} ({product.aisle}, {product.shelf.toLowerCase()})</p>
        </div>
      </div>
      <p className="coupon-meta t-body">{couponExpiry}</p>
      <div className="coupon-actions">
        <Button variant="secondary" size="md" className="deal-button" onClick={locate}>Shop this deal<span className="sr-only">: show where {product.name} is</span></Button>
        <button type="button" className={`round-action${inCart ? " done" : ""}`} onClick={add} aria-label={inCart ? `Coupon for ${product.name} is on your card and the item is in your cart. Remove` : `Add ${product.name} to cart and put this coupon on your card`}>
          <span key={inCart ? "on" : "off"} className="circle" aria-hidden="true"><Icon name={inCart ? "check" : "plus"} size={22} /></span>
          <span>{inCart ? "On card" : "Add to cart"}</span>
        </button>
      </div>
    </article>
  );
}

/* Savings › Coupons — current app layout (IMG_1815–1817): "Savings" header with "Find deals" search, "Coupons" heading, All / On card / For you segmented control, Sort & refine + count, coupon cards. */
type CouponFilter = "all" | "cart" | "foryou";
type CouponSort = "recommended" | "savings" | "aisle";
function Savings({ goBack, navigate, quantities, itemCount, toggle, locate, initialFilter = "all", extraBucksSent, sendExtraBucks }: { goBack: () => void; navigate: (screen: Screen) => void; quantities: Record<number, number>; itemCount: number; toggle: (id: number) => void; locate: (product: Product) => void; initialFilter?: CouponFilter; extraBucksSent: boolean; sendExtraBucks: () => void }) {
  const [filter, setFilter] = useState<CouponFilter>(initialFilter);
  const [sort, setSort] = useState<CouponSort>("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  let list = offers.filter((product) => filter === "all" || (filter === "cart" ? !!quantities[product.id] : !!product.dueAgain));
  if (term) list = list.filter((product) => `${product.name} ${product.keywords ?? ""}`.toLowerCase().includes(term));
  if (sort === "savings") list = [...list].sort((a, b) => saving(b) - saving(a));
  if (sort === "aisle") list = [...list].sort((a, b) => Number(a.aisle.replace(/\D/g, "")) - Number(b.aisle.replace(/\D/g, "")));
  const filters: [CouponFilter, string][] = [["all", "All"], ["cart", "On card"], ["foryou", "For you"]];
  return (
    <div className={`page savings-page${itemCount ? " with-dock" : ""}`}>
      <header className="savings-head">
        <div className="bar">
          <button type="button" className="header-back" onClick={goBack} aria-label="Go back"><Icon name="back" /></button>
          <h1 className="title" tabIndex={-1}>Savings</h1>
          <button type="button" className="header-assistant" aria-label="Chat with CVS (not part of this prototype)"><Icon name="chat" size={22} /></button>
          <button type="button" className="header-round white" onClick={() => navigate("order")} aria-label={`In-store cart, ${items(itemCount)}`}><Icon name="cart" />{!!itemCount && <i className="count-badge">{itemCount}</i>}</button>
        </div>
        <div className="savings-search"><Icon name="search" size={22} /><input type="search" aria-label="Find deals" placeholder="Find deals" value={query} onChange={(event) => setQuery(event.target.value)} />{query ? <button type="button" className="clear" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={20} /></button> : <Icon name="barcode" size={22} />}</div>
      </header>
      {/* CVS ExtraCare block (IMG_1815): wordmark + View rewards, ExtraBucks Rewards card with Send to card */}
      <section className="extracare-block" aria-label="ExtraCare">
        <div className="extracare-top"><img src="shop/extracare.png" alt="ExtraCare" width={138} height={21} /><span className="view-rewards">View rewards</span></div>
        <div className="extrabucks-card">
          <span className="t-body-lg">ExtraBucks Rewards®</span>
          <div className="extrabucks-row">
            <span className="eb-figure"><b>${(extraBucksSent ? EXTRABUCKS : 0).toFixed(2)}</b><span>Total on card</span></span>
            <span className="eb-figure"><b>${(extraBucksSent ? 0 : EXTRABUCKS).toFixed(2)}</b><span>Available</span></span>
            <button type="button" className="eb-send" onClick={sendExtraBucks} disabled={extraBucksSent}>{extraBucksSent ? "Sent to card" : "Send to card"}</button>
          </div>
        </div>
      </section>
      <main className="content savings-content">
        <div className="coupons-head"><h2 className="t-title regular">Coupons</h2><span className="weekly-ad"><Icon name="doc" size={20} />Weekly Ad</span></div>
        <div className="segmented three" role="tablist" aria-label="Coupons">
          {filters.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <div className="coupons-tools">
          <Button variant="secondary" size="sm" className="sort-button" onClick={() => setSortOpen(true)}><Icon name="sliders" size={20} />Sort &amp; refine</Button>
          <span className="t-body-lg" aria-live="polite">{list.length} deals and rewards</span>
        </div>
        {list.length > 0
          ? <div className="coupon-list">{list.map((product) => <CouponCard key={product.id} product={product} inCart={!!quantities[product.id]} add={() => toggle(product.id)} locate={() => locate(product)} />)}</div>
          : <div className="empty-state"><span className="empty-circle" aria-hidden="true"><Icon name="tag" size={28} /></span><h2 className="t-heading-sm regular">{filter === "cart" ? "No coupons on your card yet" : "No deals match"}</h2><p className="t-body">{filter === "cart" ? "Add an item with a coupon and its coupon goes on your card." : "Try another word, or choose All."}</p></div>}
        <p className="t-caption c-secondary">Coupons on your card are applied when the cashier scans your checkout pass. Expiry dates are examples in this prototype.</p>
      </main>
      {itemCount > 0 && <div className="cart-dock"><Button onClick={() => navigate("order")}>Review in-store cart ({items(itemCount)})</Button></div>}
      {sortOpen && (
        <BottomSheet title="Sort & refine" close={() => setSortOpen(false)}>
          <OptionTiles<CouponSort> name="coupon-sort" label="Sort coupons" value={sort} onChange={setSort} options={[{ value: "recommended", label: "Recommended" }, { value: "savings", label: "Biggest savings" }, { value: "aisle", label: "Aisle number (walk the store in order)" }]} />
          <Button onClick={() => setSortOpen(false)}>Show {list.length} {list.length === 1 ? "deal" : "deals"}</Button>
        </BottomSheet>
      )}
    </div>
  );
}

/* CVS R44 Product card with round add-to-cart button (IMG_1787, IMG_1789, IMG_1798 "Trending Now" / "You May Also Like") */
function ProductCard({ product, add, inCart = false }: { product: Product; add: () => void; inCart?: boolean }) {
  return (
    <article className="product-card" aria-labelledby={`card-${product.id}`}>
      <div className="card-media">
        <Packshot product={product} size={128} />
        <button type="button" className="fab-add" onClick={add} aria-label={`Add ${product.name} to cart`}><Icon name="cartPlus" size={26} /></button>
      </div>
      {product.coupon && <DealTag onCard={inCart}>{product.coupon}<span className="sr-only"> coupon</span></DealTag>}
      <b className="t-heading-sm">{product.price}</b>
      <span id={`card-${product.id}`} className="t-body card-name">{product.name}</span>
      <span className="stock-line">{product.aisle}</span>
    </article>
  );
}

const viewCopy: Record<ShopView, string> = {
  low: "Items you usually buy around now, based on how often you buy them.",
  frequent: "Everything you've bought at CVS before, starting with what you buy most.",
  deals: "Coupons for items you buy. Add an item and its coupon goes on your card.",
};
const shopCategories: { name: string; image: string }[] = [
  { name: "Health & Medicine", image: "shop/cat-health-medicine.png" },
  { name: "Beauty", image: "shop/cat-beauty.png" },
  { name: "Personal Care", image: "shop/cat-personal-care.png" },
];

/*
  Shop — the current app's Shop tab (IMG_1790 header, search, location bar, "Spooky season" banner, Extra Big Deals
  promo; IMG_1792 "Shop by category"). EXT E29 adds one section at the top while the shopper is checked in:
  "Shop while you wait", with the Buy it again / Frequently bought lists. The check-in screen's two cards jump here.
*/
function Shop({ goBack, navigate, quantities, itemCount, toggle, view, setView, query, setQuery, locate, checkedIn, pickup, jump }: { goBack: () => void; navigate: (screen: Screen) => void; quantities: Record<number, number>; itemCount: number; toggle: (id: number) => void; view: ShopView; setView: (view: ShopView) => void; query: string; setQuery: (query: string) => void; locate: (product: Product) => void; checkedIn: boolean; pickup: Pickup; jump: boolean }) {
  const term = query.trim().toLowerCase();
  const results = term ? products.filter((product) => { const text = `${product.name} ${product.keywords ?? ""}`.toLowerCase(); return term.split(/\s+/).every((part) => text.includes(part)); }) : [];
  const list = view === "low" ? buyAgain : view === "deals" ? offers : frequentlyBought;
  const [expanded, setExpanded] = useState(false);
  const shown = term ? results : expanded ? list : list.slice(0, 3);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => { if (jump) sectionRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" }); }, [jump]);
  useEffect(() => { setExpanded(false); }, [view]);
  const rows = (entries: Product[]) => <div className="product-list">{entries.map((product) => <ProductRow key={product.id} product={product} showCount={!!term || view === "frequent"} inCart={!!quantities[product.id]} add={() => toggle(product.id)} locate={() => locate(product)} />)}</div>;
  return (
    <div className={`page shop-page${itemCount ? " with-dock" : ""}`}>
      <AppHeader variant="shop" title="Shop" back={goBack} cartCount={itemCount} onCart={() => navigate("order")}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search or ask a question" />
      </AppHeader>
      {/* CVS R28 Location bar (IMG_1790 "Find a location near you"); names the store once checked in */}
      <div className="location-bar"><StoreIllustration /><b className="t-heading-sm">{checkedIn ? "Shopping at CVS #4471" : "Find a location near you"}</b><Icon name="info" size={22} /></div>
      {term ? (
        <main className="content">
          {results.length > 0 && <div className="results-head"><h2 className="t-label" aria-live="polite">{`${results.length} ${results.length === 1 ? "result" : "results"} for "${query.trim()}"`}</h2></div>}
          {!results.length && (
            <div className="stack-12">
              {/* CVS R29 Empty state (IMG_1821 "Not ready to checkout?") */}
              <div className="empty-state">
                <span className="empty-circle" aria-hidden="true"><Icon name="search" size={28} /></span>
                <h2 className="t-heading-sm regular" aria-live="polite">{`No results for "${query.trim()}"`}</h2>
                <p className="t-body">Check the spelling, or try a broader word like "vitamins" or "chips". A store team member can also help you find it.</p>
              </div>
              <Button onClick={() => setQuery("")}>Clear search</Button>
            </div>
          )}
          {results.length > 0 && rows(results)}
        </main>
      ) : (
        <main className="content shop-content">
          {/* EXT E29 Shop while you wait — CVS R9 section title, R5 segmented control, R21 product rows */}
          <section ref={sectionRef} id="while-you-wait-lists" className="wait-section" aria-labelledby="wait-title">
            <div className="stack-4">
              <h2 id="wait-title" className="t-title">{checkedIn ? "Shop while you wait" : "Your CVS items"}</h2>
              <p className="t-body c-secondary">{checkedIn ? `${pickupLine(pickup)}. Every item shows its aisle in this store.` : "Items you've bought at CVS before."}</p>
            </div>
            <SegmentedControl selected={view} onSelect={setView} label="Product lists" />
            <p className="t-caption c-secondary">{viewCopy[view]}</p>
            {rows(shown)}
            {list.length > 3 && <Button variant="secondary" onClick={() => setExpanded((open) => !open)}>{expanded ? "Show fewer" : `See all ${list.length} items`}</Button>}
          </section>
          {/* CVS banner carousel (IMG_1790 "Spooky season is here!") */}
          <div className="season-banner" aria-hidden="true">
            <span className="season-line"><img src="shop/pumpkin.png" alt="" width={26} height={26} />Spooky season is here!<Icon name="chevron" size={22} /></span>
            <span className="season-dots"><i className="on" /><i /><i /></span>
          </div>
          {/* CVS promo card (IMG_1790) — opens Savings */}
          <button type="button" className="promo-card outline" onClick={() => navigate("savings")}>
            <img src="shop/extra-big-deals.png" alt="Extra extra big deals days with ExtraCare" width={370} height={159} />
            <span className="promo-body"><b className="promo-title">Last chance for double the deals!</b><span className="promo-text">So many Extra Big Deals, so little time. Ends October 10.</span></span>
          </button>
          {/* CVS R45 Shop by category (IMG_1792) */}
          <section className="category-section" aria-labelledby="category-title">
            <div className="section-title-row"><h2 id="category-title" className="t-title">Shop by category</h2><span className="see-all">See All</span></div>
            <div className="category-row" aria-hidden="true">
              {shopCategories.map((category) => <div key={category.name} className="shop-category"><img src={category.image} alt="" width={72} height={72} /><b>{category.name}</b></div>)}
            </div>
          </section>
        </main>
      )}
      {itemCount > 0 && <div className="cart-dock"><Button onClick={() => navigate("order")}>Review in-store cart ({items(itemCount)})</Button></div>}
    </div>
  );
}

const shelves: Product["shelf"][] = ["Top shelf", "Eye level", "Middle shelf", "Bottom shelf"];

/* EXT E8 Shelf location — CVS R13 bottom sheet + R8 detail rows; aisle callout and shelf diagram are new */
function Locator({ product, close }: { product: Product; close: () => void }) {
  return (
    <BottomSheet title="Shelf location" label={`Shelf location for ${product.name}`} close={close}>
      <div className="summary-product"><Packshot product={product} size={72} /><div className="body"><span className="t-body">{product.name}</span><span className="stock-line">{product.aisle} | {product.shelf}</span></div></div>
      <div className="aisle-callout"><Icon name="pin" size={28} /><div><b className="t-display">{product.aisle}</b><span className="t-label">{product.shelf} · {product.section}</span></div></div>
      <div className="shelf-map" role="img" aria-label={`Shelf diagram: ${product.shelf} highlighted`}>
        {shelves.map((shelf) => <div key={shelf} className={shelf === product.shelf ? "active" : ""}><span className="t-caption">{shelf}</span><i /></div>)}
      </div>
      <div>
        <DetailRow title="Aisle" value={product.aisle.replace("Aisle ", "")} />
        <DetailRow title="Shelf" value={product.shelf} />
        <DetailRow title="Section" value={product.section.replace("Section ", "")} />
      </div>
      <p className="t-caption c-secondary">Section letters are on the shelf labels. A store team member can also help you find it.</p>
      <Button onClick={close}>Got it</Button>
    </BottomSheet>
  );
}

function cartTotals(quantities: Record<number, number>) {
  const chosen = products.filter((product) => quantities[product.id]);
  const subtotal = chosen.reduce((sum, product) => sum + money(product.original ?? product.price) * quantities[product.id], 0);
  const savings = chosen.reduce((sum, product) => sum + saving(product) * quantities[product.id], 0);
  const itemCount = chosen.reduce((sum, product) => sum + quantities[product.id], 0);
  const coupons = chosen.filter((product) => product.coupon).length;
  return { chosen, subtotal, savings, itemCount, coupons };
}

/* CVS R16 Order summary — white card on a warm band, rows, divider, bold total (IMG_1824, IMG_1819) */
function OrderSummary({ title, rows, total, note, children }: { title: string; rows: [string, string, string?][]; total?: [string, string]; note?: string; children?: React.ReactNode }) {
  return (
    <section className="summary-band" aria-label={title}>
      <div className="summary-card">
        <h2 className="t-heading-lg">{title}</h2>
        {rows.map(([label, value, tone]) => <div className="summary-row t-body" key={label}><span>{label}</span><span className={tone}>{value}</span></div>)}
        {total && <div className="summary-row total t-heading-sm"><span>{total[0]}</span><span>{total[1]}</span></div>}
        {note && <p className="t-caption c-secondary">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/* In-store cart — current CVS cart layout (IMG_1818–1819): R15 fulfillment header, R14 item cards, R17 bands, R16 summary */
function Order({ goBack, goShop, navigate, quantities, setQuantity, toggle, extraBucks }: { goBack: () => void; goShop: (view: ShopView) => void; navigate: (screen: Screen) => void; quantities: Record<number, number>; setQuantity: (id: number, quantity: number) => void; toggle: (id: number) => void; extraBucks: number }) {
  const { chosen, subtotal, savings, itemCount, coupons } = cartTotals(quantities);
  const available = offers.filter((product) => !quantities[product.id]);
  return (
    <div className="page cart-page">
      <AppHeader variant="cart" title="Review in-store cart" back={goBack} />
      <main>
        {/* CVS R15 Fulfillment header (IMG_1818 "Pickup") */}
        <section className="fulfillment">
          <span className="fulfil-circle" aria-hidden="true"><StoreIllustration size={36} /></span>
          <div className="body"><h2 className="t-title">In-store list</h2><span className="t-body">{items(itemCount)} to find • ${(subtotal - savings).toFixed(2)}</span><span className="t-body">CVS #4471, 4610 Centre Ave</span></div>
        </section>
        <div className="cart-items">
          {chosen.length === 0
            ? <div className="stack-12">
                <div className="empty-state"><span className="empty-circle" aria-hidden="true"><Icon name="cart" size={28} /></span><h2 className="t-heading-sm regular">Your cart is empty</h2><p className="t-body">Add items while you wait. Every item shows its aisle and shelf.</p></div>
                <Button onClick={() => goShop("frequent")}>Start shopping</Button>
              </div>
            : chosen.map((product) => (
              /* CVS R14 Cart item card + quantity stepper (IMG_1818) */
              <article className="cart-item" key={product.id}>
                <div className="top">
                  <Packshot product={product} size={72} />
                  <div className="body"><span className="t-body">{product.name}</span><span className="stock-line">{product.aisle} | {product.shelf}</span></div>
                  <span className={`t-body${product.original ? " sale-text" : ""}`}>{product.price}</span>
                </div>
                <div className="stepper">
                  <button type="button" onClick={() => setQuantity(product.id, quantities[product.id] - 1)} aria-label={quantities[product.id] === 1 ? `Remove ${product.name}` : `Decrease quantity of ${product.name}`}><Icon name="minus" size={16} /></button>
                  <span className="qty" aria-live="polite">Qty {quantities[product.id]}</span>
                  <button type="button" onClick={() => setQuantity(product.id, quantities[product.id] + 1)} aria-label={`Increase quantity of ${product.name}`}><Icon name="plus" size={16} /></button>
                  <button type="button" className="trash" onClick={() => setQuantity(product.id, 0)} aria-label={`Remove ${product.name}`}><Icon name="trash" size={20} /></button>
                </div>
                {product.coupon && <div className="item-promo"><CouponState product={product} inCart /></div>}
              </article>
            ))}
        </div>
        <div className="band" />
        {/* CVS R7 card shell with summary rows (as IMG_1819 Rewards card) */}
        <section className="cart-section">
          <div className="coupon-card">
            <h2 className="t-heading-md">Coupons</h2>
            <div className="summary-row t-body"><span>Added to this cart</span><span>{coupons} · −${savings.toFixed(2)}</span></div>
            <div className="summary-row t-body"><span>Available for other items</span><span>{available.length}</span></div>
            <p className="t-caption c-secondary">Coupons on your card are applied when the cashier scans your checkout pass.</p>
            {available.length > 0 && <Button variant="secondary" onClick={() => navigate("savings")}>Add other items with coupons</Button>}
          </div>
        </section>
        {/* CVS R44 product cards in a horizontal carousel (IMG_1789 "Trending Now", IMG_1798 "You May Also Like") */}
        {available.length > 0 && (
          <section className="cart-section carousel-section" aria-labelledby="coupon-carousel">
            <h2 id="coupon-carousel" className="t-heading-lg">Items with coupons for you</h2>
            <div className="product-carousel">{available.map((product) => <ProductCard key={product.id} product={product} add={() => toggle(product.id)} />)}</div>
          </section>
        )}
        <OrderSummary
          title="Order summary"
          rows={[[`Store items (${items(itemCount)})`, `$${subtotal.toFixed(2)}`], ["Coupons", `−$${savings.toFixed(2)}`, "sale-text"], ...(extraBucks > 0 ? [["ExtraBucks Rewards", `−$${extraBucks.toFixed(2)}`, "sale-text"] as [string, string, string]] : []), ["Prescription copay", "$10.00"]]}
          total={["Estimated total at register", `$${Math.max(0, subtotal - savings - extraBucks + 10).toFixed(2)}`]}
          note="Nothing is charged in the app. Tax and final prices are calculated at the register."
        >
          {/* The one way to the code: add items › Review in-store cart › Get checkout pass */}
          <Button disabled={!chosen.length} onClick={() => navigate("ready")}>Get checkout pass</Button>
        </OrderSummary>
      </main>
    </div>
  );
}

/* Checkout pass (opened only from Review in-store cart) — CVS R1 cart header, R10 heading, EXT E11 pass card, R8 rows, R19 step circles, R11 info notice */
function SavingsPass({ goBack, navigate, quantities, identity, extraBucks }: { goBack: () => void; navigate: (screen: Screen) => void; quantities: Record<number, number>; identity: Identity; extraBucks: number }) {
  const { savings, itemCount, coupons } = cartTotals(quantities);
  const qrCells = Array.from({ length: 81 }, (_, index) => ((index * 7 + index % 4) % 5 < 2 || [0, 1, 2, 9, 11, 18, 19, 20, 60, 61, 62, 69, 71, 78, 79, 80].includes(index)));
  const steps = ["Bring your items to the pharmacy or front register", "Show this code before the cashier totals your purchase", "Pay at the register and collect your prescriptions"];
  return (
    <div className="page">
      <AppHeader variant="cart" title="Checkout pass" back={goBack} />
      <main className="content">
        <PageHeading title="Show this code when you pay">
          <p className="t-body">This code is your ExtraCare card. At the register, show it to the cashier before they total your purchase, or scan it at self-checkout. Scanning it adds your {coupons} {coupons === 1 ? "coupon" : "coupons"} to this purchase.</p>
        </PageHeading>
        {/* EXT E11 Checkout pass card — CVS R7 card shell; QR and ExtraCare branding row are new */}
        <article className="pass-card">
          <div className="brand-row"><b className="t-heading-sm" style={{ color: "var(--brand-red)" }}>CVS<span style={{ color: "var(--text-primary)", marginLeft: 4 }}>Health</span></b><span className="t-micro c-secondary">EXTRACARE</span></div>
          <div className="qr-code" role="img" aria-label="ExtraCare card QR code for the cashier to scan">{qrCells.map((filled, index) => <i className={filled ? "filled" : ""} key={index} />)}</div>
          <div className="stack-4"><b className="t-heading-sm">{displayName(identity)}</b><span className="t-caption c-secondary">ExtraCare ending in 1842</span></div>
        </article>
        <div>
          <DetailRow icon="tag" title="Coupons to apply" value={`${coupons} · −$${savings.toFixed(2)}`} />
          {extraBucks > 0 && <DetailRow icon="tag" title="ExtraBucks Rewards on card" value={`−$${extraBucks.toFixed(2)}`} />}
          <DetailRow icon="cart" title="Store items to pay for" value={`${itemCount}`} />
          <DetailRow icon="rx" title="Prescriptions to pick up" value="2" />
        </div>
        <section>
          <SectionTitle title="At the register" />
          <ol className="step-list">{steps.map((step, index) => <li key={step}><span className="step-circle" aria-hidden="true">{index + 1}</span><span className="t-body">{step}</span></li>)}</ol>
        </section>
        <Notice>You pay at the register. The app doesn't take payment.</Notice>
        <Button onClick={() => navigate("done")}>I've finished at the register</Button>
      </main>
    </div>
  );
}

/* Visit complete — CVS confirmation layout (ScreenRecording 11-33-18 "Visit Details"), R16 summary, EXT E12 rating */
function Done({ finish, quantities, extraBucks }: { finish: () => void; quantities: Record<number, number>; extraBucks: number }) {
  const { savings, itemCount, coupons } = cartTotals(quantities);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="page">
      <AppHeader title="Silent Check-In" />
      <main className="content">
        <section className="checkin-confirmation">
          <span className="confirm-mark" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round"><path d="M3.33 8L6.67 11.33L12.67 4.67" /></svg></span>
          <PageHeading title="Visit complete" divider={false}>
            <p className="t-body">You marked your visit as finished. Your receipt comes from the register.</p>
          </PageHeading>
        </section>
        <div className="summary-card bordered">
          <h2 className="t-heading-lg">Your visit</h2>
          <div className="summary-row t-body"><span>Store items on your list</span><span>{itemCount}</span></div>
          <div className="summary-row t-body"><span>Coupons on your pass</span><span>{coupons} · −${savings.toFixed(2)}</span></div>
          {extraBucks > 0 && <div className="summary-row t-body"><span>ExtraBucks Rewards</span><span>−${extraBucks.toFixed(2)}</span></div>}
          <div className="summary-row t-body"><span>Prescriptions</span><span>2</span></div>
        </div>
        {/* EXT E12 Rating input — star style from the current app's product ratings (IMG_1765) */}
        <div className="rating-card">
          <b className="t-heading-md" id="rating-label">How was Silent Check-in?</b>
          {submitted ? (
            <>
              <Notice type="success" title="Thanks for your feedback." role="status">You rated Silent Check-in {rating} out of 5.</Notice>
              <Button variant="text" size="sm" className="align-start" onClick={() => setSubmitted(false)}>Change rating</Button>
            </>
          ) : (
            <>
              <div className="rating-input" role="radiogroup" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className={star <= rating ? "filled" : ""}>
                    <input type="radio" name="rating" value={star} checked={rating === star} onChange={() => setRating(star)} aria-label={`${star} of 5 stars`} />
                    <svg width="34" height="34" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 .8 8.9 4.9l4.4.6-3.2 3.1.8 4.4L7 10.9 3.1 13l.8-4.4L.7 5.5l4.4-.6L7 .8Z" fill={star <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="0.66" strokeLinejoin="round" /></svg>
                  </label>
                ))}
              </div>
              <p className="t-caption c-secondary">{rating ? `${rating} of 5 stars selected` : "Select 1 to 5 stars"}</p>
              <Button variant="secondary" disabled={!rating} onClick={() => setSubmitted(true)}>Submit rating</Button>
            </>
          )}
        </div>
        <Button onClick={finish}>Back to home</Button>
      </main>
    </div>
  );
}

/*
  CVS "Scan in store" floating button (ScreenRecording 11-28-01: Home and Shop). Same gradient pill, icon,
  position above the tab bar, collapse to an icon-only circle on scroll down, and the white light that sweeps
  across it three times when a screen opens, as in the current app.
  EXT E31: a supporting savings tracker, not a checkout path. Once coupons are on the card, the
  label shows what they save ("Saving $7.50"); the amount counts up and the light sweeps once when a coupon is
  added. Tapping it opens Savings (All coupons, or On card once coupons are saving). The collapsed circle carries
  the coupon count in the CVS red count badge. It never opens the checkout code; paying always goes through
  Review in-store cart › Get checkout pass.
*/
function useCountUp(target: number, paused: boolean) {
  const [value, setValue] = useState(target);
  const [pulse, setPulse] = useState(0);
  const current = useRef(target);
  useEffect(() => {
    if (paused || target === current.current) return;
    const from = current.current;
    if (target > from) setPulse((count) => count + 1);
    if (reduceMotion()) { current.current = target; setValue(target); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      current.current = t < 1 ? from + (target - from) * (1 - Math.pow(1 - t, 3)) : target;
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, paused]);
  return { value, pulse };
}

function ScanInStoreButton({ screen, quantities, extraBucks, raised, paused, onOpen }: { screen: Screen; quantities: Record<number, number>; extraBucks: number; raised: boolean; paused: boolean; onOpen: (saving: boolean) => void }) {
  const { savings: couponSavings, coupons } = cartTotals(quantities);
  // Everything that will come off at the register: coupons on the card plus ExtraBucks sent to the card
  const savings = couponSavings + extraBucks;
  const onCard = coupons + (extraBucks > 0 ? 1 : 0);
  const showSavings = savings > 0;
  const { value, pulse } = useCountUp(savings, paused);
  const [collapsed, setCollapsed] = useState(false);
  const [sheen, setSheen] = useState({ id: 0, times: 3 });
  const lastTop = useRef(0);
  useEffect(() => { setSheen((current) => ({ id: current.id + 1, times: 3 })); }, [screen]);
  // When savings go up, the button opens back up (even if scrolled into its icon-only state) so the count-up is seen
  useEffect(() => { if (pulse > 0) { setCollapsed(false); setSheen((current) => ({ id: current.id + 1, times: 1 })); } }, [pulse]);

  // Collapse on scroll down, expand on scroll up. Listens in the capture phase so it covers the window (Shop, Savings) and the Home page's own scroller.
  useEffect(() => {
    setCollapsed(false);
    lastTop.current = 0;
    const onScroll = (event: Event) => {
      const target = event.target;
      const top = target instanceof HTMLElement ? target.scrollTop : window.scrollY;
      if (Math.abs(top - lastTop.current) < 6) return;
      setCollapsed(top > 24 && top > lastTop.current);
      lastTop.current = top;
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [screen]);

  // The label switches once the amount starts counting, so it never reads "$0.00" while the cart sheet is open.
  const tracking = showSavings && value >= 0.005;
  const label = tracking ? `Saving $${value.toFixed(2)}` : "Scan in store";
  const accessibleLabel = showSavings ? `Saving $${savings.toFixed(2)} with ${onCard} ${onCard === 1 ? "saving" : "savings"} on your card. Opens your coupons.` : "Scan in store. Opens your coupons.";
  return (
    <button type="button" key={`scan-${pulse}`} className={`scan-store${collapsed ? " collapsed" : ""}${raised ? " raised" : ""}${pulse > 0 ? " caught" : ""}`} onClick={() => onOpen(coupons > 0)} aria-label={accessibleLabel}>
      <span className="scan-sheen-clip" aria-hidden="true"><span key={sheen.id} className="scan-sheen" style={{ animationIterationCount: sheen.times }} /></span>
      <Icon name="scanStore" size={24} />
      <span className="scan-label" aria-hidden="true">{label}</span>
      {showSavings && collapsed && <i className="count-badge" aria-hidden="true">{onCard}</i>}
    </button>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [navHistory, setNavHistory] = useState<Screen[]>([]);
  const [slideDir, setSlideDir] = useState<"forward" | "back" | "fade">("forward");
  const [navKey, setNavKey] = useState(0);
  // Check-in
  const [identity, setIdentity] = useState<Identity>(emptyIdentity);
  const [draft, setDraft] = useState<Preferences>(emptyPreferences);
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState(() => new Date());
  const [editing, setEditing] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [checkinFailed, setCheckinFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<"pickup" | "private" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceledAt, setCanceledAt] = useState(() => new Date());
  const failCheckinNext = useRef(checkinMode === "error");
  // Shop
  const [shopView, setShopView] = useState<ShopView>("low");
  const [shopJump, setShopJump] = useState(false);
  const [savingsFilter, setSavingsFilter] = useState<CouponFilter>("all");
  const [extraBucks, setExtraBucks] = useState(0);
  const [query, setQuery] = useState("");
  const [locator, setLocator] = useState<Product | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cartSheet, setCartSheet] = useState<Product | null>(null);
  // Pharmacy Help chat
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatTopic, setChatTopic] = useState<ChatTopic>("free");
  const [typing, setTyping] = useState(false);
  // Coupons offered on the check-in screen
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("loading");
  const failNext = useRef(false);

  const pickup = usePickup(checkedIn, checkedInAt);
  // Savings opens on "On card" only when reached from the savings tracker button; any other way in shows All.
  useEffect(() => { if (screen !== "savings") setSavingsFilter("all"); }, [screen]);
  const itemCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = products.reduce((sum, product) => sum + (quantities[product.id] ? money(product.price) * quantities[product.id] : 0), 0);
  const overlayOpen = !!locator || !!cartSheet || !!sheet || cancelOpen || loading;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  const navigate = (next: Screen, transition: "forward" | "fade" = "forward") => {
    setSlideDir(transition);
    setNavHistory((h) => [...h, screen]);
    setNavKey((k) => k + 1);
    setScreen(next);
    scrollTop();
  };
  // Replace the history (used after check-in, cancel and visit end so Back doesn't return into a finished flow)
  const navigateFresh = (next: Screen, base: Screen[] = ["home"]) => {
    setSlideDir("forward");
    setNavHistory(base);
    setNavKey((k) => k + 1);
    setScreen(next);
    scrollTop();
  };
  const goBack = () => {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setSlideDir("back");
    setNavKey((k) => k + 1);
    setNavHistory((h) => h.slice(0, -1));
    setScreen(prev);
    scrollTop();
  };
  const goHome = () => {
    setSlideDir("back");
    setNavKey((k) => k + 1);
    setNavHistory([]);
    setScreen("home");
    setEditing(false);
    setReturnToReview(false);
    scrollTop();
  };
  const goShop = (view: ShopView, transition: "forward" | "fade" = "forward", jump = false) => {
    setShopView(view);
    setShopJump(jump);
    setQuery("");
    navigate("shop", transition);
  };
  const updateDraft = (changes: Partial<Preferences>) => setDraft((current) => ({ ...current, ...changes }));

  const setQuantity = (id: number, quantity: number) => {
    setQuantities((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[id]; else next[id] = quantity;
      return next;
    });
  };
  const toggle = (id: number) => {
    const isRemoving = !!quantities[id];
    setQuantity(id, isRemoving ? 0 : 1);
    if (!isRemoving) setCartSheet(products.find((product) => product.id === id) ?? null);
  };

  // Simulated coupon request. ?coupons=error fails the first request of each check-in; ?coupons=none returns no offers.
  const loadCoupons = () => {
    setCouponStatus("loading");
    window.setTimeout(() => {
      if (failNext.current) { failNext.current = false; setCouponStatus("error"); return; }
      setCouponStatus(couponMode === "none" ? "none" : "ready");
    }, 700);
  };

  // Check-in flow navigation
  const startCheckin = () => {
    setSheet(null);
    if (checkedIn) { navigate("status"); return; }
    setDraft(emptyPreferences);
    setEditing(false);
    setReturnToReview(false);
    setCheckinFailed(false);
    navigate("identity");
  };
  const confirmIdentity = (next: Identity) => {
    setIdentity(next);
    if (returnToReview) { setReturnToReview(false); goBack(); return; }
    // Simulated identity lookup — the current app shows its loading dialog here (IMG_1809)
    setLoading(true);
    window.setTimeout(() => { setLoading(false); navigate("questions"); }, 800);
  };
  const stepNext = (next: Screen) => {
    if (returnToReview) { setReturnToReview(false); goBack(); return; }
    navigate(next);
  };
  const editFromReview = (step: Screen) => { setReturnToReview(true); navigate(step); };
  const editCheckin = () => { setDraft(preferences); setEditing(true); setReturnToReview(false); navigate("review"); };

  // Check-in request (simulated). Coupons are requested in parallel so they are ready on the check-in screen.
  const submitCheckin = () => {
    if (editing) { setPreferences(draft); setEditing(false); goBack(); return; }
    if (loading) return;
    setLoading(true);
    failNext.current = couponMode === "error";
    loadCoupons();
    window.setTimeout(() => {
      setLoading(false);
      if (failCheckinNext.current) { failCheckinNext.current = false; setCheckinFailed(true); scrollTop(); return; }
      setCheckinFailed(false);
      setPreferences(draft);
      setCheckedIn(true);
      setCheckedInAt(new Date());
      navigateFresh("status");
    }, 900);
  };

  const cancelCheckin = () => {
    setCancelOpen(false);
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setCheckedIn(false); setCouponStatus("loading"); setChat([]);
      setCanceledAt(new Date());
      navigateFresh("canceled");
    }, 700);
  };

  // Pharmacy Help (simulated replies)
  const reply = (text: string) => {
    setTyping(true);
    window.setTimeout(() => { setTyping(false); setChat((current) => [...current, { from: "pharmacy", text }]); }, 1500);
  };
  const startChat = (topic: ChatTopic) => {
    setChatTopic(topic);
    const opening: ChatMessage[] = chat.length || preferences.question !== "yes" ? [] : [
      { from: "me", text: preferences.questionText.trim() || "I have a question for the pharmacist." },
      { from: "pharmacy", text: "We received the question you shared at check-in. A pharmacist will reply here." },
    ];
    const add = (messages: ChatMessage[]) => setChat((current) => [...current, ...opening, ...messages]);
    if (topic === "question") add([{ from: "pharmacy", text: opening.length ? "Do you have another question? Type it below and a pharmacist will reply here in writing." : "What's your question? Type it below and a pharmacist will reply here in writing." }]);
    if (topic === "private") { add([{ from: "me", text: "I'd like to talk to a pharmacist privately." }]); setPreferences((current) => ({ ...current, privateDiscussion: "yes" })); reply("Of course. When you're called, a pharmacist will meet you at the private consultation area next to the pickup counter."); }
    if (topic === "meet") { add([{ from: "me", text: "Where should I meet the pharmacist?" }]); reply("Please wait near the pharmacy seating area. We'll message you here when it's your turn."); }
    if (topic === "language") add(preferences.languageSupport === "yes" && preferences.language
      ? [{ from: "me", text: `I need language support: ${languageLabel(preferences)}.` }, { from: "pharmacy", text: `We have your request for ${languageLabel(preferences)}. We'll try to arrange a team member or a phone or video interpreter.` }]
      : [{ from: "pharmacy", text: "Which language would you like to use with our team?" }]);
    if (topic === "free" && opening.length) add([]);
    navigate("chat");
  };
  const sendChat = (text: string) => {
    setChat((current) => [...current, { from: "me", text }]);
    reply(chatTopic === "question" || text.includes("?") ? "Thanks for your question. A pharmacist will reply here in writing in a few minutes." : "Thanks, we got your message. A team member will reply here shortly.");
  };
  const shareChatLanguage = (language: string, other: string) => {
    const next: Preferences = { ...preferences, languageSupport: "yes", language, otherLanguage: other };
    setPreferences(next);
    setChat((current) => [...current, { from: "me", text: `I need language support: ${languageLabel(next)}.` }]);
    reply(`Thanks. We'll try to arrange help in ${languageLabel(next)}. If no one is available in person, we may use a phone or video interpreter.`);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 10 && dy < 40 && touchStartX.current < 40) isSwiping.current = true;
  };
  const handleTouchEnd = () => {
    if (isSwiping.current && navHistory.length > 0 && !overlayOpen) goBack();
    isSwiping.current = false;
  };

  const exitFlow = () => { setReturnToReview(false); setEditing(false); goHome(); };
  const pharmacyTarget: Screen = checkedIn ? "status" : "visit";

  const current = screen === "home"
    ? <Home navigate={navigate} cartCount={itemCount} checkedIn={checkedIn} pickup={pickup} />
    : screen === "visit"
    ? <PickupChecklist identity={identity} onStart={startCheckin} onDetails={() => setSheet("pickup")} goHome={goHome} />
    : screen === "identity"
    ? <ConfirmIdentity initial={identity} onBack={() => { setReturnToReview(false); goBack(); }} onNext={confirmIdentity} goHome={exitFlow} />
    : screen === "questions"
    ? <QuestionsStep draft={draft} update={updateDraft} identity={identity} onBack={() => { setReturnToReview(false); goBack(); }} onNext={() => stepNext("communication")} goHome={exitFlow} openPrivateInfo={() => setSheet("private")} returning={returnToReview} />
    : screen === "communication"
    ? <CommunicationStep draft={draft} update={updateDraft} onBack={() => { setReturnToReview(false); goBack(); }} onNext={() => stepNext("review")} goHome={exitFlow} returning={returnToReview} />
    : screen === "review"
    ? <ReviewCheckin identity={identity} draft={draft} editing={editing} failed={checkinFailed} busy={loading} onBack={() => { setEditing(false); goBack(); }} onEdit={editFromReview} onSubmit={submitCheckin} goHome={exitFlow} />
    : screen === "status"
    ? <Status goBack={goHome} navigate={navigate} goShop={goShop} identity={identity} preferences={preferences} checkedInAt={checkedInAt} pickup={pickup} couponStatus={couponStatus} retryCoupons={loadCoupons} onEdit={editCheckin} onCancel={() => setCancelOpen(true)} />
    : screen === "canceled"
    ? <CheckinCanceled identity={identity} canceledAt={canceledAt} goHome={goHome} startAgain={() => { navigateFresh("visit"); }} />
    : screen === "messages"
    ? <Messages goBack={goBack} startChat={startChat} preferences={preferences} updatePreferences={(changes) => setPreferences((existing) => ({ ...existing, ...changes }))} />
    : screen === "chat"
    ? <Chat goBack={goBack} messages={chat} topic={chatTopic} typing={typing} send={sendChat} shareLanguage={shareChatLanguage} preferences={preferences} />
    : screen === "shop"
    ? <Shop goBack={goBack} navigate={navigate} quantities={quantities} itemCount={itemCount} toggle={toggle} view={shopView} setView={setShopView} query={query} setQuery={setQuery} locate={setLocator} checkedIn={checkedIn} pickup={pickup} jump={shopJump} />
    : screen === "savings"
    ? <Savings goBack={goBack} navigate={navigate} quantities={quantities} itemCount={itemCount} toggle={toggle} locate={setLocator} initialFilter={savingsFilter} extraBucksSent={extraBucks > 0} sendExtraBucks={() => setExtraBucks(EXTRABUCKS)} />
    : screen === "order"
    ? <Order goBack={goBack} goShop={goShop} navigate={navigate} quantities={quantities} setQuantity={setQuantity} toggle={toggle} extraBucks={extraBucks} />
    : screen === "ready"
    ? <SavingsPass goBack={goBack} navigate={navigate} quantities={quantities} identity={identity} extraBucks={extraBucks} />
    : <Done quantities={quantities} extraBucks={extraBucks} finish={() => {
        // The visit is over: clear this check-in session so the next check-in starts fresh.
        setCheckedIn(false); setPreferences(emptyPreferences); setDraft(emptyPreferences); setIdentity(emptyIdentity); setQuantities({}); setExtraBucks(0); setChat([]); setCheckinFailed(false); setCouponStatus("loading");
        goHome();
      }} />;

  // Tab bars follow the current app: global bar on Home, Shop-area bar in Shop; none in task flows, details pages, cart and checkout (IMG_1799, IMG_1804, IMG_1818).
  const tabBar = screen === "home"
    ? <GlobalTabBar active="home" navigate={navigate} goShop={goShop} pharmacyTarget={pharmacyTarget} />
    : screen === "shop" || screen === "savings"
    ? <ShopTabBar active={screen === "savings" ? "savings" : "shop"} navigate={navigate} goShop={goShop} />
    : null;

  return (
    <div
      className={`app-shell${checkedIn && screen !== "done" ? " checked-in" : ""}${screen === "home" ? " home-page-active" : ""}${tabBar ? " has-tab-bar" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="app-frame" inert={overlayOpen}>
        <PhoneStatus pickup={!checkedIn || screen === "done" ? null : pickup} />
        <div key={navKey} className={`app-screen screen-${slideDir === "fade" ? "fade" : slideDir === "forward" ? "slide-forward" : "slide-back"}`}>
          {current}
        </div>
        {tabBar}
        {tabBar && (
          <ScanInStoreButton
            screen={screen}
            extraBucks={extraBucks}
            quantities={quantities}
            raised={screen !== "home" && itemCount > 0}
            paused={overlayOpen}
            onOpen={(saving) => { setSavingsFilter(saving ? "cart" : "all"); navigate("savings"); }}
          />
        )}
      </div>
      {sheet === "pickup" && <PickupDetailsSheet identity={identity} close={() => setSheet(null)} onStart={startCheckin} />}
      {sheet === "private" && <PrivateInfoSheet close={() => setSheet(null)} />}
      {cancelOpen && <CancelCheckinModal close={() => setCancelOpen(false)} onConfirm={cancelCheckin} />}
      {loading && <LoadingDialog />}
      {locator && <Locator product={locator} close={() => setLocator(null)} />}
      {cartSheet && (
        <CartAddedSheet
          product={cartSheet}
          cartCount={itemCount}
          subtotal={subtotal}
          onViewCart={() => { setCartSheet(null); navigate("order"); }}
          onContinue={() => setCartSheet(null)}
        />
      )}
    </div>
  );
}
