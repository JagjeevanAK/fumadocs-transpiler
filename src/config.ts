import * as fs from "fs-extra";
import * as path from "path";
import { TranspilerConfig } from "./types";

export class ConfigManager {
  private static readonly DEFAULT_CONFIG: TranspilerConfig = {
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
    addTitle: true,
  };

  /**
   * Load configuration from file or use defaults
   */
  public static async loadConfig(
    configPath?: string
  ): Promise<TranspilerConfig> {
    if (!configPath) {
      return { ...ConfigManager.DEFAULT_CONFIG };
    }

    try {
      const configExists = await fs.pathExists(configPath);
      if (!configExists) {
        console.warn(`Config file not found at ${configPath}, using defaults`);
        return { ...ConfigManager.DEFAULT_CONFIG };
      }

      const configContent = await fs.readFile(configPath, "utf-8");
      const userConfig = JSON.parse(configContent);

      // Merge with defaults
      return ConfigManager.mergeConfig(
        ConfigManager.DEFAULT_CONFIG,
        userConfig
      );
    } catch (error) {
      throw new Error(
        `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a default configuration file
   */
  public static async createDefaultConfig(outputPath: string): Promise<void> {
    const configContent = {
      componentMappings: {
        "callout-info": '<Callout type="info">{{content}}</Callout>',
        "callout-warn": '<Callout type="warn">{{content}}</Callout>',
        "callout-error": '<Callout type="error">{{content}}</Callout>',
        "callout-note": '<Callout type="note">{{content}}</Callout>',
        "custom-tip": '<div className="custom-tip">{{content}}</div>',
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
      backupOriginal: true,
      validateSyntax: true,
      addTitle: true,
    };

    await fs.writeFile(
      outputPath,
      JSON.stringify(configContent, null, 2),
      "utf-8"
    );
  }

  /**
   * Validate configuration
   */
  public static validateConfig(config: TranspilerConfig): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!config.componentMappings) {
      errors.push("componentMappings is required");
    }

    if (!config.outputExtension) {
      errors.push("outputExtension is required");
    }

    if (!Array.isArray(config.imports)) {
      errors.push("imports must be an array");
    }

    // Validate output extension
    if (config.outputExtension && !config.outputExtension.startsWith(".")) {
      errors.push('outputExtension must start with a dot (e.g., ".mdx")');
    }

    // Validate component mappings
    if (config.componentMappings) {
      for (const [key, template] of Object.entries(config.componentMappings)) {
        if (typeof template !== "string") {
          errors.push(`Component mapping for "${key}" must be a string`);
        } else if (!template.includes("{{content}}")) {
          errors.push(
            `Component mapping for "${key}" must include {{content}} placeholder`
          );
        }
      }
    }

    // Validate imports
    if (config.imports) {
      for (const importStatement of config.imports) {
        if (!importStatement.startsWith("import ")) {
          errors.push(`Invalid import statement: "${importStatement}"`);
        }
      }
    }

    return errors;
  }

  /**
   * Find configuration file in common locations
   */
  public static async findConfigFile(startDir: string): Promise<string | null> {
    const configNames = [
      "fumadocs-transpiler.config.json",
      "transpiler.config.json",
      ".fumadocs-transpiler.json",
    ];

    let currentDir = startDir;

    while (currentDir !== path.dirname(currentDir)) {
      for (const configName of configNames) {
        const configPath = path.join(currentDir, configName);
        if (await fs.pathExists(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * Merge user config with defaults
   */
  private static mergeConfig(
    defaultConfig: TranspilerConfig,
    userConfig: Partial<TranspilerConfig>
  ): TranspilerConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      componentMappings: {
        ...defaultConfig.componentMappings,
        ...userConfig.componentMappings,
      },
      imports: userConfig.imports || defaultConfig.imports,
    };
  }

  /**
   * Get config for specific annotation type
   */
  public static getComponentMapping(
    config: TranspilerConfig,
    annotationType: string
  ): string | null {
    return config.componentMappings[annotationType] || null;
  }

  /**
   * Add custom component mapping
   */
  public static addComponentMapping(
    config: TranspilerConfig,
    type: string,
    template: string
  ): void {
    config.componentMappings[type] = template;
  }

  /**
   * Remove component mapping
   */
  public static removeComponentMapping(
    config: TranspilerConfig,
    type: string
  ): boolean {
    if (config.componentMappings[type]) {
      delete config.componentMappings[type];
      return true;
    }
    return false;
  }

  /**
   * Get all supported annotation types
   */
  public static getSupportedTypes(config: TranspilerConfig): string[] {
    const builtInTypes = [
      "callout-info",
      "callout-warn",
      "callout-error",
      "callout-note",
      "tabs",
      "steps",
      "accordion",
      "code-block",
      "files",
      "banner",
    ];

    const customTypes = Object.keys(config.componentMappings);

    return [...new Set([...builtInTypes, ...customTypes])];
  }

  /**
   * Export configuration to file
   */
  public static async exportConfig(
    config: TranspilerConfig,
    outputPath: string
  ): Promise<void> {
    const configToExport = {
      componentMappings: config.componentMappings,
      preserveOriginal: config.preserveOriginal,
      outputExtension: config.outputExtension,
      imports: config.imports,
      backupOriginal: config.backupOriginal,
      validateSyntax: config.validateSyntax,
      addTitle: config.addTitle,
    };

    await fs.writeFile(
      outputPath,
      JSON.stringify(configToExport, null, 2),
      "utf-8"
    );
  }
}
