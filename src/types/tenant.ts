export interface TenantSummary {
  tenantId:    string
  name:        string
  kind:        'personal' | 'organization'
  enabled:     boolean
  tokenBudget: number | null
  rateLimit:   number | null
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
    tokenBudget: number | null
    rateLimit:   number | null
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
