import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Globe, Plus, Search, Settings, Eye, MoreHorizontal, CheckCircle, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock domain data
const domains = [
  {
    id: "1",
    host: "pixoratools.com",
    name: "PixoraTools",
    category: "Global",
    status: "active",
    toolsCount: 287,
    monthlyVisits: 1250000,
    lastUpdated: "2024-01-15",
    primaryColor: "#164e63",
  },
  {
    id: "2",
    host: "pixorapdf.com",
    name: "PixoraPDF",
    category: "PDF",
    status: "active",
    toolsCount: 34,
    monthlyVisits: 450000,
    lastUpdated: "2024-01-14",
    primaryColor: "#dc2626",
  },
  {
    id: "3",
    host: "pixoraimg.com",
    name: "PixoraIMG",
    category: "Image",
    status: "active",
    toolsCount: 41,
    monthlyVisits: 380000,
    lastUpdated: "2024-01-13",
    primaryColor: "#7c3aed",
  },
  {
    id: "4",
    host: "pixoraqrcode.com",
    name: "PixoraQRCode",
    category: "QR",
    status: "active",
    toolsCount: 23,
    monthlyVisits: 220000,
    lastUpdated: "2024-01-12",
    primaryColor: "#059669",
  },
  {
    id: "5",
    host: "pixoracode.com",
    name: "PixoraCode",
    category: "Code",
    status: "maintenance",
    toolsCount: 52,
    monthlyVisits: 180000,
    lastUpdated: "2024-01-10",
    primaryColor: "#ea580c",
  },
]

export default function DomainsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
          <p className="text-muted-foreground">Manage your multi-domain tool ecosystem and configurations.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {/* Domain Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domains.length}</div>
            <p className="text-xs text-muted-foreground">
              {domains.filter((d) => d.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domains.reduce((sum, domain) => sum + domain.toolsCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Visits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(domains.reduce((sum, domain) => sum + domain.monthlyVisits, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Combined traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((domains.filter((d) => d.status === "active").length / domains.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Domains operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Domains</CardTitle>
              <CardDescription>Manage domain configurations, branding, and tool assignments.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search domains..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead>Monthly Visits</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: domain.primaryColor }} />
                      <div>
                        <div className="font-medium">{domain.name}</div>
                        <div className="text-sm text-muted-foreground">{domain.host}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{domain.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {domain.status === "active" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="capitalize">{domain.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{domain.toolsCount}</TableCell>
                  <TableCell>{(domain.monthlyVisits / 1000).toFixed(0)}K</TableCell>
                  <TableCell>{domain.lastUpdated}</TableCell>
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
                          View Site
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Globe className="h-4 w-4 mr-2" />
                          Manage Tools
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
