'use client';

/**
 * LineChartCard -- Reusable line chart wrapped in a Card.
 *
 * Uses Recharts ResponsiveContainer so the chart adapts to the
 * parent's width. Includes a formatted tooltip.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LineChartCardProps {
  /** Card heading */
  title: string;
  /** Array of objects to plot */
  data: Record<string, unknown>[];
  /** Key used for the X-axis (typically a date or label) */
  xKey: string;
  /** Key used for the Y-axis (the numeric value) */
  yKey: string;
  /** Stroke color for the line (defaults to primary blue) */
  color?: string;
  /** Chart height in pixels (defaults to 300) */
  height?: number;
  /** Optional formatter for tooltip values */
  valueFormatter?: (value: number) => string;
}

export function LineChartCard({
  title,
  data,
  xKey,
  yKey,
  color = '#6366f1',
  height = 300,
  valueFormatter,
}: LineChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) =>
                valueFormatter ? valueFormatter(Number(value)) : Number(value).toLocaleString('en-IN')
              }
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
