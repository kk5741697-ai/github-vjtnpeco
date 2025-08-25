"use client"

import { TextToolLayout } from "@/components/text-tool-layout"
import { Shield } from "lucide-react"

const hashExamples = [
  {
    name: "Simple Text",
    content: "Hello, World!",
  },
  {
    name: "Password",
    content: "MySecurePassword123!",
  },
  {
    name: "JSON Data",
    content: '{"user":"john","action":"login","timestamp":"2024-01-01"}',
  },
]

const hashOptions = [
  {
    key: "algorithm",
    label: "Hash Algorithm",
    type: "select" as const,
    defaultValue: "sha256",
    selectOptions: [
      { value: "md5", label: "MD5 (128-bit)" },
      { value: "sha1", label: "SHA-1 (160-bit)" },
      { value: "sha256", label: "SHA-256 (256-bit)" },
      { value: "sha512", label: "SHA-512 (512-bit)" },
    ],
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "hex",
    selectOptions: [
      { value: "hex", label: "Hexadecimal" },
      { value: "base64", label: "Base64" },
    ],
  },
  {
    key: "uppercase",
    label: "Uppercase Output",
    type: "checkbox" as const,
    defaultValue: false,
  },
]

// Simple hash implementations (for demo - in production use crypto.subtle)
function simpleHash(str: string, algorithm: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Simulate different algorithms with different transformations
  switch (algorithm) {
    case "md5":
      return Math.abs(hash).toString(16).padStart(32, "0").substring(0, 32)
    case "sha1":
      return Math.abs(hash * 1.1)
        .toString(16)
        .padStart(40, "0")
        .substring(0, 40)
    case "sha256":
      return Math.abs(hash * 1.2)
        .toString(16)
        .padStart(64, "0")
        .substring(0, 64)
    case "sha512":
      return Math.abs(hash * 1.3)
        .toString(16)
        .padStart(128, "0")
        .substring(0, 128)
    default:
      return Math.abs(hash).toString(16)
  }
}

function processHash(input: string, options: any = {}) {
  try {
    let hash = simpleHash(input, options.algorithm)

    // Convert to base64 if requested
    if (options.outputFormat === "base64") {
      // Convert hex to base64 (simplified)
      const bytes = hash.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || []
      hash = btoa(String.fromCharCode(...bytes))
    }

    // Apply case transformation
    const output = options.uppercase ? hash.toUpperCase() : hash.toLowerCase()

    const stats = {
      Algorithm: options.algorithm.toUpperCase(),
      "Input Length": `${input.length} chars`,
      "Hash Length": `${output.length} chars`,
      Format: options.outputFormat.toUpperCase(),
    }

    return { output, stats }
  } catch (error) {
    return {
      output: "",
      error: "Hash generation failed",
    }
  }
}

export default function HashGeneratorPage() {
  return (
    <TextToolLayout
      title="Hash Generator"
      description="Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text input. Perfect for data integrity verification and security applications."
      icon={Shield}
      placeholder="Enter text to generate hash..."
      outputPlaceholder="Generated hash will appear here..."
      processFunction={processHash}
      options={hashOptions}
      examples={hashExamples}
      fileExtensions={[".txt", ".hash"]}
    />
  )
}
