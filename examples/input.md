# Example Documentation

This is an example markdown file showing various annotation types that can be transpiled.

## Callouts

::: callout-info
This is an informational callout that provides helpful context to users.
:::

::: callout-warn
This is a warning callout that alerts users to potential issues.
:::

::: callout-error
This is an error callout that highlights critical problems.
:::

## Interactive Components

### Tabs Example

::: tabs
Installation|npm install fumadocs-transpiler
Usage|fumadocs-transpiler ./docs ./src/pages
Configuration|Create a config file with fumadocs-transpiler config init
:::

### Steps Example

::: steps
Step 1: Install the package using npm or yarn
Step 2: Create a configuration file for your project
Step 3: Run the transpiler on your markdown files
Step 4: Review the generated React components
:::

### Accordion Example

::: accordion
What is Fumadocs Transpiler?|A tool that converts annotated Markdown to React components
How do I install it?|Use npm install -g fumadocs-transpiler
Can I customize components?|Yes, through the configuration file
Is it open source?|Yes, it's available on GitHub under MIT license
:::

## Code Examples

::: code-block lang="bash" title="Installation Command"
npm install -g fumadocs-transpiler
:::

::: code-block lang="javascript" title="Programmatic Usage"
import { FumadocsTranspiler } from 'fumadocs-transpiler';

const transpiler = await FumadocsTranspiler.create();
await transpiler.processFiles({
input: './docs',
output: './src/pages'
});
:::

## File Structure

::: files
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

## Banners

::: banner type="info"
📢 This documentation is automatically generated from Markdown files using Fumadocs Transpiler!
:::

## Regular Markdown

All regular Markdown syntax is preserved:

- **Bold text**
- _Italic text_
- `Inline code`
- [Links](https://example.com)

### Code Blocks (Regular)

```javascript
// Regular markdown code blocks are preserved
function example() {
  console.log("This remains unchanged");
}
```

### Lists

1. Numbered lists work normally
2. They are not affected by the transpiler
3. Only annotation blocks are transformed

- Bullet points also work
- As expected in regular Markdown
- No changes here

### Tables

| Feature    | Supported | Notes                   |
| ---------- | --------- | ----------------------- |
| Callouts   | ✅        | Info, warn, error, note |
| Tabs       | ✅        | Multiple tabs supported |
| Steps      | ✅        | Numbered step sequences |
| Accordions | ✅        | Collapsible Q&A format  |

This example demonstrates how the transpiler preserves regular Markdown while transforming only the special annotation blocks.
