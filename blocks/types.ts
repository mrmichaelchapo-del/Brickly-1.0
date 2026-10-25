export type BlockShape = "hat" | "command" | "reporter";

export type BlockCategory =
  | "Motion"
  | "Looks"
  | "Sounds"
  | "Events"
  | "Controls"
  | "Operators"
  | "Variables"
  | "Lists";

export interface BlockDefinition {
  id: string;
  name: string;
  category: BlockCategory;
  label: string;
  shape: BlockShape;
  description: string;
  args?: string[];
}

export interface BlockRuntimeResult {
  id: string;
  name: string;
  label: string;
  category: BlockCategory;
  shape: BlockShape;
  args?: unknown[];
}