import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const LiveChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-slate-400">Loading chart data...</div>;

  // Format timestamp for the X-axis so it's readable
  const formattedData = data.map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
          <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* Upper and Lower Control Limits (2.5% deviation from target 90) */}
          <ReferenceLine y={92.25} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Upper Limit (+2.5%)', fill: '#ef4444', fontSize: 12 }} />
          <ReferenceLine y={87.75} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Lower Limit (-2.5%)', fill: '#ef4444', fontSize: 12 }} />
          
          <Line type="monotone" dataKey="target_basis_weight" name="Target Weight" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="basis_weight" name="Actual Basis Weight" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LiveChart;