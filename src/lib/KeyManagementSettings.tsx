/**
 * KeyManagementSettings — User settings for managing S/MIME certificates
 * and GPG public keys.
 *
 * Two sections: S/MIME Certificate and GPG Public Key.
 * Each section: upload button, display of current key metadata, delete button.
 * Validates uploaded files before storing.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { FC, memo, useCallback, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KeyManagementSettingsProps {
  /** Current PEM-encoded S/MIME certificate, or undefined if none stored. */
  smimeCertificate?: string;
  /** Current ASCII-armored GPG public key, or undefined if none stored. */
  gpgPublicKey?: string;
  /** Callback to persist updated key values. */
  onUpdate: (changes: {
    smimeCertificate?: string | null;
    gpgPublicKey?: string | null;
  }) => Promise<void>;
}

export interface KeyMetadata {
  label: string;
  value: string;
}

// ─── Validation helpers (exported for testing) ──────────────────────────────

/**
 * Validates that a string looks like a PEM-encoded X.509 certificate.
 * Checks for BEGIN/END CERTIFICATE markers.
 */
export function isValidSmimeCertificate(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.includes('-----BEGIN CERTIFICATE-----') &&
    trimmed.includes('-----END CERTIFICATE-----')
  );
}

/**
 * Validates that a string looks like an ASCII-armored PGP public key block.
 * Checks for BEGIN/END PGP PUBLIC KEY BLOCK markers.
 */
export function isValidGpgPublicKey(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') &&
    trimmed.includes('-----END PGP PUBLIC KEY BLOCK-----')
  );
}

/**
 * Extracts basic metadata from a PEM certificate string.
 * Returns a simplified label (just indicates it's present).
 */
export function extractSmimeMetadata(pem: string): KeyMetadata[] {
  const lines = pem.trim().split('\n');
  // Count content lines (excluding markers)
  const contentLines = lines.filter(
    (l) => !l.startsWith('-----') && l.trim().length > 0,
  );
  return [
    { label: 'Format', value: 'X.509 PEM' },
    { label: 'Size', value: `${contentLines.length} lines` },
  ];
}

/**
 * Extracts basic metadata from an ASCII-armored GPG public key.
 */
export function extractGpgMetadata(armored: string): KeyMetadata[] {
  const lines = armored.trim().split('\n');
  const contentLines = lines.filter(
    (l) => !l.startsWith('-----') && l.trim().length > 0,
  );
  return [
    { label: 'Format', value: 'ASCII-armored PGP' },
    { label: 'Size', value: `${contentLines.length} lines` },
  ];
}

// ─── Component ──────────────────────────────────────────────────────────────

const KeyManagementSettings: FC<KeyManagementSettingsProps> = ({
  smimeCertificate,
  gpgPublicKey,
  onUpdate,
}) => {
  const [smimeError, setSmimeError] = useState<string | null>(null);
  const [gpgError, setGpgError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const smimeInputRef = useRef<HTMLInputElement>(null);
  const gpgInputRef = useRef<HTMLInputElement>(null);

  // ── S/MIME upload handler ─────────────────────────────────────────────
  const handleSmimeUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setSmimeError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        if (!isValidSmimeCertificate(content)) {
          setSmimeError('Invalid X.509 certificate file');
          return;
        }
        setUpdating(true);
        await onUpdate({ smimeCertificate: content });
      } catch {
        setSmimeError('Failed to upload certificate');
      } finally {
        setUpdating(false);
        // Reset input so the same file can be re-selected
        if (smimeInputRef.current) smimeInputRef.current.value = '';
      }
    },
    [onUpdate],
  );

  // ── GPG upload handler ────────────────────────────────────────────────
  const handleGpgUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setGpgError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        if (!isValidGpgPublicKey(content)) {
          setGpgError('Invalid PGP public key file');
          return;
        }
        setUpdating(true);
        await onUpdate({ gpgPublicKey: content });
      } catch {
        setGpgError('Failed to upload key');
      } finally {
        setUpdating(false);
        if (gpgInputRef.current) gpgInputRef.current.value = '';
      }
    },
    [onUpdate],
  );

  // ── Delete handlers ───────────────────────────────────────────────────
  const handleDeleteSmime = useCallback(async () => {
    setSmimeError(null);
    setUpdating(true);
    try {
      await onUpdate({ smimeCertificate: null });
    } catch {
      setSmimeError('Failed to delete certificate');
    } finally {
      setUpdating(false);
    }
  }, [onUpdate]);

  const handleDeleteGpg = useCallback(async () => {
    setGpgError(null);
    setUpdating(true);
    try {
      await onUpdate({ gpgPublicKey: null });
    } catch {
      setGpgError('Failed to delete key');
    } finally {
      setUpdating(false);
    }
  }, [onUpdate]);

  const smimeMetadata = smimeCertificate
    ? extractSmimeMetadata(smimeCertificate)
    : null;
  const gpgMetadata = gpgPublicKey ? extractGpgMetadata(gpgPublicKey) : null;

  return (
    <Box
      data-testid="key-management-settings"
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {/* ── S/MIME Certificate Section ─────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            S/MIME Certificate
          </Typography>

          {smimeMetadata ? (
            <Box data-testid="smime-metadata" sx={{ mb: 1 }}>
              {smimeMetadata.map((m) => (
                <Typography
                  key={m.label}
                  variant="body2"
                  color="text.secondary"
                >
                  {m.label}: {m.value}
                </Typography>
              ))}
              <IconButton
                data-testid="smime-delete-btn"
                onClick={handleDeleteSmime}
                disabled={updating}
                aria-label="Delete S/MIME certificate"
                size="small"
                color="error"
                sx={{ mt: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No certificate uploaded
            </Typography>
          )}

          {smimeError && (
            <Alert severity="error" data-testid="smime-error" sx={{ mb: 1 }}>
              {smimeError}
            </Alert>
          )}

          <input
            ref={smimeInputRef}
            type="file"
            accept=".pem,.crt,.cer"
            onChange={handleSmimeUpload}
            style={{ display: 'none' }}
            data-testid="smime-file-input"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon />}
            onClick={() => smimeInputRef.current?.click()}
            disabled={updating}
            data-testid="smime-upload-btn"
          >
            {smimeCertificate ? 'Replace Certificate' : 'Upload Certificate'}
          </Button>
        </CardContent>
      </Card>

      {/* ── GPG Public Key Section ─────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            GPG Public Key
          </Typography>

          {gpgMetadata ? (
            <Box data-testid="gpg-metadata" sx={{ mb: 1 }}>
              {gpgMetadata.map((m) => (
                <Typography
                  key={m.label}
                  variant="body2"
                  color="text.secondary"
                >
                  {m.label}: {m.value}
                </Typography>
              ))}
              <IconButton
                data-testid="gpg-delete-btn"
                onClick={handleDeleteGpg}
                disabled={updating}
                aria-label="Delete GPG public key"
                size="small"
                color="error"
                sx={{ mt: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No public key uploaded
            </Typography>
          )}

          {gpgError && (
            <Alert severity="error" data-testid="gpg-error" sx={{ mb: 1 }}>
              {gpgError}
            </Alert>
          )}

          <input
            ref={gpgInputRef}
            type="file"
            accept=".asc,.gpg,.pgp,.pub"
            onChange={handleGpgUpload}
            style={{ display: 'none' }}
            data-testid="gpg-file-input"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon />}
            onClick={() => gpgInputRef.current?.click()}
            disabled={updating}
            data-testid="gpg-upload-btn"
          >
            {gpgPublicKey ? 'Replace Key' : 'Upload Key'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default memo(KeyManagementSettings);
