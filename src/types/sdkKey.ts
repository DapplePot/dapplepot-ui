export interface SdkKeySummary {
  keyId:      string
  name:       string | null
  maskedKey:  string        // e.g. "dp_sk_••••••••••••" — always masked, built by backend
  enabled:    boolean
  createdAt:  string
  lastUsedAt: string | null
}

export interface SdkKeyRevealResponse {
  key: string               // full plaintext key — only returned for admin role
}
