# Fumadocs Transpiler Examples

This directory contains example files demonstrating the capabilities of the Fumadocs Transpiler, including both forward and reverse transpilation.

## Files Overview

### Forward Transpilation Examples

- **`input.md`** - Original annotated Markdown file with various component annotations
- **`expected-output.mdx`** - Expected MDX output after forward transpilation
- **`input.mdx`** - Alternative MDX input for testing

### Reverse Transpilation Examples

- **`sample-mdx-input.mdx`** - Comprehensive MDX file with all supported components
- **`expected-reverse-output.md`** - Expected Markdown output after reverse transpilation

### Code Block Enhancement Examples

- **`code-block-example.md`** - Markdown file demonstrating code block title extraction
- **`code-block-expected-output.mdx`** - Expected output showing enhanced code blocks

### Configuration

- **`fumadocs-transpiler.config.json`** - Example configuration file

## How to Use These Examples

### 1. Forward Transpilation (Markdown → MDX)

Convert the annotated Markdown to MDX:

```bash
# Basic forward transpilation
fumadocs-transpiler --input examples/input.md --output examples/output --verbose

# With description
fumadocs-transpiler --input examples/input.md --output examples/output --description "Example documentation" --verbose

# Dry run to preview
fumadocs-transpiler --input examples/input.md --dry-run --verbose
```

### 2. Reverse Transpilation (MDX → Markdown)

Convert the MDX file back to annotated Markdown:

```bash
# Basic reverse transpilation
fumadocs-transpiler --input examples/sample-mdx-input.mdx --output examples/output --reverse --verbose

# Dry run to preview reverse changes
fumadocs-transpiler --input examples/sample-mdx-input.mdx --reverse --dry-run --verbose

# In-place reverse transpilation
fumadocs-transpiler --input examples/sample-mdx-input.mdx --reverse --verbose
```

### 3. Code Block Enhancement Testing

Test the automatic code block title extraction:

```bash
# Transform markdown with code block enhancement
fumadocs-transpiler --input examples/code-block-example.md --output examples/output --verbose

# Preview code block enhancements
fumadocs-transpiler --input examples/code-block-example.md --dry-run --verbose

# Test reverse transformation of enhanced code blocks
fumadocs-transpiler --input examples/code-block-expected-output.mdx --output examples/output --reverse --verbose
```

### 4. Round-Trip Testing

Test bidirectional conversion:

```bash
# Step 1: Forward transpilation
fumadocs-transpiler --input examples/input.md --output examples/test-output --verbose

# Step 2: Reverse transpilation
fumadocs-transpiler --input examples/test-output/input.mdx --output examples/test-output --reverse --verbose

# Compare the original and round-trip result
diff examples/input.md examples/test-output/input.md
```

### 5. Using Configuration

Test with the example configuration:

```bash
# Use the example config file
fumadocs-transpiler --input examples/input.md --config examples/fumadocs-transpiler.config.json --verbose
```

## Supported Components Demonstrated

The examples showcase all supported component types:

### Callouts
- `:::callout-info` → `<Callout type="info">`
- `:::callout-warn` → `<Callout type="warn">`
- `:::callout-error` → `<Callout type="error">`
- `:::callout-note` → `<Callout type="note">`

### Interactive Components
- `:::tabs` → `<Tabs>` with `<Tab>` children
- `:::steps` → `<Steps>` with `<Step>` children
- `:::accordion` → `<Accordions>` with `<Accordion>` children

### Code and Files
- `:::code-block` → `<CodeBlock>` with syntax highlighting
- `:::files` → `<Files>` with nested `<File>` structure

### Banners
- `:::banner` → `<Banner>` with type attribute

### Code Block Enhancement
- Regular ````bash` → ````bash title="Heading Title"`
- Automatic title extraction from nearest `##` or `###` heading
- Reverse: ````bash title="Title"` → ````bash` (title removed)

## Features Demonstrated

### Title Extraction
- Automatic extraction of `# Title` from Markdown
- Conversion to frontmatter `title: "Title"`
- Reverse conversion from frontmatter back to `# Title`

### Frontmatter Handling
- Preservation of existing frontmatter
- Addition of title and description
- Clean removal during reverse transpilation

### Import Management
- Automatic addition of required imports
- Smart import organization
- Complete removal during reverse transpilation

### Content Preservation
- Regular Markdown syntax remains unchanged
- Code blocks enhanced with titles from headings
- Lists, tables, and links preserved
- Formatting and structure maintained

### Code Block Enhancement
- Automatic title extraction from `##` and `###` headings
- Smart heading search (looks backwards, stops at `#`)
- Preserves existing explicit titles
- Bidirectional conversion support

## Testing Your Changes

If you modify the transpiler, use these examples to verify functionality:

```bash
# Test all examples
npm run build
node dist/cli.js --input examples/input.md --dry-run --verbose
node dist/cli.js --input examples/sample-mdx-input.mdx --reverse --dry-run --verbose
node dist/cli.js --input examples/code-block-example.md --dry-run --verbose

# Validate round-trip conversion
node dist/cli.js --input examples/input.md --output /tmp/test-forward
node dist/cli.js --input /tmp/test-forward/input.mdx --output /tmp/test-reverse --reverse
diff examples/input.md /tmp/test-reverse/input.md
```

## Expected Behavior

- **Forward transpilation** should match `expected-output.mdx`
- **Code block enhancement** should match `code-block-expected-output.mdx`
- **Reverse transpilation** should match `expected-reverse-output.md`
- **Round-trip conversion** should preserve the original content structure
- **Code block titles** should be added during forward and removed during reverse
- **All regular Markdown** should remain unchanged in both directions
