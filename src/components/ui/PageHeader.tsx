import { type FC } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: FC<PageHeaderProps> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-text text-3xl font-bold">{title}</h1>
    <div
      className="mt-2 h-1 w-16 rounded-full"
      style={{ backgroundImage: 'var(--gradient-primary)' }}
    />
    {subtitle && <p className="text-text-muted mt-2 text-sm">{subtitle}</p>}
  </div>
);

export default PageHeader;
