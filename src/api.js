export const API_BASE = '/.netlify/functions/api';

async function fetchJSON(path, init){
  const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, init||{}));
  if(!res.ok) throw new Error('HTTP '+res.status);
  return await res.json();
}

export const API = {
  async listActivities(){ return await fetchJSON(`${API_BASE}/activities`); },
  async upsertActivity(obj){
    const hasId = !!obj.id;
    const url = hasId ? `${API_BASE}/activities/${encodeURIComponent(obj.id)}` : `${API_BASE}/activities`;
    const method = hasId ? 'PUT' : 'POST';
    return await fetchJSON(url, { method, body: JSON.stringify(obj) });
  },
  async deleteActivity(id){ return await fetchJSON(`${API_BASE}/activities/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async getTrip(){ return await fetchJSON(`${API_BASE}/trip`); },
  async saveTrip(obj){ return await fetchJSON(`${API_BASE}/trip`, { method: 'PUT', body: JSON.stringify(obj) }); },
  async getSelections(){ return await fetchJSON(`${API_BASE}/selections`); },
  async toggleSelection(payload){ return await fetchJSON(`${API_BASE}/selections`, { method: 'POST', body: JSON.stringify(payload) }); },
  async getAttendees(){ return await fetchJSON(`${API_BASE}/attendees`); },
  async saveAttendee(obj){ return await fetchJSON(`${API_BASE}/attendees`, { method: 'POST', body: JSON.stringify(obj) }); },
  async deleteAttendee(id){ return await fetchJSON(`${API_BASE}/attendees/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
};
