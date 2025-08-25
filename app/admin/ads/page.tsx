import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  Plus,
  Search,
  Settings,
  MoreHorizontal,
  Eye,
  DollarSign,
  MousePointer,
  TrendingUp,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock ad slots data
const adSlots = [
  {
    id: "1",
    name: "Header Banner",
    adUnitPath: "/12345678/header-banner",
    type: "banner",
    sizes: "728x90, 970x90, 320x50",
    position: "header",
    isActive: true,
    autoRefresh: true,
    refreshInterval: 60,
    impressions: 125000,
    clicks: 2500,
    revenue: 450.25,
    ctr: 2.0,
    domains: ["pixoratools.com", "pixorapdf.com"],
  },
  {
    id: "2",
    name: "Sidebar Banner",
    adUnitPath: "/12345678/sidebar-banner",
    type: "banner",
    sizes: "300x250, 300x600",
    position: "sidebar",
    isActive: true,
    autoRefresh: true,
    refreshInterval: 120,
    impressions: 89000,
    clicks: 1780,
    revenue: 320.15,
    ctr: 2.0,
    domains: ["pixoratools.com"],
  },
  {
    id: "3",
    name: "Mobile Sticky",
    adUnitPath: "/12345678/mobile-sticky",
    type: "sticky",
    sizes: "320x50, 728x90",
    position: "sticky",
    isActive: true,
    autoRefresh: true,
    refreshInterval: 90,
    impressions: 67000,
    clicks: 1005,
    revenue: 180.75,
    ctr: 1.5,
    domains: ["all"],
  },
  {
    id: "4",
    name: "Rewarded Video",
    adUnitPath: "/12345678/rewarded-video",
    type: "rewarded",
    sizes: "640x480, 320x240",
    position: "modal",
    isActive: true,
    autoRefresh: false,
    refreshInterval: 0,
    impressions: 12000,
    clicks: 8400,
    revenue: 840.0,
    ctr: 70.0,
    domains: ["all"],
  },
  {
    id: "5",
    name: "Inline Content",
    adUnitPath: "/12345678/inline-content",
    type: "responsive",
    sizes: "728x90, 970x250, 300x250",
    position: "inline",
    isActive: false,
    autoRefresh: false,
    refreshInterval: 0,
    impressions: 0,
    clicks: 0,
    revenue: 0,
    ctr: 0,
    domains: ["pixoraimg.com", "pixoraqrcode.com"],
  },
]

const adTypes = ["All", "banner", "sticky", "responsive", "video", "interstitial", "rewarded"]

export default function AdsPage() {
  const totalRevenue = adSlots.reduce((sum, slot) => sum + slot.revenue, 0)
  const totalImpressions = adSlots.reduce((sum, slot) => sum + slot.impressions, 0)
  const totalClicks = adSlots.reduce((sum, slot) => sum + slot.clicks, 0)
  const avgCTR = totalClicks > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ad Management</h1>
          <p className="text-muted-foreground">
            Manage Google Ad Manager slots, targeting, and performance across all domains.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Ad Slot
        </Button>
      </div>

      {/* Ad Performance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalImpressions / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalClicks / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ad Slots Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ad Slots</CardTitle>
              <CardDescription>Manage ad slot configurations, targeting, and performance.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="All">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {adTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search ad slots..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Slot</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adSlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{slot.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {slot.position} • {slot.sizes}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{slot.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch checked={slot.isActive} />
                      {slot.autoRefresh && (
                        <Badge variant="outline" className="text-xs">
                          Auto {slot.refreshInterval}s
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{(slot.impressions / 1000).toFixed(0)}K impressions</div>
                      <div className="text-muted-foreground">
                        {slot.clicks} clicks • {slot.ctr}% CTR
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${slot.revenue.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {slot.domains.includes("all") ? "All domains" : `${slot.domains.length} domains`}
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
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
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
