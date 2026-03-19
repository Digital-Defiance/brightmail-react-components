/**
 * Unit tests for KeyManagementSettings component.
 *
 * Tests: upload flow with valid/invalid certificate files, delete action,
 * display of certificate metadata.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KeyManagementSettingsProps } from '../KeyManagementSettings';
import KeyManagementSettings from '../KeyManagementSettings';

// ─── Test data ──────────────────────────────────────────────────────────────

const VALID_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALRiMLAh0ESOMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RDQTAYHQ0yNTAxMDEwMDAwMDBaFw0yNjAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RDQTBcMA0GCSqGSIb3DQEBAQUAAw==
-----END CERTIFICATE-----`;

const INVALID_PEM = 'not a certificate at all';

const VALID_GPG = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mQENBGABCDEBCAC1234567890abcdef
=ABCD
-----END PGP PUBLIC KEY BLOCK-----`;

const INVALID_GPG = 'not a gpg key';

// ─── Helpers ────────────────────────────────────────────────────────────────

const defaultProps: KeyManagementSettingsProps = {
  onUpdate: jest.fn().mockResolvedValue(undefined),
};

function renderSettings(overrides: Partial<KeyManagementSettingsProps> = {}) {
  return render(<KeyManagementSettings {...defaultProps} {...overrides} />);
}

/**
 * Creates a mock File with the given text content.
 */
function createTextFile(content: string, name: string): File {
  const file = new File([content], name, { type: 'application/x-pem-file' });
  // Ensure .text() works in jsdom
  file.text = () => Promise.resolve(content);
  return file;
}

/**
 * Simulates uploading a file to a hidden input.
 */
function uploadFile(input: HTMLElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('KeyManagementSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Requirement 6.1: Renders both sections ────────────────────────────

  it('renders the key management settings container', () => {
    renderSettings();
    expect(screen.getByTestId('key-management-settings')).toBeInTheDocument();
  });

  it('shows "No certificate uploaded" when smimeCertificate is undefined', () => {
    renderSettings();
    expect(screen.getByText('No certificate uploaded')).toBeInTheDocument();
  });

  it('shows "No public key uploaded" when gpgPublicKey is undefined', () => {
    renderSettings();
    expect(screen.getByText('No public key uploaded')).toBeInTheDocument();
  });

  // ── Requirement 6.2: Upload valid S/MIME certificate ──────────────────

  it('calls onUpdate with certificate content when a valid PEM is uploaded', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    renderSettings({ onUpdate });

    const input = screen.getByTestId('smime-file-input');
    const file = createTextFile(VALID_PEM, 'cert.pem');
    uploadFile(input, file);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        smimeCertificate: VALID_PEM,
      });
    });
  });

  // ── Requirement 6.3: Reject invalid S/MIME certificate ────────────────

  it('shows error when an invalid certificate file is uploaded', async () => {
    renderSettings();

    const input = screen.getByTestId('smime-file-input');
    const file = createTextFile(INVALID_PEM, 'bad.pem');
    uploadFile(input, file);

    await waitFor(() => {
      expect(screen.getByTestId('smime-error')).toHaveTextContent(
        'Invalid X.509 certificate file',
      );
    });
  });

  // ── Requirement 6.2: Upload valid GPG key ─────────────────────────────

  it('calls onUpdate with key content when a valid GPG key is uploaded', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    renderSettings({ onUpdate });

    const input = screen.getByTestId('gpg-file-input');
    const file = createTextFile(VALID_GPG, 'key.asc');
    uploadFile(input, file);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        gpgPublicKey: VALID_GPG,
      });
    });
  });

  // ── Requirement 6.3: Reject invalid GPG key ──────────────────────────

  it('shows error when an invalid GPG key file is uploaded', async () => {
    renderSettings();

    const input = screen.getByTestId('gpg-file-input');
    const file = createTextFile(INVALID_GPG, 'bad.asc');
    uploadFile(input, file);

    await waitFor(() => {
      expect(screen.getByTestId('gpg-error')).toHaveTextContent(
        'Invalid PGP public key file',
      );
    });
  });

  // ── Requirement 6.4: Display certificate metadata ─────────────────────

  it('displays S/MIME metadata when certificate is present', () => {
    renderSettings({ smimeCertificate: VALID_PEM });
    expect(screen.getByTestId('smime-metadata')).toBeInTheDocument();
    expect(screen.getByText('Format: X.509 PEM')).toBeInTheDocument();
  });

  it('displays GPG metadata when key is present', () => {
    renderSettings({ gpgPublicKey: VALID_GPG });
    expect(screen.getByTestId('gpg-metadata')).toBeInTheDocument();
    expect(screen.getByText('Format: ASCII-armored PGP')).toBeInTheDocument();
  });

  // ── Requirement 6.5: Delete certificate ───────────────────────────────

  it('calls onUpdate with null to delete S/MIME certificate', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    renderSettings({ smimeCertificate: VALID_PEM, onUpdate });

    fireEvent.click(screen.getByTestId('smime-delete-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ smimeCertificate: null });
    });
  });

  it('calls onUpdate with null to delete GPG key', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    renderSettings({ gpgPublicKey: VALID_GPG, onUpdate });

    fireEvent.click(screen.getByTestId('gpg-delete-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ gpgPublicKey: null });
    });
  });

  // ── Requirement 6.1: Upload button text changes ───────────────────────

  it('shows "Replace Certificate" when certificate exists', () => {
    renderSettings({ smimeCertificate: VALID_PEM });
    expect(screen.getByTestId('smime-upload-btn')).toHaveTextContent(
      'Replace Certificate',
    );
  });

  it('shows "Upload Certificate" when no certificate exists', () => {
    renderSettings();
    expect(screen.getByTestId('smime-upload-btn')).toHaveTextContent(
      'Upload Certificate',
    );
  });
});
