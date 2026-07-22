import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient, getAuthToken } from '@/lib/axios';
import { formatPrice } from '@/utils/currency';
import { LoginForm } from '@/features/auth/components/LoginForm';

// ── Types ──

interface StatCardData {
  labelKey: string;
  value: string;
  sublabel: string;
  trend: 'up' | 'live' | 'neutral';
  iconSvg: string;
  iconBg: 'green' | 'blue' | 'orange' | 'purple';
}

// ── SVG Icons (inline to avoid loading lucide on public page) ──

const ICONS = {
  orders: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  suppliers: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  revenue: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  fulfillment: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  trendUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  trendLive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};

// ── Default Placeholder Stats ──

const DEFAULT_STATS: StatCardData[] = [
  {
    labelKey: 'totalOrders', value: '1,247', sublabel: '+18 dispatched today',
    trend: 'up', iconSvg: ICONS.orders, iconBg: 'green',
  },
  {
    labelKey: 'activeSuppliers', value: '48', sublabel: '100% operational',
    trend: 'live', iconSvg: ICONS.suppliers, iconBg: 'blue',
  },
  {
    labelKey: 'monthlyRevenue', value: '482K', sublabel: '+12.5% growth',
    trend: 'up', iconSvg: ICONS.revenue, iconBg: 'orange',
  },
  {
    labelKey: 'fulfillmentRate', value: '98.7%', sublabel: '+2.3% this week',
    trend: 'up', iconSvg: ICONS.fulfillment, iconBg: 'purple',
  },
];

// ── Fetch Live Stats from Backend ──

async function fetchLoginStats(): Promise<StatCardData[]> {
  if (!getAuthToken()) return DEFAULT_STATS;
  try {
    const res = await apiClient.get('/api/v1/admin/dashboard');
    const d = res.data?.data;
    if (!d) return DEFAULT_STATS;

    const orders = d.orders || {};
    const totalOrders = (orders.today || 0) + (orders.week || 0);
    const pendingApprovals = d.pending_approvals || {};

    return [
      {
        labelKey: 'totalOrders',
        value: totalOrders > 0 ? totalOrders.toLocaleString() : '1,247',
        sublabel: `${orders.today || 0} today`,
        trend: 'up', iconSvg: ICONS.orders, iconBg: 'green',
      },
      {
        labelKey: 'activeSuppliers',
        value: '48',
        sublabel: pendingApprovals.suppliers > 0 ? `${pendingApprovals.suppliers} pending` : 'All approved',
        trend: pendingApprovals.suppliers > 0 ? 'live' : 'up',
        iconSvg: ICONS.suppliers, iconBg: 'blue',
      },
      {
        labelKey: 'monthlyRevenue',
        value: d.revenue ? `${formatPrice(Number(d.revenue))}` : '482K',
        sublabel: 'This month',
        trend: 'up', iconSvg: ICONS.revenue, iconBg: 'orange',
      },
      {
        labelKey: 'fulfillmentRate',
        value: d.trips_today ? '94%' : '98.7%',
        sublabel: `${d.trips_today || 0} trips today`,
        trend: 'up', iconSvg: ICONS.fulfillment, iconBg: 'purple',
      },
    ];
  } catch {
    return DEFAULT_STATS;
  }
}

// ── Helpers ──

const ICON_BG_CLASS: Record<string, string> = {
  green: 'rgba(45,212,168,0.15)',
  blue: 'rgba(59,130,246,0.15)',
  orange: 'rgba(249,115,22,0.15)',
  purple: 'rgba(168,85,247,0.15)',
};

const ICON_COLOR: Record<string, string> = {
  green: '#2dd4a8',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#a855f7',
};

// ── Component ──

export function LoginPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatCardData[]>(DEFAULT_STATS);
  const statsLoaded = useRef(false);

  // Inject focus styles once on mount, clean up on unmount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `input:focus { border-color: #2dd4a8 !important; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // ── Fetch stats on mount ──
  useEffect(() => {
    if (!statsLoaded.current) {
      statsLoaded.current = true;
      fetchLoginStats().then(setStats);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row w-screen min-h-screen overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ── LEFT PANEL (Dark, hidden on mobile & tablet) ── */}
      <div className="hidden lg:flex relative flex-1 overflow-hidden flex-col px-8 py-8" style={styles.leftPanel}>
        {/* Network SVG — dashed connection lines & glowing nodes */}
        <svg style={styles.networkSvg} viewBox="0 0 700 700" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="glow-green">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-red">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-orange">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Dashed connection lines */}
          <path d="M 300 320 Q 200 200 100 160" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.4"/>
          <path d="M 300 320 Q 350 180 380 130" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.4"/>
          <path d="M 300 320 Q 420 280 500 320" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.4"/>
          <path d="M 300 320 Q 400 420 480 480" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.4"/>
          <path d="M 300 320 Q 280 430 260 520" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.4"/>
          <path d="M 300 320 Q 180 380 80 400" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.4"/>
          <path d="M 100 160 Q 200 280 300 320" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.3"/>
          <path d="M 380 130 Q 450 250 500 320" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.3"/>
          <path d="M 500 320 Q 490 400 480 480" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.3"/>
          <path d="M 480 480 Q 370 500 260 520" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.3"/>
          <path d="M 260 520 Q 170 470 80 400" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.3"/>
          <path d="M 80 400 Q 90 280 100 160" stroke="#2dd4a8" strokeWidth="1.5" fill="none" strokeDasharray="6,6" opacity="0.3"/>

          {/* NEXA Hub (center, green) */}
          <circle cx="300" cy="320" r="28" fill="rgba(45,212,168,0.15)" stroke="#2dd4a8" strokeWidth="1.5" filter="url(#glow-green)"/>
          <circle cx="300" cy="320" r="10" fill="#2dd4a8" opacity="0.8"/>
          <circle cx="300" cy="320" r="4" fill="#fff"/>

          {/* Air Freight (top, green) */}
          <circle cx="380" cy="130" r="22" fill="rgba(45,212,168,0.15)" stroke="#2dd4a8" strokeWidth="1.5" filter="url(#glow-green)"/>
          <circle cx="380" cy="130" r="8" fill="#2dd4a8" opacity="0.8"/>
          <circle cx="380" cy="130" r="3" fill="#fff"/>

          {/* Rejected node (left, red) */}
          <circle cx="100" cy="160" r="22" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glow-red)"/>
          <circle cx="100" cy="160" r="8" fill="#ef4444" opacity="0.8"/>
          <circle cx="100" cy="160" r="3" fill="#fff"/>

          {/* Regional (right, green) */}
          <circle cx="500" cy="320" r="22" fill="rgba(45,212,168,0.15)" stroke="#2dd4a8" strokeWidth="1.5" filter="url(#glow-green)"/>
          <circle cx="500" cy="320" r="8" fill="#2dd4a8" opacity="0.8"/>
          <circle cx="500" cy="320" r="3" fill="#fff"/>

          {/* Suspended node (right-mid, orange) */}
          <circle cx="480" cy="480" r="22" fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="1.5" filter="url(#glow-orange)"/>
          <circle cx="480" cy="480" r="8" fill="#f97316" opacity="0.8"/>
          <circle cx="480" cy="480" r="3" fill="#fff"/>

          {/* Distribution (bottom, green) */}
          <circle cx="260" cy="520" r="22" fill="rgba(45,212,168,0.15)" stroke="#2dd4a8" strokeWidth="1.5" filter="url(#glow-green)"/>
          <circle cx="260" cy="520" r="8" fill="#2dd4a8" opacity="0.8"/>
          <circle cx="260" cy="520" r="3" fill="#fff"/>

          {/* Left edge node */}
          <circle cx="80" cy="400" r="22" fill="rgba(45,212,168,0.15)" stroke="#2dd4a8" strokeWidth="1.5" filter="url(#glow-green)"/>
          <circle cx="80" cy="400" r="8" fill="#2dd4a8" opacity="0.8"/>
          <circle cx="80" cy="400" r="3" fill="#fff"/>
        </svg>

        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>N</div>
          <div>
            <div style={styles.logoText}>{t('app.title')}</div>
            <div style={styles.logoSub}>{t('app.subtitle')}</div>
          </div>
        </div>

        {/* Stat cards — positioned in each corner */}
        {stats.map((stat, idx) => {
          const positions = [
            { top: '20%', right: '16%' },      // Card 0: top-right
            { bottom: '30%', right: '16%' },    // Card 1: bottom-right
            { bottom: '30%', left: '16%' },     // Card 2: bottom-left
            { top: '20%', left: '16%' },        // Card 3: top-left
          ];
          const pos = positions[idx % positions.length];
          return (
            <div
              key={stat.labelKey}
              style={{
                position: 'absolute',
                ...pos,
                zIndex: 15,
              }}
            >
              <div style={styles.orbitCardInner}>
                <div style={styles.orbitCardHeader}>
                  <div style={{
                    ...styles.statIcon,
                    background: ICON_BG_CLASS[stat.iconBg],
                    color: ICON_COLOR[stat.iconBg],
                  }}
                    dangerouslySetInnerHTML={{ __html: stat.iconSvg }}
                  />
                  <span style={styles.statLabel}>{t(`auth.loginPage.${stat.labelKey}`)}</span>
                </div>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={{
                  ...styles.statChange,
                  color: stat.trend === 'up' ? '#2dd4a8' : stat.trend === 'live' ? '#f97316' : 'rgba(255,255,255,0.45)',
                }}>
                  <span style={styles.trendIcon}
                    dangerouslySetInnerHTML={{ __html: stat.trend === 'live' ? ICONS.trendLive : ICONS.trendUp }}
                  />
                  {stat.sublabel}
                </div>
              </div>
            </div>
          );
        })}

        {/* Node labels */}
        <div style={styles.nodeLabelHub}>{t('auth.loginPage.hubLabel')}</div>
        <div style={styles.nodeLabelAir}>{t('auth.loginPage.airFreightLabel')}</div>
        <div style={styles.nodeLabelRegional}>{t('auth.loginPage.regionalLabel')}</div>
        <div style={styles.nodeLabelDist}>{t('auth.loginPage.distributionLabel')}</div>

        {/* Bottom content */}
        <div style={styles.bottomContent}>
          <div style={styles.platformBadge}>
            <div style={styles.platformDot} />
            <span style={styles.platformText}>{t('auth.loginPage.intelligentPlatform')}</span>
          </div>
          <h1 style={styles.bottomTitle} dangerouslySetInnerHTML={{ __html: t('auth.loginPage.poweringModern') }} />
          <p style={styles.bottomDesc}>
            {t('auth.loginPage.platformDescription')}
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Light, full-width on mobile & tablet) ── */}
      <div className="w-full lg:w-[480px] flex items-center justify-center px-6 lg:px-10 py-8" style={{ background: '#f0f2f5', minWidth: 0 }}>
        <LoginForm />
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ── Inline Styles ──

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // ── Left Panel ──
  leftPanel: {
    flex: 1,
    position: 'relative',
    background: '#0a1628',
    overflow: 'hidden',
    padding: '32px 40px',
  },
  networkSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none' as const,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: '#2dd4a8',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    color: '#0a1628',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },

  // ── Orbit Card ──
  orbitCardInner: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(15,25,45,0.88)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '16px 20px',
    minWidth: 180,
    width: 180,
  },
  orbitCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    width: 14,
    height: 14,
    display: 'inline-flex',
  },

  // ── Node Labels ──
  nodeLabelHub: {
    position: 'absolute',
    zIndex: 5,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none' as const,
    left: '270px',
    top: '355px',
  },
  nodeLabelAir: {
    position: 'absolute',
    zIndex: 5,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none' as const,
    left: '355px',
    top: '160px',
  },
  nodeLabelRegional: {
    position: 'absolute',
    zIndex: 5,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none' as const,
    left: '475px',
    top: '350px',
  },
  nodeLabelDist: {
    position: 'absolute',
    zIndex: 5,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none' as const,
    left: '230px',
    top: '550px',
  },

  // ── Bottom Content ──
  bottomContent: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    zIndex: 10,
  },
  platformBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(45,212,168,0.1)',
    border: '1px solid rgba(45,212,168,0.25)',
    borderRadius: 20,
    padding: '6px 16px',
    marginBottom: 16,
  },
  platformDot: {
    width: 8,
    height: 8,
    background: '#2dd4a8',
    borderRadius: '50%',
    animation: 'pulse-dot 2s infinite',
  },
  platformText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#2dd4a8',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  bottomTitle: {
    fontSize: 34,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
    marginBottom: 14,
  },
  bottomDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.6,
    maxWidth: 380,
  },

  // ── Right Panel ──
  rightPanel: {
    width: 480,
    minWidth: 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    background: '#f0f2f5',
  },
};


