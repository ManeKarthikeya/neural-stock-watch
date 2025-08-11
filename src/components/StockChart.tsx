import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface ChartDataPoint {
  date: string;
  price: number;
  volume?: number;
}

interface StockChartProps {
  data: ChartDataPoint[];
  ticker: string;
}

export const StockChart = ({ data, ticker }: StockChartProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Determine trend color
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const isUpTrend = lastPrice >= firstPrice;

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">{ticker} Price Chart</CardTitle>
            <CardDescription className="text-sm">Last 30 days closing prices</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-48 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatPrice}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={['dataMin - 5', 'dataMax + 5']}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-popover-foreground">
                          {new Date(label).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isUpTrend ? "hsl(var(--bull-green-bright))" : "hsl(var(--bear-red-bright))"}
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: isUpTrend ? "hsl(var(--bull-green-bright))" : "hsl(var(--bear-red-bright))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">
            Trend: 
            <span className={`ml-2 font-semibold ${
              isUpTrend ? 'text-bull-bright' : 'text-bear-bright'
            }`}>
              {isUpTrend ? '📈 Bullish' : '📉 Bearish'} 
              ({((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};