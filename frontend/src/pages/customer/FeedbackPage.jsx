import { useState, useEffect } from 'react';
import { apiPost, apiGet } from '../../api';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet('/api/feedback/list').then(d => {
      if (d?.feedbacks) setFeedbacks(d.feedbacks);
    });
  }, [submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    await apiPost('/api/feedback', { rating, comment });
    setRating(0);
    setComment('');
    setSubmitted(true);
    setLoading(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Provide Feedback</h1>
        <p>Help us improve our service by sharing your experience</p>
      </div>

      {submitted && (
        <div className="toast-success">Thank you for your feedback!</div>
      )}

      <div className="feedback-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rate your experience</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                  className={n <= rating ? 'active' : ''}
                  onClick={() => setRating(n)}>
                  ★
                </button>
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {rating === 0 ? 'Click a star to rate' : `${rating}/5`}
            </span>
          </div>

          <div className="form-group">
            <label>Your Comments (optional)</label>
            <textarea
              className="feedback-textarea"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={rating === 0 || loading}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {feedbacks.length > 0 && (
        <div className="feedback-list">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>
            Your Past Feedback
          </h3>
          {feedbacks.map(fb => (
            <div key={fb.id} className="feedback-item">
              <div className="feedback-item-header">
                <div className="feedback-item-stars">
                  {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                </div>
                <div className="feedback-item-date">
                  {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ''}
                </div>
              </div>
              {fb.comment && (
                <div className="feedback-item-comment">{fb.comment}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
