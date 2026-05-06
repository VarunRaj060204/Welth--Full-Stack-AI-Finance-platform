"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, getCategoryColor } from "@/lib/utils";

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
  currency: string;
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 h-full">
      <h3 className="font-semibold mb-1">Spending by Category</h3>
      <p className="text-xs text-muted-foreground mb-5">
        {formatCurrency(total, currency)} total spent
      </p>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No spending data
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={getCategoryColor(entry.name)}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v, currency)}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-1.5 mt-3">
            {data.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: getCategoryColor(item.name) }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {((item.value / total) * 100).toFixed(1)}%
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.value, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
