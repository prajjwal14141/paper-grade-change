import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, ShieldAlert, CheckCircle2, TrendingDown, RefreshCw } from 'lucide-react';

const OperatorAction = ({ prediction }) => {
  const [status, setStatus] = useState('pending');

  // This automatically resets the panel when the system returns to "System Stable"
  useEffect(() => {
    setStatus('pending');
  }, [prediction?.alert]);

  if (!prediction || !prediction.recommendation) {
    return <div className="text-slate-400 text-sm py-8 text-center">Monitoring system parameters...</div>;
  }

  const { suggestedSetpoints, rationale, source, future_state } = prediction.recommendation;

  const handleFeedback = async (action) => {
    try {
      await axios.post('http://localhost:5000/api/feedback', { action });
      setStatus(action);
    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
  };

  // 1. STATE: System is Stable / No Action Needed
  if (!prediction.alert) {
    return (
      <div className="w-full h-full flex flex-col justify-between">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-400" />
          System Operational Status
        </h3>
        
        <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-800/50 my-auto">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-slate-800/80 p-2 rounded">
              <span className="block text-slate-400 text-[11px]">Steam Setpoint</span>
              <span className="font-bold text-slate-200 text-sm">{suggestedSetpoints.steam_pressure} PSI</span>
            </div>
            <div className="bg-slate-800/80 p-2 rounded">
              <span className="block text-slate-400 text-[11px]">Stock Flow Setpoint</span>
              <span className="font-bold text-slate-200 text-sm">{suggestedSetpoints.stock_flow} L/m</span>
            </div>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed"><span className="font-semibold text-emerald-400">Status:</span> {rationale}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-2">Source: {source}</p>
        </div>
      </div>
    );
  }

  // 2. STATE: Action has been Taken (Accept or Reject)
  if (status !== 'pending') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center py-4">
        <div className={`p-4 rounded-full mb-3 ${status === 'accept' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
          {status === 'accept' ? <CheckCircle2 size={32} /> : <RefreshCw size={32} className="animate-spin" />}
        </div>
        
        <h3 className="text-lg font-bold text-white">
          {status === 'accept' ? 'AI Override Implemented' : 'Manual Intervention Required'}
        </h3>
        <p className="text-sm text-slate-300 mt-2 max-w-[80%]">
          {status === 'accept' 
            ? "AI setpoints deployed. System parameter interpolation in progress..." 
            : "Floor operators manually adjusting valves. System stabilizing..."}
        </p>
        <p className="text-xs text-slate-500 mt-4 italic">Observe chart for live stabilization metrics.</p>
      </div>
    );
  }

  // 3. STATE: Pending Decision (Anomaly detected)
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
        <ShieldAlert className="h-5 w-5 mr-2 text-red-400" />
        Recommended Operator Action
      </h3>

      <div className="bg-red-950/40 p-2 rounded border-l-2 border-red-500 mb-2 flex items-start">
        <TrendingDown className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
        <span className="text-red-200 text-xs italic">{future_state}</span>
      </div>
      
      <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 mb-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-slate-900/50 p-2 rounded">
            <span className="block text-slate-400 text-[11px]">Target Steam</span>
            <span className="font-bold text-emerald-400 text-sm">{suggestedSetpoints.steam_pressure} PSI</span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded">
            <span className="block text-slate-400 text-[11px]">Target Stock Flow</span>
            <span className="font-bold text-emerald-400 text-sm">{suggestedSetpoints.stock_flow} L/m</span>
          </div>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed mb-1"><span className="font-semibold text-amber-400">Rationale:</span> {rationale}</p>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider">Source: {source}</p>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => handleFeedback('accept')}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-semibold text-sm transition-colors flex justify-center items-center"
        >
          <Check className="h-4 w-4 mr-1" /> Accept
        </button>
        <button 
          onClick={() => handleFeedback('reject')}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-semibold text-sm transition-colors flex justify-center items-center"
        >
          <X className="h-4 w-4 mr-1" /> Reject
        </button>
      </div>
    </div>
  );
};

export default OperatorAction;