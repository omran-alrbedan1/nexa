import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, getDefaultRoute } from '@/contexts/AuthContext';
import { useToastStore } from '@/stores/toastStore';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/authSchema';

const ICONS = {
  eye: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
};

const QUICK_FILL = [
  { email: 'admin@nexa.local', label: 'Admin', color: '#2dd4a8' },
  { email: 'ops@nexa.local', label: 'Ops', color: '#3b82f6' },
  { email: 'warehouse@nexa.local', label: 'Warehouse', color: '#a855f7' },
];

const styles: Record<string, React.CSSProperties> = {
  formLabel: {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#374151',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  textInput: {
    width: '100%', padding: '13px 16px', border: '1.5px solid #e5e7eb',
    borderRadius: 12, background: '#f9fafb', fontSize: 14, color: '#374151',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444', background: '#fef2f2',
  },
  passwordWrapper: { position: 'relative', marginBottom: 20 },
  passwordInput: {
    width: '100%', padding: '13px 48px 13px 16px', border: '1.5px solid #e5e7eb',
    borderRadius: 12, background: '#f9fafb', fontSize: 14, color: '#374151',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
    display: 'flex', padding: 0,
  },
  formOptions: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },
  rememberMe: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', cursor: 'pointer',
  },
  checkbox: { width: 16, height: 16, accentColor: '#2dd4a8' },
  forgotLink: { fontSize: 13, color: '#2dd4a8', textDecoration: 'none', fontWeight: 600 },
  loginBtn: {
    width: '100%', padding: '15px 20px', background: 'linear-gradient(135deg, #2dd4a8, #20b892)',
    color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 4px 16px rgba(45,212,168,0.3)',
  },
  btnArrow: { display: 'inline-flex', width: 18, height: 18 },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
    padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 16, lineHeight: 1.4,
  },
  fieldError: { color: '#ef4444', fontSize: 11, marginTop: 4, marginBottom: 16 },
  divider: { display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 },
  dividerLine: { flex: 1, height: 1, background: '#e5e7eb' },
  dividerText: { fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500 },
  quickFillRow: { display: 'flex', gap: 8, marginBottom: 20 },
  quickFillBtn: {
    flex: 1, padding: '10px 16px', background: '#fff', border: '1.5px solid',
    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', textAlign: 'center',
  },
};

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      const destination = from || getDefaultRoute(undefined);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Login failed. Check your credentials.');
      setServerError(message);
      useToastStore.getState().addToast('error', message);
    }
  };

  const quickFill = (credEmail: string) => {
    setValue('email', credEmail);
    setValue('password', 'password');
  };

  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ width: 32, height: 32, background: '#2dd4a8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#0a1628' }}>N</div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>NEXA</span>
        <span style={{ fontSize: 13, color: '#2dd4a8', fontWeight: 500 }}>Operations</span>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Welcome Back</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Sign in to your operations dashboard.</p>

      {serverError && (
        <div style={styles.errorBox} role="alert">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label style={styles.formLabel}>Email</label>
        <input
          type="email"
          {...register('email')}
          autoFocus
          placeholder="admin@nexa.local"
          style={{ ...styles.textInput, ...(errors.email ? styles.inputError : {}) }}
        />
        {errors.email && <p style={styles.fieldError}>{errors.email.message}</p>}

        <label style={{ ...styles.formLabel, marginTop: 20 }}>Password</label>
        <div style={styles.passwordWrapper}>
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Enter password"
            style={{ ...styles.passwordInput, ...(errors.password ? styles.inputError : {}) }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            dangerouslySetInnerHTML={{ __html: showPassword ? ICONS.eyeOff : ICONS.eye }}
          />
        </div>
        {errors.password && <p style={styles.fieldError}>{errors.password.message}</p>}

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
          disabled={isSubmitting}
          style={{ ...styles.loginBtn, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Signing in...' : (
            <>
              Login to Dashboard
              <span style={styles.btnArrow} dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }} />
            </>
          )}
        </button>
      </form>

      {/* Quick-fill — dev only */}
      {import.meta.env.DEV && (
        <>
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
                style={{ ...styles.quickFillBtn, borderColor: cred.color, color: cred.color }}
              >
                {cred.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Trust badges */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {[
          { text: 'Verified Supplier Platform', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>` },
          { text: 'Secure Business Operations', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` },
          { text: 'Protected Commercial Data', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
        ].map((badge) => (
          <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f3f4f6', borderRadius: 20, padding: '7px 14px', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
            <span style={{ width: 14, height: 14, display: 'inline-flex', color: '#2dd4a8' }} dangerouslySetInnerHTML={{ __html: badge.icon }} />
            {badge.text}
          </div>
        ))}
      </div>
    </div>
  );
}
