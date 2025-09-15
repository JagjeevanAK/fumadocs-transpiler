import * as path from "path";
import chalk from "chalk";
import { AnnotationParser } from "./parser";
import { AnnotationTransformer } from "./transformer";
import { ReverseTransformer } from "./reverse-transformer";
import { FileHandler } from "./file-handler";
import { ConfigManager } from "./config";
import {
  TranspilerConfig,
  CliOptions,
  FileProcessingResult,
  TransformError,
} from "./types";

export class FumadocsTranspiler {
  private parser: AnnotationParser;
  private transformer: AnnotationTransformer;
  private reverseTransformer: ReverseTransformer;
  private fileHandler: FileHandler;
  private config: TranspilerConfig;

  constructor(config: TranspilerConfig) {
    this.config = config;
    this.parser = new AnnotationParser();
    this.transformer = new AnnotationTransformer(config);
    this.reverseTransformer = new ReverseTransformer(config);
    this.fileHandler = new FileHandler(config);
  }

  /**
   * Process files based on CLI options
   */
  public async processFiles(options: CliOptions): Promise<void> {
    const startTime = Date.now();
    const mode = options.reverse ? "reverse transpiler" : "transpiler";
    console.log(chalk.blue(`Starting Fumadocs ${mode}...`));

    try {
      // Find all files (markdown or MDX based on mode)
      const files = await this.fileHandler.findMarkdownFiles(options.input, options.reverse);

      if (files.length === 0) {
        const fileType = options.reverse ? "MDX" : "markdown";
        console.log(chalk.yellow(`No ${fileType} files found`));
        return;
      }

      const fileType = options.reverse ? "MDX" : "markdown";
      console.log(chalk.green(`Found ${files.length} ${fileType} file(s)`));

      // Process files
      const results: FileProcessingResult[] = [];
      let processedCount = 0;
      let errorCount = 0;

      for (const inputFile of files) {
        if (!this.fileHandler.shouldProcessFile(inputFile, options.reverse)) {
          if (options.verbose) {
            console.log(
              chalk.gray(
              `Skipping ${this.fileHandler.getRelativePath(inputFile, options.input)}`
              )
            );
          }
          continue;
        }

        const result = options.reverse 
          ? await this.processReverseFile(inputFile, options)
          : await this.processFile(inputFile, options);
        results.push(result);

        if (result.success) {
          processedCount++;
          if (options.verbose) {
            console.log(
              chalk.green(
                `${this.fileHandler.getRelativePath(inputFile, options.input)}`
              )
            );
          }
        } else {
          errorCount++;
          console.log(
            chalk.red(
              `${this.fileHandler.getRelativePath(inputFile, options.input)}`
            )
          );
          this.printErrors(result.errors);
        }
      }

      // Print summary
      const duration = Date.now() - startTime;
      console.log(chalk.blue("\nSummary:"));
      console.log(chalk.green(`Processed: ${processedCount} files`));
      if (errorCount > 0) {
        console.log(chalk.red(`Errors: ${errorCount} files`));
      }
      console.log(chalk.gray(`Duration: ${duration}ms`));

      if (options.dryRun) {
        console.log(
          chalk.yellow(
            "\n🔍 This was a dry run - no files were actually modified"
          )
        );
      }
    } catch (error) {
      console.error(
        chalk.red("Fatal error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  }

  /**
   * Process a single file
   */
  public async processFile(
    inputPath: string,
    options: CliOptions
  ): Promise<FileProcessingResult> {
    try {
      // Read the file
      const { content, frontmatter } =
        await this.fileHandler.readMarkdownFile(inputPath);

      // Parse annotations
      const { blocks, errors: parseErrors } =
        this.parser.parseAnnotations(content);

      // Validate annotations if enabled
      const validationErrors: TransformError[] = [];
      if (this.config.validateSyntax) {
        for (const block of blocks) {
          const blockErrors = this.parser.validateAnnotation(block);
          validationErrors.push(...blockErrors);
        }
      }

      // Transform annotations
      const {
        content: transformedContent,
        imports,
        errors: transformErrors,
      } = this.transformer.transformAnnotations(content, blocks);

      // Generate output path
      const outputPath = this.fileHandler.generateOutputPath(
        inputPath,
        options.input,
        options.output,
        false // not reverse mode
      );

      // Write transformed file
      const writeResult = await this.fileHandler.writeTransformedFile(
        inputPath,
        outputPath,
        transformedContent,
        imports,
        frontmatter,
        options.dryRun,
        options.description
      );

      // Combine all errors
      const allErrors = [
        ...parseErrors,
        ...validationErrors,
        ...transformErrors,
        ...writeResult.errors,
      ];

      return {
        ...writeResult,
        errors: allErrors,
      };
    } catch (error) {
      return {
        inputPath,
        outputPath: "",
        success: false,
        errors: [
          {
            message: `Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`,
            line: 0,
            type: "error",
          },
        ],
      };
    }
  }

  /**
   * Process a single file in reverse mode (MDX to Markdown)
   */
  public async processReverseFile(
    inputPath: string,
    options: CliOptions
  ): Promise<FileProcessingResult> {
    try {
      // Read the MDX file
      const { content, frontmatter } =
        await this.fileHandler.readMarkdownFile(inputPath);

      // Reverse transform the content
      const {
        content: transformedContent,
        errors: transformErrors,
      } = this.reverseTransformer.reverseTransform(content);

      // Generate output path for reverse mode
      const outputPath = this.fileHandler.generateOutputPath(
        inputPath,
        options.input,
        options.output,
        true // reverse mode
      );

      // Write reverse transformed file
      const writeResult = await this.fileHandler.writeReverseTransformedFile(
        inputPath,
        outputPath,
        transformedContent,
        frontmatter,
        options.dryRun
      );

      // Combine all errors
      const allErrors = [
        ...transformErrors,
        ...writeResult.errors,
      ];

      return {
        ...writeResult,
        errors: allErrors,
      };
    } catch (error) {
      return {
        inputPath,
        outputPath: "",
        success: false,
        errors: [
          {
            message: `Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`,
            line: 0,
            type: "error",
          },
        ],
      };
    }
  }

  /**
   * Watch for file changes and auto-transpile
   */
  public async watchFiles(options: CliOptions): Promise<void> {
    const chokidar = await import("chokidar");

    console.log(chalk.blue("Watching for changes..."));

    const watcher = chokidar.watch(path.join(options.input, "**/*.md"), {
      ignored: ["**/node_modules/**", "**/dist/**", "**/build/**"],
      persistent: true,
    });

    watcher.on("change", async (filePath) => {
      console.log(
        chalk.yellow(
          `🔄 File changed: ${path.relative(options.input, filePath)}`
        )
      );

      const result = await this.processFile(filePath, {
        ...options,
        dryRun: false,
      });

      if (result.success) {
        console.log(
          chalk.green(
            `Transpiled: ${path.relative(options.input, filePath)}`
          )
        );
      } else {
        console.log(
          chalk.red(
            `Error transpiling: ${path.relative(options.input, filePath)}`
          )
        );
        this.printErrors(result.errors);
      }
    });

    watcher.on("add", async (filePath) => {
      if (this.fileHandler.shouldProcessFile(filePath)) {
        console.log(
          chalk.green(`New file: ${path.relative(options.input, filePath)}`)
        );

        const result = await this.processFile(filePath, {
          ...options,
          dryRun: false,
        });

        if (result.success) {
          console.log(
            chalk.green(
              `Transpiled: ${path.relative(options.input, filePath)}`
            )
          );
        } else {
          console.log(
            chalk.red(
              `Error transpiling: ${path.relative(options.input, filePath)}`
            )
          );
          this.printErrors(result.errors);
        }
      }
    });

    // Keep the process running
    process.on("SIGINT", () => {
      console.log(chalk.blue("\nStopping watcher..."));
      watcher.close();
      process.exit(0);
    });
  }

  /**
   * Validate files without processing
   */
  public async validateFiles(options: CliOptions): Promise<boolean> {
    console.log(chalk.blue("🔍 Validating files..."));

    const files = await this.fileHandler.findMarkdownFiles(options.input);
    let hasErrors = false;

    for (const inputFile of files) {
      if (!this.fileHandler.shouldProcessFile(inputFile)) {
        continue;
      }

      try {
        const { content } = await this.fileHandler.readMarkdownFile(inputFile);
        const { blocks, errors: parseErrors } =
          this.parser.parseAnnotations(content);

        const validationErrors: TransformError[] = [];
        for (const block of blocks) {
          const blockErrors = this.parser.validateAnnotation(block);
          validationErrors.push(...blockErrors);
        }

        const allErrors = [...parseErrors, ...validationErrors];

        if (allErrors.length > 0) {
          hasErrors = true;
          console.log(
            chalk.red(
              `${this.fileHandler.getRelativePath(inputFile, options.input)}`
            )
          );
          this.printErrors(allErrors);
        } else if (options.verbose) {
          console.log(
            chalk.green(
              `${this.fileHandler.getRelativePath(inputFile, options.input)}`
            )
          );
        }
      } catch (error) {
        hasErrors = true;
        console.log(
          chalk.red(
            `${this.fileHandler.getRelativePath(inputFile, options.input)}: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    }

    if (!hasErrors) {
      console.log(chalk.green("All files are valid"));
    }

    return !hasErrors;
  }

  /**
   * Print error messages with formatting
   */
  private printErrors(errors: TransformError[]): void {
    for (const error of errors) {
      const prefix =
        error.type === "error" ? chalk.red("ERROR") : chalk.yellow("WARNING");
      const location = error.line > 0 ? chalk.gray(`(line ${error.line})`) : "";
      const annotation = error.annotation
        ? chalk.blue(`[${error.annotation}]`)
        : "";

      console.log(`  ${prefix} ${annotation} ${error.message} ${location}`);
    }
  }

  /**
   * Get transpiler statistics
   */
  public getStats(): { supportedTypes: string[]; version: string } {
    return {
      supportedTypes: ConfigManager.getSupportedTypes(this.config),
      version: "1.0.0",
    };
  }

  /**
   * Create a new transpiler instance with config
   */
  public static async create(configPath?: string): Promise<FumadocsTranspiler> {
    const config = await ConfigManager.loadConfig(configPath);
    const validationErrors = ConfigManager.validateConfig(config);

    if (validationErrors.length > 0) {
      throw new Error(`Invalid configuration:\n${validationErrors.join("\n")}`);
    }

    return new FumadocsTranspiler(config);
  }
}
