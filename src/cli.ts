#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import * as fs from "fs-extra";
import { FumadocsTranspiler } from "./transpiler";
import { ConfigManager } from "./config";
import { CliOptions } from "./types";

const program = new Command();

program
  .name("fumadocs-transpiler")
  .description(
    "Transform annotated Markdown files to Fuma-docs compatible React components"
  )
  .version("1.0.0");

// Main transpile command
program
  .argument("<input>", "Input directory or file path")
  .argument(
    "[output]",
    "Output directory (optional, defaults to in-place transformation)"
  )
  .option("-w, --watch", "Watch for file changes and auto-transpile")
  .option("-c, --config <path>", "Path to configuration file")
  .option("-d, --dry-run", "Preview changes without writing files")
  .option("-b, --backup", "Create backup of original files")
  .option("-v, --verbose", "Enable verbose output")
  .option("--validate-only", "Only validate files without transpiling")
  .action(async (input: string, output: string | undefined, options: any) => {
    try {
      // Resolve input path
      const inputPath = path.resolve(input);
      const outputPath = output ? path.resolve(output) : undefined;

      // Check if input exists
      if (!(await fs.pathExists(inputPath))) {
        console.error(chalk.red(`❌ Input path does not exist: ${inputPath}`));
        process.exit(1);
      }

      // Find or use config file
      let configPath = options.config;
      if (!configPath) {
        const foundConfig = await ConfigManager.findConfigFile(process.cwd());
        if (foundConfig) {
          configPath = foundConfig;
          if (options.verbose) {
            console.log(chalk.blue(`📄 Using config file: ${configPath}`));
          }
        }
      }

      // Create transpiler instance
      const transpiler = await FumadocsTranspiler.create(configPath);

      // Prepare CLI options
      const cliOptions: CliOptions = {
        input: inputPath,
        output: outputPath,
        watch: options.watch,
        config: configPath,
        dryRun: options.dryRun,
        backup: options.backup,
        verbose: options.verbose,
      };

      // Handle different modes
      if (options.validateOnly) {
        const isValid = await transpiler.validateFiles(cliOptions);
        process.exit(isValid ? 0 : 1);
      } else if (options.watch) {
        await transpiler.watchFiles(cliOptions);
      } else {
        await transpiler.processFiles(cliOptions);
      }
    } catch (error) {
      console.error(
        chalk.red("💥 Error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

// Config commands
const configCmd = program
  .command("config")
  .description("Configuration management commands");

configCmd
  .command("init")
  .description("Create a default configuration file")
  .option(
    "-o, --output <path>",
    "Output path for config file",
    "fumadocs-transpiler.config.json"
  )
  .action(async (options) => {
    try {
      const outputPath = path.resolve(options.output);

      if (await fs.pathExists(outputPath)) {
        console.error(
          chalk.red(`❌ Config file already exists: ${outputPath}`)
        );
        process.exit(1);
      }

      await ConfigManager.createDefaultConfig(outputPath);
      console.log(chalk.green(`✅ Created config file: ${outputPath}`));
    } catch (error) {
      console.error(
        chalk.red("💥 Error creating config:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

configCmd
  .command("validate")
  .description("Validate configuration file")
  .argument("[config]", "Path to configuration file")
  .action(async (configPath?: string) => {
    try {
      if (!configPath) {
        const foundConfig = await ConfigManager.findConfigFile(process.cwd());
        if (!foundConfig) {
          console.error(chalk.red("❌ No configuration file found"));
          process.exit(1);
        }
        configPath = foundConfig;
      }

      const config = await ConfigManager.loadConfig(configPath);
      const errors = ConfigManager.validateConfig(config);

      if (errors.length === 0) {
        console.log(chalk.green("✅ Configuration is valid"));
      } else {
        console.log(chalk.red("❌ Configuration errors:"));
        errors.forEach((error) => console.log(chalk.red(`  • ${error}`)));
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red("💥 Error validating config:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

// Info command
program
  .command("info")
  .description("Show transpiler information and supported annotation types")
  .option("-c, --config <path>", "Path to configuration file")
  .action(async (options) => {
    try {
      let configPath = options.config;
      if (!configPath) {
        const foundConfig = await ConfigManager.findConfigFile(process.cwd());
        if (foundConfig) {
          configPath = foundConfig;
        }
      }

      const transpiler = await FumadocsTranspiler.create(configPath);
      const stats = transpiler.getStats();

      console.log(chalk.blue("📋 Fumadocs Transpiler Information"));
      console.log(chalk.gray("─".repeat(40)));
      console.log(`Version: ${chalk.green(stats.version)}`);
      console.log(
        `Config: ${configPath ? chalk.green(configPath) : chalk.yellow("Using defaults")}`
      );
      console.log("\nSupported annotation types:");

      stats.supportedTypes.forEach((type) => {
        console.log(`  • ${chalk.cyan(type)}`);
      });
    } catch (error) {
      console.error(
        chalk.red("💥 Error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

// Examples command
program
  .command("examples")
  .description("Show usage examples")
  .action(() => {
    console.log(chalk.blue("📚 Usage Examples\n"));

    console.log(chalk.yellow("Basic usage:"));
    console.log("  fumadocs-transpiler ./docs ./src/pages\n");

    console.log(chalk.yellow("In-place transformation:"));
    console.log("  fumadocs-transpiler ./docs\n");

    console.log(chalk.yellow("Watch mode:"));
    console.log("  fumadocs-transpiler ./docs --watch\n");

    console.log(chalk.yellow("Dry run (preview changes):"));
    console.log("  fumadocs-transpiler ./docs --dry-run\n");

    console.log(chalk.yellow("With custom config:"));
    console.log("  fumadocs-transpiler ./docs --config ./my-config.json\n");

    console.log(chalk.yellow("Validate only:"));
    console.log("  fumadocs-transpiler ./docs --validate-only\n");

    console.log(chalk.yellow("Create config file:"));
    console.log("  fumadocs-transpiler config init\n");

    console.log(chalk.yellow("Show supported annotations:"));
    console.log("  fumadocs-transpiler info\n");
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === "commander.helpDisplayed") {
    process.exit(0);
  }

  if (error.code === "commander.unknownCommand") {
    console.error(
      chalk.red("❌ Unknown command. Use --help for available commands.")
    );
    process.exit(1);
  }

  console.error(chalk.red("💥 CLI Error:"), error.message);
  process.exit(1);
}

// Show help if no arguments provided
if (process.argv.length <= 2) {
  program.help();
}
