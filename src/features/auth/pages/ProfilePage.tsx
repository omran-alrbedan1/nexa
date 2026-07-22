import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  User, Mail, Phone, Shield, Calendar, Clock, Building2,
} from 'lucide-react';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-display font-bold text-2xl shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{user.full_name}</h1>
              <p className="text-sm text-text-secondary font-body mt-0.5">
                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} · {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="teal" size="sm">{user.role}</Badge>
                <Badge variant="green" size="sm">{user.status}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Details */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('auth.profile.accountDetails')}</h3>
        </div>
        <div className="space-y-0 divide-y divide-border-default/50">
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Mail size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.email')}</span>
            <span className="font-bold text-text-primary">{user.email || '—'}</span>
          </div>
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Phone size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.phone')}</span>
            <span className="font-bold text-text-primary">{user.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Shield size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.role')}</span>
            <span className="font-bold text-text-primary capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Shield size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.userType')}</span>
            <span className="font-bold text-text-primary">{user.user_type}</span>
          </div>
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Building2 size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.permissions')}</span>
            <span className="font-bold text-text-primary">
              {user.permissions.length > 0 ? t('auth.profile.permissionsCount', { count: user.permissions.length }) : t('auth.profile.none')}
            </span>
          </div>
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Calendar size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.created')}</span>
            <span className="font-bold text-text-primary">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 py-3 text-sm font-body">
            <Clock size={14} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-secondary w-24">{t('auth.profile.lastLogin')}</span>
            <span className="font-bold text-text-primary">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* Powered by FutureX */}
      <div className="text-center py-6">
        <p className="text-xs text-text-tertiary font-body">
          {t('auth.profile.poweredBy')}{' '}
          <span className="font-bold text-brand-primary">{t('auth.profile.futureX')}</span>
        </p>
      </div>
    </div>
  );
}
