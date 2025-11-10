'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Response } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsChartProps {
  responses: Response[];
}

export function MetricsChart({ responses }: MetricsChartProps) {
  // Prepare data for bar chart
  const barChartData = responses.map((r, index) => ({
    name: `R${index + 1}`,
    'Temp/TopP': `${r.temperature}/${r.topP}`,
    Coherence: r.metrics.coherence,
    Completeness: r.metrics.completeness,
    Structural: r.metrics.structural,
    Overall: r.metrics.overall,
  }));

  // Prepare data for radar chart (average metrics)
  const avgMetrics =
    responses.length > 0
      ? {
          coherence: responses.reduce((sum, r) => sum + (r.metrics.coherence || 0), 0) / responses.length,
          completeness: responses.reduce((sum, r) => sum + (r.metrics.completeness || 0), 0) / responses.length,
          structural: responses.reduce((sum, r) => sum + (r.metrics.structural || 0), 0) / responses.length,
        }
      : { coherence: 0, completeness: 0, structural: 0 };

  const radarChartData = [
    {
      metric: 'Coherence',
      value: Math.max(0, Math.min(100, Math.round(avgMetrics.coherence) || 0)),
      fullMark: 100,
    },
    {
      metric: 'Completeness',
      value: Math.max(0, Math.min(100, Math.round(avgMetrics.completeness) || 0)),
      fullMark: 100,
    },
    {
      metric: 'Structural',
      value: Math.max(0, Math.min(100, Math.round(avgMetrics.structural) || 0)),
      fullMark: 100,
    },
  ].filter((item) => !isNaN(item.value) && isFinite(item.value)); // Filter out NaN and Infinity values

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="Coherence"
                fill="#8884d8"
              />
              <Bar
                dataKey="Completeness"
                fill="#82ca9d"
              />
              <Bar
                dataKey="Structural"
                fill="#ffc658"
              />
              <Bar
                dataKey="Overall"
                fill="#ff7300"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <RadarChart data={radarChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
              />
              <Radar
                name="Average"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip
                formatter={(value: any) => {
                  if (value == null) return '0';
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  if (isNaN(numValue) || !isFinite(numValue)) return '0';
                  return numValue.toString();
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
