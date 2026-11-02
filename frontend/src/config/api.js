/**
 * Centralized API configuration.
 * Reads base URL from VITE_API_URL environment variable.
 * When running in Vite dev mode on port 5173, defaults to http://127.0.0.1:8000.
 * In production / unified deployment, uses relative path (empty string) to prevent CORS issues.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://127.0.0.1:8000' : '')

// Ensure no trailing slash
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '')

export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development'

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  API_V1_HEALTH: `${API_BASE_URL}/api/v1/health`,
  ROOT: `${API_BASE_URL}/`,
  AUTH_REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  AUTH_LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  AUTH_ME: `${API_BASE_URL}/api/v1/auth/me`,
  RESUMES: `${API_BASE_URL}/api/v1/resumes`,
  RESUME_DETAIL: (id) => `${API_BASE_URL}/api/v1/resumes/${id}`,
  JOB_ANALYSES: `${API_BASE_URL}/api/v1/job-analyses`,
  JOB_ANALYSIS_DETAIL: (id) => `${API_BASE_URL}/api/v1/job-analyses/${id}`,
  INTERVIEWS: `${API_BASE_URL}/api/v1/interviews`,
  INTERVIEW_DETAIL: (id) => `${API_BASE_URL}/api/v1/interviews/${id}`,
  INTERVIEW_START: (id) => `${API_BASE_URL}/api/v1/interviews/${id}/start`,
  INTERVIEW_ANSWERS: (id) => `${API_BASE_URL}/api/v1/interviews/${id}/answers`,
  INTERVIEW_COMPLETE: (id) => `${API_BASE_URL}/api/v1/interviews/${id}/complete`,
  INTERVIEW_REPORT: (id) => `${API_BASE_URL}/api/v1/interviews/${id}/report`,
  INTERVIEW_REPORT_PDF: (id) => `${API_BASE_URL}/api/v1/interviews/${id}/report/pdf`,
  INTERVIEW_TRANSCRIBE: (id) => `${API_BASE_URL}/api/v1/interviews/${id}/transcribe`,
  ANALYTICS_OVERVIEW: `${API_BASE_URL}/api/v1/analytics/overview`,
  ANALYTICS_TRENDS: `${API_BASE_URL}/api/v1/analytics/trends`,
  ANALYTICS_SKILLS: `${API_BASE_URL}/api/v1/analytics/skills`,
  ANALYTICS_RECOMMENDATIONS: `${API_BASE_URL}/api/v1/analytics/recommendations`,
  COACH_FEEDBACK: (sessionId, questionId) => `${API_BASE_URL}/api/v1/interviews/${sessionId}/questions/${questionId}/coach`,
  ROADMAP: `${API_BASE_URL}/api/v1/roadmap`,
  ROADMAP_GENERATE: `${API_BASE_URL}/api/v1/roadmap/generate`,
  ROADMAP_PLAN: `${API_BASE_URL}/api/v1/roadmap/plan`,
  ROADMAP_TASKS: `${API_BASE_URL}/api/v1/roadmap/tasks`,
  ROADMAP_TASK_DETAIL: (taskId) => `${API_BASE_URL}/api/v1/roadmap/tasks/${taskId}`,
  ADMIN_AUTH: `${API_BASE_URL}/api/v1/admin/auth`,
  ADMIN_OVERVIEW: `${API_BASE_URL}/api/v1/admin/overview`,
  ADMIN_STUDENTS: `${API_BASE_URL}/api/v1/admin/students`,
}
