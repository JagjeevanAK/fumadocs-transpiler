import { AnnotationParser } from "../parser";

describe("AnnotationParser", () => {
  let parser: AnnotationParser;

  beforeEach(() => {
    parser = new AnnotationParser();
  });

  describe("parseAnnotations", () => {
    it("should parse simple callout annotation", () => {
      const content = `# Title

::: callout-info
This is an info message
:::

Some text`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(errors).toHaveLength(0);
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toEqual({
        type: "callout-info",
        content: "This is an info message",
        attributes: {},
        startLine: 3,
        endLine: 5,
        originalText: "::: callout-info\nThis is an info message\n:::",
      });
    });

    it("should parse annotation with attributes", () => {
      const content = `::: code-block lang="javascript" title="Example"
console.log('Hello');
:::`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(errors).toHaveLength(0);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("code-block");
      expect(blocks[0].attributes).toEqual({
        lang: "javascript",
        title: "Example",
      });
      expect(blocks[0].content).toBe("console.log('Hello');");
    });

    it("should parse multiple annotations", () => {
      const content = `::: callout-info
First message
:::

::: callout-warn
Second message
:::`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(errors).toHaveLength(0);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe("callout-info");
      expect(blocks[1].type).toBe("callout-warn");
    });

    it("should handle multiline content", () => {
      const content = `::: tabs
Tab 1|Line 1
Line 2
Tab 2|Another line
:::`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(errors).toHaveLength(0);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].content).toBe(`Tab 1|Line 1
Line 2
Tab 2|Another line`);
    });

    it("should detect unclosed annotation blocks", () => {
      const content = `::: callout-info
This is not closed

Some other text`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(blocks).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("error");
      expect(errors[0].message).toContain("Unclosed annotation block");
    });

    it("should detect closing without opening", () => {
      const content = `Some text
:::
More text`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(blocks).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("error");
      expect(errors[0].message).toContain("closing annotation without opening");
    });

    it("should handle nested annotation attempt", () => {
      const content = `::: callout-info
Outer content
::: callout-warn
Inner content
:::
:::`;

      const { blocks, errors } = parser.parseAnnotations(content);

      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain("Unclosed annotation block");
      expect(errors[1].message).toContain("closing annotation without opening");
    });
  });

  describe("validateAnnotation", () => {
    it("should validate callout annotations", () => {
      const block = {
        type: "callout-info",
        content: "Valid content",
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: "::: callout-info\nValid content\n:::",
      };

      const errors = parser.validateAnnotation(block);
      expect(errors).toHaveLength(0);
    });

    it("should warn about empty callout content", () => {
      const block = {
        type: "callout-info",
        content: "   ",
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: "::: callout-info\n   \n:::",
      };

      const errors = parser.validateAnnotation(block);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
      expect(errors[0].message).toContain("empty content");
    });

    it("should validate tabs content format", () => {
      const validBlock = {
        type: "tabs",
        content: "Tab 1|Content 1\nTab 2|Content 2",
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: "::: tabs\nTab 1|Content 1\nTab 2|Content 2\n:::",
      };

      const errors = parser.validateAnnotation(validBlock);
      expect(errors).toHaveLength(0);
    });

    it("should error on invalid tabs format", () => {
      const invalidBlock = {
        type: "tabs",
        content: "Tab 1 without pipe\nTab 2|Content 2",
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: "::: tabs\nTab 1 without pipe\nTab 2|Content 2\n:::",
      };

      const errors = parser.validateAnnotation(invalidBlock);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("error");
    });

    it("should validate steps content format", () => {
      const validBlock = {
        type: "steps",
        content: "Step 1: First step\nStep 2: Second step",
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: "::: steps\nStep 1: First step\nStep 2: Second step\n:::",
      };

      const errors = parser.validateAnnotation(validBlock);
      expect(errors).toHaveLength(0);
    });

    it("should require lang attribute for code blocks", () => {
      const block = {
        type: "code-block",
        content: 'console.log("test");',
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: '::: code-block\nconsole.log("test");\n:::',
      };

      const errors = parser.validateAnnotation(block);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
      expect(errors[0].message).toContain("lang");
    });

    it("should warn about unknown annotation types", () => {
      const block = {
        type: "unknown-type",
        content: "Some content",
        attributes: {},
        startLine: 1,
        endLine: 3,
        originalText: "::: unknown-type\nSome content\n:::",
      };

      const errors = parser.validateAnnotation(block);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
      expect(errors[0].message).toContain("Unknown annotation type");
    });
  });
});
