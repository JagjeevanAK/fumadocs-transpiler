import {
  AnnotationBlock,
  TransformResult,
  TransformError,
  TranspilerConfig,
  TabItem,
  StepItem,
  AccordionItem,
  FileTreeNode,
} from "./types";

export class AnnotationTransformer {
  private config: TranspilerConfig;
  private usedImports: Set<string> = new Set();

  constructor(config: TranspilerConfig) {
    this.config = config;
  }

  /**
   * Transform annotation blocks to Fuma-docs components
   */
  public transformAnnotations(
    content: string,
    blocks: AnnotationBlock[]
  ): TransformResult {
    const errors: TransformError[] = [];
    let transformedContent = content;
    this.usedImports.clear();

    // Sort blocks by start line in reverse order to avoid offset issues
    const sortedBlocks = [...blocks].sort((a, b) => b.startLine - a.startLine);

    for (const block of sortedBlocks) {
      try {
        const transformed = this.transformBlock(block);
        transformedContent = this.replaceBlockInContent(
          transformedContent,
          block,
          transformed
        );
      } catch (error) {
        errors.push({
          message: `Failed to transform ${block.type}: ${error instanceof Error ? error.message : "Unknown error"}`,
          line: block.startLine,
          type: "error",
          annotation: block.type,
        });
      }
    }

    return {
      content: transformedContent,
      imports: this.usedImports,
      errors,
    };
  }

  /**
   * Transform a single annotation block
   */
  private transformBlock(block: AnnotationBlock): string {
    const { type, content, attributes } = block;

    switch (type) {
      case "callout-info":
        return this.transformCallout(content, "info");
      case "callout-warn":
        return this.transformCallout(content, "warn");
      case "callout-error":
        return this.transformCallout(content, "error");
      case "callout-note":
        return this.transformCallout(content, "note");
      case "tabs":
        return this.transformTabs(content);
      case "steps":
        return this.transformSteps(content);
      case "accordion":
        return this.transformAccordion(content);
      case "code-block":
        return this.transformCodeBlock(content, attributes);
      case "files":
        return this.transformFiles(content);
      case "banner":
        return this.transformBanner(content, attributes);
      default:
        // Check for custom mappings
        if (this.config.componentMappings[type]) {
          return this.transformCustomComponent(content, type);
        }
        throw new Error(`Unknown annotation type: ${type}`);
    }
  }

  private transformCallout(content: string, type: string): string {
    this.usedImports.add(
      "import { Callout } from 'fumadocs-ui/components/callout';"
    );
    return `<Callout type="${type}">\n${content}\n</Callout>`;
  }

  private transformTabs(content: string): string {
    this.usedImports.add(
      "import { Tabs, Tab } from 'fumadocs-ui/components/tabs';"
    );

    const tabs = this.parseTabsContent(content);
    const tabTitles = tabs.map((tab) => `"${tab.title}"`).join(", ");

    let result = `<Tabs items={[${tabTitles}]}>\n`;
    for (const tab of tabs) {
      result += `<Tab value="${tab.title}">\n${tab.content}\n</Tab>\n`;
    }
    result += "</Tabs>";

    return result;
  }

  private transformSteps(content: string): string {
    this.usedImports.add(
      "import { Steps, Step } from 'fumadocs-ui/components/steps';"
    );

    const steps = this.parseStepsContent(content);

    let result = "<Steps>\n";
    for (const step of steps) {
      result += "<Step>\n";
      result += `## ${step.title}\n`;
      result += `${step.content}\n`;
      result += "</Step>\n";
    }
    result += "</Steps>";

    return result;
  }

  private transformAccordion(content: string): string {
    this.usedImports.add(
      "import { Accordions, Accordion } from 'fumadocs-ui/components/accordion';"
    );

    const items = this.parseAccordionContent(content);

    let result = '<Accordions type="single">\n';
    for (const item of items) {
      result += `<Accordion title="${item.title}">\n${item.content}\n</Accordion>\n`;
    }
    result += "</Accordions>";

    return result;
  }

  private transformCodeBlock(
    content: string,
    attributes: Record<string, string>
  ): string {
    this.usedImports.add(
      "import { CodeBlock } from 'fumadocs-ui/components/codeblock';"
    );

    const lang = attributes.lang || "text";
    const title = attributes.title ? ` title="${attributes.title}"` : "";

    return `<CodeBlock lang="${lang}"${title}>\n\`\`\`${lang}\n${content}\n\`\`\`\n</CodeBlock>`;
  }

  private transformFiles(content: string): string {
    this.usedImports.add(
      "import { Files, File } from 'fumadocs-ui/components/files';"
    );

    const fileTree = this.parseFilesContent(content);

    let result = "<Files>\n";
    result += this.renderFileTree(fileTree);
    result += "</Files>";

    return result;
  }

  private transformBanner(
    content: string,
    attributes: Record<string, string>
  ): string {
    this.usedImports.add(
      "import { Banner } from 'fumadocs-ui/components/banner';"
    );

    const type = attributes.type || "info";
    return `<Banner type="${type}">\n${content}\n</Banner>`;
  }

  private transformCustomComponent(content: string, type: string): string {
    const template = this.config.componentMappings[type];
    return template.replace("{{content}}", content);
  }

  // Content parsing helpers
  private parseTabsContent(content: string): TabItem[] {
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const [title, ...contentParts] = line.split("|");
      return {
        title: title.trim(),
        content: contentParts.join("|").trim(),
      };
    });
  }

  private parseStepsContent(content: string): StepItem[] {
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const match = line.match(/^Step\s+(\d+):\s*(.+)$/i);
      if (match) {
        return {
          title: `Step ${match[1]}`,
          content: match[2].trim(),
        };
      }
      return {
        title: "Step",
        content: line.trim(),
      };
    });
  }

  private parseAccordionContent(content: string): AccordionItem[] {
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      const [title, ...contentParts] = line.split("|");
      return {
        title: title.trim(),
        content: contentParts.join("|").trim(),
      };
    });
  }

  private parseFilesContent(content: string): FileTreeNode[] {
    const lines = content.split("\n").filter((line) => line.trim());
    const nodes: FileTreeNode[] = [];
    const stack: { node: FileTreeNode; level: number }[] = [];

    for (const line of lines) {
      const level = (line.match(/^\s*/)?.[0].length || 0) / 2;
      const name = line.trim();
      const isFile = !name.endsWith("/");

      const node: FileTreeNode = {
        name: name.replace(/\/$/, ""),
        children: isFile ? undefined : [],
        isFile,
        level,
      };

      // Pop stack until we find the correct parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        nodes.push(node);
      } else {
        const parent = stack[stack.length - 1].node;
        if (parent.children) {
          parent.children.push(node);
        }
      }

      if (!isFile) {
        stack.push({ node, level });
      }
    }

    return nodes;
  }

  private renderFileTree(nodes: FileTreeNode[]): string {
    let result = "";

    const renderNode = (node: FileTreeNode): string => {
      if (node.isFile) {
        return `<File name="${node.name}" />\n`;
      } else {
        let nodeResult = `<File name="${node.name}/">\n`;
        if (node.children) {
          for (const child of node.children) {
            nodeResult += renderNode(child);
          }
        }
        nodeResult += "</File>\n";
        return nodeResult;
      }
    };

    for (const node of nodes) {
      result += renderNode(node);
    }

    return result;
  }

  private replaceBlockInContent(
    content: string,
    block: AnnotationBlock,
    replacement: string
  ): string {
    const lines = content.split("\n");
    const beforeLines = lines.slice(0, block.startLine - 1);
    const afterLines = lines.slice(block.endLine);

    return [...beforeLines, replacement, ...afterLines].join("\n");
  }
}
