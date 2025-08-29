export interface TranspilerConfig {
  componentMappings: Record<string, string>;
  preserveOriginal: boolean;
  outputExtension: string;
  imports: string[];
  backupOriginal?: boolean;
  validateSyntax?: boolean;
  addTitle?: boolean;
}

export interface CliOptions {
  input: string;
  output?: string;
  watch?: boolean;
  config?: string;
  dryRun?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

export interface AnnotationBlock {
  type: string;
  content: string;
  attributes: Record<string, string>;
  startLine: number;
  endLine: number;
  originalText: string;
}

export interface TransformResult {
  content: string;
  imports: Set<string>;
  errors: TransformError[];
}

export interface TransformError {
  message: string;
  line: number;
  type: "warning" | "error";
  annotation?: string;
}

export interface FileProcessingResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
  errors: TransformError[];
  skipped?: boolean;
  reason?: string;
}

// Component-specific interfaces
export interface TabItem {
  title: string;
  content: string;
}

export interface StepItem {
  title: string;
  content: string;
}

export interface AccordionItem {
  title: string;
  content: string;
}

export interface FileTreeNode {
  name: string;
  children?: FileTreeNode[];
  isFile: boolean;
  level: number;
}
