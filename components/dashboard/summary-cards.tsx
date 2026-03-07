"use client"

import type { ComponentType, SVGProps } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type SummaryCardIcon = ComponentType<SVGProps<SVGSVGElement>>

export type SummaryCardData = {
  title: string
  value: string
  change?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}

interface SummaryCardsProps {
  items: SummaryCardData[]
}

export function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.iconBg}`}>
              {item.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {item.value}
              </div>
              {item.change && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.change}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

