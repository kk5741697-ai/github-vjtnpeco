import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Search, Settings, MoreHorizontal, Crown, Shield, User, CreditCard } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock users data
const users = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    role: "USER",
    plan: "PRO",
    status: "active",
    joinDate: "2024-01-15",
    lastLogin: "2024-01-20",
    toolsUsed: 45,
    avatar: "/avatars/john.png",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "DOMAIN_ADMIN",
    plan: "BUSINESS",
    status: "active",
    joinDate: "2024-01-10",
    lastLogin: "2024-01-19",
    toolsUsed: 123,
    avatar: "/avatars/sarah.png",
  },
  {
    id: "3",
    name: "Mike Chen",
    email: "mike@startup.io",
    role: "USER",
    plan: "FREE",
    status: "active",
    joinDate: "2024-01-18",
    lastLogin: "2024-01-20",
    toolsUsed: 12,
    avatar: "/avatars/mike.png",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@design.co",
    role: "USER",
    plan: "PRO",
    status: "suspended",
    joinDate: "2024-01-05",
    lastLogin: "2024-01-15",
    toolsUsed: 67,
    avatar: "/avatars/emily.png",
  },
  {
    id: "5",
    name: "Admin User",
    email: "admin@pixora.com",
    role: "SUPER_ADMIN",
    plan: "ENTERPRISE",
    status: "active",
    joinDate: "2023-12-01",
    lastLogin: "2024-01-20",
    toolsUsed: 234,
    avatar: "/avatars/admin.png",
  },
]

const roles = ["All", "USER", "DOMAIN_ADMIN", "ADMIN", "SUPER_ADMIN"]
const plans = ["All", "FREE", "PRO", "BUSINESS", "ENTERPRISE"]

function getRoleIcon(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return <Crown className="h-4 w-4 text-yellow-600" />
    case "ADMIN":
      return <Shield className="h-4 w-4 text-red-600" />
    case "DOMAIN_ADMIN":
      return <Settings className="h-4 w-4 text-blue-600" />
    default:
      return <User className="h-4 w-4 text-gray-600" />
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

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and subscription plans.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">{users.filter((u) => u.status === "active").length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.plan !== "FREE").length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((users.filter((u) => u.plan !== "FREE").length / users.length) * 100)}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role.includes("ADMIN")).length}</div>
            <p className="text-xs text-muted-foreground">Administrative users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tools Used</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(users.reduce((sum, user) => sum + user.toolsUsed, 0) / users.length)}
            </div>
            <p className="text-xs text-muted-foreground">Per user this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts, roles, and subscription plans.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="All">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm">{user.role.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanColor(user.plan)}>{user.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.toolsUsed} tools
                      <div className="text-xs text-muted-foreground">this month</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <User className="h-4 w-4 mr-2" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">Suspend User</DropdownMenuItem>
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
