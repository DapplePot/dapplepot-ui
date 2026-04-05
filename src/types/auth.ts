export type UserRole   = 'superadmin' | 'admin' | 'editor' | 'viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'

export interface UserSummary {
  id:        string
  tenantId:  string | null   // null for superadmin
  email:     string
  name:      string
  role:      UserRole
  status:    UserStatus
  createdAt: string
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
  token:    string
  name:     string
  password: string
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
