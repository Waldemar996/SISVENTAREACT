import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function MiniSparkline({ data, color = '#4F46E5' }) {
    if (!data || data.length === 0) return null;

    const chartData = data.map((value, index) => ({ value }));

    return (
        <div className="h-12 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
