import {
  type ChangeEvent,
  type ComponentType,
  type FC,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  FileText,
  type LucideProps,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { type Easing, motion, type Variants } from 'framer-motion';

const EASE_OUT: Easing = 'easeOut';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const Home: FC = () => {
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      {
        icon: FileText,
        title: 'Upload & Parse',
        description:
          "Select your WhatsApp .txt export file. We'll automatically detect participants and timestamps.",
        color: '#6366F1',
      },
      {
        icon: Settings,
        title: 'Configure',
        description:
          'Anonymize names with aliases and filter the conversation by date range to keep only what matters.',
        color: '#8B5CF6',
      },
      {
        icon: Download,
        title: 'Export',
        description:
          'Preview the redacted text and copy it to your clipboard or download as a new file.',
        color: '#A78BFA',
      },
    ],
    [],
  );

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      await navigate('/redact', { state: { fileContent: text } });
    },
    [navigate],
  );

  return (
    <motion.div
      className="relative mx-auto max-w-7xl overflow-hidden p-4 sm:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background orbs */}
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          top: -150,
          left: -150,
          background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)',
        }}
      />
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          top: 50,
          right: -150,
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
        }}
      />

      {/* ABOVE THE FOLD: two-column hero */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-12 py-12 lg:flex-row lg:items-center lg:gap-16 lg:py-20">
        {/* Left: tagline */}
        <motion.div
          className="flex max-w-xl flex-col items-center text-center lg:items-start lg:pt-4 lg:text-left"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <div
              className="mb-5 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 shadow-sm"
              style={{
                background: 'rgba(99,102,241,0.08)',
                borderColor: 'rgba(99,102,241,0.2)',
              }}
            >
              <ShieldCheck className="text-primary h-4 w-4" />
              <span className="text-primary text-sm font-semibold">
                100% Client-Side Privacy
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-text mb-5 text-5xl font-bold tracking-tight sm:text-6xl lg:text-6xl"
            variants={itemVariants}
          >
            Secure WhatsApp <br className="hidden lg:block" />
            <span className="gradient-text">Chat Redaction</span>
          </motion.h1>

          <motion.p
            className="text-text-muted mb-6 max-w-lg text-lg leading-relaxed"
            variants={itemVariants}
          >
            Anonymize your WhatsApp chat exports before sharing with AI models
            or others. All processing happens in your browser — nothing leaves
            your device.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-3 text-sm"
            variants={itemVariants}
          >
            {['Zero uploads', 'Works offline', 'Open source'].map((label) => (
              <span
                key={label}
                className="text-text-muted flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-surface)',
                }}
              >
                <span className="text-primary">✓</span>
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: upload card */}
        <motion.div
          className="relative w-full max-w-md shrink-0 overflow-hidden rounded-3xl p-px shadow-2xl"
          style={{
            backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          }}
          variants={itemVariants}
          whileHover={{ scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="bg-card rounded-3xl p-8">
            <h2 className="text-text mb-6 text-2xl font-bold">
              Start redacting
            </h2>

            <label
              className="group hover:bg-primary/5 mb-5 block cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all"
              style={{ borderColor: 'var(--color-border)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = '#6366F1')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = 'var(--color-border)')
              }
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                  }}
                >
                  <Upload className="text-primary h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-text group-hover:text-primary text-base font-semibold transition-colors">
                    Upload WhatsApp .txt file
                  </p>
                  <p className="text-text-muted mt-1 text-sm">
                    or drag and drop here
                  </p>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".txt"
                onChange={handleFileUpload}
              />
            </label>

            <div className="flex items-center gap-3 text-sm">
              <div
                className="h-px flex-1"
                style={{ background: 'var(--color-border)' }}
              />
              <span className="text-text-muted text-xs font-medium">or</span>
              <div
                className="h-px flex-1"
                style={{ background: 'var(--color-border)' }}
              />
            </div>

            <button
              onClick={() => navigate('/redact')}
              className="btn-gradient mt-4 flex w-full items-center justify-center gap-2 text-sm"
            >
              Paste text manually
            </button>
          </div>
        </motion.div>
      </div>

      {/* BELOW THE FOLD: How it works */}
      <motion.div
        className="relative z-10 pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <h2 className="text-text text-2xl font-bold">How it works</h2>
          <p className="text-text-muted mt-2 text-sm">
            Three simple steps to anonymize your chat
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <WorkflowStep
              key={index}
              icon={step.icon}
              index={index + 1}
              title={step.title}
              description={step.description}
              color={step.color}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const WorkflowStep: FC<{
  icon: ComponentType<LucideProps>;
  index: number;
  title: string;
  description: string;
  color: string;
}> = ({ icon: Icon, index, title, description, color }) => (
  <motion.div
    className="card-base group relative flex flex-col items-center p-8 text-center transition-all duration-300 hover:-translate-y-1"
    variants={itemVariants}
    whileHover={{ boxShadow: `0 12px 40px ${color}28` }}
  >
    <div
      className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }}
    >
      {index}
    </div>

    <div
      className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
      style={{ background: `linear-gradient(135deg, ${color}18, ${color}30)` }}
    >
      <Icon size={26} style={{ color }} />
    </div>
    <h3 className="text-text mb-3 text-lg font-semibold">{title}</h3>
    <p className="text-text-muted text-sm leading-relaxed">{description}</p>
  </motion.div>
);

export default Home;
