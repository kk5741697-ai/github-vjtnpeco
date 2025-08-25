"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Heart,
  AlertCircle,
  FileText
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ToolOption {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "slider" | "color"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
}

interface TextExample {
  name: string
  content: string
}

interface TextToolLayoutProps {
  title: string
  description: string
  icon: any
  placeholder: string
  outputPlaceholder: string
  processFunction: (input: string, options: any) => { output: string; error?: string; stats?: any }
  validateFunction?: (input: string) => { isValid: boolean; error?: string }
  options?: ToolOption[]
  examples?: TextExample[]
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
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  useEffect(() => {
    if (autoUpdate && input.trim()) {
      processText()
    } else if (!input.trim()) {
      setOutput("")
      setError("")
      setStats(null)
    }
  }, [input, autoUpdate, toolOptions])

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

    const result = processFunction(input, toolOptions)
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
      console.error("Failed to copy:", error)
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

  const getFileExtension = () => {
    return fileExtensions[0] || ".txt"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">Code</span>
            <Heart className="h-6 w-6 text-teal-500 fill-teal-500" />
            <span className="text-2xl font-bold text-gray-900">Beautify</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">{title}</h1>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button variant="ghost" className="text-blue-600">
              <Heart className="h-4 w-4 mr-2" />
              Add to Fav
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">
              New
            </Button>
            <Button variant="outline">
              Save & Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(input)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(input, `input${getFileExtension()}`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setInput("")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500">Sample</div>
              </div>
              
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <FileText className="h-4 w-4 mr-2" />
                    File
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <Link className="h-4 w-4 mr-2" />
                    URL
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
                <span>Ln: {input.split('\n').length} Col: {input.length}</span>
                <div className="flex space-x-4">
                  <span>JSON</span>
                  <span>UTF-8</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(output, `output${getFileExtension()}`)}>
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
                <label htmlFor="auto-update" className="text-sm">Auto Update</label>
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
                <span>Ln: {output.split('\n').length} Col: {output.length}</span>
                <div className="flex space-x-4">
                  <span>TOML</span>
                  <span>UTF-8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tool Options */}
        {options.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((option) => (
                  <div key={option.key} className="space-y-2">
                    <Label className="text-sm font-medium">{option.label}</Label>
                    
                    {option.type === "select" && (
                      <Select
                        value={toolOptions[option.key]?.toString()}
                        onValueChange={(value) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {option.selectOptions?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {option.type === "checkbox" && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={toolOptions[option.key] || false}
                          onCheckedChange={(checked) => setToolOptions(prev => ({ ...prev, [option.key]: checked }))}
                        />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    )}

                    {option.type === "slider" && (
                      <div className="space-y-2">
                        <Slider
                          value={[toolOptions[option.key] || option.defaultValue]}
                          onValueChange={([value]) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
                          min={option.min}
                          max={option.max}
                          step={option.step}
                        />
                        <div className="text-xs text-gray-500 text-center">
                          {toolOptions[option.key] || option.defaultValue}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button 
            onClick={processText}
            className="bg-teal-500 hover:bg-teal-600 text-white px-8"
            size="lg"
          >
            {title}
          </Button>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => downloadFile(output, `converted${getFileExtension()}`)}
              disabled={!output}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" className="text-blue-600">
              JSON Sorter
            </Button>
          </div>
        </div>

        {/* Stats Display */}
        {stats && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-sm text-gray-600">{key}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
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
          </div>
        )}
      </div>
    </div>
  )
}