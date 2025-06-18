"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, DollarSign, Home, Wrench } from "lucide-react"
import type { Database } from "@/types/supabase"

type Quote = Database["public"]["Tables"]["quotes"]["Row"]

interface ComprehensiveAnalyticsProps {
  quotes: Quote[]
}

export function ComprehensiveAnalytics({ quotes }: ComprehensiveAnalyticsProps) {
  // Service type analysis
  const serviceTypeData = quotes.reduce(
    (acc, quote) => {
      const service = quote.service_type || "unknown"
      acc[service] = (acc[service] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const serviceChartData = Object.entries(serviceTypeData).map(([service, count]) => ({
    name: service.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: count,
    percentage: Math.round((count / quotes.length) * 100),
  }))

  // Monthly trends
  const monthlyData = quotes.reduce(
    (acc, quote) => {
      const date = new Date(quote.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!acc[monthKey]) {
        acc[monthKey] = { submitted: 0, incomplete: 0, revenue: 0 }
      }

      if (quote.status === "submitted") {
        acc[monthKey].submitted += 1
        acc[monthKey].revenue += quote.final_price || 0
      } else {
        acc[monthKey].incomplete += 1
      }

      return acc
    },
    {} as Record<string, { submitted: number; incomplete: number; revenue: number }>,
  )

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      submitted: data.submitted,
      incomplete: data.incomplete,
      revenue: data.revenue,
    }))

  // Property size analysis
  const sizeRanges = [
    { min: 0, max: 1500, label: "Small (0-1,500 sq ft)" },
    { min: 1501, max: 3000, label: "Medium (1,501-3,000 sq ft)" },
    { min: 3001, max: 5000, label: "Large (3,001-5,000 sq ft)" },
    { min: 5001, max: Number.POSITIVE_INFINITY, label: "Extra Large (5,000+ sq ft)" },
  ]

  const sizeData = sizeRanges
    .map((range) => {
      const count = quotes.filter(
        (q) => q.square_footage && q.square_footage >= range.min && q.square_footage <= range.max,
      ).length
      return {
        name: range.label,
        count,
        percentage: quotes.length > 0 ? Math.round((count / quotes.length) * 100) : 0,
      }
    })
    .filter((item) => item.count > 0)

  // Story analysis
  const storyData = quotes.reduce(
    (acc, quote) => {
      const stories = quote.stories || 1
      const key = `${stories} ${stories === 1 ? "Story" : "Stories"}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const storyChartData = Object.entries(storyData).map(([stories, count]) => ({
    name: stories,
    value: count,
  }))

  // Revenue analysis
  const submittedQuotes = quotes.filter((q) => q.status === "submitted" && q.final_price)
  const totalRevenue = submittedQuotes.reduce((sum, q) => sum + (q.final_price || 0), 0)
  const avgQuoteValue = submittedQuotes.length > 0 ? totalRevenue / submittedQuotes.length : 0

  // Top performing services by revenue
  const serviceRevenue = submittedQuotes.reduce(
    (acc, quote) => {
      const service = quote.service_type || "unknown"
      if (!acc[service]) {
        acc[service] = { revenue: 0, count: 0 }
      }
      acc[service].revenue += quote.final_price || 0
      acc[service].count += 1
      return acc
    },
    {} as Record<string, { revenue: number; count: number }>,
  )

  const topServices = Object.entries(serviceRevenue)
    .map(([service, data]) => ({
      service: service.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      revenue: data.revenue,
      count: data.count,
      avgValue: data.count > 0 ? data.revenue / data.count : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
            <p className="text-xs text-muted-foreground">
              {submittedQuotes.length} completed ({Math.round((submittedQuotes.length / quotes.length) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${Math.round(avgQuoteValue).toLocaleString()} per quote
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Property Size</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(quotes.reduce((sum, q) => sum + (q.square_footage || 0), 0) / quotes.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Square feet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceChartData.length > 0 ? serviceChartData[0].name : "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {serviceChartData.length > 0 ? `${serviceChartData[0].percentage}% of quotes` : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trends */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Business Trends (Last 6 Months)</CardTitle>
            <CardDescription>Track your quote submissions and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="submitted" fill="#3b82f6" name="Submitted" />
                <Bar yAxisId="left" dataKey="incomplete" fill="#ef4444" name="Incomplete" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
            <CardDescription>Distribution of requested services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {serviceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Property Sizes</CardTitle>
            <CardDescription>Distribution by square footage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sizeData}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Services */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Services</CardTitle>
            <CardDescription>Services ranked by total revenue generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={service.service} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">{service.count} quotes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${service.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Avg: ${Math.round(service.avgValue).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Story Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {storyChartData.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="font-medium">{Math.round((submittedQuotes.length / quotes.length) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Abandonment Rate</span>
                <span className="font-medium">
                  {Math.round(((quotes.length - submittedQuotes.length) / quotes.length) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Days to Complete</span>
                <span className="font-medium">Same Day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Highest Quote</span>
                <span className="font-medium">
                  ${Math.max(...submittedQuotes.map((q) => q.final_price || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Lowest Quote</span>
                <span className="font-medium">
                  ${Math.min(...submittedQuotes.map((q) => q.final_price || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue/Sq Ft</span>
                <span className="font-medium">
                  ${(totalRevenue / submittedQuotes.reduce((sum, q) => sum + (q.square_footage || 0), 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
