import { type FC, type FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Feedback: FC = () => {
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    if (isPending) return;

    e.preventDefault();

    if (!message.trim()) {
      toast.show('Please enter a message', 'error');
      return;
    }

    try {
      setIsPending(true);

      const response = await fetch('https://formspree.io/f/mgoegdqp', {
        method: 'POST',
        body: JSON.stringify({
          rating,
          message,
          email,
          _subject: `Redactly Feedback - ${rating} Stars`,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.show(
          'Thank you for your feedback! We appreciate your input.',
          'success',
        );
        setMessage('');
        setRating(0);
        setEmail('');
      } else {
        toast.show(
          'An error occurred while sending your feedback. Please try again later.',
          'error',
        );
      }
    } catch (e) {
      console.error(e);
      toast.show(
        'An error occurred while sending your feedback. Please try again later.',
        'error',
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-2xl p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundImage:
              'var(--gradient-primary-tint-soft)',
          }}
        >
          <MessageSquare size={26} className="text-primary" />
        </div>
        <h1 className="text-text mb-2 text-3xl font-bold">
          We value your feedback
        </h1>
        <p className="text-text-muted">
          Help us improve Redactly by sharing your thoughts and suggestions.
        </p>
      </div>

      <motion.div
        className="card-base p-6 sm:p-8"
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-text text-sm font-medium">
              How would you rate your experience?
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={34}
                    className={`transition-colors ${
                      (hoveredStar || rating) >= star
                        ? 'text-yellow-400'
                        : 'text-text-muted'
                    }`}
                    fill={
                      (hoveredStar || rating) >= star ? 'currentColor' : 'none'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="text-text mb-1.5 block text-sm font-medium"
            >
              Email{' '}
              <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base w-full"
              placeholder="your@email.com"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="text-text mb-1.5 block text-sm font-medium"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-base w-full resize-none leading-relaxed"
              placeholder="Tell us what you think..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-gradient flex w-full items-center justify-center gap-2"
          >
            <Send size={18} />
            {isPending ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </motion.div>

      <div className="mt-6 text-center">
        <p className="text-text-muted flex items-center justify-center gap-1.5 text-sm">
          <MessageSquare size={14} />
          You can also reach out directly on{' '}
          <a
            href="https://x.com/logickoder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            X (Twitter)
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default Feedback;
