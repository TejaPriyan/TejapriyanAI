export type EffortLevel = "fast" | "think" | "max" | "ultra";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageData?: string | null;
  createdAt?: string;
  pending?: boolean;
  error?: boolean;
};

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
};
