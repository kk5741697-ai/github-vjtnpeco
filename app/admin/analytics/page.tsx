import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, Globe, Download, Calendar, Eye, MousePointer } from "lucide-react"

// Mock analytics data
const analyticsData = {
  overview: {
    totalVisits: 2450000,
    uniqueUsers: 1250000,
    toolRuns: 3450000,
    conversionRate: 3.2,
    avgSessionDuration: "4:32",
    bounceRate: 42.5,
  },
  topDomains: [
    { domain: "pixoratools.com", visits: 1250000, users: 650000, tools: 287 },
    { domain: "pixorapdf.com", visits: 450000, users: 220000, tools: 34 },
    { domain: "pixoraimg.com", visits: 380000, users: 180000, tools: 41 },
    { domain: "pixoraqrcode.com", visits: 220000, users: 110000, tools: 23 },
    { domain: "pixoracode.com", visits: 150000, users: 90000, tools: 52 },
  ],
  topTools: [
    { name: "PDF Merge", category: "PDF", runs: 234000, users: 45000 },
    { name: "Image Resize", category: "Image", runs: 198000, users: 38000 },
    { name: "QR Generator", category: "QR", runs: 156000, users: 32000 },
    { name: "JSON Formatter", category: "Code", runs: 134000, users: 28000 },
    { name: "Base64 Encoder", category: "Code", runs: 112000, users: 24000 },
  ],
  trafficSources: [
    { source: "Organic Search", percentage: 45.2, visits: 1107600 },
    { source: "Direct", percentage: 28.7, visits: 703150 },
    { source: "Social Media", percentage: 12.1, visits: 296450 },
    { source: "Referral", percentage: 8.9, visits: 218050 },
    { source: "Paid Search", percentage: 5.1, visits: 124950 },
  ],
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights across all domains and tools.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analyticsData.overview.totalVisits / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analyticsData.overview.uniqueUsers / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tool Runs</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analyticsData.overview.toolRuns / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.avgSessionDuration}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0:15</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+1.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Domains */}
        <Card>
          <CardHeader>
            <CardTitle>Top Domains</CardTitle>
            <CardDescription>Performance breakdown by domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topDomains.map((domain, index) => (
                <div key={domain.domain} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{domain.domain}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{(domain.visits / 1000).toFixed(0)}K visits</span>
                      <span>{(domain.users / 1000).toFixed(0)}K users</span>
                      <span>{domain.tools} tools</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tools</CardTitle>
            <CardDescription>Most used tools across all domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topTools.map((tool, index) => (
                <div key={tool.name} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {tool.category}
                      </Badge>
                      <span>{(tool.runs / 1000).toFixed(0)}K runs</span>
                      <span>{(tool.users / 1000).toFixed(0)}K users</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Where your visitors are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.trafficSources.map((source) => (
              <div key={source.source} className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{source.source}</p>
                    <span className="text-sm text-muted-foreground">{source.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{(source.visits / 1000).toFixed(0)}K visits</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
