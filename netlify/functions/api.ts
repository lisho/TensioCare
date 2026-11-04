import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

// On Netlify serverless Lambda, /tmp is writable across invocations
const TMP_DB_FILE = path.join('/tmp', 'tensiocare_db.json');

// Default initial database in case file is not yet initialized in /tmp
const DEFAULT_DATA = {
  cycles: [
    {
      id: "ciclo-actual",
      title: "Control Semanal AMPA (7 Días)",
      dateRange: "Semana Actual",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: "en_curso",
      statusLabel: "En curso",
      dayProgress: "Día 1 de 7",
      progressPercent: 0,
      completedTakes: 0,
      totalTakes: 14,
      morningAvg: { tas: 0, tad: 0, label: "Sin registros" },
      nightAvg: { tas: 0, tad: 0, label: "Sin registros" },
      overallAvg: { tas: 0, tad: 0 },
      classificationTag: "Iniciando"
    }
  ],
  measurements: [],
  doctorNote: {
    doctorName: "Dr. Manuel Varela",
    specialty: "Cardiología",
    date: "Pendiente de revisión",
    content: "Pauta de inicio de automonitorización de presión arterial (AMPA). Registrar dos tomas diarias (matutina en ayunas y vespertina antes de cenar) durante 7 días consecutivos para valoración clínica.",
    adherence: "Protocolo recién iniciado: 0 de 14 tomas"
  },
  userProfile: {
    name: "Carlos Méndez",
    age: 58,
    dni: "***4582-K",
    doctor: "Dr. Manuel Varela",
    clinic: "Hospital Universitario Clínico - Consulta Externa Cardiología",
    currentMedication: "Enalapril 10mg (1 comprimido matutino en ayunas)",
    protocol: "AMPA 7 Días (ESH/ESC 2023)"
  },
  lastModified: new Date().toISOString()
};

async function getDb(): Promise<any> {
  try {
    if (existsSync(TMP_DB_FILE)) {
      const content = await fs.readFile(TMP_DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading tmp db on Netlify:', e);
  }
  return DEFAULT_DATA;
}

async function saveDb(data: any): Promise<void> {
  data.lastModified = new Date().toISOString();
  await fs.writeFile(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const handler = async (event: any) => {
  const pathPart = event.path.replace(/^\/\.netlify\/functions\/api\/?/, '').replace(/^\/api\/?/, '');
  const method = event.httpMethod;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const db = await getDb();

    // GET /api/data
    if ((pathPart === 'data' || pathPart === '') && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(db),
      };
    }

    // POST /api/measurements
    if (pathPart === 'measurements' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) body.id = `m-${Date.now()}`;
      body.isOverLimit = body.tas >= 135 || body.tad >= 85;

      db.measurements = [body, ...(db.measurements || [])];

      if (db.cycles && db.cycles.length > 0) {
        const activeCycle = db.cycles.find((c: any) => c.id === body.periodId) || db.cycles[0];
        if (activeCycle) {
          activeCycle.completedTakes = Math.min(activeCycle.totalTakes, (activeCycle.completedTakes || 0) + 1);
          activeCycle.progressPercent = Math.round((activeCycle.completedTakes / activeCycle.totalTakes) * 100);
        }
      }

      await saveDb(db);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, measurement: body, cycles: db.cycles }),
      };
    }

    // PUT /api/measurements/:id
    if (pathPart.startsWith('measurements/') && method === 'PUT') {
      const id = pathPart.replace('measurements/', '');
      const body = JSON.parse(event.body || '{}');
      const idx = (db.measurements || []).findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        body.id = id;
        body.isOverLimit = body.tas >= 135 || body.tad >= 85;
        db.measurements[idx] = { ...db.measurements[idx], ...body };
        await saveDb(db);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, measurement: db.measurements[idx] }),
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Medición no encontrada' }) };
    }

    // DELETE /api/measurements/:id
    if (pathPart.startsWith('measurements/') && method === 'DELETE') {
      const id = pathPart.replace('measurements/', '');
      const target = (db.measurements || []).find((m: any) => m.id === id);
      db.measurements = (db.measurements || []).filter((m: any) => m.id !== id);

      if (target && db.cycles && db.cycles.length > 0) {
        const activeCycle = db.cycles.find((c: any) => c.id === target.periodId) || db.cycles[0];
        if (activeCycle) {
          activeCycle.completedTakes = Math.max(0, (activeCycle.completedTakes || 1) - 1);
          activeCycle.progressPercent = Math.round((activeCycle.completedTakes / activeCycle.totalTakes) * 100);
        }
      }

      await saveDb(db);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Medición eliminada', cycles: db.cycles }),
      };
    }

    // POST /api/cycles
    if (pathPart === 'cycles' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      db.cycles = [body, ...(db.cycles || [])];
      await saveDb(db);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, cycle: body }),
      };
    }

    // PUT /api/notes
    if (pathPart === 'notes' && method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      db.doctorNote = body;
      await saveDb(db);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, doctorNote: body }),
      };
    }

    // GET /api/health
    if (pathPart === 'health' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          environment: 'Netlify Serverless Function',
          storage: 'Server /tmp JSON persistence',
          lastModified: db.lastModified,
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Ruta no encontrada: ${pathPart}` }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Error interno del servidor' }),
    };
  }
};
