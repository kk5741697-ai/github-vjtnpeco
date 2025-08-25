import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Wrench, Globe, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Settings } from "lucide-react"

// Mock data - in real app this would come from database
const dashboardStats = {
  totalUsers: 12543,
  activeTools: 287,
  totalDomains: 8,
  monthlyRevenue: 45230,
  toolRuns: 156789,
  errorRate: 0.02,
  uptime: 99.97,
  pendingJobs: 23,
}

const recentActivity = [
  { id: 1, action: "New user registered", user: "john@example.com", time: "2 minutes ago", type: "user" },
  { id: 2, action: "PDF merge completed", user: "sarah@company.com", time: "5 minutes ago", type: "tool" },
  { id: 3, action: "Domain updated", user: "admin@pixora.com", time: "10 minutes ago", type: "domain" },
  { id: 4, action: "Subscription upgraded", user: "mike@startup.io", time: "15 minutes ago", type: "subscription" },
  { id: 5, action: "Tool error reported", user: "system", time: "20 minutes ago", type: "error" },
]

const topTools = [
  { name: "PDF Merge", usage: 15234, category: "PDF" },
  { name: "Image Resize", usage: 12456, category: "Image" },
  { name: "QR Generator", usage: 9876, category: "QR" },
  { name: "JSON Formatter", usage: 8765, category: "Code" },
  { name: "Base64 Encoder", usage: 7654, category: "Code" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your PixoraTools platform performance and metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeTools}</div>
            <p className="text-xs text-muted-foreground">Across {dashboardStats.totalDomains} domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.uptime}%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and events across your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.type === "user" && <Users className="h-4 w-4 text-blue-600" />}
                    {activity.type === "tool" && <Wrench className="h-4 w-4 text-green-600" />}
                    {activity.type === "domain" && <Globe className="h-4 w-4 text-purple-600" />}
                    {activity.type === "subscription" && <DollarSign className="h-4 w-4 text-yellow-600" />}
                    {activity.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.user}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Tools</CardTitle>
            <CardDescription>Most used tools this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTools.map((tool, index) => (
                <div key={tool.name} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {tool.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{tool.usage.toLocaleString()} uses</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Add New User
            </Button>
            <Button variant="outline" size="sm">
              <Wrench className="h-4 w-4 mr-2" />
              Deploy New Tool
            </Button>
            <Button variant="outline" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              Configure Domain
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
