# American Wellness MD Assistant - Security & HIPAA Compliance Guide

## Security Features Implemented

### 1. Security Headers
The application includes comprehensive security headers:
- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-XSS-Protection** - Enables browser XSS filtering
- **Content-Security-Policy** - Restricts resource loading
- **Strict-Transport-Security (HSTS)** - Forces HTTPS connections
- **Referrer-Policy** - Controls referrer information sharing
- **Permissions-Policy** - Restricts sensitive browser features

### 2. Rate Limiting
API endpoints are protected against abuse:
- 50 requests per minute per IP address
- 429 responses with Retry-After headers
- In-memory implementation (consider Redis for production)

### 3. Audit Logging
All PHI access is logged:
- Case creation, access, and deletion
- IP addresses and user agents
- Timestamps and action types
- Success/failure status

### 4. Input Validation
- Zod schema validation for all inputs
- XSS sanitization on user inputs
- File upload validation (type and size limits)

## HIPAA Compliance Checklist

### Technical Safeguards (Implemented)
- [x] Access controls (authentication ready)
- [x] Audit controls (logging implemented)
- [x] Integrity controls (hash verification ready)
- [x] Transmission security (HTTPS/HSTS)

### Technical Safeguards (Needs Implementation)
- [ ] Unique user identification (NextAuth.js)
- [ ] Automatic logoff (session timeout)
- [ ] Encryption of PHI at rest
- [ ] Encryption of PHI in transit

### Administrative Safeguards (Needs Implementation)
- [ ] Business Associate Agreements (BAAs)
- [ ] Risk analysis and management
- [ ] Workforce security training
- [ ] Contingency planning

## Required Environment Variables

```env
# Database (Required)
DATABASE_URL="postgresql://..."

# AI API (Required for analysis)
GEMINI_API_KEY="..."

# Security (Recommended)
SESSION_SECRET="your-random-secret-key"
ENCRYPTION_KEY="32-character-encryption-key"
```

## Deployment Security Checklist

### Vercel Deployment
1. ✅ Add `DATABASE_URL` environment variable
2. ✅ Add `GEMINI_API_KEY` environment variable
3. ⬜ Sign BAA with Vercel (Enterprise plan)
4. ⬜ Enable Vercel Web Application Firewall
5. ⬜ Configure custom headers in vercel.json

### Database Provider (e.g., Neon, Vercel Postgres)
1. ⬜ Sign Business Associate Agreement
2. ⬜ Enable automated encrypted backups
3. ⬜ Configure IP allowlist
4. ⬜ Enable audit logging

### Google AI Studio
1. ⬜ Review data usage policies
2. ⬜ Sign applicable BAAs
3. ⬜ Configure data residency if required

## Session Management Recommendations

For full HIPAA compliance, implement session timeout:

```typescript
// Recommended: 15-minute timeout for inactivity
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Auto-logout hook
useEffect(() => {
  const timer = setTimeout(() => {
    // Force logout after inactivity
    logout();
  }, SESSION_TIMEOUT);
  
  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(logout, SESSION_TIMEOUT);
  };
  
  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('keypress', resetTimer);
  
  return () => {
    clearTimeout(timer);
    window.removeEventListener('mousemove', resetTimer);
    window.removeEventListener('keypress', resetTimer);
  };
}, []);
```

## Data Encryption Recommendations

### At Rest
Use PostgreSQL with TDE (Transparent Data Encryption):
- **Vercel Postgres**: Automatic encryption at rest
- **Neon**: Automatic encryption at rest
- **Supabase**: Automatic encryption at rest

### In Transit
All connections use TLS 1.2+:
- HSTS header enforces HTTPS
- Certificate validation enabled

## Compliance Documentation

### Data Flow
1. Patient data enters via upload or voice
2. Data stored in encrypted PostgreSQL
3. AI analysis uses Google Gemini API
4. Results displayed to authorized users
5. Audit logs记录 all access

### PHI Access Points
- `/api/cases` - Case CRUD operations
- `/api/cases/[caseId]/results` - Analysis results
- `/api/files/upload` - File uploads
- `/case/[caseId]/voice` - Voice transcription

## Incident Response Plan

1. **Detection** - Monitor audit logs for unusual activity
2. **Containment** - Revoke access, disable affected accounts
3. **Investigation** - Review audit logs, determine scope
4. **Notification** - Notify affected individuals per HIPAA rules
5. **Remediation** - Fix vulnerabilities, restore data

## Regular Security Reviews

- Weekly: Review audit logs for anomalies
- Monthly: Update dependencies (npm audit)
- Quarterly: Penetration testing
- Annually: Full security assessment

## References

- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
