"use client"

import { TextToolLayout } from "@/components/text-tool-layout"
import { Type } from "lucide-react"

const caseExamples = [
  {
    name: "Mixed Case",
    content: "Hello World! This is a SAMPLE text for CASE conversion.",
  },
  {
    name: "Programming",
    content: "myVariableName getUserData processFormInput",
  },
  {
    name: "Sentence",
    content: "the quick brown fox jumps over the lazy dog",
  },
]

const caseOptions = [
  {
    key: "caseType",
    label: "Case Type",
    type: "select" as const,
    defaultValue: "lower",
    selectOptions: [
      { value: "lower", label: "lowercase" },
      { value: "upper", label: "UPPERCASE" },
      { value: "title", label: "Title Case" },
      { value: "sentence", label: "Sentence case" },
      { value: "camel", label: "camelCase" },
      { value: "pascal", label: "PascalCase" },
      { value: "snake", label: "snake_case" },
      { value: "kebab", label: "kebab-case" },
      { value: "constant", label: "CONSTANT_CASE" },
    ],
  },
]

function processTextCase(input: string, options: any = {}) {
  try {
    let output: string

    switch (options.caseType) {
      case "upper":
        output = input.toUpperCase()
        break
      case "lower":
        output = input.toLowerCase()
        break
      case "title":
        output = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        break
      case "sentence":
        output = input.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
        break
      case "camel":
        output = input
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
          .replace(/\s+/g, "")
        break
      case "pascal":
        output = input.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, "")
        break
      case "snake":
        output = input
          .replace(/\W+/g, " ")
          .split(/ |\B(?=[A-Z])/)
          .map((word) => word.toLowerCase())
          .join("_")
        break
      case "kebab":
        output = input
          .replace(/\W+/g, " ")
          .split(/ |\B(?=[A-Z])/)
          .map((word) => word.toLowerCase())
          .join("-")
        break
      case "constant":
        output = input
          .replace(/\W+/g, " ")
          .split(/ |\B(?=[A-Z])/)
          .map((word) => word.toUpperCase())
          .join("_")
        break
      default:
        output = input.toLowerCase()
    }

    const stats = {
      Words: `${input.trim().split(/\s+/).length}`,
      Characters: `${input.length}`,
      "Case Changes": `${countCaseChanges(input, output)}`,
    }

    return { output, stats }
  } catch (error) {
    return {
      output: "",
      error: "Case conversion failed",
    }
  }
}

function countCaseChanges(input: string, output: string): number {
  let changes = 0
  for (let i = 0; i < Math.min(input.length, output.length); i++) {
    if (input[i] !== output[i]) {
      changes++
    }
  }
  return changes
}

export default function TextCaseConverterPage() {
  return (
    <TextToolLayout
      title="Text Case Converter"
      description="Convert text between different cases: lowercase, UPPERCASE, Title Case, camelCase, snake_case, kebab-case, and more."
      icon={Type}
      placeholder="Enter text to convert case..."
      outputPlaceholder="Converted text will appear here..."
      processFunction={processTextCase}
      options={caseOptions}
      examples={caseExamples}
      fileExtensions={[".txt"]}
    />
  )
}
