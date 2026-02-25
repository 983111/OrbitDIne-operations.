import { useState } from 'react';
import { Star, MessageSquare, Reply, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: Date;
  status: 'pending' | 'resolved';
  tableNumber: number;
  orderId: string;
}

const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: '1',
    customerName: 'Anonymous',
    rating: 2,
    comment: 'Food was cold when it arrived. The truffle burger was very disappointing.',
    date: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    status: 'pending',
    tableNumber: 4,
    orderId: 'ORD-8923'
  },
  {
    id: '2',
    customerName: 'John D.',
    rating: 3,
    comment: 'Service was a bit slow today, though the food was good as usual.',
    date: new Date(Date.now() - 3600000 * 24), // 1 day ago
    status: 'resolved',
    tableNumber: 12,
    orderId: 'ORD-8845'
  },
  {
    id: '3',
    customerName: 'Sarah W.',
    rating: 1,
    comment: 'Found a hair in my salad. Unacceptable.',
    date: new Date(Date.now() - 3600000 * 48), // 2 days ago
    status: 'pending',
    tableNumber: 7,
    orderId: 'ORD-8712'
  }
];

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(MOCK_FEEDBACK);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter);

  const resolveFeedback = (id: string) => {
    setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: 'resolved' } : f));
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Low Ratings Monitor</h1>
          <p className="text-slate-500 mt-2">Review and respond to 1-3 star private feedback.</p>
        </div>
        <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
          {(['all', 'pending', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors",
                filter === f 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
            <p>There is no feedback requiring your attention right now.</p>
          </div>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className={cn(
              "bg-white rounded-2xl border p-6 transition-all",
              feedback.status === 'pending' ? "border-red-200 shadow-sm" : "border-slate-200 opacity-75"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="flex mr-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={cn(
                          "w-5 h-5", 
                          star <= feedback.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        )} 
                      />
                    ))}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{feedback.customerName}</h4>
                    <p className="text-sm text-slate-500">
                      Table {feedback.tableNumber} • Order {feedback.orderId} • {formatDistanceToNow(feedback.date)} ago
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  feedback.status === 'pending' ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                )}>
                  {feedback.status}
                </span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                <p className="text-slate-700 italic">"{feedback.comment}"</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                {feedback.status === 'pending' && (
                  <>
                    <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Reply className="w-4 h-4 mr-2" />
                      Reply Privately
                    </button>
                    <button 
                      onClick={() => resolveFeedback(feedback.id)}
                      className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Resolved
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
