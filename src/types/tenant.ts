export type PlanTier = 'internal' | 'trial' | 'pro' | 'team' | 'enterprise'

export interface TenantSummary {
  tenantId:    string
  name:        string
  kind:        'personal' | 'organization'
  planTier:    PlanTier
  enabled:     boolean
  tokenBudget: number | null
  rateLimit:   number | null
  /** When present, identifies the workspace owner — used by Settings to gate
   *  delete + ownership-protection UX. */
  ownerUserId?: string | null
  createdAt:   string
  updatedAt:   string
}

export interface TenantWithStats extends TenantSummary {
  adminUser:  { name: string; email: string } | null
  userCount:  number
}

export interface UserTenantSummary {
  tenantId:  string
  name:      string
  kind:      'personal' | 'organization'
  role:      'admin' | 'editor' | 'viewer'
  joinedAt:  string
}

export interface TenantGrowthPoint {
  month:        string  // 'YYYY-MM'
  total:        number
  organization: number
  personal:     number
}

export interface OnboardClientRequest {
  tenant: {
    name:        string
    kind:        'personal' | 'organization'
    planTier:    'internal' | 'enterprise'
    tokenBudget: number | null
    rateLimit:   number | null
    /** Enterprise-only contractual limits. NULL ignored for non-Enterprise. */
    enterpriseSeatsCap?:        number | null
    enterpriseEventsPerPeriod?: number | null
  }
  admin: {
    email:    string
    name:     string
    password: string
  }
}

export interface OnboardClientResponse {
  tenant: TenantSummary
  admin: {
    userId:    string
    email:     string
    name:      string
    role:      'admin'
    createdAt: string
  }
}
