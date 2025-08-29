# Fumadocs Transpiler

[![npm version](https://badge.fury.io/js/fumadocs-transpiler.svg)](https://badge.fury.io/js/fumadocs-transpiler)
[![npm downloads](https://img.shields.io/npm/dm/fumadocs-transpiler.svg)](https://www.npmjs.com/package/fumadocs-transpiler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/fumadocs-transpiler.svg)](https://nodejs.org/)

A powerful Node.js transpiler that converts annotated Markdown files to Fuma-docs compatible React components. This tool enables mentors and contributors to write documentation in familiar Markdown syntax with simple annotations, automatically generating proper React component syntax.

## Features

- **Simple Annotation Syntax**: Use triple colons (`:::`) to define components
- **Built-in Components**: Support for callouts, tabs, steps, accordions, code blocks, files, and banners
- **Custom Components**: Extensible configuration for custom component mappings
- **Batch Processing**: Process multiple files and directories recursively
- **Watch Mode**: Auto-transpile on file changes during development
- **Validation**: Syntax validation with helpful error messages
- **Backup Support**: Optional backup of original files
- **Dry Run**: Preview changes without modifying files
- **Frontmatter Preservation**: Maintains existing frontmatter in files
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

### Global Installation (Recommended)

```bash
npm install -g fumadocs-transpiler
```

### Local Installation

```bash
npm install fumadocs-transpiler
# or
yarn add fumadocs-transpiler
```

## 🎯 Quick Start

### 1. Basic Usage

Transform all `.md` files in a directory:

```bash
fumadocs-transpiler ./docs ./src/pages
```

### 2. In-place Transformation

Transform files in the same directory:

```bash
fumadocs-transpiler ./docs
```

### 3. Watch Mode

Auto-transpile on file changes:

```bash
fumadocs-transpiler ./docs --watch
```

### 4. Dry Run

Preview changes without writing files:

```bash
fumadocs-transpiler ./docs --dry-run
```

## Annotation Syntax

### Callouts

```markdown
:::callout-info
This is an info callout message
:::

:::callout-warn
This is a warning message
:::

:::callout-error
This is an error message
:::

:::callout-note
This is a note message
:::
```

**Output:**

```jsx
<Callout type="info">This is an info callout message</Callout>
```

### Tabs

```markdown
:::tabs
Tab 1|Content for the first tab
Tab 2|Content for the second tab
Tab 3|Content for the third tab
:::
```

**Output:**

```jsx
<Tabs items={["Tab 1", "Tab 2", "Tab 3"]}>
  <Tab value="Tab 1">Content for the first tab</Tab>
  <Tab value="Tab 2">Content for the second tab</Tab>
  <Tab value="Tab 3">Content for the third tab</Tab>
</Tabs>
```

### Steps

```markdown
:::steps
Step 1: Install the package
Step 2: Configure your project
Step 3: Start using the transpiler
:::
```

**Output:**

```jsx
<Steps>
  <Step>## Step 1 Install the package</Step>
  <Step>## Step 2 Configure your project</Step>
  <Step>## Step 3 Start using the transpiler</Step>
</Steps>
```

### Accordion

```markdown
:::accordion
How do I install?|Run npm install fumadocs-transpiler
How do I configure?|Create a config file using fumadocs-transpiler config init
:::
```

**Output:**

```jsx
<Accordions type="single">
  <Accordion title="How do I install?">
    Run npm install fumadocs-transpiler
  </Accordion>
  <Accordion title="How do I configure?">
    Create a config file using fumadocs-transpiler config init
  </Accordion>
</Accordions>
```

### Code Blocks

```markdown
:::code-block lang="javascript" title="Example Code"
console.log('Hello, World!');
const message = 'This is a code example';
:::
```

**Output:**

````jsx
<CodeBlock lang="javascript" title="Example Code">
```javascript
console.log('Hello, World!');
const message = 'This is a code example';
````

</CodeBlock>
```

### File Tree

```markdown
:::files
src/
components/
Button.tsx
Input.tsx
pages/
index.tsx
about.tsx
utils/
helpers.ts
:::
```

**Output:**

```jsx
<Files>
  <File name="src/">
    <File name="components/">
      <File name="Button.tsx" />
      <File name="Input.tsx" />
    </File>
    <File name="pages/">
      <File name="index.tsx" />
      <File name="about.tsx" />
    </File>
    <File name="utils/">
      <File name="helpers.ts" />
    </File>
  </File>
</Files>
```

### Banner

```markdown
:::banner type="info"
This is an important announcement banner
:::
```

**Output:**

```jsx
<Banner type="info">This is an important announcement banner</Banner>
```

## ⚙️ Configuration

### Create Configuration File

```bash
fumadocs-transpiler config init
```

This creates a `fumadocs-transpiler.config.json` file:

```json
{
  "componentMappings": {
    "callout-info": "<Callout type=\"info\">{{content}}</Callout>",
    "callout-warn": "<Callout type=\"warn\">{{content}}</Callout>",
    "callout-error": "<Callout type=\"error\">{{content}}</Callout>",
    "callout-note": "<Callout type=\"note\">{{content}}</Callout>",
    "custom-tip": "<div className=\"custom-tip\">{{content}}</div>"
  },
  "preserveOriginal": false,
  "outputExtension": ".mdx",
  "imports": [
    "import { Callout } from 'fumadocs-ui/components/callout';",
    "import { Tabs, Tab } from 'fumadocs-ui/components/tabs';",
    "import { Steps, Step } from 'fumadocs-ui/components/steps';",
    "import { Accordions, Accordion } from 'fumadocs-ui/components/accordion';",
    "import { CodeBlock } from 'fumadocs-ui/components/codeblock';",
    "import { Files, File } from 'fumadocs-ui/components/files';",
    "import { Banner } from 'fumadocs-ui/components/banner';"
  ],
  "backupOriginal": true,
  "validateSyntax": true
}
```

### Configuration Options

| Option              | Type    | Default           | Description                                    |
| ------------------- | ------- | ----------------- | ---------------------------------------------- |
| `componentMappings` | Object  | Built-in mappings | Custom component mappings                      |
| `preserveOriginal`  | Boolean | `false`           | Keep original files alongside transformed ones |
| `outputExtension`   | String  | `.mdx`            | File extension for output files                |
| `imports`           | Array   | Built-in imports  | Import statements to add to files              |
| `backupOriginal`    | Boolean | `false`           | Create backup files before transformation      |
| `validateSyntax`    | Boolean | `true`            | Enable syntax validation                       |

### Custom Components

Add custom component mappings to handle your own annotation types:

```json
{
  "componentMappings": {
    "custom-alert": "<Alert variant=\"custom\">{{content}}</Alert>",
    "highlight": "<Highlight>{{content}}</Highlight>",
    "video": "<VideoPlayer src=\"{{src}}\">{{content}}</VideoPlayer>"
  }
}
```

Then use them in your Markdown:

```markdown
:::custom-alert
This is a custom alert component
:::

:::highlight
This text will be highlighted
:::
```

## CLI Commands

### Main Command

```bash
fumadocs-transpiler <input> [output] [options]
```

**Arguments:**

- `input`: Input directory or file path (required)
- `output`: Output directory (optional, defaults to in-place transformation)

**Options:**

- `-w, --watch`: Watch for file changes and auto-transpile
- `-c, --config <path>`: Path to configuration file
- `-d, --dry-run`: Preview changes without writing files
- `-b, --backup`: Create backup of original files
- `-v, --verbose`: Enable verbose output
- `--validate-only`: Only validate files without transpiling

### Configuration Commands

```bash
# Create default configuration file
fumadocs-transpiler config init

# Validate configuration file
fumadocs-transpiler config validate [config-path]
```

### Information Commands

```bash
# Show transpiler information and supported types
fumadocs-transpiler info

# Show usage examples
fumadocs-transpiler examples
```

## 📋 Examples

### Basic Transformation

```bash
# Transform docs directory to src/pages
fumadocs-transpiler ./docs ./src/pages

# Transform with verbose output
fumadocs-transpiler ./docs ./src/pages --verbose
```

### Development Workflow

```bash
# Watch mode for development
fumadocs-transpiler ./docs --watch --verbose

# Dry run to preview changes
fumadocs-transpiler ./docs --dry-run
```

### With Configuration

```bash
# Use custom config file
fumadocs-transpiler ./docs --config ./my-config.json

# Create and use config
fumadocs-transpiler config init
fumadocs-transpiler ./docs
```

### Validation

```bash
# Validate files only
fumadocs-transpiler ./docs --validate-only

# Validate configuration
fumadocs-transpiler config validate
```

## Programmatic Usage

You can also use the transpiler programmatically in your Node.js applications:

```javascript
import { FumadocsTranspiler, ConfigManager } from "fumadocs-transpiler";

// Create transpiler with default config
const transpiler = await FumadocsTranspiler.create();

// Or with custom config
const config = await ConfigManager.loadConfig("./my-config.json");
const customTranspiler = new FumadocsTranspiler(config);

// Process files
await transpiler.processFiles({
  input: "./docs",
  output: "./src/pages",
  verbose: true,
});
```

## Testing

Run the test suite:

```bash
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the OpenFoodFacts organization
- Designed to work seamlessly with Fuma-docs
- Inspired by the need for simple, mentor-friendly documentation tools

## 📞 Support

- Create an issue on GitHub for bug reports or feature requests
- Check the [examples](#-examples) section for common use cases
- Use `fumadocs-transpiler examples` for CLI usage examples

---

Made with ❤️ for the open-source community
