# Complete Component Guide

This is a comprehensive example showing all supported Fumadocs components that can be reverse-transpiled back to annotated Markdown.

## Callout Components

:::callout-info
This is an informational callout that provides helpful context to users.
:::

:::callout-warn
This is a warning callout that alerts users to potential issues.
:::

:::callout-error
This is an error callout that highlights critical problems.
:::

:::callout-note
This is a note callout for additional information.
:::

## Interactive Components

### Installation Tabs

:::tabs
npm|npm install fumadocs-transpiler
yarn|yarn add fumadocs-transpiler
pnpm|pnpm add fumadocs-transpiler
:::

### Step-by-Step Guide

:::steps
Step 1 Install the package using your preferred package manager
Step 2 Create a configuration file for your project settings
Step 3 Run the transpiler on your markdown files
Step 4 Review the generated React components and imports
:::

### FAQ Accordion

:::accordion
What is Fumadocs Transpiler?|A powerful tool that converts annotated Markdown files to Fumadocs-compatible React components with bidirectional conversion support.
How do I install it?|Use npm install -g fumadocs-transpiler to install it globally, or npm install fumadocs-transpiler for local installation.
Can I reverse the transpilation?|Yes! Use the --reverse flag to convert MDX files back to annotated Markdown format.
Is it open source?|Yes, it's available on GitHub under the MIT license with full source code access.
:::

## Code Examples

### JavaScript Example

:::code-block lang="javascript" title="Basic Usage"
import { FumadocsTranspiler } from 'fumadocs-transpiler';

const transpiler = await FumadocsTranspiler.create();
await transpiler.processFiles({
  input: './docs',
  output: './src/pages',
  description: 'API documentation'
});
:::

### Bash Commands

:::code-block lang="bash" title="CLI Commands"
# Forward transpilation
fumadocs-transpiler --input ./docs --output ./src/pages

# Reverse transpilation
fumadocs-transpiler --input ./src/pages --output ./docs --reverse
:::

## File Structure

:::files
project/
docs/
getting-started.md
api-reference.md
examples/
basic.md
advanced.md
src/
pages/
getting-started.mdx
api-reference.mdx
examples/
basic.mdx
advanced.mdx
fumadocs-transpiler.config.json
:::

## Important Notice

:::banner type="info"
📢 This example demonstrates all supported components that can be converted bidirectionally between MDX and annotated Markdown formats!
:::

## Regular Markdown Content

All regular Markdown syntax is preserved during reverse transpilation:

- **Bold text** remains bold
- _Italic text_ remains italic
- `Inline code` stays as inline code
- [Links](https://example.com) are preserved

### Standard Code Blocks

```typescript
// Regular markdown code blocks are preserved
interface Config {
  input: string;
  output?: string;
  reverse?: boolean;
}

function processFiles(config: Config): Promise<void> {
  // Implementation here
}
```

### Lists and Tables

1. Numbered lists work normally
2. They are preserved during conversion
3. No changes to regular markdown

| Feature | Forward | Reverse |
|---------|---------|---------|
| Callouts | ✅ | ✅ |
| Tabs | ✅ | ✅ |
| Steps | ✅ | ✅ |
| Accordions | ✅ | ✅ |

This comprehensive example shows how the transpiler handles all component types while preserving regular Markdown content perfectly.
