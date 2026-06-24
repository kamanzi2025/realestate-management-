// Demo mode data — used when NEXT_PUBLIC_DEMO_MODE=true

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// IDs
const L  = '00000000-0000-0000-0000-000000000001' // landlord
const S  = '00000000-0000-0000-0000-000000000002' // Sarah
const M  = '00000000-0000-0000-0000-000000000003' // Michael
const E  = '00000000-0000-0000-0000-000000000004' // Emily

const U1A = '00000000-0000-0001-0000-000000000010' // Unit 1A
const U1B = '00000000-0000-0001-0000-000000000011' // Unit 1B
const U2A = '00000000-0000-0001-0000-000000000012' // Unit 2A
const U2B = '00000000-0000-0001-0000-000000000013' // Unit 2B (vacant)

const LA  = '00000000-0000-0002-0000-000000000020' // Lease 1A
const LB  = '00000000-0000-0002-0000-000000000021' // Lease 1B
const LC  = '00000000-0000-0002-0000-000000000022' // Lease 2A

export const DEMO_LANDLORD_ID = L

export const demoUnits = [
  { id: U1A, label: 'Unit 1A', bedroom_count: 1, monthly_rent: 1200, status: 'occupied',
    profiles: [{ id: S, full_name: 'Sarah Johnson' }],
    leases: [{ id: LA, status: 'active', monthly_rent: 1200, tenant_id: S }] },
  { id: U1B, label: 'Unit 1B', bedroom_count: 2, monthly_rent: 1500, status: 'occupied',
    profiles: [{ id: M, full_name: 'Michael Chen' }],
    leases: [{ id: LB, status: 'active', monthly_rent: 1500, tenant_id: M }] },
  { id: U2A, label: 'Unit 2A', bedroom_count: 2, monthly_rent: 1500, status: 'occupied',
    profiles: [{ id: E, full_name: 'Emily Rodriguez' }],
    leases: [{ id: LC, status: 'active', monthly_rent: 1500, tenant_id: E }] },
  { id: U2B, label: 'Unit 2B', bedroom_count: 1, monthly_rent: 1200, status: 'vacant',
    profiles: [], leases: [] },
]

export const demoUnitsSimple = [
  { id: U1A, label: 'Unit 1A', monthly_rent: 1200, status: 'occupied' },
  { id: U1B, label: 'Unit 1B', monthly_rent: 1500, status: 'occupied' },
  { id: U2A, label: 'Unit 2A', monthly_rent: 1500, status: 'occupied' },
  { id: U2B, label: 'Unit 2B', monthly_rent: 1200, status: 'vacant' },
]

export const demoAllUnits = [
  { id: U1A, label: 'Unit 1A', monthly_rent: 1200, status: 'occupied' },
  { id: U1B, label: 'Unit 1B', monthly_rent: 1500, status: 'occupied' },
  { id: U2A, label: 'Unit 2A', monthly_rent: 1500, status: 'occupied' },
  { id: U2B, label: 'Unit 2B', monthly_rent: 1200, status: 'vacant' },
]

export const demoActiveLeases = [
  { id: LA, unit_id: U1A, tenant_id: S, monthly_rent: 1200 },
  { id: LB, unit_id: U1B, tenant_id: M, monthly_rent: 1500 },
  { id: LC, unit_id: U2A, tenant_id: E, monthly_rent: 1500 },
]

export const demoLeases = [
  {
    id: LA, status: 'active', monthly_rent: 1200, deposit_amount: 1200,
    move_in_date: '2024-01-01', rent_due_day: 1,
    lease_start: '2024-01-01', lease_end: '2026-12-31',
    profiles: { full_name: 'Sarah Johnson', phone: '+1 (555) 210-3344' },
    units: { label: 'Unit 1A', bedroom_count: 1 },
  },
  {
    id: LB, status: 'active', monthly_rent: 1500, deposit_amount: 2000,
    move_in_date: '2024-06-01', rent_due_day: 1,
    lease_start: '2024-06-01', lease_end: '2026-08-05',
    profiles: { full_name: 'Michael Chen', phone: '+1 (555) 874-9901' },
    units: { label: 'Unit 1B', bedroom_count: 2 },
  },
  {
    id: LC, status: 'active', monthly_rent: 1500, deposit_amount: 1500,
    move_in_date: '2025-03-01', rent_due_day: 5,
    lease_start: '2025-03-01', lease_end: null,
    profiles: { full_name: 'Emily Rodriguez', phone: null },
    units: { label: 'Unit 2A', bedroom_count: 2 },
  },
]

// Current month payments for landlord overview (June 2026)
export const demoCurrentPayments = [
  { tenant_id: S, status: 'confirmed',     period_month: '2026-06' },
  { tenant_id: M, status: 'pending_review', period_month: '2026-06' },
  // Emily has not submitted
]

// All payments (last 12 months) for rent review list + financials
function makePayments() {
  const months = [
    '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
    '2026-01','2026-02','2026-03','2026-04','2026-05',
  ]
  const result: {
    id: string; tenant_id: string; period_month: string; amount: number;
    status: string; submitted_at: string; lease_id: string;
    receipt_file_url: null; landlord_notes: null;
    profiles: { full_name: string; unit_id: string; units: { label: string } };
  }[] = []
  let idx = 1
  for (const pm of months) {
    const [y, m] = pm.split('-').map(Number)
    const submittedAt = new Date(y, m - 1, 2).toISOString()
    result.push({
      id: `pay-s-${pm}`, tenant_id: S, period_month: pm, amount: 1200,
      status: 'confirmed', submitted_at: submittedAt, lease_id: LA,
      receipt_file_url: null, landlord_notes: null,
      profiles: { full_name: 'Sarah Johnson', unit_id: U1A, units: { label: 'Unit 1A' } },
    })
    result.push({
      id: `pay-m-${pm}`, tenant_id: M, period_month: pm, amount: 1500,
      status: 'confirmed', submitted_at: submittedAt, lease_id: LB,
      receipt_file_url: null, landlord_notes: null,
      profiles: { full_name: 'Michael Chen', unit_id: U1B, units: { label: 'Unit 1B' } },
    })
    if (pm >= '2025-03') {
      result.push({
        id: `pay-e-${pm}`, tenant_id: E, period_month: pm, amount: 1500,
        status: 'confirmed', submitted_at: submittedAt, lease_id: LC,
        receipt_file_url: null, landlord_notes: null,
        profiles: { full_name: 'Emily Rodriguez', unit_id: U2A, units: { label: 'Unit 2A' } },
      })
    }
    idx++
  }
  // June 2026 - current month
  result.unshift({
    id: 'pay-s-2026-06', tenant_id: S, period_month: '2026-06', amount: 1200,
    status: 'confirmed', submitted_at: '2026-06-02T09:00:00Z', lease_id: LA,
    receipt_file_url: null, landlord_notes: null,
    profiles: { full_name: 'Sarah Johnson', unit_id: U1A, units: { label: 'Unit 1A' } },
  })
  result.unshift({
    id: 'pay-m-2026-06', tenant_id: M, period_month: '2026-06', amount: 1500,
    status: 'pending_review', submitted_at: '2026-06-10T14:30:00Z', lease_id: LB,
    receipt_file_url: null, landlord_notes: null,
    profiles: { full_name: 'Michael Chen', unit_id: U1B, units: { label: 'Unit 1B' } },
  })
  return result
}

export const demoPayments = makePayments()

// Active leases summary for rent page
export const demoLeaseSummaries = [
  { tenant_id: S, monthly_rent: 1200, profiles: { full_name: 'Sarah Johnson', units: { label: 'Unit 1A' } } },
  { tenant_id: M, monthly_rent: 1500, profiles: { full_name: 'Michael Chen',  units: { label: 'Unit 1B' } } },
  { tenant_id: E, monthly_rent: 1500, profiles: { full_name: 'Emily Rodriguez', units: { label: 'Unit 2A' } } },
]

export const demoMaintenanceRequests = [
  {
    id: 'maint-001', category: 'plumbing', urgency: 'medium', status: 'submitted',
    description: 'Kitchen faucet is dripping constantly — wastes water and disrupts sleep.',
    landlord_comment: null, photo_urls: [],
    tenant_id: S, unit_id: U1A,
    created_at: '2026-06-15T10:20:00Z', updated_at: '2026-06-15T10:20:00Z',
    profiles: { full_name: 'Sarah Johnson' }, units: { label: 'Unit 1A' },
  },
  {
    id: 'maint-002', category: 'hvac', urgency: 'high', status: 'in_progress',
    description: 'A/C not cooling at all — unit stays at 82°F even on max setting.',
    landlord_comment: 'Technician booked for Thursday 10am. Will confirm when done.',
    photo_urls: [],
    tenant_id: M, unit_id: U1B,
    created_at: '2026-06-05T08:00:00Z', updated_at: '2026-06-12T16:00:00Z',
    profiles: { full_name: 'Michael Chen' }, units: { label: 'Unit 1B' },
  },
  {
    id: 'maint-003', category: 'electrical', urgency: 'medium', status: 'acknowledged',
    description: 'Lights in the master bedroom flicker every few minutes.',
    landlord_comment: null, photo_urls: [],
    tenant_id: E, unit_id: U2A,
    created_at: '2026-06-18T19:45:00Z', updated_at: '2026-06-19T09:00:00Z',
    profiles: { full_name: 'Emily Rodriguez' }, units: { label: 'Unit 2A' },
  },
]

export const demoTenants = [
  { id: S, full_name: 'Sarah Johnson',    unit_id: U1A, units: { label: 'Unit 1A' } },
  { id: M, full_name: 'Michael Chen',     unit_id: U1B, units: { label: 'Unit 1B' } },
  { id: E, full_name: 'Emily Rodriguez',  unit_id: U2A, units: { label: 'Unit 2A' } },
]

export const demoMessages = [
  // Broadcast
  { id: 'msg-000', sender_id: L, recipient_id: null, body: 'Reminder: trash collection is now on Tuesdays, not Mondays. Please put bins out Monday night.', created_at: '2026-06-09T10:00:00Z', is_broadcast: true },
  // Michael thread
  { id: 'msg-001', sender_id: M, recipient_id: L, body: 'Hi, just sent June rent. Please let me know once confirmed!', created_at: '2026-06-10T14:35:00Z', is_broadcast: false },
  { id: 'msg-002', sender_id: L, recipient_id: M, body: 'Got it, Michael. Reviewing now — should be confirmed by end of day.', created_at: '2026-06-10T15:10:00Z', is_broadcast: false },
  // Sarah thread
  { id: 'msg-003', sender_id: S, recipient_id: L, body: 'Any update on the faucet repair? It\'s been a few days.', created_at: '2026-06-18T11:00:00Z', is_broadcast: false },
  { id: 'msg-004', sender_id: L, recipient_id: S, body: 'Plumber is coming Friday between 9-11am. Please make sure someone is home.', created_at: '2026-06-18T11:45:00Z', is_broadcast: false },
  { id: 'msg-005', sender_id: S, recipient_id: L, body: 'Perfect, I\'ll be here. Thank you!', created_at: '2026-06-18T12:00:00Z', is_broadcast: false },
]

export const demoMoveOutNotices = [
  {
    id: 'notice-001',
    tenant_id: E,
    intended_move_out_date: '2026-08-31',
    reason: 'Relocating for a new job opportunity — excited but sad to leave!',
    status: 'submitted',
    created_at: '2026-06-01T09:00:00Z',
    profiles: { full_name: 'Emily Rodriguez', units: { label: 'Unit 2A' } },
  },
]

export const demoExpenses = [
  { id: 'exp-001', unit_id: null, category: 'building_maintenance', amount: 300, expense_date: '2025-07-15', description: 'Quarterly landscaping and lawn care', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2025-07-15T10:00:00Z', units: null },
  { id: 'exp-002', unit_id: null, category: 'insurance', amount: 1200, expense_date: '2025-09-03', description: 'Building insurance — Q3 premium', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2025-09-03T10:00:00Z', units: null },
  { id: 'exp-003', unit_id: U1A, category: 'plumbing', amount: 280, expense_date: '2025-10-20', description: 'Replaced kitchen sink p-trap', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2025-10-20T10:00:00Z', units: { label: 'Unit 1A' } },
  { id: 'exp-004', unit_id: null, category: 'building_maintenance', amount: 450, expense_date: '2025-12-05', description: 'Gutter cleaning and minor roof inspection', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2025-12-05T10:00:00Z', units: null },
  { id: 'exp-005', unit_id: U2A, category: 'electrical', amount: 200, expense_date: '2026-01-10', description: 'Replaced two GFCI outlets in bathroom', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2026-01-10T10:00:00Z', units: { label: 'Unit 2A' } },
  { id: 'exp-006', unit_id: null, category: 'insurance', amount: 1200, expense_date: '2026-03-15', description: 'Building insurance — Q1 premium', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2026-03-15T10:00:00Z', units: null },
  { id: 'exp-007', unit_id: U1B, category: 'appliances', amount: 350, expense_date: '2026-04-22', description: 'Refrigerator compressor repair', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2026-04-22T10:00:00Z', units: { label: 'Unit 1B' } },
  { id: 'exp-008', unit_id: null, category: 'cleaning', amount: 180, expense_date: '2026-05-08', description: 'Common area deep clean before summer', receipt_file_url: null, linked_maintenance_request_id: null, created_at: '2026-05-08T10:00:00Z', units: null },
  { id: 'exp-009', unit_id: U1B, category: 'other', amount: 580, expense_date: '2026-06-12', description: 'A/C repair — refrigerant recharge and condenser cleaning', receipt_file_url: null, linked_maintenance_request_id: 'maint-002', created_at: '2026-06-12T10:00:00Z', units: { label: 'Unit 1B' } },
]

export const demoNotifications = [
  { id: 'notif-001', type: 'maintenance_submitted', title: 'New maintenance request', body: 'Sarah Johnson submitted a plumbing request for Unit 1A', link: '/landlord/maintenance', read_at: null, created_at: '2026-06-15T10:21:00Z', user_id: L },
  { id: 'notif-002', type: 'payment_submitted', title: 'Rent payment received', body: 'Michael Chen submitted rent payment for June 2026', link: '/landlord/rent', read_at: null, created_at: '2026-06-10T14:31:00Z', user_id: L },
  { id: 'notif-003', type: 'message', title: 'New message', body: 'Sarah Johnson: Any update on the faucet repair?', link: '/landlord/messages', read_at: '2026-06-18T11:50:00Z', created_at: '2026-06-18T11:00:00Z', user_id: L },
  { id: 'notif-004', type: 'move_out_notice', title: 'Move-out notice received', body: 'Emily Rodriguez submitted a move-out notice for August 31, 2026', link: '/landlord/move-out', read_at: '2026-06-01T10:00:00Z', created_at: '2026-06-01T09:01:00Z', user_id: L },
  { id: 'notif-005', type: 'payment_submitted', title: 'Rent payment received', body: 'Sarah Johnson submitted rent payment for June 2026', link: '/landlord/rent', read_at: '2026-06-02T10:00:00Z', created_at: '2026-06-02T09:01:00Z', user_id: L },
]
