import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, ExternalLink, ImageOff } from 'lucide-react';
import { safeFormatDate, isDateValid } from '@/utils/date';

export interface DocumentsSectionDocument {
  id: number;
  type: string;
  filePath: string | null;
  status?: string | null;
  uploadedAt?: string | null;
  expiresAt?: string | null;
}

interface DocumentsSectionProps {
  documents: DocumentsSectionDocument[];
  titleKey: string;
  emptyKey: string;
  subtitleKey?: string;
}

const STATUS_BADGE: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  verified: 'green',
};

function DocumentImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-tertiary">
        <ImageOff size={22} />
        <span className="text-[10px] font-body px-2 text-center">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function DocumentsSection({ documents, titleKey, emptyKey, subtitleKey }: DocumentsSectionProps) {
  const { t } = useTranslation();

  const typeLabel = (type: string) => {
    const key = `documents.types.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type.replace(/_/g, ' ');
  };

  const dateLabel = (doc: DocumentsSectionDocument) => {
    const date = doc.expiresAt || doc.uploadedAt;
    if (!date || !isDateValid(date)) return null;
    return safeFormatDate(date, (d) => d.toLocaleDateString());
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t(titleKey)}</h3>
          {documents.length > 0 && (
            <span className="text-xs text-text-tertiary font-body">({documents.length})</span>
          )}
        </div>
        {subtitleKey && <p className="text-xs text-text-secondary font-body mt-1">{t(subtitleKey)}</p>}
      </CardHeader>
      {documents.length === 0 ? (
        <p className="text-sm text-text-secondary font-body">{t(emptyKey)}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-border-default/70 overflow-hidden flex flex-col">
              <div className="relative h-32 w-full bg-bg-section-alt group">
                {doc.filePath ? (
                  <>
                    <DocumentImage src={doc.filePath} alt={typeLabel(doc.type)} />
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-white text-xs font-bold font-body gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={14} /> {t('documents.open')}
                    </a>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
                    <FileText size={28} />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-text-primary font-body capitalize truncate">{typeLabel(doc.type)}</p>
                  {doc.status && (
                    <Badge variant={STATUS_BADGE[doc.status] || 'gray'} size="sm">{doc.status}</Badge>
                  )}
                </div>
                {dateLabel(doc) && (
                  <p className="text-[11px] text-text-tertiary font-body" dir="ltr">
                    {doc.expiresAt ? t('documents.expiresOn') : t('documents.uploadedOn')} {dateLabel(doc)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
