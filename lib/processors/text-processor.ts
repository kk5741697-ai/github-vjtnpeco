export interface TextProcessingOptions {
  indent?: number | string
  sortKeys?: boolean
  removeComments?: boolean
  minify?: boolean
  beautify?: boolean
  caseType?: "lower" | "upper" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant"
  operation?: "encode" | "decode"
  algorithm?: "md5" | "sha1" | "sha256" | "sha512"
  outputFormat?: "hex" | "base64"
  uppercase?: boolean
}

export class TextProcessor {
  static processJSON(input: string, options: TextProcessingOptions = {}): { output: string; error?: string; stats?: any } {
    try {
      const parsed = JSON.parse(input)
      
      // Sort keys if requested
      const processedData = options.sortKeys ? this.sortObjectKeys(parsed) : parsed
      
      // Determine indentation
      let indent: string | number = 2
      if (options.indent === "tab") {
        indent = "\t"
      } else if (typeof options.indent === "number") {
        indent = options.indent
      }

      // Format or minify
      const output = options.minify 
        ? JSON.stringify(processedData)
        : JSON.stringify(processedData, null, indent)

      const stats = {
        "Original Size": `${input.length} chars`,
        "Formatted Size": `${output.length} chars`,
        "Objects": this.countObjects(parsed),
        "Arrays": this.countArrays(parsed),
      }

      return { output, stats }
    } catch (error) {
      return {
        output: "",
        error: error instanceof Error ? error.message : "Invalid JSON format",
      }
    }
  }

  static processBase64(input: string, options: TextProcessingOptions = {}): { output: string; error?: string; stats?: any } {
    try {
      let output: string

      if (options.operation === "decode") {
        // Decode from Base64
        let base64Input = input.trim()

        // Handle URL-safe Base64
        if (options.outputFormat === "base64") {
          base64Input = base64Input.replace(/-/g, "+").replace(/_/g, "/")
        }

        // Add padding if needed
        while (base64Input.length % 4) {
          base64Input += "="
        }

        output = atob(base64Input)
      } else {
        // Encode to Base64
        output = btoa(input)

        // Handle URL-safe Base64
        if (options.outputFormat === "base64") {
          output = output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
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

  static processURL(input: string, options: TextProcessingOptions = {}): { output: string; error?: string; stats?: any } {
    try {
      let output: string

      if (options.operation === "decode") {
        output = decodeURIComponent(input)
      } else {
        output = encodeURIComponent(input)
      }

      const stats = {
        "Input Length": `${input.length} chars`,
        "Output Length": `${output.length} chars`,
        "Encoded Characters": options.operation === "encode" 
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

  static processTextCase(input: string, options: TextProcessingOptions = {}): { output: string; error?: string; stats?: any } {
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
          output = input.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          )
          break
        case "sentence":
          output = input.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
          break
        case "camel":
          output = input
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, "")
          break
        case "pascal":
          output = input
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
            .replace(/\s+/g, "")
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
        "Words": `${input.trim().split(/\s+/).length}`,
        "Characters": `${input.length}`,
        "Case Changes": `${this.countCaseChanges(input, output)}`,
      }

      return { output, stats }
    } catch (error) {
      return {
        output: "",
        error: "Case conversion failed",
      }
    }
  }

  static processHash(input: string, options: TextProcessingOptions = {}): { output: string; error?: string; stats?: any } {
    try {
      // Simple hash implementation for demo
      let hash = this.simpleHash(input, options.algorithm || "sha256")

      // Convert to base64 if requested
      if (options.outputFormat === "base64") {
        const bytes = hash.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || []
        hash = btoa(String.fromCharCode(...bytes))
      }

      // Apply case transformation
      const output = options.uppercase ? hash.toUpperCase() : hash.toLowerCase()

      const stats = {
        "Algorithm": (options.algorithm || "sha256").toUpperCase(),
        "Input Length": `${input.length} chars`,
        "Hash Length": `${output.length} chars`,
        "Format": (options.outputFormat || "hex").toUpperCase(),
      }

      return { output, stats }
    } catch (error) {
      return {
        output: "",
        error: "Hash generation failed",
      }
    }
  }

  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  static generatePassword(length: number, options: {
    includeUppercase?: boolean
    includeLowercase?: boolean
    includeNumbers?: boolean
    includeSymbols?: boolean
    excludeSimilar?: boolean
  } = {}): string {
    let charset = ""

    if (options.includeUppercase !== false) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (options.includeLowercase !== false) charset += "abcdefghijklmnopqrstuvwxyz"
    if (options.includeNumbers !== false) charset += "0123456789"
    if (options.includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if (options.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, "")
    }

    if (charset === "") {
      throw new Error("No character types selected")
    }

    let result = ""
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    return result
  }

  private static simpleHash(str: string, algorithm: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    // Simulate different algorithms with different transformations
    switch (algorithm) {
      case "md5":
        return Math.abs(hash).toString(16).padStart(32, "0").substring(0, 32)
      case "sha1":
        return Math.abs(hash * 1.1).toString(16).padStart(40, "0").substring(0, 40)
      case "sha256":
        return Math.abs(hash * 1.2).toString(16).padStart(64, "0").substring(0, 64)
      case "sha512":
        return Math.abs(hash * 1.3).toString(16).padStart(128, "0").substring(0, 128)
      default:
        return Math.abs(hash).toString(16)
    }
  }

  private static sortObjectKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(this.sortObjectKeys)
    } else if (obj !== null && typeof obj === "object") {
      const sorted: any = {}
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          sorted[key] = this.sortObjectKeys(obj[key])
        })
      return sorted
    }
    return obj
  }

  private static countObjects(obj: any): number {
    let count = 0
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
      count = 1
      Object.values(obj).forEach((value) => {
        count += this.countObjects(value)
      })
    } else if (Array.isArray(obj)) {
      obj.forEach((item) => {
        count += this.countObjects(item)
      })
    }
    return count
  }

  private static countArrays(obj: any): number {
    let count = 0
    if (Array.isArray(obj)) {
      count = 1
      obj.forEach((item) => {
        count += this.countArrays(item)
      })
    } else if (obj !== null && typeof obj === "object") {
      Object.values(obj).forEach((value) => {
        count += this.countArrays(value)
      })
    }
    return count
  }

  private static countCaseChanges(input: string, output: string): number {
    let changes = 0
    for (let i = 0; i < Math.min(input.length, output.length); i++) {
      if (input[i] !== output[i]) {
        changes++
      }
    }
    return changes
  }
}