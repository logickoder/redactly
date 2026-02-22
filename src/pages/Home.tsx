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
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
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
      className="relative mx-auto flex max-w-7xl flex-col items-center overflow-hidden p-4 sm:p-8"
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
          top: -100,
          left: -100,
          background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)',
        }}
      />
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          top: 100,
          right: -120,
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
        }}
      />

      {/* Hero */}
      <motion.header
        className="relative z-10 mt-12 mb-16 w-full max-w-4xl text-center"
        variants={itemVariants}
      >
        <div
          className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 shadow-sm"
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

        <h1 className="text-text mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Secure WhatsApp <br className="hidden sm:block" />
          <span className="gradient-text">Chat Redaction</span>
        </h1>
        <p className="text-text-muted mx-auto max-w-2xl text-xl leading-relaxed">
          Anonymize your WhatsApp chat exports before sharing. Process sensitive
          data directly in your browser without it ever leaving your device.
        </p>
      </motion.header>

      {/* Workflow steps */}
      <motion.div
        className="relative z-10 mb-20 grid w-full max-w-5xl gap-6 md:grid-cols-3"
        variants={containerVariants}
      >
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
      </motion.div>

      {/* Upload zone */}
      <motion.section
        id="upload-section"
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl p-px shadow-2xl"
        style={{ backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="bg-card rounded-3xl p-8 text-center sm:p-10">
          <h2 className="text-text mb-8 text-3xl font-bold">Ready to start?</h2>

          <label
            className="group hover:bg-primary/5 block cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-all"
            style={{ borderColor: 'var(--color-border)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = '#6366F1')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = 'var(--color-border)')
            }
          >
            <div className="flex flex-col items-center">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all group-hover:scale-110"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                }}
              >
                <Upload className="text-primary h-9 w-9 transition-colors" />
              </div>
              <p className="text-text group-hover:text-primary text-xl font-semibold transition-colors">
                Click to upload WhatsApp .txt file
              </p>
              <p className="text-text-muted mt-2 text-sm">
                or drag and drop here
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".txt"
              onChange={handleFileUpload}
            />
          </label>

          <div className="mt-6">
            <button
              onClick={() => navigate('/redact')}
              className="text-primary text-sm font-medium hover:underline"
            >
              Or paste conversation text directly →
            </button>
          </div>
        </div>
      </motion.section>
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
    className="card-base group relative flex flex-col items-center p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    style={{ '--hover-shadow-color': `${color}30` } as React.CSSProperties}
    variants={itemVariants}
    whileHover={{ boxShadow: `0 12px 40px ${color}28` }}
  >
    {/* Step number badge */}
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
