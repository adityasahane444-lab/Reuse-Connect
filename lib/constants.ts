export const MIN_PASSWORD_LENGTH = 6;
export const BIO_MAX = 300;
export const MESSAGE_MAX = 2000;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_BUCKET = "avatars";
export const TIME_ZONE = "Asia/Kolkata";

/** How long before a food post's expiry we alert people with an accepted pickup. */
export const EXPIRY_ALERT_WINDOW_MS = 2 * 60 * 60 * 1000;

/** Default map centre (Pune) when no listings have coordinates yet. */
export const DEFAULT_MAP_CENTER: [number, number] = [18.5204, 73.8567];

export const FOOD_CATEGORIES = ["Cooked Food", "Groceries", "Restaurant", "Events"] as const;

/** Campus/academic categories, grouped so the UI can show them together. */
export const ACADEMIC_CATEGORIES = ["Question Banks (SPPU)", "Textbooks", "Lab Equipment"] as const;

export const RESOURCE_CATEGORIES = [
  "Clothes",
  "Books",
  "Electronics",
  "Furniture",
  "Toys",
  "School Supplies",
  "Travel Gear",
  ...ACADEMIC_CATEGORIES,
  "Others",
] as const;

/** Quick-pick tags for academic listings (users can type their own too). */
export const SUGGESTED_TAGS = [
  "sppu",
  "fe",
  "se",
  "te",
  "be",
  "chemistry",
  "physics",
  "maths",
  "mechanical",
  "computer",
  "electronics",
  "civil",
  "sem-1",
  "sem-2",
  "lab-kit",
] as const;

export const EVENT_CATEGORIES = ["Tree Plantation", "Clean-up", "Donation Drive", "Workshop", "Other"] as const;

export const REPORT_REASONS = [
  "Spam or fake listing",
  "Unsafe or expired food",
  "Inappropriate content",
  "Scam or asking for money",
  "Other",
] as const;

export type ItemType = "food" | "resource";
export type ReportItemType = ItemType | "event";
export type ItemStatus = "available" | "reserved" | "completed";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";
export const ITEM_TABLE: Record<ReportItemType, string> = {
  food: "food_posts",
  resource: "resource_posts",
  event: "events",
};
