import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tensiocare_db.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read data from server JSON file
async function readDb(): Promise<any> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON DB, fallback to initial state:', err);
    return null;
  }
}

// Helper to write data atomically to server JSON file
async function writeDb(data: any): Promise<void> {
  data.lastModified = new Date().toISOString();
  const tempPath = `${DB_FILE}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, DB_FILE);
}

// Middleware
app.use(express.json());

// API Routes
app.get('/api/data', async (_req: Request, res: Response) => {
  try {
    const data = await readDb();
    if (!data) {
      return res.status(500).json({ error: 'No se pudo leer la base de datos JSON' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar datos JSON del servidor' });
  }
});

app.post('/api/measurements', async (req: Request, res: Response) => {
  try {
    const newMeasurement = req.body;
    if (!newMeasurement || !newMeasurement.tas || !newMeasurement.tad) {
      return res.status(400).json({ error: 'Datos de medición incompletos' });
    }

    const db = await readDb();
    if (!db) {
      return res.status(500).json({ error: 'Error en la base de datos JSON' });
    }

    // Add unique ID if not present
    if (!newMeasurement.id) {
      newMeasurement.id = `m-${Date.now()}`;
    }
    newMeasurement.isOverLimit = newMeasurement.tas >= 135 || newMeasurement.tad >= 85;

    // Prepend to measurements
    db.measurements = [newMeasurement, ...(db.measurements || [])];

    // Update active cycle progress count
    if (db.cycles && db.cycles.length > 0) {
      const activeCycle = db.cycles.find((c: any) => c.id === newMeasurement.periodId) || db.cycles[0];
      if (activeCycle) {
        activeCycle.completedTakes = Math.min(activeCycle.totalTakes, (activeCycle.completedTakes || 0) + 1);
        activeCycle.progressPercent = Math.round((activeCycle.completedTakes / activeCycle.totalTakes) * 100);
        if (activeCycle.completedTakes >= activeCycle.totalTakes) {
          activeCycle.dayProgress = '7 de 7 Días';
        }
      }
    }

    await writeDb(db);
    res.status(201).json({ success: true, measurement: newMeasurement, cycles: db.cycles });
  } catch (error) {
    console.error('Error saving measurement to JSON:', error);
    res.status(500).json({ error: 'Error al guardar la medición en el JSON del servidor' });
  }
});

app.put('/api/measurements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedMeasurement = req.body;
    const db = await readDb();
    if (!db) {
      return res.status(500).json({ error: 'Error en la base de datos JSON' });
    }

    const index = (db.measurements || []).findIndex((m: any) => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Medición no encontrada' });
    }

    updatedMeasurement.id = id;
    updatedMeasurement.isOverLimit = updatedMeasurement.tas >= 135 || updatedMeasurement.tad >= 85;
    db.measurements[index] = { ...db.measurements[index], ...updatedMeasurement };

    await writeDb(db);
    res.json({ success: true, measurement: db.measurements[index] });
  } catch (error) {
    console.error('Error updating measurement in JSON:', error);
    res.status(500).json({ error: 'Error al actualizar la medición en el servidor' });
  }
});

app.delete('/api/measurements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await readDb();
    if (!db) {
      return res.status(500).json({ error: 'Error en la base de datos JSON' });
    }

    const targetMeasurement = (db.measurements || []).find((m: any) => m.id === id);
    db.measurements = (db.measurements || []).filter((m: any) => m.id !== id);

    // Update cycle progress
    if (targetMeasurement && db.cycles && db.cycles.length > 0) {
      const activeCycle = db.cycles.find((c: any) => c.id === targetMeasurement.periodId) || db.cycles[0];
      if (activeCycle) {
        activeCycle.completedTakes = Math.max(0, (activeCycle.completedTakes || 1) - 1);
        activeCycle.progressPercent = Math.round((activeCycle.completedTakes / activeCycle.totalTakes) * 100);
      }
    }

    await writeDb(db);
    res.json({ success: true, message: 'Medición eliminada del JSON', cycles: db.cycles });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la medición en el servidor' });
  }
});

app.post('/api/cycles', async (req: Request, res: Response) => {
  try {
    const newCycle = req.body;
    if (!newCycle || !newCycle.title) {
      return res.status(400).json({ error: 'Datos del ciclo incompletos' });
    }

    const db = await readDb();
    if (!db) {
      return res.status(500).json({ error: 'Error en la base de datos JSON' });
    }

    db.cycles = [newCycle, ...(db.cycles || [])];
    await writeDb(db);
    res.status(201).json({ success: true, cycle: newCycle });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el nuevo ciclo en el JSON' });
  }
});

app.put('/api/notes', async (req: Request, res: Response) => {
  try {
    const updatedNote = req.body;
    const db = await readDb();
    if (!db) {
      return res.status(500).json({ error: 'Error en la base de datos JSON' });
    }

    db.doctorNote = updatedNote;
    await writeDb(db);
    res.json({ success: true, doctorNote: updatedNote });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar las notas médicas en el servidor' });
  }
});

app.post('/api/reset', async (_req: Request, res: Response) => {
  try {
    // Reset to clean starting state from 0
    const initialDb = {
      cycles: [
        {
          id: 'ciclo-actual',
          title: 'Control Semanal AMPA (7 Días)',
          dateRange: 'Semana Actual',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'en_curso',
          statusLabel: 'En curso',
          dayProgress: 'Día 1 de 7',
          progressPercent: 0,
          completedTakes: 0,
          totalTakes: 14,
          morningAvg: { tas: 0, tad: 0, label: 'Sin registros' },
          nightAvg: { tas: 0, tad: 0, label: 'Sin registros' },
          overallAvg: { tas: 0, tad: 0 },
          classificationTag: 'Iniciando',
        },
      ],
      measurements: [],
      doctorNote: {
        doctorName: 'Dr. Manuel Varela',
        specialty: 'Cardiología',
        date: 'Pendiente de revisión',
        content: 'Pauta de inicio de automonitorización de presión arterial (AMPA). Registrar dos tomas diarias (matutina en ayunas y vespertina antes de cenar) durante 7 días consecutivos para valoración clínica.',
        adherence: 'Protocolo recién iniciado: 0 de 14 tomas',
      },
      userProfile: {
        name: 'Carlos Méndez',
        age: 58,
        dni: '***4582-K',
        doctor: 'Dr. Manuel Varela',
        clinic: 'Hospital Universitario Clínico - Consulta Externa Cardiología',
        currentMedication: 'Enalapril 10mg (1 comprimido matutino en ayunas)',
        protocol: 'AMPA 7 Días (ESH/ESC 2023)',
      },
    };

    await writeDb(initialDb);
    res.json({ success: true, message: 'Base de datos JSON reseteada a 0 con éxito', data: initialDb });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear la base de datos' });
  }
});

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  const db = await readDb();
  res.json({
    status: 'ok',
    serverStorage: 'JSON File System (data/tensiocare_db.json)',
    measurementsCount: db?.measurements?.length || 0,
    cyclesCount: db?.cycles?.length || 0,
    lastModified: db?.lastModified || null,
  });
});

// Serve frontend: Vite middleware in development, static build in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[TensioCare Server] Running on http://localhost:${PORT}`);
    console.log(`[TensioCare Server] JSON Database: ${DB_FILE}`);
  });
}

startServer();
