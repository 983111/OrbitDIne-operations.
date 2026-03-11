import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, Badge } from '../../components/ui';
import { cn, formatDate } from '../../lib/utils';
import { MessageSquare, Star, TrendingUp, Loader2, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface Feedback {
  id: string;
  table_number: number;
  rating: number;
  comment: string | null;
  created_at: string;
  order_id: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn('w-3.5 h-3.5', i <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#2A2A3C]')} />
      ))}
    </div>
  );
}

export function Feedback() {
  const { profile } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const restaurantId = profile?.restaurant_id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    // feedback table joins to orders for table number
    const { data } = await supabase
      .from('feedback')
      .select('*, orders(table_id, tables(number))')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (data) {
      setFeedback(data.map((f: any) => ({
        id: f.id,
        table_number: f.orders?.tables?.number ?? 0,
        rating: f.rating,
        comment: f.comment,
        created_at: f.created_at,
        order_id: f.order_id,
      })));
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const avgRating = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;
  const dist = [5, 4, 3, 2, 1].map(r => ({ r, count: feedback.filter(f => f.rating === r).length }));

  const sentimentIcon = avgRating >= 4 ? ThumbsUp : avgRating >= 3 ? Minus : ThumbsDown;
  const sentimentColor = avgRating >= 4 ? 'text-emerald-400' : avgRating >= 3 ? 'text-amber-400' : 'text-red-400';
  const SentimentIcon = sentimentIcon;

  const ratingBadge = (r: number): 'green' | 'orange' | 'red' | 'gray' =>
    r >= 4 ? 'green' : r === 3 ? 'orange' : 'red';

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Feedback" subtitle="Customer ratings and comments" />

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-orange-500" /></div>
      ) : feedback.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback yet" description="Ratings submitted by customers will appear here." />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F0F0FF]">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-[#6B6B9A]">Average rating</p>
                <StarRow rating={Math.round(avgRating)} />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F0F0FF]">{feedback.length}</p>
                <p className="text-xs text-[#6B6B9A]">Total reviews</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl border flex items-center justify-center shrink-0',
                avgRating >= 4 ? 'bg-emerald-500/15 border-emerald-500/20' : avgRating >= 3 ? 'bg-amber-500/15 border-amber-500/20' : 'bg-red-500/15 border-red-500/20')}>
                <SentimentIcon className={cn('w-5 h-5', sentimentColor)} />
              </div>
              <div>
                <p className={cn('text-lg font-bold', sentimentColor)}>
                  {avgRating >= 4 ? 'Excellent' : avgRating >= 3 ? 'Average' : 'Needs Work'}
                </p>
                <p className="text-xs text-[#6B6B9A]">Overall sentiment</p>
              </div>
            </div>
          </div>

          {/* Rating distribution */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#F0F0FF]">Rating Distribution</h2>
            <div className="space-y-2.5">
              {dist.map(({ r, count }) => (
                <div key={r} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16 shrink-0">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-[#6B6B9A]">{r}</span>
                  </div>
                  <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', r >= 4 ? 'bg-emerald-500' : r === 3 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: feedback.length ? `${(count / feedback.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-[#6B6B9A] w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual feedback */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#F0F0FF]">All Reviews</h2>
            {feedback.map(f => (
              <div key={f.id} className="glass rounded-2xl px-5 py-4 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <StarRow rating={f.rating} />
                    <Badge color={ratingBadge(f.rating)}>{f.rating}/5</Badge>
                    {f.table_number > 0 && <span className="text-xs text-[#6B6B9A]">Table {f.table_number}</span>}
                  </div>
                  <span className="text-[11px] text-[#4A4A6A]">{formatDate(f.created_at)}</span>
                </div>
                {f.comment && (
                  <p className="text-sm text-[#C0C0E0] leading-relaxed">"{f.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
