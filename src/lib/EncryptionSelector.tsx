/**
 * EncryptionSelector — Allows the sender to choose an encryption scheme
 * (None, ECIES, S/MIME) before sending an email.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7
 */

import { MessageEncryptionScheme } from '@brightchain/brightchain-lib';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { FC, memo, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EncryptionSelectorProps {
  value: MessageEncryptionScheme;
  onChange: (scheme: MessageEncryptionScheme) => void;
  recipientWarnings?: string[];
  senderCertMissing?: boolean;
}

// ─── Option mapping ─────────────────────────────────────────────────────────

const ENCRYPTION_OPTIONS: {
  value: MessageEncryptionScheme;
  label: string;
}[] = [
  { value: MessageEncryptionScheme.NONE, label: 'No Encryption' },
  { value: MessageEncryptionScheme.RECIPIENT_KEYS, label: 'ECIES' },
  { value: MessageEncryptionScheme.S_MIME, label: 'S/MIME' },
];

// ─── Pure utility (exported for property testing — Property 9) ──────────────

/**
 * Returns the recipients whose addresses are NOT present in the knownKeys map.
 *
 * @param recipients - Array of recipient email addresses.
 * @param knownKeys  - Map of email address → public key string.
 * @returns Array of recipient addresses missing from knownKeys.
 */
export function findMissingRecipientKeys(
  recipients: string[],
  knownKeys: Record<string, string>,
): string[] {
  return recipients.filter(
    (addr) => !Object.prototype.hasOwnProperty.call(knownKeys, addr),
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

const EncryptionSelector: FC<EncryptionSelectorProps> = ({
  value,
  onChange,
  recipientWarnings,
  senderCertMissing,
}) => {
  const handleChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange(e.target.value as MessageEncryptionScheme);
    },
    [onChange],
  );

  const requiresKeys =
    value === MessageEncryptionScheme.RECIPIENT_KEYS ||
    value === MessageEncryptionScheme.S_MIME;

  const showRecipientWarning =
    requiresKeys && recipientWarnings && recipientWarnings.length > 0;

  const showSenderCertWarning =
    value === MessageEncryptionScheme.S_MIME && senderCertMissing === true;

  return (
    <Box data-testid="encryption-selector">
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="encryption-selector-label">Encryption</InputLabel>
        <Select
          labelId="encryption-selector-label"
          id="encryption-selector-select"
          value={value}
          label="Encryption"
          onChange={handleChange}
          data-testid="encryption-select"
        >
          {ENCRYPTION_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showRecipientWarning && (
        <Alert
          severity="warning"
          sx={{ mt: 1 }}
          data-testid="recipient-key-warning"
        >
          The following recipients lack public keys:{' '}
          {recipientWarnings.join(', ')}
        </Alert>
      )}

      {showSenderCertWarning && (
        <Alert
          severity="warning"
          sx={{ mt: 1 }}
          data-testid="sender-cert-warning"
        >
          S/MIME signing requires a configured certificate in Settings
        </Alert>
      )}
    </Box>
  );
};

export default memo(EncryptionSelector);
