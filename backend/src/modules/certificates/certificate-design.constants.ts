/** Default field layout coordinates — overridable per template version via design JSON. */
export type CertificateFieldLayout = {
  x: number
  y: number
  width?: number
  align?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
}

export type CertificateDesign = {
  pageWidth?: number
  pageHeight?: number
  primaryColor?: string
  accentColor?: string
  showSignature?: boolean
  showQrCode?: boolean
  fields?: {
    organizationName?: CertificateFieldLayout
    subtitle?: CertificateFieldLayout
    studentName?: CertificateFieldLayout
    completionLine?: CertificateFieldLayout
    courseTitle?: CertificateFieldLayout
    instructor?: CertificateFieldLayout
    completionDate?: CertificateFieldLayout
    issueDate?: CertificateFieldLayout
    certificateNumber?: CertificateFieldLayout
    credentialId?: CertificateFieldLayout
    verifyUrl?: CertificateFieldLayout
    signature?: CertificateFieldLayout
    qrCode?: { x: number; y: number; size: number }
  }
}

export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesign = {
  pageWidth: 842,
  pageHeight: 595,
  showSignature: true,
  showQrCode: true,
  fields: {
    organizationName: { x: 0, y: 56, align: 'center', fontSize: 11, fontWeight: 'bold' },
    subtitle: { x: 0, y: 78, align: 'center', fontSize: 10, color: '#666666' },
    studentName: { x: 0, y: 130, align: 'center', fontSize: 28, fontWeight: 'bold', color: '#111111' },
    completionLine: { x: 0, y: 175, align: 'center', fontSize: 12, color: '#444444' },
    courseTitle: { x: 72, y: 205, width: 698, align: 'center', fontSize: 20, fontWeight: 'bold' },
    instructor: { x: 0, y: 265, align: 'center', fontSize: 11, color: '#444444' },
    completionDate: { x: 0, y: 285, align: 'center', fontSize: 11, color: '#444444' },
    issueDate: { x: 0, y: 302, align: 'center', fontSize: 11, color: '#444444' },
    certificateNumber: { x: 56, y: 523, align: 'left', fontSize: 8, color: '#888888' },
    credentialId: { x: 56, y: 537, align: 'left', fontSize: 8, color: '#888888' },
    verifyUrl: { x: 56, y: 551, width: 560, align: 'left', fontSize: 8, color: '#888888' },
    signature: { x: 301, y: 355, width: 240, align: 'center', fontSize: 9, color: '#666666' },
    qrCode: { x: 672, y: 445, size: 100 },
  },
}

export function mergeCertificateDesign(
  partial?: CertificateDesign | Record<string, unknown> | null,
): CertificateDesign {
  const input = (partial ?? {}) as CertificateDesign
  return {
    ...DEFAULT_CERTIFICATE_DESIGN,
    ...input,
    fields: {
      ...DEFAULT_CERTIFICATE_DESIGN.fields,
      ...(input.fields ?? {}),
    },
  }
}
