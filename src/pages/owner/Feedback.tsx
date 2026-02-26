import { useState, useEffect } from 'react';
import { Star, Reply, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';
import { Database } from '../../lib/database.types';

type FeedbackItem = Database['public']['Tables']['feedback']['Row'];

export function Feedback() {
  const { profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    if (!profile?.restaurant_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('restaurant_id', profile.restaurant_id)
      .lte('rating', 3)
      .order('created_at', { ascending: false });
    setFeedbacks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchFeedback(); }, [profile?.restaurant_id]);

  const resolveFeedback = async (id: string) => {
    await supabase.from('feedback').update({ status: 'resolved' }).eq('id', id);
    fetchFeedback();
  };

  const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Low Ratings Monitor</h1>
          <p className="text-slate-500 mt-2">Review and respond to 1–3 star private feedback.</p>
        </div>
        <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
          {(['all', 'pending', 'resolved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors",
                filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
            <p>There is no feedback requiring your attention right now.</p>
          </div>
        ) : (
          filteredFeedbacks.map(feedback => (
            <div key={feedback.id} className={cn("bg-white rounded-2xl border p-6 transition-all",
              feedback.status === 'pending' ? "border-red-200 shadow-sm" : "border-slate-200 opacity-75")}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="flex mr-4">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={cn("w-5 h-5", star <= feedback.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{feedback.customer_name ?? 'Anonymous'}</h4>
                    <p className="text-sm text-slate-500">
                      {feedback.table_number ? `Table ${feedback.table_number} • ` : ''}{formatDistanceToNow(new Date(feedback.created_at))} ago
                    </p>
                  </div>
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  feedback.status === 'pending' ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800")}>
                  {feedback.status}
                </span>
              </div>
              {feedback.comment && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <p className="text-slate-700 italic">"{feedback.comment}"</p>
                </div>
              )}
              {feedback.status === 'pending' && (
                <div className="flex justify-end space-x-3">
                  <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Reply className="w-4 h-4 mr-2" />Reply Privately
                  </button>
                  <button onClick={() => resolveFeedback(feedback.id)}
                    className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                    <CheckCircle className="w-4 h-4 mr-2" />Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
