// Main exports for the fumadocs-transpiler package
export { FumadocsTranspiler } from "./transpiler";
export { AnnotationParser } from "./parser";
export { AnnotationTransformer } from "./transformer";
export { FileHandler } from "./file-handler";
export { ConfigManager } from "./config";

// Type exports
export type {
  TranspilerConfig,
  CliOptions,
  AnnotationBlock,
  TransformResult,
  TransformError,
  FileProcessingResult,
  TabItem,
  StepItem,
  AccordionItem,
  FileTreeNode,
} from "./types";

// Default configuration
export const DEFAULT_CONFIG = {
  componentMappings: {
    "callout-info": '<Callout type="info">{{content}}</Callout>',
    "callout-warn": '<Callout type="warn">{{content}}</Callout>',
    "callout-error": '<Callout type="error">{{content}}</Callout>',
    "callout-note": '<Callout type="note">{{content}}</Callout>',
  },
  preserveOriginal: false,
  outputExtension: ".mdx",
  imports: [
    "import { Callout } from 'fumadocs-ui/components/callout';",
    "import { Tabs, Tab } from 'fumadocs-ui/components/tabs';",
    "import { Steps, Step } from 'fumadocs-ui/components/steps';",
    "import { Accordions, Accordion } from 'fumadocs-ui/components/accordion';",
    "import { CodeBlock } from 'fumadocs-ui/components/codeblock';",
    "import { Files, File } from 'fumadocs-ui/components/files';",
    "import { Banner } from 'fumadocs-ui/components/banner';",
  ],
  backupOriginal: false,
  validateSyntax: true,
};

// Version
export const VERSION = "1.0.0";
