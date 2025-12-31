import React, { type FC, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Feedback: FC = () => {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.show('Please enter a message', 'error');
      return;
    }

    startTransition(async () => {
      try {
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
      }
    });
  };

  return (
    <motion.div
      className="mx-auto max-w-2xl p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
          We value your feedback
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Help us improve Redactly by sharing your thoughts and suggestions.
        </p>
      </div>

      <motion.div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              How would you rate your experience?
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors ${
                    rating >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <Star
                    size={32}
                    fill={rating >= star ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="Tell us what you think..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send size={20} className="mr-2" />
            {isPending ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </motion.div>

      <div className="mt-8 text-center">
        <p className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          <MessageSquare size={16} className="mr-2" />
          You can also reach out directly on{' '}
          <a
            href="https://x.com/logickoder"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-blue-600 hover:underline dark:text-blue-400"
          >
            Twitter
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default Feedback;
