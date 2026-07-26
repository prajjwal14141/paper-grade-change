import { Zap, Activity } from 'lucide-react';

const IntelligencePanel = ({ prediction }) => {
  if (!prediction || !prediction.dynamic_correlations || prediction.dynamic_correlations.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 py-8">
        <Activity className="animate-spin h-6 w-6 text-blue-500 mb-2" />
        <span className="text-sm">Connecting to Correlation Engine...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-start">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <Zap className="h-5 w-5 mr-2 text-yellow-400" />
        ML Correlation Engine
      </h3>
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {prediction.dynamic_correlations.map((corr, index) => (
          <div key={index} className="bg-slate-700/40 p-3 rounded-lg border border-slate-600/80">
            {/* Deliverable 4: Displaying the Control Loop Name */}
            <div className="text-[10px] uppercase tracking-wider text-blue-400 mb-1 font-semibold">
              {corr.loop} Loop
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-200 text-sm">{corr.parameter}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                Math.abs(corr.correlation_score) > 0.5 
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' 
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {corr.correlation_score > 0 ? '+' : ''}{corr.correlation_score}
              </span>
            </div>
            <p className="text-xs text-slate-400">{corr.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelligencePanel;