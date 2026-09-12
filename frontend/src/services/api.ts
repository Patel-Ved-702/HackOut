import { 
  Asset, 
  DashboardSummary, 
  Alert, 
  MaintenanceTask, 
  PriorityQueueItem, 
  ImpactAssessment, 
  SensorReading, 
  User,
  WebDataSummary
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  login: async (email: string, password: string):Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed: Invalid credentials');
    return res.json();
  },

  register: async (name: string, email: string, password: string):Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) throw new Error('Registration failed: Email might be taken');
    return res.json();
  },

  // Dashboard
  getDashboardSummary: async (scope: 'all' | 'reporting' = 'reporting'): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary?scope=${scope}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  // Assets
  getAssets: async (filter?: { site_id?: number; status_filter?: string; asset_type?: string }): Promise<Asset[]> => {
    const params = new URLSearchParams();
    if (filter?.site_id) params.append('site_id', filter.site_id.toString());
    if (filter?.status_filter) params.append('status_filter', filter.status_filter);
    if (filter?.asset_type) params.append('asset_type', filter.asset_type);

    const res = await fetch(`${API_BASE}/assets?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  getAssetDetail: async (id: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/assets/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch asset ${id}`);
    return res.json();
  },

  getAssetReadings: async (id: number, limit = 40): Promise<SensorReading[]> => {
    const res = await fetch(`${API_BASE}/assets/${id}/readings?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch asset readings`);
    return res.json();
  },

  // Impact
  getAssetImpact: async (assetId: number, customTariff?: number): Promise<ImpactAssessment> => {
    const url = customTariff !== undefined 
      ? `${API_BASE}/impact/${assetId}?custom_tariff=${customTariff}`
      : `${API_BASE}/impact/${assetId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch impact assessment');
    return res.json();
  },

  // Alerts
  getAlerts: async (statusFilter?: string): Promise<Alert[]> => {
    const url = statusFilter ? `${API_BASE}/alerts?status_filter=${statusFilter}` : `${API_BASE}/alerts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  updateAlert: async (id: number, action: 'acknowledge' | 'resolve'): Promise<Alert> => {
    const res = await fetch(`${API_BASE}/alerts/${id}?action=${action}`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  // Maintenance
  getPriorities: async (scope: 'all' | 'reporting' = 'all'): Promise<PriorityQueueItem[]> => {
    const res = await fetch(`${API_BASE}/maintenance/priorities?scope=${scope}`);
    if (!res.ok) throw new Error('Failed to fetch maintenance priorities');
    return res.json();
  },

  getTasks: async (assignedTo?: number): Promise<MaintenanceTask[]> => {
    const url = assignedTo ? `${API_BASE}/maintenance/tasks?assigned_to=${assignedTo}` : `${API_BASE}/maintenance/tasks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch maintenance tasks');
    return res.json();
  },

  createTask: async (task: { asset_id: number; assigned_to?: number; priority: string; notes?: string }): Promise<MaintenanceTask> => {
    const res = await fetch(`${API_BASE}/maintenance/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  updateTask: async (id: number, update: { status?: string; notes?: string; outcome?: string }): Promise<MaintenanceTask> => {
    const res = await fetch(`${API_BASE}/maintenance/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  // Simulation Demo Triggers
  triggerDegrade: async (assetCode = 'WT-006', step = 4): Promise<any> => {
    const res = await fetch(`${API_BASE}/simulator/degrade?asset_code=${assetCode}&step=${step}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger degradation');
    return res.json();
  },

  resetSimulation: async (assetCode = 'WT-006'): Promise<any> => {
    const res = await fetch(`${API_BASE}/simulator/reset?asset_code=${assetCode}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  simulateReading: async (assetId: number, mode: 'normal' | 'degrade' | 'spike' | 'reset' = 'normal'): Promise<any> => {
    const res = await fetch(`${API_BASE}/simulator/simulate-reading?asset_id=${assetId}&mode=${mode}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to simulate reading');
    return res.json();
  },

  // CSV Batch Upload & Ingestion
  uploadCsv: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/sensors/upload-csv`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errData.detail || 'CSV upload failed');
    }
    return res.json();
  },

  // Admin
  adminGetUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  adminUpdateRole: async (userId: number, role: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },
  adminDeleteUser: async (userId: number): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },
  adminGetWebData: async (): Promise<WebDataSummary> => {
    const res = await fetch(`${API_BASE}/admin/web-data`);
    if (!res.ok) throw new Error('Failed to fetch web data');
    return res.json();
  },
  adminPurgeData: async (): Promise<{ message: string; readings_deleted: number; predictions_deleted: number }> => {
    const res = await fetch(`${API_BASE}/admin/purge-data`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to purge data');
    return res.json();
  }
};
