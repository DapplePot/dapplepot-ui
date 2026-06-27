import { apiClient } from './client'

export interface CheckoutSessionResponse {
    url:          string
    sessionId:    string
    /** Present only when the server just created a fresh workspace for an
     *  orphan user. Frontend must swap it into the auth store. */
    accessToken?: string | null
}

export function createCheckoutSession(body: {
    planTier:     'pro' | 'team'
    billingCycle: 'monthly' | 'annual'
}): Promise<CheckoutSessionResponse> {
    return apiClient.post('v1/billing/checkout-session', { json: body }).json()
}

export function openCustomerPortal(): Promise<{ url: string }> {
    return apiClient.post('v1/billing/customer-portal').json()
}

export interface StripeInvoice {
    id:          string
    number:      string | null
    status:      string | null
    amountPaid:  number      // in cents
    currency:    string
    createdAt:   string
    periodStart: string
    periodEnd:   string
    hostedUrl:   string | null
    pdfUrl:      string | null
}

export function listInvoices(): Promise<{ data: StripeInvoice[] }> {
    return apiClient.get('v1/billing/invoices').json()
}
