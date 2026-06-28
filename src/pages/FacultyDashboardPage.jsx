import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

export default function FacultyDashboardPage() {
  const { registerNo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get(`/summary/faculty-summary/dashboard/?register_no=${registerNo}&role=all`);
        setData(response.data);
      } catch (err) {
        alert("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [registerNo]);

  if (loading) return <div className="p-6 sm:p-10 text-center text-sm sm:text-base">Loading Dashboard...</div>;
  if (!data) return <div className="p-6 sm:p-10 text-center text-sm sm:text-base">No data found.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 break-words">Faculty: {data.username}</h2>
        <p className="text-slate-500 text-sm sm:text-base">Register No: {data.register_no}</p>
      </div>

      {/* Render your data structure here */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.modules.map((mod, index) => (
          <div key={index} className="bg-white p-4 sm:p-5 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">{mod.module}</h3>
            <p className="text-sm text-slate-600">Points: {mod.points}</p>
            {/* Add more detail rendering here based on your JSON structure */}
          </div>
        ))}
      </div>
    </div>
  );
}