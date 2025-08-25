import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Wrench,
  Plus,
  Search,
  Settings,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock tools data
const tools = [
  {
    id: "1",
    slug: "pdf-merge",
    title: "PDF Merge",
    category: "PDF",
    description: "Combine multiple PDF files into one document",
    isActive: true,
    isPremium: false,
    supportsBulk: true,
    monthlyUsage: 15234,
    domains: ["pixoratools.com", "pixorapdf.com"],
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    slug: "image-resize",
    title: "Image Resize",
    category: "IMAGE",
    description: "Resize images by pixels, percentage, or aspect ratio",
    isActive: true,
    isPremium: false,
    supportsBulk: true,
    monthlyUsage: 12456,
    domains: ["pixoratools.com", "pixoraimg.com"],
    lastUpdated: "2024-01-14",
  },
  {
    id: "3",
    slug: "qr-generator",
    title: "QR Code Generator",
    category: "QR_BARCODE",
    description: "Generate custom QR codes with logos and colors",
    isActive: true,
    isPremium: false,
    supportsBulk: false,
    monthlyUsage: 9876,
    domains: ["pixoratools.com", "pixoraqrcode.com"],
    lastUpdated: "2024-01-13",
  },
  {
    id: "4",
    slug: "json-formatter",
    title: "JSON Formatter",
    category: "CODE_DEV",
    description: "Beautify, validate, and minify JSON data",
    isActive: true,
    isPremium: false,
    supportsBulk: false,
    monthlyUsage: 8765,
    domains: ["pixoratools.com", "pixoracode.com"],
    lastUpdated: "2024-01-12",
  },
  {
    id: "5",
    slug: "pdf-compress",
    title: "PDF Compress",
    category: "PDF",
    description: "Reduce PDF file size while maintaining quality",
    isActive: false,
    isPremium: true,
    supportsBulk: true,
    monthlyUsage: 5432,
    domains: ["pixoratools.com", "pixorapdf.com"],
    lastUpdated: "2024-01-10",
  },
]

const categories = ["All", "PDF", "IMAGE", "QR_BARCODE", "CODE_DEV", "SEO", "NETWORK", "UTILITIES"]

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tools Management</h1>
          <p className="text-muted-foreground">Manage your tool catalog, configurations, and domain assignments.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      </div>

      {/* Tools Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
            <p className="text-xs text-muted-foreground">{tools.filter((t) => t.isActive).length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(tools.reduce((sum, tool) => sum + tool.monthlyUsage, 0) / 1000)}K
            </div>
            <p className="text-xs text-muted-foreground">Total tool runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Tools</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.filter((t) => t.isPremium).length}</div>
            <p className="text-xs text-muted-foreground">Subscription required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulk Support</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.filter((t) => t.supportsBulk).length}</div>
            <p className="text-xs text-muted-foreground">Multi-file processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tools</CardTitle>
              <CardDescription>Manage tool configurations, enable/disable, and assign to domains.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="All">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tools..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tool.title}</div>
                      <div className="text-sm text-muted-foreground">{tool.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tool.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch checked={tool.isActive} />
                      {tool.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {tool.isPremium && (
                        <Badge variant="outline" className="text-xs">
                          Premium
                        </Badge>
                      )}
                      {tool.supportsBulk && (
                        <Badge variant="outline" className="text-xs">
                          Bulk
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tool.monthlyUsage.toLocaleString()}
                      <div className="text-xs text-muted-foreground">this month</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tool.domains.length} domains
                      <div className="text-xs text-muted-foreground">
                        {tool.domains[0]}
                        {tool.domains.length > 1 && ` +${tool.domains.length - 1}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
