import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Plus, Search, MoreHorizontal, TrendingUp, Users, DollarSign, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock subscription data
const subscriptions = [
  {
    id: "1",
    user: {
      name: "John Smith",
      email: "john@example.com",
      avatar: "/avatars/john.png",
    },
    plan: "PRO",
    status: "ACTIVE",
    amount: 9.99,
    interval: "month",
    currentPeriodStart: "2024-01-15",
    currentPeriodEnd: "2024-02-15",
    createdAt: "2024-01-15",
    stripeCustomerId: "cus_123456789",
  },
  {
    id: "2",
    user: {
      name: "Sarah Johnson",
      email: "sarah@company.com",
      avatar: "/avatars/sarah.png",
    },
    plan: "BUSINESS",
    status: "ACTIVE",
    amount: 29.99,
    interval: "month",
    currentPeriodStart: "2024-01-10",
    currentPeriodEnd: "2024-02-10",
    createdAt: "2024-01-10",
    stripeCustomerId: "cus_987654321",
  },
  {
    id: "3",
    user: {
      name: "Mike Chen",
      email: "mike@startup.io",
      avatar: "/avatars/mike.png",
    },
    plan: "PRO",
    status: "PAST_DUE",
    amount: 9.99,
    interval: "month",
    currentPeriodStart: "2024-01-05",
    currentPeriodEnd: "2024-02-05",
    createdAt: "2024-01-05",
    stripeCustomerId: "cus_456789123",
  },
  {
    id: "4",
    user: {
      name: "Emily Davis",
      email: "emily@design.co",
      avatar: "/avatars/emily.png",
    },
    plan: "ENTERPRISE",
    status: "ACTIVE",
    amount: 99.99,
    interval: "month",
    currentPeriodStart: "2024-01-01",
    currentPeriodEnd: "2024-02-01",
    createdAt: "2023-12-01",
    stripeCustomerId: "cus_789123456",
  },
  {
    id: "5",
    user: {
      name: "Alex Wilson",
      email: "alex@freelance.com",
      avatar: "/avatars/alex.png",
    },
    plan: "PRO",
    status: "CANCELLED",
    amount: 9.99,
    interval: "month",
    currentPeriodStart: "2024-01-01",
    currentPeriodEnd: "2024-02-01",
    createdAt: "2023-11-15",
    stripeCustomerId: "cus_321654987",
  },
]

const plans = ["All", "FREE", "PRO", "BUSINESS", "ENTERPRISE"]
const statuses = ["All", "ACTIVE", "PAST_DUE", "CANCELLED", "INCOMPLETE"]

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800"
    case "PAST_DUE":
      return "bg-yellow-100 text-yellow-800"
    case "CANCELLED":
      return "bg-red-100 text-red-800"
    case "INCOMPLETE":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getPlanColor(plan: string) {
  switch (plan) {
    case "ENTERPRISE":
      return "bg-purple-100 text-purple-800"
    case "BUSINESS":
      return "bg-blue-100 text-blue-800"
    case "PRO":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function SubscriptionsPage() {
  const totalRevenue = subscriptions.filter((s) => s.status === "ACTIVE").reduce((sum, sub) => sum + sub.amount, 0)

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE").length
  const churnRate = (subscriptions.filter((s) => s.status === "CANCELLED").length / subscriptions.length) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">Manage user subscriptions, billing, and revenue analytics.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Manual Subscription
        </Button>
      </div>

      {/* Subscription Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
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
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5</span> new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+0.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue Per User</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / activeSubscriptions).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+$2.50</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Manage user subscriptions and billing information.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="All">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="All">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search subscriptions..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Current Period</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={subscription.user.avatar || "/placeholder.svg"}
                          alt={subscription.user.name}
                        />
                        <AvatarFallback>
                          {subscription.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{subscription.user.name}</div>
                        <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanColor(subscription.plan)}>{subscription.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${subscription.amount}</div>
                    <div className="text-sm text-muted-foreground">per {subscription.interval}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {subscription.currentPeriodStart} - {subscription.currentPeriodEnd}
                    </div>
                  </TableCell>
                  <TableCell>{subscription.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <CreditCard className="h-4 w-4 mr-2" />
                          View in Stripe
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          View Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">Cancel Subscription</DropdownMenuItem>
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
