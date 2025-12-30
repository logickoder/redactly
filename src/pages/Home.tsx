import { type ChangeEvent, type ComponentType, type FC, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, type LucideProps, Settings, ShieldCheck, Upload } from 'lucide-react';

const Home: FC = () => {
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      {
        icon: FileText,
        title: 'Upload & Parse',
        description:
          "Select your WhatsApp .txt export file. We'll automatically detect participants and timestamps."
      },
      {
        icon: Settings,
        title: 'Configure',
        description:
          'Anonymize names with aliases and filter the conversation by date range to keep only what matters.'
      },
      {
        icon: Download,
        title: 'Export',
        description:
          'Preview the redacted text and copy it to your clipboard or download as a new file.'
      }
    ],
    []
  );

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      await navigate('/redact', { state: { fileContent: text } });
    },
    [navigate]
  );

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="w-full max-w-4xl text-center mb-16 mt-12">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
          <ShieldCheck className="w-5 h-5 text-primary mr-2" />
          <span className="text-sm font-medium text-primary">100% Client-Side Privacy</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-text mb-6 tracking-tight">
          Secure WhatsApp <br className="hidden sm:block" />
          <span className="text-primary">Chat Redaction</span>
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          Anonymize your WhatsApp chat exports before sharing. Process sensitive data directly in
          your browser without it ever leaving your device.
        </p>
      </header>

      <main className="w-full max-w-5xl grid gap-8 md:grid-cols-3 mb-20">
        {steps.map((step, index) => (
          <WorkflowStep
            key={index}
            icon={step.icon}
            index={index + 1}
            title={step.title}
            description={step.description}
          />
        ))}
      </main>

      <section className="w-full max-w-3xl bg-card rounded-3xl p-10 shadow-xl border border-gray-200 dark:border-gray-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary to-secondary"></div>
        <h2 className="text-3xl font-bold mb-8 text-text">Ready to start?</h2>

        <label className="border-3 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group block">
          <div className="flex flex-col items-center">
            <Upload className="h-16 w-16 text-gray-400 group-hover:text-primary mb-6 transition-colors" />
            <p className="text-xl font-medium text-text group-hover:text-primary transition-colors">
              Click to upload WhatsApp .txt file
            </p>
            <p className="text-sm text-text-muted mt-3">or drag and drop here</p>
          </div>
          <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
        </label>

        <div className="mt-6">
          <button
            onClick={() => navigate('/redact')}
            className="text-primary hover:underline font-medium text-lg"
          >
            Or paste conversation text directly
          </button>
        </div>
      </section>
    </div>
  );
};

const WorkflowStep: FC<{
  icon: ComponentType<LucideProps>;
  index: number;
  title: string;
  description: string;
}> = ({ icon: Icon, index, title, description }) => (
  <div className="bg-card p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group">
    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-semibold mb-3 text-text">
      {index}. {title}
    </h3>
    <p className="text-text-muted leading-relaxed">{description}</p>
  </div>
);

export default Home;
