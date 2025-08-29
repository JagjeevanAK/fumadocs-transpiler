import { AnnotationTransformer } from "../transformer";
import { TranspilerConfig, AnnotationBlock } from "../types";

describe("AnnotationTransformer", () => {
  let transformer: AnnotationTransformer;
  let config: TranspilerConfig;

  beforeEach(() => {
    config = {
      componentMappings: {
        "custom-component": "<CustomComponent>{{content}}</CustomComponent>",
      },
      preserveOriginal: false,
      outputExtension: ".mdx",
      imports: [],
      backupOriginal: false,
      validateSyntax: true,
    };
    transformer = new AnnotationTransformer(config);
  });

  describe("transformAnnotations", () => {
    it("should transform callout annotations", () => {
      const content = `# Title

:::callout-info
This is an info message
:::

Some text`;

      const blocks: AnnotationBlock[] = [
        {
          type: "callout-info",
          content: "This is an info message",
          attributes: {},
          startLine: 3,
          endLine: 5,
          originalText: ":::callout-info\nThis is an info message\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain('<Callout type="info">');
      expect(result.content).toContain("This is an info message");
      expect(result.content).toContain("</Callout>");
      expect(
        result.imports.has(
          "import { Callout } from 'fumadocs-ui/components/callout';"
        )
      ).toBe(true);
    });

    it("should transform tabs annotations", () => {
      const content = `:::tabs
Tab 1|Content for tab 1
Tab 2|Content for tab 2
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "tabs",
          content: "Tab 1|Content for tab 1\nTab 2|Content for tab 2",
          attributes: {},
          startLine: 1,
          endLine: 4,
          originalText:
            ":::tabs\nTab 1|Content for tab 1\nTab 2|Content for tab 2\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain('<Tabs items={["Tab 1", "Tab 2"]}>');
      expect(result.content).toContain('<Tab value="Tab 1">');
      expect(result.content).toContain("Content for tab 1");
      expect(result.content).toContain('<Tab value="Tab 2">');
      expect(result.content).toContain("Content for tab 2");
      expect(result.content).toContain("</Tabs>");
      expect(
        result.imports.has(
          "import { Tabs, Tab } from 'fumadocs-ui/components/tabs';"
        )
      ).toBe(true);
    });

    it("should transform steps annotations", () => {
      const content = `:::steps
Step 1: First step description
Step 2: Second step description
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "steps",
          content:
            "Step 1: First step description\nStep 2: Second step description",
          attributes: {},
          startLine: 1,
          endLine: 4,
          originalText:
            ":::steps\nStep 1: First step description\nStep 2: Second step description\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain("<Steps>");
      expect(result.content).toContain("<Step>");
      expect(result.content).toContain("## Step 1");
      expect(result.content).toContain("First step description");
      expect(result.content).toContain("## Step 2");
      expect(result.content).toContain("Second step description");
      expect(result.content).toContain("</Steps>");
      expect(
        result.imports.has(
          "import { Steps, Step } from 'fumadocs-ui/components/steps';"
        )
      ).toBe(true);
    });

    it("should transform accordion annotations", () => {
      const content = `:::accordion
Question 1|Answer to question 1
Question 2|Answer to question 2
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "accordion",
          content:
            "Question 1|Answer to question 1\nQuestion 2|Answer to question 2",
          attributes: {},
          startLine: 1,
          endLine: 4,
          originalText:
            ":::accordion\nQuestion 1|Answer to question 1\nQuestion 2|Answer to question 2\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain('<Accordions type="single">');
      expect(result.content).toContain('<Accordion title="Question 1">');
      expect(result.content).toContain("Answer to question 1");
      expect(result.content).toContain('<Accordion title="Question 2">');
      expect(result.content).toContain("Answer to question 2");
      expect(result.content).toContain("</Accordions>");
      expect(
        result.imports.has(
          "import { Accordions, Accordion } from 'fumadocs-ui/components/accordion';"
        )
      ).toBe(true);
    });

    it("should transform code-block annotations", () => {
      const content = `:::code-block lang="javascript" title="Example"
console.log('Hello World');
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "code-block",
          content: "console.log('Hello World');",
          attributes: { lang: "javascript", title: "Example" },
          startLine: 1,
          endLine: 3,
          originalText:
            ':::code-block lang="javascript" title="Example"\nconsole.log(\'Hello World\');\n:::',
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain(
        '<CodeBlock lang="javascript" title="Example">'
      );
      expect(result.content).toContain("```javascript");
      expect(result.content).toContain("console.log('Hello World');");
      expect(result.content).toContain("</CodeBlock>");
      expect(
        result.imports.has(
          "import { CodeBlock } from 'fumadocs-ui/components/codeblock';"
        )
      ).toBe(true);
    });

    it("should transform files annotations", () => {
      const content = `:::files
src/
  components/
    Button.tsx
  pages/
    index.tsx
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "files",
          content:
            "src/\n  components/\n    Button.tsx\n  pages/\n    index.tsx",
          attributes: {},
          startLine: 1,
          endLine: 7,
          originalText:
            ":::files\nsrc/\n  components/\n    Button.tsx\n  pages/\n    index.tsx\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain("<Files>");
      expect(result.content).toContain('<File name="src/">');
      expect(result.content).toContain('<File name="components/">');
      expect(result.content).toContain('<File name="Button.tsx" />');
      expect(result.content).toContain('<File name="pages/">');
      expect(result.content).toContain('<File name="index.tsx" />');
      expect(result.content).toContain("</Files>");
      expect(
        result.imports.has(
          "import { Files, File } from 'fumadocs-ui/components/files';"
        )
      ).toBe(true);
    });

    it("should transform banner annotations", () => {
      const content = `:::banner type="info"
This is a banner message
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "banner",
          content: "This is a banner message",
          attributes: { type: "info" },
          startLine: 1,
          endLine: 3,
          originalText: ':::banner type="info"\nThis is a banner message\n:::',
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain('<Banner type="info">');
      expect(result.content).toContain("This is a banner message");
      expect(result.content).toContain("</Banner>");
      expect(
        result.imports.has(
          "import { Banner } from 'fumadocs-ui/components/banner';"
        )
      ).toBe(true);
    });

    it("should transform custom component annotations", () => {
      const content = `:::custom-component
Custom content here
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "custom-component",
          content: "Custom content here",
          attributes: {},
          startLine: 1,
          endLine: 3,
          originalText: ":::custom-component\nCustom content here\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain("<CustomComponent>");
      expect(result.content).toContain("Custom content here");
      expect(result.content).toContain("</CustomComponent>");
    });

    it("should handle multiple annotations in correct order", () => {
      const content = `# Title

:::callout-info
First annotation
:::

Some text

:::callout-warn
Second annotation
:::

More text`;

      const blocks: AnnotationBlock[] = [
        {
          type: "callout-info",
          content: "First annotation",
          attributes: {},
          startLine: 3,
          endLine: 5,
          originalText: ":::callout-info\nFirst annotation\n:::",
        },
        {
          type: "callout-warn",
          content: "Second annotation",
          attributes: {},
          startLine: 9,
          endLine: 11,
          originalText: ":::callout-warn\nSecond annotation\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain('<Callout type="info">');
      expect(result.content).toContain("First annotation");
      expect(result.content).toContain('<Callout type="warn">');
      expect(result.content).toContain("Second annotation");
    });

    it("should handle transformation errors gracefully", () => {
      const content = `:::unknown-type
Some content
:::`;

      const blocks: AnnotationBlock[] = [
        {
          type: "unknown-type",
          content: "Some content",
          attributes: {},
          startLine: 1,
          endLine: 3,
          originalText: ":::unknown-type\nSome content\n:::",
        },
      ];

      const result = transformer.transformAnnotations(content, blocks);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("error");
      expect(result.errors[0].message).toContain("unknown-type");
    });
  });
});
