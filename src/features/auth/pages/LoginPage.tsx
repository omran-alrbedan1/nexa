import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDefaultRoute } from '@/contexts/AuthContext';
import { useToastStore } from '@/stores/toastStore';
import { apiClient } from '@/lib/axios';

// ── Types ──

interface StatCardData {
  label: string;
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
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  eye: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

// ── Default Placeholder Stats ──

const DEFAULT_STATS: StatCardData[] = [
  {
    label: 'Total Orders', value: '1,247', sublabel: '+18 dispatched today',
    trend: 'up', iconSvg: ICONS.orders, iconBg: 'green',
  },
  {
    label: 'Active Suppliers', value: '48', sublabel: '100% operational',
    trend: 'live', iconSvg: ICONS.suppliers, iconBg: 'blue',
  },
  {
    label: 'Monthly Revenue', value: 'SAR 482K', sublabel: '+12.5% growth',
    trend: 'up', iconSvg: ICONS.revenue, iconBg: 'orange',
  },
  {
    label: 'Fulfillment Rate', value: '98.7%', sublabel: '+2.3% this week',
    trend: 'up', iconSvg: ICONS.fulfillment, iconBg: 'purple',
  },
];

// ── Fetch Live Stats from Backend ──

async function fetchLoginStats(): Promise<StatCardData[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return DEFAULT_STATS;

    const res = await apiClient.get('/api/v1/admin/dashboard');
    const d = res.data?.data;
    if (!d) return DEFAULT_STATS;

    const orders = d.orders || {};
    const totalOrders = (orders.today || 0) + (orders.week || 0);
    const pendingApprovals = d.pending_approvals || {};

    return [
      {
        label: 'Total Orders',
        value: totalOrders > 0 ? totalOrders.toLocaleString() : '1,247',
        sublabel: `${orders.today || 0} today`,
        trend: 'up', iconSvg: ICONS.orders, iconBg: 'green',
      },
      {
        label: 'Active Suppliers',
        value: '48',
        sublabel: pendingApprovals.suppliers > 0 ? `${pendingApprovals.suppliers} pending` : 'All approved',
        trend: pendingApprovals.suppliers > 0 ? 'live' : 'up',
        iconSvg: ICONS.suppliers, iconBg: 'blue',
      },
      {
        label: 'Revenue',
        value: d.revenue ? `SAR ${Number(d.revenue).toLocaleString()}` : 'SAR 482K',
        sublabel: 'This month',
        trend: 'up', iconSvg: ICONS.revenue, iconBg: 'orange',
      },
      {
        label: 'Fulfillment Rate',
        value: d.trips_today ? '94%' : '98.7%',
        sublabel: `${d.trips_today || 0} trips today`,
        trend: 'up', iconSvg: ICONS.fulfillment, iconBg: 'purple',
      },
    ];
  } catch {
    return DEFAULT_STATS;
  }
}

// ── Quick-fill credentials ──

const QUICK_FILL = [
  { email: 'admin@nexa.local', label: 'Admin', color: '#2dd4a8' },
  { email: 'ops@nexa.local', label: 'Ops', color: '#3b82f6' },
  { email: 'warehouse@nexa.local', label: 'Warehouse', color: '#a855f7' },
];

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
  // Inject focus styles once on mount, clean up on unmount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input:focus {
        border-color: #2dd4a8 !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<StatCardData[]>(DEFAULT_STATS);
  const statsLoaded = useRef(false);

  // ── Fetch stats on mount ──
  useEffect(() => {
    if (!statsLoaded.current) {
      statsLoaded.current = true;
      fetchLoginStats().then(setStats);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      const destination = from || getDefaultRoute(undefined);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Login failed. Check your credentials.');
      setError(message);
      useToastStore.getState().addToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (credEmail: string) => {
    setEmail(credEmail);
    setPassword('password');
  };

  return (
    <div style={styles.pageContainer}>
      {/* ── LEFT PANEL (Dark) ── */}
      <div style={styles.leftPanel}>
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
            <div style={styles.logoText}>NEXA</div>
            <div style={styles.logoSub}>Operations</div>
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
              key={stat.label}
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
                  <span style={styles.statLabel}>{stat.label}</span>
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
        <div style={styles.nodeLabelHub}>NEXA Hub</div>
        <div style={styles.nodeLabelAir}>Air Freight</div>
        <div style={styles.nodeLabelRegional}>Regional</div>
        <div style={styles.nodeLabelDist}>Distribution</div>

        {/* Bottom content */}
        <div style={styles.bottomContent}>
          <div style={styles.platformBadge}>
            <div style={styles.platformDot} />
            <span style={styles.platformText}>Intelligent Supply Platform</span>
          </div>
          <h1 style={styles.bottomTitle}>Powering Modern<br />Supply Operations</h1>
          <p style={styles.bottomDesc}>
            Manage orders, inventory, procurement, and warehouse coordination from one intelligent platform.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Light) ── */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          {/* Logo */}
          <div style={styles.loginLogo}>
            <div style={styles.loginLogoIcon}>N</div>
            <span style={styles.loginLogoName}>NEXA</span>
            <span style={styles.loginLogoSub}>Operations</span>
          </div>

          <h2 style={styles.loginTitle}>Welcome Back</h2>
          <p style={styles.loginSubtitle}>Sign in to your operations dashboard.</p>

          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={styles.formLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="admin@nexa.local"
              style={styles.textInput}
            />

            <label style={{ ...styles.formLabel, marginTop: 20 }}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                style={styles.passwordInput}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                dangerouslySetInnerHTML={{ __html: showPassword ? ICONS.eyeOff : ICONS.eye }}
              />
            </div>

            <div style={styles.formOptions}>
              <label style={styles.rememberMe}>
                <input type="checkbox" defaultChecked style={styles.checkbox} />
                Remember me
              </label>
              <a href="#" style={styles.forgotLink} onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.loginBtn,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Signing in...' : (
                <>
                  Login to Dashboard
                  <span style={styles.btnArrow} dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }} />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>quick login</span>
            <div style={styles.dividerLine} />
          </div>

          <div style={styles.quickFillRow}>
            {QUICK_FILL.map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => quickFill(cred.email)}
                style={{
                  ...styles.quickFillBtn,
                  borderColor: cred.color,
                  color: cred.color,
                }}
              >
                {cred.label}
              </button>
            ))}
          </div>

          {/* Trust badges */}
          <div style={styles.trustBadges}>
            <div style={styles.trustBadge}>
              <span style={styles.trustIcon} dangerouslySetInnerHTML={{ __html: ICONS.fulfillment.replace('strokeWidth="2"', 'strokeWidth="2" style="color:#2dd4a8"') }} />
              Verified Supplier Platform
            </div>
            <div style={styles.trustBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Secure Business Operations
            </div>
            <div style={styles.trustBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Protected Commercial Data
            </div>
          </div>
        </div>
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
    display: 'flex',
    flexDirection: 'column',
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
  loginCard: {
    background: '#fff',
    borderRadius: 24,
    padding: '44px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  loginLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  loginLogoIcon: {
    width: 32,
    height: 32,
    background: '#2dd4a8',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    color: '#0a1628',
  },
  loginLogoName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  loginLogoSub: {
    fontSize: 13,
    color: '#2dd4a8',
    fontWeight: 500,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 28,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  formLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#374151',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    padding: '13px 16px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 12,
    background: '#f9fafb',
    fontSize: 14,
    color: '#374151',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  passwordWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    width: '100%',
    padding: '13px 48px 13px 16px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 12,
    background: '#f9fafb',
    fontSize: 14,
    color: '#374151',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    padding: 0,
  },
  formOptions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  rememberMe: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#6b7280',
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: '#2dd4a8',
  },
  forgotLink: {
    fontSize: 13,
    color: '#2dd4a8',
    textDecoration: 'none',
    fontWeight: 600,
  },
  loginBtn: {
    width: '100%',
    padding: '15px 20px',
    background: 'linear-gradient(135deg, #2dd4a8, #20b892)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 16px rgba(45,212,168,0.3)',
  },
  btnArrow: {
    display: 'inline-flex',
    width: 18,
    height: 18,
  },

  // ── Divider & Quick Fill ──
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    fontWeight: 500,
  },
  quickFillRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  quickFillBtn: {
    flex: 1,
    padding: '10px 16px',
    background: '#fff',
    border: '1.5px solid',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center' as const,
  },

  // ── Trust Badges ──
  trustBadges: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    alignItems: 'center',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f3f4f6',
    borderRadius: 20,
    padding: '7px 14px',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
  },
  trustIcon: {
    width: 14,
    height: 14,
    display: 'inline-flex',
    color: '#2dd4a8',
  },
};


