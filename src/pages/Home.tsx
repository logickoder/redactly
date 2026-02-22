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
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
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
      },
      {
        icon: Settings,
        title: 'Configure',
        description:
          'Anonymize names with aliases and filter the conversation by date range to keep only what matters.',
      },
      {
        icon: Download,
        title: 'Export',
        description:
          'Preview the redacted text and copy it to your clipboard or download as a new file.',
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
      className="mx-auto flex max-w-7xl flex-col items-center p-4 sm:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header
        className="mt-12 mb-16 w-full max-w-4xl text-center"
        variants={itemVariants}
      >
        <div className="bg-primary/10 mb-6 inline-flex items-center justify-center rounded-full p-2">
          <ShieldCheck className="text-primary mr-2 h-5 w-5" />
          <span className="text-primary text-sm font-medium">
            100% Client-Side Privacy
          </span>
        </div>
        <h1 className="text-text mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Secure WhatsApp <br className="hidden sm:block" />
          <span className="text-primary">Chat Redaction</span>
        </h1>
        <p className="text-text-muted mx-auto max-w-2xl text-xl leading-relaxed">
          Anonymize your WhatsApp chat exports before sharing. Process sensitive
          data directly in your browser without it ever leaving your device.
        </p>
      </motion.header>

      <motion.main
        className="mb-20 grid w-full max-w-5xl gap-8 md:grid-cols-3"
        variants={containerVariants}
      >
        {steps.map((step, index) => (
          <WorkflowStep
            key={index}
            icon={step.icon}
            index={index + 1}
            title={step.title}
            description={step.description}
          />
        ))}
      </motion.main>

      <motion.section
        id="upload-section"
        className="bg-card relative w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-200 p-10 text-center shadow-xl dark:border-gray-800"
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="from-primary to-secondary absolute top-0 left-0 h-2 w-full bg-linear-to-r"></div>
        <h2 className="text-text mb-8 text-3xl font-bold">Ready to start?</h2>

        <label className="hover:border-primary group block cursor-pointer rounded-2xl border-3 border-dashed border-gray-300 p-12 transition-all hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
          <div className="flex flex-col items-center">
            <Upload className="group-hover:text-primary mb-6 h-16 w-16 text-gray-400 transition-colors" />
            <p className="text-text group-hover:text-primary text-xl font-medium transition-colors">
              Click to upload WhatsApp .txt file
            </p>
            <p className="text-text-muted mt-3 text-sm">
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
            className="text-primary text-lg font-medium hover:underline"
          >
            Or paste conversation text directly
          </button>
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
}> = ({ icon: Icon, index, title, description }) => (
  <motion.div
    className="bg-card group flex flex-col items-center rounded-2xl border border-gray-200 p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-800"
    variants={itemVariants}
  >
    <div className="bg-primary/10 text-primary mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
      <Icon size={28} />
    </div>
    <h3 className="text-text mb-3 text-xl font-semibold">
      {index}. {title}
    </h3>
    <p className="text-text-muted leading-relaxed">{description}</p>
  </motion.div>
);

export default Home;
