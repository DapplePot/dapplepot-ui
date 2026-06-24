export type UserRole   = 'superadmin' | 'admin' | 'editor' | 'viewer'
export type UserStatus = 'active' | 'disabled'

export interface UserSummary {
  userId:           string
  tenantId:         string | null   // null for superadmin
  email:            string
  name:             string
  role:             UserRole
  status:           UserStatus
  createdAt:        string
  emailVerifiedAt:  string | null   // null until user clicks verification link
}

export interface UserMembership {
  tenantId:   string
  tenantName: string
  role:       Exclude<UserRole, 'superadmin'>
}

export interface UserGrowthPoint {
  month:        string  // 'YYYY-MM'
  total:        number
  self:         number
  organization: number
}

export interface UserWithMemberships {
  userId:           string
  email:            string
  name:             string
  role:             UserRole
  status:           UserStatus
  createdAt:        string
  emailVerifiedAt:  string | null
  activeTenantId:   string | null
  activeTenantName: string | null
  memberships:      UserMembership[]
}

export interface SignupRequest {
  email:    string
  password: string
  name:     string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface LoginRequest {
  email:    string
  password: string
}

export interface LoginResponse {
  accessToken:  string
  refreshToken: string
  expiresIn:    number   // seconds
  user:         UserSummary
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken:  string
  refreshToken: string
  expiresIn:    number
}

export interface LogoutRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token:    string
  password: string
}

export interface AcceptInviteRequest {
  token:     string
  // name/password are required only for brand-new accounts. When the invitee
  // already has a DapplePot account these fields are ignored by the API.
  name?:     string
  password?: string
}

export interface InviteSummary {
  id:        string
  email:     string
  role:      UserRole
  invitedAt: string
  expiresAt: string
}

export interface InviteUserRequest {
  email: string
  role:  UserRole
}

export interface UpdateMeRequest {
  name?:     string
  password?: string
}

export interface ChangeRoleRequest {
  role: UserRole
}

export interface ChangeStatusRequest {
  status: UserStatus
}
