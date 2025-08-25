"use client"

import { TextToolLayout } from "@/components/text-tool-layout"
import { Lock } from "lucide-react"

const base64Examples = [
  {
    name: "Simple Text",
    content: "Hello, World!",
  },
  {
    name: "URL",
    content: "https://example.com/api/data?param=value",
  },
  {
    name: "JSON",
    content: '{"message":"Hello","timestamp":"2024-01-01T00:00:00Z"}',
  },
]

const base64Options = [
  {
    key: "operation",
    label: "Operation",
    type: "select" as const,
    defaultValue: "encode",
    selectOptions: [
      { value: "encode", label: "Encode to Base64" },
      { value: "decode", label: "Decode from Base64" },
    ],
  },
  {
    key: "urlSafe",
    label: "URL Safe",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "addPadding",
    label: "Add Padding",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

function processBase64(input: string, options: any = {}) {
  try {
    let output: string

    if (options.operation === "decode") {
      // Decode from Base64
      let base64Input = input.trim()

      // Handle URL-safe Base64
      if (options.urlSafe) {
        base64Input = base64Input.replace(/-/g, "+").replace(/_/g, "/")
      }

      // Add padding if needed
      if (options.addPadding) {
        while (base64Input.length % 4) {
          base64Input += "="
        }
      }

      output = atob(base64Input)
    } else {
      // Encode to Base64
      output = btoa(input)

      // Handle URL-safe Base64
      if (options.urlSafe) {
        output = output.replace(/\+/g, "-").replace(/\//g, "_")
      }

      // Remove padding if requested
      if (!options.addPadding) {
        output = output.replace(/=/g, "")
      }
    }

    const stats = {
      "Input Length": `${input.length} chars`,
      "Output Length": `${output.length} chars`,
      "Size Change": `${((output.length / input.length - 1) * 100).toFixed(1)}%`,
    }

    return { output, stats }
  } catch (error) {
    return {
      output: "",
      error: options.operation === "decode" ? "Invalid Base64 format" : "Encoding failed",
    }
  }
}

function validateBase64(input: string) {
  // Basic validation - just check if input exists
  if (!input.trim()) {
    return { isValid: false, error: "Input cannot be empty" }
  }
  return { isValid: true }
}

export default function Base64EncoderPage() {
  return (
    <TextToolLayout
      title="Base64 Encoder/Decoder"
      description="Encode text to Base64 or decode Base64 strings back to text. Supports URL-safe encoding and custom padding options."
      icon={Lock}
      placeholder="Enter text to encode or Base64 to decode..."
      outputPlaceholder="Encoded/decoded result will appear here..."
      processFunction={processBase64}
      validateFunction={validateBase64}
      options={base64Options}
      examples={base64Examples}
      fileExtensions={[".txt", ".b64"]}
    />
  )
}
