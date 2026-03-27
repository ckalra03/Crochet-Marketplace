'use client';

/**
 * BarChartCard -- Reusable bar chart wrapped in a Card.
 *
 * Uses Recharts ResponsiveContainer for responsive sizing.
 * Supports an optional value formatter for tooltip display.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface BarChartCardProps {
  /** Card heading */
  title: string;
  /** Array of objects to plot */
  data: Record<string, unknown>[];
  /** Key used for the X-axis (category label) */
  xKey: string;
  /** Key used for the Y-axis (the numeric value) */
  yKey: string;
  /** Bar fill color (defaults to teal) */
  color?: string;
  /** Chart height in pixels (defaults to 300) */
  height?: number;
  /** Optional formatter for tooltip values */
  valueFormatter?: (value: number) => string;
}

export function BarChartCard({
  title,
  data,
  xKey,
  yKey,
  color = '#14b8a6',
  height = 300,
  valueFormatter,
}: BarChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
