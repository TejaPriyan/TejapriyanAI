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
export type WorkspaceFile = {
  id: string;
  name: string;
  language: string;
  content: string;
  updatedAt?: number;
};

export type WorkspaceProject = {
  id: string;
  name: string;
  files: WorkspaceFile[];
  activeFileId: string | null;
};
