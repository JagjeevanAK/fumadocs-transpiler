import * as fs from "fs-extra";
import * as path from "path";
import { glob } from "glob";
import matter from "gray-matter";
import { FileProcessingResult, TranspilerConfig } from "./types";

export class FileHandler {
  private config: TranspilerConfig;

  constructor(config: TranspilerConfig) {
    this.config = config;
  }

  /**
   * Find all markdown files in a directory
   */
  public async findMarkdownFiles(inputPath: string): Promise<string[]> {
    const stats = await fs.stat(inputPath);

    if (stats.isFile()) {
      if (this.isMarkdownFile(inputPath)) {
        return [inputPath];
      }
      return [];
    }

    // Use glob to find all .md files recursively
    const pattern = path.join(inputPath, "**/*.md");
    const files = await glob(pattern, {
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
      absolute: true,
    });

    return files;
  }

  /**
   * Read a markdown file with frontmatter support
   */
  public async readMarkdownFile(
    filePath: string
  ): Promise<{ content: string; frontmatter: any; originalContent: string }> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsed = matter(fileContent);

      return {
        content: parsed.content,
        frontmatter: parsed.data,
        originalContent: fileContent,
      };
    } catch (error) {
      throw new Error(
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Write transformed content to output file
   */
  public async writeTransformedFile(
    inputPath: string,
    outputPath: string,
    transformedContent: string,
    imports: Set<string>,
    frontmatter: any,
    dryRun: boolean = false
  ): Promise<FileProcessingResult> {
    try {
      // Generate final content with imports and frontmatter
      const finalContent = this.generateFinalContent(
        transformedContent,
        imports,
        frontmatter
      );

      if (dryRun) {
        console.log(`[DRY RUN] Would write to: ${outputPath}`);
        console.log("Content preview:");
        console.log(finalContent.substring(0, 200) + "...");
        return {
          inputPath,
          outputPath,
          success: true,
          errors: [],
        };
      }

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Backup original file if requested
      if (this.config.backupOriginal && inputPath === outputPath) {
        const backupPath = `${inputPath}.backup`;
        await fs.copy(inputPath, backupPath);
      }

      // Write the transformed file
      await fs.writeFile(outputPath, finalContent, "utf-8");

      return {
        inputPath,
        outputPath,
        success: true,
        errors: [],
      };
    } catch (error) {
      return {
        inputPath,
        outputPath,
        success: false,
        errors: [
          {
            message: `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
            line: 0,
            type: "error",
          },
        ],
      };
    }
  }

  /**
   * Generate output file path
   */
  public generateOutputPath(
    inputPath: string,
    inputDir: string,
    outputDir?: string
  ): string {
    if (!outputDir) {
      // In-place transformation
      const dir = path.dirname(inputPath);
      const name = path.basename(inputPath, ".md");
      return path.join(dir, `${name}${this.config.outputExtension}`);
    }

    // Transform to output directory
    const relativePath = path.relative(inputDir, inputPath);
    const dir = path.dirname(relativePath);
    const name = path.basename(relativePath, ".md");
    return path.join(outputDir, dir, `${name}${this.config.outputExtension}`);
  }

  /**
   * Check if file should be processed
   */
  public shouldProcessFile(filePath: string): boolean {
    // Skip if already has target extension
    if (filePath.endsWith(this.config.outputExtension)) {
      return false;
    }

    // Skip backup files
    if (filePath.endsWith(".backup")) {
      return false;
    }

    return this.isMarkdownFile(filePath);
  }

  /**
   * Create backup of original file
   */
  public async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.copy(filePath, backupPath);
    return backupPath;
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(
    originalPath: string,
    backupPath: string
  ): Promise<void> {
    await fs.copy(backupPath, originalPath);
    await fs.remove(backupPath);
  }

  /**
   * Clean up backup files
   */
  public async cleanupBackups(directory: string): Promise<void> {
    const backupPattern = path.join(directory, "**/*.backup.*");
    const backupFiles = await glob(backupPattern);

    for (const backupFile of backupFiles) {
      await fs.remove(backupFile);
    }
  }

  /**
   * Get file stats for comparison
   */
  public async getFileStats(
    filePath: string
  ): Promise<{ size: number; mtime: Date } | null> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if path is a markdown file
   */
  private isMarkdownFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".md" || ext === ".markdown";
  }

  /**
   * Generate final file content with imports and frontmatter
   */
  private generateFinalContent(
    content: string,
    imports: Set<string>,
    frontmatter: any
  ): string {
    let result = "";

    // Add frontmatter if it exists
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      result += "---\n";
      result += Object.entries(frontmatter)
        .map(
          ([key, value]) =>
            `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`
        )
        .join("\n");
      result += "\n---\n\n";
    }

    // Add imports
    if (imports.size > 0) {
      result += Array.from(imports).join("\n") + "\n\n";
    }

    // Add transformed content
    result += content;

    return result;
  }

  /**
   * Validate file permissions
   */
  public async validatePermissions(
    filePath: string,
    operation: "read" | "write"
  ): Promise<boolean> {
    try {
      if (operation === "read") {
        await fs.access(filePath, fs.constants.R_OK);
      } else {
        const dir = path.dirname(filePath);
        await fs.access(dir, fs.constants.W_OK);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get relative path for display
   */
  public getRelativePath(filePath: string, basePath: string): string {
    return path.relative(basePath, filePath);
  }
}
