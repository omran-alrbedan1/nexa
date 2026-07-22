import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTicketDetail, useSendMessage, useUpdateTicketStatus } from '../hooks/useSupportTicket';
import { useSupportRealtime } from '../hooks/useSupportRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, Send, Lock, Unlock, User, Clock, MessageSquare,
  CheckCircle2, XCircle, PlayCircle, LifeBuoy,
} from 'lucide-react';
import type { SupportTicketMessage } from '../api/supportApi';

const STATUS_VARIANT: Record<string, 'red' | 'yellow' | 'green' | 'purple'> = {
  open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'purple',
};

const NEXT_STATUS: Record<string, { label: string; status: string; icon: React.ReactNode }> = {
  open: { label: 'Start', status: 'in_progress', icon: <PlayCircle size={14} /> },
  in_progress: { label: 'Resolve', status: 'resolved', icon: <CheckCircle2 size={14} /> },
  resolved: { label: 'Close', status: 'closed', icon: <XCircle size={14} /> },
};

function MessageBubble({ message, currentUserId }: { message: SupportTicketMessage; currentUserId?: number }) {
  const isInternal = message.is_internal;
  const isOwn = !isInternal && message.user?.id === currentUserId;
  const isOther = !isInternal && message.user?.id !== currentUserId;
  const attachments = message.attachments || [];

  return (
    <div className={`flex ${isInternal || isOther ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isInternal
            ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm'
            : isOther
              ? 'bg-gray-100 border border-gray-200 text-gray-800 rounded-tl-sm'
              : 'bg-brand-primary text-white rounded-tr-sm'
          }
        `}
      >
        {isInternal && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lock size={10} className="text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Internal Note</span>
          </div>
        )}
        {message.message && <p className="whitespace-pre-wrap">{message.message}</p>}
        {attachments.map((a) => (
          a.mime_type?.startsWith('image/')
            ? <img key={a.id} src={a.url} alt={a.original_name} className="max-w-full rounded-lg mt-2 cursor-pointer" onClick={() => window.open(a.url, '_blank')} loading="lazy" />
            : <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block mt-1 underline text-sm">{a.original_name}</a>
        ))}
        {!message.message && attachments.length === 0 && !isInternal && (
          <p className="italic opacity-80">[Attachment only]</p>
        )}
        <div className={`flex items-center gap-2 mt-1.5 ${isInternal ? 'text-amber-600' : isOther ? 'text-gray-500' : 'text-white/70'}`}>
          {message.user && (
            <span className="text-[10px] font-medium">{message.user.full_name}</span>
          )}
          <span className="text-[10px] opacity-60">
            {new Date(message.created_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const id = parseInt(ticketId || '0', 10);
  const [messageText, setMessageText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: ticket, isLoading, isError, error, refetch } = useTicketDetail(id);
  const sendMutation = useSendMessage(id);
  const statusMutation = useUpdateTicketStatus(id);
  useSupportRealtime(id);

  const messages = useMemo(() => {
    const msgs = ticket?.messages || [];
    return [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [ticket?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;
    sendMutation.mutate(
      { message: text, is_internal: isInternal },
      {
        onSuccess: () => {
          setMessageText('');
          setIsInternal(false);
          inputRef.current?.focus();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-32 bg-gray-100 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SUPPORT_TICKETS)}>
          <ArrowLeft size={16} className="mr-1.5" /> {t('common.back')}
        </Button>
        <ErrorState
          title="Failed to load ticket"
          message={error instanceof Error ? error.message : 'An error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!ticket) return null;

  const nextAction = NEXT_STATUS[ticket.status];

  return (
    <div className="flex flex-col space-y-5 animate-fade-up max-w-5xl mx-auto min-h-0" style={{ minHeight: 'calc(100vh - 64px - 48px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SUPPORT_TICKETS)}>
            <ArrowLeft size={16} className="mr-1.5" /> {t('common.back')}
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary font-display line-clamp-1">{ticket.subject}</h1>
            <p className="text-xs text-text-secondary font-body">{ticket.ticket_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[ticket.status] || 'yellow'} size="sm" className="capitalize">
            {t('support.ticketStatus.' + (ticket.status ?? 'unknown'))}
          </Badge>
          {nextAction && (
            <Button
              variant="primary"
              size="sm"
              isLoading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(nextAction.status)}
            >
              {nextAction.icon}
              <span className="ml-1">{nextAction.label}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Info */}
      <Card padding="md" className="flex-shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider font-body mb-1">Customer</p>
            <div className="flex items-center gap-1.5 text-sm text-text-primary">
              <User size={14} className="text-text-tertiary" />
              <span>{ticket.customer?.full_name || '—'}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider font-body mb-1">Assignee</p>
            <div className="flex items-center gap-1.5 text-sm text-text-primary">
              <User size={14} className="text-text-tertiary" />
              <span>{ticket.assignee?.full_name || 'Unassigned'}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider font-body mb-1">Priority</p>
            <p className="text-sm text-text-primary capitalize">{ticket.priority}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider font-body mb-1">Created</p>
            <div className="flex items-center gap-1.5 text-sm text-text-primary">
              <Clock size={14} className="text-text-tertiary" />
              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat area */}
      <Card padding="none" className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Send a message to start the conversation"
            />
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} currentUserId={user?.id} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-border-default/60 p-4 bg-white flex-shrink-0">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setIsInternal(!isInternal)}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0
                ${isInternal
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-gray-100 text-text-tertiary border border-transparent hover:bg-gray-200'
                }
              `}
              title={isInternal ? 'Switch to public reply' : 'Switch to internal note'}
            >
              {isInternal ? <Lock size={12} /> : <Unlock size={12} />}
              {isInternal ? 'Internal' : 'Public'}
            </button>
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isInternal ? 'Write an internal note (not visible to customer)...' : 'Type your reply...'}
              rows={1}
              className="flex-1 px-4 py-2.5 text-sm bg-bg-input border border-border-default rounded-xl outline-none resize-none focus:border-brand-primary transition-colors"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              isLoading={sendMutation.isPending}
              disabled={!messageText.trim()}
              className="flex-shrink-0"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
