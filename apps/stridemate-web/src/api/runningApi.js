import { runningClient } from './client.js';

export const saveProfile = async (payload) => (await runningClient.post('/profiles', payload)).data;
export const getProfileByEmail = async (email) => (await runningClient.get('/profiles/by-email', { params: { email } })).data;
export const generatePlan = async (payload) => (await runningClient.post('/plans/generate', payload)).data;
export const getCurrentPlan = async (email) => (await runningClient.get('/plans/current', { params: { email } })).data;
export const getDashboard = async (email) => (await runningClient.get('/dashboard', { params: { email } })).data;
export const logWorkout = async (sessionId, payload) => (await runningClient.post(`/sessions/${sessionId}/logs`, payload)).data;
export const getInsights = async (email) => (await runningClient.get('/insights', { params: { email } })).data;
export const adjustNextSession = async (email) => (await runningClient.post('/coach/adjust-next-session', null, { params: { email } })).data;
