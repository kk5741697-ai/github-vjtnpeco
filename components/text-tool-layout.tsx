"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Copy, 
  Download, 
  Upload, 
  Link, 
  RefreshCw,
  Settings,
  Trash2,
  Eye,
  Share2,
  FileText
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ToolOption {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "slider"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
}

interface Example {
  name: string
  content: string
}

interface TextToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  outputPlaceholder: string
  processFunction: (input: string, options: any) => { output: string; error?: string; stats?: any }
  validateFunction?: (input: string) => { isValid: boolean; error?: string }
  options?: ToolOption[]
  examples?: Example[]
  fileExtensions?: string[]
}

export function TextToolLayout({
  title,
  description,
  icon: Icon,
  placeholder,
  outputPlaceholder,
  processFunction,
  validateFunction,
  options = [],
  examples = [],
  fileExtensions = [".txt"]
}: TextToolLayoutProps) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<any>(null)
  const [processingOptions, setProcessingOptions] = useState<Record<string, any>>({})

  // Initialize default options
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setProcessingOptions(defaultOptions)
  }, [options])

  useEffect(() => {
    if (autoUpdate && input.trim()) {
      processText()
    } else if (!input.trim()) {
      setOutput("")
      setError("")
      setStats(null)
    }
  }, [input, autoUpdate, processingOptions])

  const processText = () => {
    if (validateFunction) {
      const validation = validateFunction(input)
      if (!validation.isValid) {
        setError(validation.error || "Invalid input")
        setOutput("")
        setStats(null)
        return
      }
    }

    const result = processFunction(input, processingOptions)
    setOutput(result.output)
    setError(result.error || "")
    setStats(result.stats)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied successfully"
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadExample = (exampleContent: string) => {
    setInput(exampleContent)
  }

  const clearInput = () => {
    setInput("")
    setOutput("")
    setError("")
    setStats(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Icon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" onClick={() => setProcessingOptions({})}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={processText}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(input)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(input, `input${fileExtensions[0]}`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearInput}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500">Input</div>
              </div>
              
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <FileText className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="file">
                    <Upload className="h-4 w-4 mr-2" />
                    File
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0"
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Lines: {input.split('\n').length} | Chars: {input.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(output, `output${fileExtensions[0]}`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-medium bg-gray-800 text-white px-2 py-1 rounded">
                  Output
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-update"
                  checked={autoUpdate}
                  onCheckedChange={setAutoUpdate}
                />
                <Label htmlFor="auto-update" className="text-sm">Auto Update</Label>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="min-h-[400px] flex items-center justify-center text-red-500 bg-red-50 rounded border">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={output}
                  readOnly
                  placeholder={outputPlaceholder}
                  className="min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0"
                />
              )}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Lines: {output.split('\n').length} | Chars: {output.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options Panel */}
        {options.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((option) => (
                  <div key={option.key}>
                    <Label htmlFor={option.key} className="text-sm font-medium">
                      {option.label}
                    </Label>
                    
                    {option.type === "select" && (
                      <select
                        id={option.key}
                        value={processingOptions[option.key] || option.defaultValue}
                        onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white mt-1"
                      >
                        {option.selectOptions?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {option.type === "slider" && (
                      <div className="mt-2">
                        <Slider
                          value={[processingOptions[option.key] || option.defaultValue]}
                          onValueChange={(value) => setProcessingOptions(prev => ({ ...prev, [option.key]: value[0] }))}
                          min={option.min || 0}
                          max={option.max || 100}
                          step={option.step || 1}
                        />
                        <div className="text-center text-sm text-gray-500 mt-1">
                          {processingOptions[option.key] || option.defaultValue}
                        </div>
                      </div>
                    )}
                    
                    {option.type === "checkbox" && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id={option.key}
                          checked={processingOptions[option.key] || option.defaultValue}
                          onCheckedChange={(checked) => setProcessingOptions(prev => ({ ...prev, [option.key]: checked }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Panel */}
        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{value as string}</p>
                    <p className="text-sm text-gray-500">{key}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
              <CardDescription>Click an example to load it into the editor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {examples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => loadExample(example.content)}
                    className="h-auto p-4 text-left justify-start"
                  >
                    <div>
                      <div className="font-medium">{example.name}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {example.content.substring(0, 50)}...
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  )
}