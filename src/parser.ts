import { AnnotationBlock, TransformError } from "./types";

export class AnnotationParser {
  private static readonly ANNOTATION_REGEX = /^:::\s+([a-zA-Z-]+)(?:\s+(.+?))?$/;
  private static readonly CLOSING_REGEX = /^:::$/;

  /**
   * Parse markdown content and extract annotation blocks
   */
  public parseAnnotations(content: string): {
    blocks: AnnotationBlock[];
    errors: TransformError[];
  } {
    const lines = content.split("\n");
    const blocks: AnnotationBlock[] = [];
    const errors: TransformError[] = [];

    let currentBlock: Partial<AnnotationBlock> | null = null;
    let blockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for opening annotation
      const openMatch = line.match(AnnotationParser.ANNOTATION_REGEX);
      if (openMatch) {
        // If we already have an open block, it's an error
        if (currentBlock) {
          errors.push({
            message: `Unclosed annotation block '${currentBlock.type}' started at line ${currentBlock.startLine}`,
            line: lineNumber,
            type: "error",
            annotation: currentBlock.type,
          });
        }

        const [, type, attributesStr] = openMatch;
        const attributes = this.parseAttributes(attributesStr || "");

        currentBlock = {
          type,
          attributes,
          startLine: lineNumber,
          originalText: line,
        };
        blockContent = [];
        continue;
      }

      // Check for closing annotation
      if (line.match(AnnotationParser.CLOSING_REGEX)) {
        if (!currentBlock) {
          errors.push({
            message: "Found closing annotation without opening block",
            line: lineNumber,
            type: "error",
          });
          continue;
        }

        // Complete the block
        const block: AnnotationBlock = {
          type: currentBlock.type!,
          content: blockContent.join("\n"),
          attributes: currentBlock.attributes!,
          startLine: currentBlock.startLine!,
          endLine: lineNumber,
          originalText:
            currentBlock.originalText! +
            "\n" +
            blockContent.join("\n") +
            "\n" +
            line,
        };

        blocks.push(block);
        currentBlock = null;
        blockContent = [];
        continue;
      }

      // If we're inside a block, collect content
      if (currentBlock) {
        blockContent.push(line);
      }
    }

    // Check for unclosed blocks
    if (currentBlock) {
      errors.push({
        message: `Unclosed annotation block '${currentBlock.type}' started at line ${currentBlock.startLine}`,
        line: currentBlock.startLine!,
        type: "error",
        annotation: currentBlock.type,
      });
    }

    return { blocks, errors };
  }

  /**
   * Parse attributes from annotation opening line
   */
  private parseAttributes(attributesStr: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    if (!attributesStr.trim()) {
      return attributes;
    }

    // Parse key="value" or key=value patterns
    const attrRegex = /(\w+)=(?:"([^"]*)"|([^\s]+))/g;
    let match;

    while ((match = attrRegex.exec(attributesStr)) !== null) {
      const [, key, quotedValue, unquotedValue] = match;
      attributes[key] = quotedValue || unquotedValue;
    }

    return attributes;
  }

  /**
   * Validate annotation syntax
   */
  public validateAnnotation(block: AnnotationBlock): TransformError[] {
    const errors: TransformError[] = [];
    const { type, content, attributes } = block;

    switch (type) {
      case "callout-info":
      case "callout-warn":
      case "callout-error":
      case "callout-note":
        if (!content.trim()) {
          errors.push({
            message: `Callout annotation '${type}' has empty content`,
            line: block.startLine,
            type: "warning",
            annotation: type,
          });
        }
        break;

      case "tabs":
        if (!this.validateTabsContent(content)) {
          errors.push({
            message:
              'Tabs annotation must have content in format "Title|Content"',
            line: block.startLine,
            type: "error",
            annotation: type,
          });
        }
        break;

      case "steps":
        if (!this.validateStepsContent(content)) {
          errors.push({
            message:
              'Steps annotation must have content in format "Step N: Description"',
            line: block.startLine,
            type: "error",
            annotation: type,
          });
        }
        break;

      case "accordion":
        if (!this.validateAccordionContent(content)) {
          errors.push({
            message:
              'Accordion annotation must have content in format "Question|Answer"',
            line: block.startLine,
            type: "error",
            annotation: type,
          });
        }
        break;

      case "code-block":
        if (!attributes.lang) {
          errors.push({
            message: 'Code block annotation requires "lang" attribute',
            line: block.startLine,
            type: "warning",
            annotation: type,
          });
        }
        break;

      case "files":
        if (!content.trim()) {
          errors.push({
            message: "Files annotation has empty content",
            line: block.startLine,
            type: "warning",
            annotation: type,
          });
        }
        break;

      case "banner":
        if (!attributes.type) {
          errors.push({
            message: 'Banner annotation requires "type" attribute',
            line: block.startLine,
            type: "warning",
            annotation: type,
          });
        }
        break;

      default:
        errors.push({
          message: `Unknown annotation type '${type}'`,
          line: block.startLine,
          type: "warning",
          annotation: type,
        });
    }

    return errors;
  }

  private validateTabsContent(content: string): boolean {
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.length > 0 && lines.every((line) => line.includes("|"));
  }

  private validateStepsContent(content: string): boolean {
    const lines = content.split("\n").filter((line) => line.trim());
    return (
      lines.length > 0 &&
      lines.every((line) => /^Step\s+\d+:/i.test(line.trim()))
    );
  }

  private validateAccordionContent(content: string): boolean {
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.length > 0 && lines.every((line) => line.includes("|"));
  }
}
