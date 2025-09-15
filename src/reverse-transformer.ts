import { TranspilerConfig, TransformResult, TransformError } from "./types";

export class ReverseTransformer {
  private config: TranspilerConfig;

  constructor(config: TranspilerConfig) {
    this.config = config;
  }

  /**
   * Transform MDX content back to annotated Markdown
   */
  public reverseTransform(content: string): TransformResult {
    const errors: TransformError[] = [];
    let transformedContent = content;

    try {
      // Remove imports
      transformedContent = this.removeImports(transformedContent);

      // Remove title attributes from regular markdown code blocks
      transformedContent = this.removeCodeBlockTitles(transformedContent);

      // Convert components back to annotations
      transformedContent = this.convertComponentsToAnnotations(transformedContent);

      return {
        content: transformedContent,
        imports: new Set(), // No imports needed for reverse transform
        errors,
      };
    } catch (error) {
      errors.push({
        message: `Reverse transformation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        line: 0,
        type: "error",
      });

      return {
        content,
        imports: new Set(),
        errors,
      };
    }
  }

  /**
   * Remove import statements from the content
   */
  private removeImports(content: string): string {
    const lines = content.split('\n');
    const filteredLines: string[] = [];
    let skipEmptyLines = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip import statements
      if (trimmedLine.startsWith('import ') && trimmedLine.includes('fumadocs-ui')) {
        skipEmptyLines = true;
        continue;
      }
      
      // Skip empty lines after imports
      if (skipEmptyLines && !trimmedLine) {
        continue;
      }
      
      // Once we hit non-empty content, stop skipping
      if (trimmedLine) {
        skipEmptyLines = false;
      }
      
      filteredLines.push(line);
    }

    return filteredLines.join('\n');
  }

  /**
   * Remove title attributes from regular markdown code blocks
   */
  private removeCodeBlockTitles(content: string): string {
    // Match ```lang title="title" and convert back to ```lang
    return content.replace(/```(\w+)\s+title="[^"]*"/g, '```$1');
  }

  /**
   * Convert MDX components back to annotation syntax
   */
  private convertComponentsToAnnotations(content: string): string {
    let result = content;

    // Convert Callouts
    result = this.convertCallouts(result);
    
    // Convert Tabs
    result = this.convertTabs(result);
    
    // Convert Steps
    result = this.convertSteps(result);
    
    // Convert Accordions
    result = this.convertAccordions(result);
    
    // Convert CodeBlocks
    result = this.convertCodeBlocks(result);
    
    // Convert Files
    result = this.convertFiles(result);
    
    // Convert Banners
    result = this.convertBanners(result);

    return result;
  }

  /**
   * Convert Callout components back to annotations
   */
  private convertCallouts(content: string): string {
    // Match <Callout type="info">content</Callout>
    const calloutRegex = /<Callout\s+type="([^"]+)"[^>]*>([\s\S]*?)<\/Callout>/g;
    
    return content.replace(calloutRegex, (match, type, innerContent) => {
      const cleanContent = innerContent.trim();
      return `:::callout-${type}\n${cleanContent}\n:::`;
    });
  }

  /**
   * Convert Tabs components back to annotations
   */
  private convertTabs(content: string): string {
    // Match <Tabs items={[...]}>...</Tabs>
    const tabsRegex = /<Tabs\s+items=\{(\[[^\]]+\])\}[^>]*>([\s\S]*?)<\/Tabs>/g;
    
    return content.replace(tabsRegex, (match, itemsArray, tabsContent) => {
      try {
        // Parse the items array
        const items = JSON.parse(itemsArray.replace(/'/g, '"'));
        
        // Extract Tab components
        const tabRegex = /<Tab\s+value="([^"]+)"[^>]*>([\s\S]*?)<\/Tab>/g;
        const tabs: { [key: string]: string } = {};
        
        let tabMatch;
        while ((tabMatch = tabRegex.exec(tabsContent)) !== null) {
          tabs[tabMatch[1]] = tabMatch[2].trim();
        }
        
        // Build annotation format
        let result = ':::tabs\n';
        for (const item of items) {
          if (tabs[item]) {
            result += `${item}|${tabs[item]}\n`;
          }
        }
        result += ':::';
        
        return result;
      } catch (error) {
        // If parsing fails, return original content
        return match;
      }
    });
  }

  /**
   * Convert Steps components back to annotations
   */
  private convertSteps(content: string): string {
    // Match <Steps>...</Steps>
    const stepsRegex = /<Steps[^>]*>([\s\S]*?)<\/Steps>/g;
    
    return content.replace(stepsRegex, (match, stepsContent) => {
      // Extract Step components
      const stepRegex = /<Step[^>]*>## ([^<]+)([\s\S]*?)<\/Step>/g;
      const steps: string[] = [];
      
      let stepMatch;
      while ((stepMatch = stepRegex.exec(stepsContent)) !== null) {
        const title = stepMatch[1].trim();
        const content = stepMatch[2].trim();
        steps.push(`${title}${content ? ': ' + content : ''}`);
      }
      
      if (steps.length > 0) {
        return `:::steps\n${steps.join('\n')}\n:::`;
      }
      
      return match;
    });
  }

  /**
   * Convert Accordions components back to annotations
   */
  private convertAccordions(content: string): string {
    // Match <Accordions type="single">...</Accordions>
    const accordionsRegex = /<Accordions[^>]*>([\s\S]*?)<\/Accordions>/g;
    
    return content.replace(accordionsRegex, (match, accordionsContent) => {
      // Extract Accordion components
      const accordionRegex = /<Accordion\s+title="([^"]+)"[^>]*>([\s\S]*?)<\/Accordion>/g;
      const accordions: string[] = [];
      
      let accordionMatch;
      while ((accordionMatch = accordionRegex.exec(accordionsContent)) !== null) {
        const title = accordionMatch[1].trim();
        const content = accordionMatch[2].trim();
        accordions.push(`${title}|${content}`);
      }
      
      if (accordions.length > 0) {
        return `:::accordion\n${accordions.join('\n')}\n:::`;
      }
      
      return match;
    });
  }

  /**
   * Convert CodeBlock components back to regular markdown code blocks or annotations
   */
  private convertCodeBlocks(content: string): string {
    // Match <CodeBlock lang="..." title="...">```lang\ncode\n```</CodeBlock>
    const codeBlockRegex = /<CodeBlock\s+lang="([^"]+)"(?:\s+title="([^"]+)")?\s*>([\s\S]*?)<\/CodeBlock>/g;
    
    return content.replace(codeBlockRegex, (match, lang, title, codeContent) => {
      // Extract code from markdown code block
      const codeMatch = codeContent.match(/```[^`]*\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : codeContent.trim();
      
      // For CodeBlocks that were created from regular markdown code blocks,
      // convert back to regular markdown code blocks
      // We can distinguish them by checking if they have titles that look like headings
      if (title && this.looksLikeHeadingTitle(title)) {
        // Convert back to regular markdown code block
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      } else {
        // Convert to annotation format (these were originally :::code-block annotations)
        let result = `:::code-block lang="${lang}"`;
        if (title) {
          result += ` title="${title}"`;
        }
        result += `\n${code}\n:::`;
        return result;
      }
    });
  }

  /**
   * Check if a title looks like it was extracted from a heading
   */
  private looksLikeHeadingTitle(title: string): boolean {
    // Simple heuristics to determine if this was likely extracted from a heading
    // vs being an explicit title in a :::code-block annotation
    
    // If it contains common heading words or patterns, likely from a heading
    const headingPatterns = [
      /^(Getting Started|Installation|Usage|Example|Setup|Configuration|API|Tutorial|Guide)/i,
      /^(Step \d+|Chapter \d+|Section \d+)/i,
      /^[A-Z][a-z]+ [A-Z][a-z]+/, // Title Case words
      /^[A-Z][a-z]+ (Example|Usage|Guide|Tutorial|Setup|Installation)$/i
    ];
    
    return headingPatterns.some(pattern => pattern.test(title));
  }

  /**
   * Convert Files components back to annotations
   */
  private convertFiles(content: string): string {
    // Match <Files>...</Files>
    const filesRegex = /<Files[^>]*>([\s\S]*?)<\/Files>/g;
    
    return content.replace(filesRegex, (match, filesContent) => {
      const fileStructure = this.parseFileStructure(filesContent, 0);
      return `:::files\n${fileStructure}\n:::`;
    });
  }

  /**
   * Parse nested File components to recreate file structure
   */
  private parseFileStructure(content: string, level: number): string {
    const indent = '  '.repeat(level);
    const lines: string[] = [];
    
    // Match File components
    const fileRegex = /<File\s+name="([^"]+)"(?:\s*\/>|[^>]*>([\s\S]*?)<\/File>)/g;
    
    let fileMatch;
    while ((fileMatch = fileRegex.exec(content)) !== null) {
      const name = fileMatch[1];
      const innerContent = fileMatch[2];
      
      lines.push(`${indent}${name}`);
      
      if (innerContent && innerContent.trim()) {
        // Recursively parse nested files
        const nestedStructure = this.parseFileStructure(innerContent, level + 1);
        if (nestedStructure) {
          lines.push(nestedStructure);
        }
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Convert Banner components back to annotations
   */
  private convertBanners(content: string): string {
    // Match <Banner type="info">content</Banner>
    const bannerRegex = /<Banner\s+type="([^"]+)"[^>]*>([\s\S]*?)<\/Banner>/g;
    
    return content.replace(bannerRegex, (match, type, innerContent) => {
      const cleanContent = innerContent.trim();
      return `:::banner type="${type}"\n${cleanContent}\n:::`;
    });
  }
}
