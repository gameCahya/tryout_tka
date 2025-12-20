// app/admin/stats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DatabaseStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_database_stats');
      setStats(data?.[0]);
    };
    fetchStats();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">📊 Database Statistics</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Total Database Size</p>
          <p className="text-2xl font-bold">{stats.total_size}</p>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Total Results</p>
          <p className="text-2xl font-bold">{stats.results_count}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded shadow border-l-4 border-green-500">
          <p className="text-gray-600">Locked (Ranking)</p>
          <p className="text-2xl font-bold text-green-600">{stats.locked_results}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-gray-600">Practice</p>
          <p className="text-2xl font-bold text-blue-600">{stats.practice_results}</p>
        </div>
      </div>
      
      {/* Warning jika hampir penuh */}
      {parseInt(stats.total_size.replace(/[^0-9]/g, '')) > 400 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
          ⚠️ <strong>Warning:</strong> Database usage is over 400 MB! Consider cleanup.
        </div>
      )}
    </div>
  );
}
