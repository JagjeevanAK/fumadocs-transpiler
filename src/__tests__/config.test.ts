import * as fs from "fs-extra";
import * as path from "path";
import { ConfigManager } from "../config";
import { TranspilerConfig } from "../types";

describe("ConfigManager", () => {
  const testConfigDir = path.join(__dirname, "test-configs");

  beforeEach(async () => {
    await fs.ensureDir(testConfigDir);
  });

  afterEach(async () => {
    await fs.remove(testConfigDir);
  });

  describe("loadConfig", () => {
    it("should load default config when no path provided", async () => {
      const config = await ConfigManager.loadConfig();

      expect(config.componentMappings).toBeDefined();
      expect(config.outputExtension).toBe(".mdx");
      expect(config.preserveOriginal).toBe(false);
      expect(Array.isArray(config.imports)).toBe(true);
    });

    it("should load custom config from file", async () => {
      const customConfig = {
        componentMappings: {
          "custom-type": "<Custom>{{content}}</Custom>",
        },
        preserveOriginal: true,
        outputExtension: ".tsx",
        imports: ['import { Custom } from "./custom";'],
      };

      const configPath = path.join(testConfigDir, "custom.json");
      await fs.writeFile(configPath, JSON.stringify(customConfig, null, 2));

      const config = await ConfigManager.loadConfig(configPath);

      expect(config.componentMappings["custom-type"]).toBe(
        "<Custom>{{content}}</Custom>"
      );
      expect(config.preserveOriginal).toBe(true);
      expect(config.outputExtension).toBe(".tsx");
      expect(config.imports).toContain('import { Custom } from "./custom";');
    });

    it("should merge custom config with defaults", async () => {
      const customConfig = {
        componentMappings: {
          "custom-type": "<Custom>{{content}}</Custom>",
        },
        preserveOriginal: true,
      };

      const configPath = path.join(testConfigDir, "partial.json");
      await fs.writeFile(configPath, JSON.stringify(customConfig, null, 2));

      const config = await ConfigManager.loadConfig(configPath);

      // Custom values
      expect(config.componentMappings["custom-type"]).toBe(
        "<Custom>{{content}}</Custom>"
      );
      expect(config.preserveOriginal).toBe(true);

      // Default values should still be present
      expect(config.outputExtension).toBe(".mdx");
      expect(config.componentMappings["callout-info"]).toBeDefined();
    });

    it("should handle missing config file gracefully", async () => {
      const configPath = path.join(testConfigDir, "nonexistent.json");
      const config = await ConfigManager.loadConfig(configPath);

      // Should return default config
      expect(config.outputExtension).toBe(".mdx");
      expect(config.componentMappings["callout-info"]).toBeDefined();
    });

    it("should throw error for invalid JSON", async () => {
      const configPath = path.join(testConfigDir, "invalid.json");
      await fs.writeFile(configPath, "{ invalid json }");

      await expect(ConfigManager.loadConfig(configPath)).rejects.toThrow();
    });
  });

  describe("validateConfig", () => {
    it("should validate correct config", () => {
      const config: TranspilerConfig = {
        componentMappings: {
          "test-type": "<Test>{{content}}</Test>",
        },
        preserveOriginal: false,
        outputExtension: ".mdx",
        imports: ['import { Test } from "./test";'],
        backupOriginal: false,
        validateSyntax: true,
      };

      const errors = ConfigManager.validateConfig(config);
      expect(errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const config = {} as TranspilerConfig;
      const errors = ConfigManager.validateConfig(config);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes("componentMappings"))).toBe(true);
      expect(errors.some((e) => e.includes("outputExtension"))).toBe(true);
    });

    it("should validate output extension format", () => {
      const config: TranspilerConfig = {
        componentMappings: {},
        preserveOriginal: false,
        outputExtension: "mdx", // Missing dot
        imports: [],
        backupOriginal: false,
        validateSyntax: true,
      };

      const errors = ConfigManager.validateConfig(config);
      expect(errors.some((e) => e.includes("must start with a dot"))).toBe(
        true
      );
    });

    it("should validate component mapping templates", () => {
      const config: TranspilerConfig = {
        componentMappings: {
          "valid-type": "<Valid>{{content}}</Valid>",
          "invalid-type": "<Invalid>no placeholder</Invalid>",
        },
        preserveOriginal: false,
        outputExtension: ".mdx",
        imports: [],
        backupOriginal: false,
        validateSyntax: true,
      };

      const errors = ConfigManager.validateConfig(config);
      expect(
        errors.some(
          (e) => e.includes("invalid-type") && e.includes("{{content}}")
        )
      ).toBe(true);
    });

    it("should validate import statements", () => {
      const config: TranspilerConfig = {
        componentMappings: {},
        preserveOriginal: false,
        outputExtension: ".mdx",
        imports: [
          'import { Valid } from "./valid";',
          'const invalid = "not an import";',
        ],
        backupOriginal: false,
        validateSyntax: true,
      };

      const errors = ConfigManager.validateConfig(config);
      expect(errors.some((e) => e.includes("Invalid import statement"))).toBe(
        true
      );
    });
  });

  describe("findConfigFile", () => {
    it("should find config file in current directory", async () => {
      const configPath = path.join(
        testConfigDir,
        "fumadocs-transpiler.config.json"
      );
      await fs.writeFile(configPath, "{}");

      const found = await ConfigManager.findConfigFile(testConfigDir);
      expect(found).toBe(configPath);
    });

    it("should find config file in parent directory", async () => {
      const subDir = path.join(testConfigDir, "subdir");
      await fs.ensureDir(subDir);

      const configPath = path.join(testConfigDir, "transpiler.config.json");
      await fs.writeFile(configPath, "{}");

      const found = await ConfigManager.findConfigFile(subDir);
      expect(found).toBe(configPath);
    });

    it("should return null when no config found", async () => {
      const found = await ConfigManager.findConfigFile(testConfigDir);
      expect(found).toBeNull();
    });
  });

  describe("createDefaultConfig", () => {
    it("should create default config file", async () => {
      const configPath = path.join(testConfigDir, "default.json");
      await ConfigManager.createDefaultConfig(configPath);

      expect(await fs.pathExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.componentMappings).toBeDefined();
      expect(config.outputExtension).toBe(".mdx");
      expect(Array.isArray(config.imports)).toBe(true);
    });
  });

  describe("getSupportedTypes", () => {
    it("should return built-in and custom types", () => {
      const config: TranspilerConfig = {
        componentMappings: {
          "custom-type": "<Custom>{{content}}</Custom>",
          "another-custom": "<Another>{{content}}</Another>",
        },
        preserveOriginal: false,
        outputExtension: ".mdx",
        imports: [],
        backupOriginal: false,
        validateSyntax: true,
      };

      const types = ConfigManager.getSupportedTypes(config);

      // Should include built-in types
      expect(types).toContain("callout-info");
      expect(types).toContain("tabs");
      expect(types).toContain("steps");

      // Should include custom types
      expect(types).toContain("custom-type");
      expect(types).toContain("another-custom");
    });
  });

  describe("component mapping management", () => {
    let config: TranspilerConfig;

    beforeEach(() => {
      config = {
        componentMappings: {
          "existing-type": "<Existing>{{content}}</Existing>",
        },
        preserveOriginal: false,
        outputExtension: ".mdx",
        imports: [],
        backupOriginal: false,
        validateSyntax: true,
      };
    });

    it("should add component mapping", () => {
      ConfigManager.addComponentMapping(
        config,
        "new-type",
        "<New>{{content}}</New>"
      );
      expect(config.componentMappings["new-type"]).toBe(
        "<New>{{content}}</New>"
      );
    });

    it("should remove component mapping", () => {
      const removed = ConfigManager.removeComponentMapping(
        config,
        "existing-type"
      );
      expect(removed).toBe(true);
      expect(config.componentMappings["existing-type"]).toBeUndefined();
    });

    it("should return false when removing non-existent mapping", () => {
      const removed = ConfigManager.removeComponentMapping(
        config,
        "non-existent"
      );
      expect(removed).toBe(false);
    });

    it("should get component mapping", () => {
      const mapping = ConfigManager.getComponentMapping(
        config,
        "existing-type"
      );
      expect(mapping).toBe("<Existing>{{content}}</Existing>");
    });

    it("should return null for non-existent mapping", () => {
      const mapping = ConfigManager.getComponentMapping(config, "non-existent");
      expect(mapping).toBeNull();
    });
  });
});
