import { createClient } from '@supabase/supabase-js';

const supabase = (() => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
})();

function json(status, data, headers = {}) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
    body: JSON.stringify(data),
  };
}
function notConfigured() {
  return json(500, { error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.' });
}

export async function handler(event, context) {
  const { httpMethod, path, queryStringParameters } = event;
  const segments = path.split('/').slice(4);

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: '',
    };
  }

  if (segments[0] === 'activities') {
    if (!supabase) return notConfigured();

    if (httpMethod === 'GET' && segments.length === 1) {
      const { data, error } = await supabase.from('activities').select('*').order('created_at', { ascending: true });
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'POST' && segments.length === 1) {
      let body; try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
      const payload = {
        title: body.title || null,
        description: body.description || null,
        link: body.link || null,
        image_url: body.image_url || null,
        trip_id: body.trip_id || null,
      };
      const { data, error } = await supabase.from('activities').insert(payload).select().single();
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'PUT' && segments.length === 2) {
      const id = segments[1]; if (!id) return json(400, { error: 'id required' });
      let body; try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
      const payload = {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        link: body.link ?? undefined,
        image_url: body.image_url ?? undefined,
      };
      const { data, error } = await supabase.from('activities').update(payload).eq('id', id).select().single();
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'DELETE' && segments.length === 2) {
      const id = segments[1]; if (!id) return json(400, { error: 'id required' });
      const delSel = await supabase.from('selections').delete().eq('activity_id', id);
      if (delSel.error) return json(500, { error: delSel.error.message });
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true });
    }
  }

  if (segments[0] === 'selections') {
    if (!supabase) return notConfigured();

    if (httpMethod === 'GET') {
      const { data, error } = await supabase.from('selections').select('*');
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'POST') {
      let body; try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
      const payload = { attendee_id: body.attendee_id, activity_id: body.activity_id, selected: !!body.selected };
      if (!payload.attendee_id || !payload.activity_id) return json(400, { error: 'attendee_id and activity_id required' });
      const { data, error } = await supabase.from('selections').upsert(payload, { onConflict: 'attendee_id,activity_id' }).select().single();
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
  }

  if (segments[0] === 'trip') {
    if (!supabase) return notConfigured();
    const fixedId = '00000000-0000-0000-0000-000000000001';

    if (httpMethod === 'GET') {
      let { data, error } = await supabase.from('trip').select('*').eq('id', fixedId).maybeSingle();
      if (error) return json(500, { error: error.message });
      if (!data) {
        const seed = { id: fixedId, title: 'Family Fun Week', description: 'Pick what you want to do while we’re together!' };
        const ins = await supabase.from('trip').insert(seed).select().single();
        if (ins.error) return json(500, { error: ins.error.message });
        data = ins.data;
      }
      return json(200, data);
    }
    if (httpMethod === 'PUT') {
      let body; try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
      const payload = { id: fixedId, title: body.title || null, description: body.description || null };
      const { data, error } = await supabase.from('trip').upsert(payload).select().single();
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
  }

  if (segments[0] === 'attendees') {
    if (!supabase) return notConfigured();

    if (httpMethod === 'GET' && segments.length === 1) {
      const { data, error } = await supabase.from('attendees').select('*').order('created_at', { ascending: true });
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'POST' && segments.length === 1) {
      let body; try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
      const payload = {
        title: body.title || null,
        description: body.description || null,
        link: body.link || null,
        image_url: body.image_url || null,
        trip_id: body.trip_id || null,
      };
      const { data, error } = await supabase.from('activities').insert(payload).select().single();
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'PUT' && segments.length === 2) {
      const id = segments[1]; if (!id) return json(400, { error: 'id required' });
      let body; try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
      const payload = {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        link: body.link ?? undefined,
        image_url: body.image_url ?? undefined,
      };
      const { data, error } = await supabase.from('activities').update(payload).eq('id', id).select().single();
      if (error) return json(500, { error: error.message });
      return json(200, data);
    }
    if (httpMethod === 'DELETE' && segments.length === 2) {
      const id = segments[1]; if (!id) return json(400, { error: 'id required' });
      const delSel = await supabase.from('selections').delete().eq('activity_id', id);
      if (delSel.error) return json(500, { error: delSel.error.message });
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true });
    }
  }

  return json(404, { error: 'Not found' });
}
