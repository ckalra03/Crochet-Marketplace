'use client';

/**
 * DonutChartCard -- Reusable donut (ring) chart wrapped in a Card.
 *
 * Built on Recharts PieChart with innerRadius to create the donut
 * hole. Includes a legend and tooltip.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** Default color palette when individual items don't specify a color. */
const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#3b82f6', // blue
];

export interface DonutChartItem {
  /** Segment label */
  name: string;
  /** Numeric value */
  value: number;
  /** Optional custom fill color */
  color?: string;
}

export interface DonutChartCardProps {
  /** Card heading */
  title: string;
  /** Segments to render */
  data: DonutChartItem[];
  /** Chart height in pixels (defaults to 300) */
  height?: number;
  /** Optional formatter for tooltip values */
  valueFormatter?: (value: number) => string;
}

export function DonutChartCard({
  title,
  data,
  height = 300,
  valueFormatter,
}: DonutChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
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
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
