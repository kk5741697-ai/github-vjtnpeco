import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface ToolCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  category: string
  isNew?: boolean
  isPremium?: boolean
}

export function ToolCard({
  title,
  description,
  href,
  icon: Icon,
  category,
  isNew = false,
  isPremium = false,
}: ToolCardProps) {
  return (
    <a href={href} className="group">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border hover:border-accent/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base font-heading group-hover:text-accent transition-colors">
                  {title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  {category}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              {isNew && (
                <Badge variant="default" className="text-xs bg-accent text-accent-foreground">
                  New
                </Badge>
              )}
              {isPremium && (
                <Badge variant="outline" className="text-xs">
                  Pro
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
        </CardContent>
      </Card>
    </a>
  )
}
