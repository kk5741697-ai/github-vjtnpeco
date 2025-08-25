"use client"

import { TextToolLayout } from "@/components/text-tool-layout"
import { Link } from "lucide-react"

const urlExamples = [
  {
    name: "Query String",
    content: "name=John Doe&email=john@example.com&message=Hello World!",
  },
  {
    name: "URL with Spaces",
    content: "https://example.com/search?q=hello world&category=web tools",
  },
  {
    name: "Special Characters",
    content: "user@domain.com?param=value&special=!@#$%^&*()",
  },
]

const urlOptions = [
  {
    key: "operation",
    label: "Operation",
    type: "select" as const,
    defaultValue: "encode",
    selectOptions: [
      { value: "encode", label: "URL Encode" },
      { value: "decode", label: "URL Decode" },
    ],
  },
  {
    key: "encodeType",
    label: "Encoding Type",
    type: "select" as const,
    defaultValue: "component",
    selectOptions: [
      { value: "component", label: "Component (recommended)" },
      { value: "uri", label: "Full URI" },
    ],
  },
]

function processURL(input: string, options: any = {}) {
  try {
    let output: string

    if (options.operation === "decode") {
      // Decode URL
      output = decodeURIComponent(input)
    } else {
      // Encode URL
      if (options.encodeType === "uri") {
        output = encodeURI(input)
      } else {
        output = encodeURIComponent(input)
      }
    }

    const stats = {
      "Input Length": `${input.length} chars`,
      "Output Length": `${output.length} chars`,
      "Encoded Characters":
        options.operation === "encode"
          ? `${(output.match(/%/g) || []).length / 3}`
          : `${(input.match(/%/g) || []).length / 3}`,
    }

    return { output, stats }
  } catch (error) {
    return {
      output: "",
      error: options.operation === "decode" ? "Invalid URL encoding" : "Encoding failed",
    }
  }
}

export default function URLEncoderPage() {
  return (
    <TextToolLayout
      title="URL Encoder/Decoder"
      description="Encode URLs and query parameters or decode URL-encoded strings. Essential for web development and API integration."
      icon={Link}
      placeholder="Enter URL or text to encode/decode..."
      outputPlaceholder="Encoded/decoded URL will appear here..."
      processFunction={processURL}
      options={urlOptions}
      examples={urlExamples}
      fileExtensions={[".txt", ".url"]}
    />
  )
}
