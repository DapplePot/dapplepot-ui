import { apiClient } from './client'

export type PlanTier = 'internal' | 'trial' | 'pro' | 'team' | 'enterprise'

export interface AdminTenantListItem {
    tenantId:      string
    name:          string
    kind:          'personal' | 'organization'
    planTier:      PlanTier
    enabled:       boolean
    trialEndsAt:   string | null
    planChangedAt: string
    createdAt:     string
}

export interface AdminTenantDetail {
    tenantId:      string
    name:          string
    kind:          'personal' | 'organization'
    enabled:       boolean
    planTier:      PlanTier
    trialEndsAt:   string | null
    planChangedAt: string
    ownerUserId:   string | null
    createdAt:     string
    updatedAt:     string
}

export interface AdminTenantSnapshot {
    plan: { planTier: PlanTier; trialEndsAt: string | null; enabled: boolean; limits: Record<string, unknown> }
    subscription: unknown | null
    usage: { eventsUsed: number; eventsQuota: number; overageEvents: number; pct: number; periodStart: string; periodEnd: string }
    agentCount: number
    seatCount:  number
    trialDaysLeft: number | null
}

export interface AdminAuditEntry {
    logId:       string
    actorUserId: string
    actorEmail:  string | null
    action:      string
    targetType:  string
    targetId:    string | null
    beforeValue: Record<string, unknown> | null
    afterValue:  Record<string, unknown> | null
    note:        string | null
    createdAt:   string
}

export interface AdminPlatformStats {
    totalTenants:         number
    tenantsByPlan:        Record<PlanTier, number>
    activeTrials:         number
    expiredTrialsInGrace: number
    suspendedTenants:     number
    topByEvents30d:       { tenantId: string; name: string; eventsUsed: number }[]
}

export interface AdminUserResult {
    userId:     string
    email:      string
    name:       string
    role:       string
    tenantId:   string | null
    tenantName: string | null
    status:     string
    createdAt:  string
}

// ── Tenants ──────────────────────────────────────────────────────────────────

export function listAdminTenants(params: {
    planTier?: PlanTier
    enabled?:  boolean
    search?:   string
    limit?:    number
    offset?:   number
} = {}): Promise<{ data: AdminTenantListItem[] }> {
    const sp = new URLSearchParams()
    if (params.planTier) sp.set('planTier', params.planTier)
    if (params.enabled !== undefined) sp.set('enabled', String(params.enabled))
    if (params.search)   sp.set('search', params.search)
    if (params.limit)    sp.set('limit', String(params.limit))
    if (params.offset)   sp.set('offset', String(params.offset))
    return apiClient.get(`admin/tenants?${sp.toString()}`).json()
}

export function getAdminTenant(tenantId: string): Promise<{ tenant: AdminTenantDetail; snapshot: AdminTenantSnapshot }> {
    return apiClient.get(`admin/tenants/${tenantId}`).json()
}

export function createAdminTenant(body: {
    name: string
    kind: 'personal' | 'organization'
    planTier: PlanTier
    note?: string
}): Promise<AdminTenantDetail> {
    return apiClient.post('admin/tenants', { json: body }).json()
}

export function patchAdminTenant(tenantId: string, body: {
    planTier?: PlanTier
    suspend?:  boolean
    restore?:  boolean
    note?:     string
}): Promise<AdminTenantDetail> {
    return apiClient.patch(`admin/tenants/${tenantId}`, { json: body }).json()
}

// ── Users / Usage / Audit log ────────────────────────────────────────────────

export function searchAdminUsers(search: string): Promise<{ data: AdminUserResult[] }> {
    const sp = new URLSearchParams({ search })
    return apiClient.get(`admin/users?${sp.toString()}`).json()
}

export function getAdminUsage(): Promise<AdminPlatformStats> {
    return apiClient.get('admin/usage').json()
}

export function listAdminAuditLog(params: {
    actorUserId?: string
    targetType?:  string
    targetId?:    string
    action?:      string
    limit?:       number
} = {}): Promise<{ data: AdminAuditEntry[] }> {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v !== undefined) sp.set(k, String(v))
    return apiClient.get(`admin/audit-log?${sp.toString()}`).json()
}
