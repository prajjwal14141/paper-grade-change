import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import LiveChart from './components/LiveChart';
import IntelligencePanel from './components/IntelligencePanel';
import OperatorAction from './components/OperatorAction';

function App() {
  const [machineData, setMachineData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Node server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusRes = await axios.get('http://localhost:5000/api/system-status');
        setMachineData(statusRes.data);

        const predRes = await axios.get('http://localhost:5000/api/predictions');
        setPrediction(predRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false); 
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <Activity className="animate-spin h-10 w-10 text-blue-500" />
        <span className="ml-3 text-xl">Initializing Quality Control System...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-slate-100 font-sans">
      
      {/* Header Section */}
      <header className="mb-8 border-b border-slate-700 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Grade Change Intelligence</h1>
          <p className="text-slate-400 mt-1">Machine Direction (MD) Control & Prediction</p>
        </div>
        
        <div className={`flex items-center px-4 py-2 rounded-lg font-semibold ${prediction?.alert ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'}`}>
          {prediction?.alert ? <AlertTriangle className="mr-2 h-5 w-5" /> : <CheckCircle className="mr-2 h-5 w-5" />}
          {prediction?.alert ? 'Critical Deviation Predicted' : 'System Stable'}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Chart AND Operator Action vertically stacked */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Live Basis Weight Trajectory</h2>
            <div className="h-96 w-full">
              <LiveChart data={machineData} />
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
             <OperatorAction prediction={prediction} />
          </div>
        </div>

        {/* Right Column: Intelligence Engine filling the height */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl h-[calc(100vh-12rem)] min-h-[600px] flex flex-col">
           <IntelligencePanel prediction={prediction} />
        </div>

      </div>
    </div>
  );
}

export default App;