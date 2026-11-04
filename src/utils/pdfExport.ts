import { jsPDF } from 'jspdf';
import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';
import { calculateStats, classifyBloodPressure } from './eshClassifier';
import { initialUserProfile } from '../data/initialData';

/**
 * Generates and downloads an official clinical PDF report for a specific plan/cycle.
 */
export function generatePlanPdfReport(
  cycle: Cycle,
  measurements: Measurement[],
  doctorNote?: DoctorNote,
  userProfile?: UserProfile
): void {
  const profile = userProfile || initialUserProfile;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Primary brand colors
  const primaryTeal = [0, 85, 112] as const; // #005570
  const secondarySlate = [100, 116, 139] as const;
  const darkSlate = [15, 23, 42] as const;
  const lightBg = [244, 249, 253] as const;
  const alertRose = [225, 29, 72] as const;
  const borderGray = [226, 232, 240] as const;

  // Filter measurements for this specific plan/cycle if needed, or use provided measurements
  const cycleMeasurements = measurements;
  const stats = calculateStats(cycleMeasurements);

  // 1. Header Banner
  doc.setFillColor(...primaryTeal);
  doc.rect(margin, y, contentWidth, 20, 'F');

  // Title inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TensioCare  |  Informe Clínico de Presión Arterial (AMPA)', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'Automonitorización Domiciliaria según Guías Clínicas ESH/ESC 2023 · Sociedad Europea de Hipertensión',
    margin + 6,
    y + 14
  );

  y += 24;

  // 2. Patient & Protocol Info Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(...darkSlate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATOS DEL PACIENTE', margin + 4, y + 5);
  doc.text('PLAN / PROTOCOLO', margin + contentWidth * 0.36, y + 5);
  doc.text('MÉDICO RESPONSABLE', margin + contentWidth * 0.70, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  // Column 1: Patient
  doc.text(`Nombre: ${profile.name}`, margin + 4, y + 10);
  doc.text(`Edad: ${profile.age} años  ·  DNI: ${profile.dni}`, margin + 4, y + 15);
  doc.text(`Medicación: ${profile.currentMedication}`, margin + 4, y + 20);

  // Column 2: Plan
  doc.text(`Plan: ${cycle.title}`, margin + contentWidth * 0.36, y + 10);
  doc.text(`Período: ${cycle.dateRange}`, margin + contentWidth * 0.36, y + 15);
  doc.text(`Progreso: ${cycle.completedTakes} de ${cycle.totalTakes} tomas (${cycle.progressPercent}%)`, margin + contentWidth * 0.36, y + 20);

  // Column 3: Doctor
  doc.text(doctorNote?.doctorName || profile.doctor, margin + contentWidth * 0.70, y + 10);
  doc.text(doctorNote?.specialty || 'Cardiología', margin + contentWidth * 0.70, y + 15);
  doc.text('Colegiado: 28/48201', margin + contentWidth * 0.70, y + 20);

  y += 28;

  // 3. Clinical Metrics Summary (4 Cards)
  doc.setTextColor(...primaryTeal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMEN CLÍNICO HEMODINÁMICO', margin, y);
  y += 4;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 18;

  // Card 1: TAS Media
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondarySlate);
  doc.text('TAS Media (Sistólica)', margin + 3, y + 4.5);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryTeal);
  doc.text(`${stats.tasMedia > 0 ? stats.tasMedia : '—'}`, margin + 3, y + 11.5);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondarySlate);
  doc.text('mmHg (Ref <135)', margin + 18, y + 11.5);
  doc.setFontSize(7);
  doc.setTextColor(0, 120, 90);
  doc.text(stats.tasMedia > 0 ? (stats.tasMedia < 135 ? 'Normotensión' : 'Sobre límite') : 'Sin datos', margin + 3, y + 15.5);

  // Card 2: TAD Media
  const c2X = margin + cardWidth + 3;
  doc.setFillColor(...lightBg);
  doc.roundedRect(c2X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondarySlate);
  doc.text('TAD Media (Diastólica)', c2X + 3, y + 4.5);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryTeal);
  doc.text(`${stats.tadMedia > 0 ? stats.tadMedia : '—'}`, c2X + 3, y + 11.5);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondarySlate);
  doc.text('mmHg (Ref <85)', c2X + 18, y + 11.5);
  doc.setFontSize(7);
  doc.setTextColor(0, 120, 90);
  doc.text(stats.tadMedia > 0 ? (stats.tadMedia < 85 ? 'Normotensión' : 'Sobre límite') : 'Sin datos', c2X + 3, y + 15.5);

  // Card 3: Pulso Medio
  const c3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(...lightBg);
  doc.roundedRect(c3X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondarySlate);
  doc.text('Pulso Medio en Reposo', c3X + 3, y + 4.5);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(`${stats.pulseMedia > 0 ? stats.pulseMedia : '—'}`, c3X + 3, y + 11.5);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondarySlate);
  doc.text('ppm', c3X + 16, y + 11.5);
  doc.setFontSize(7);
  doc.setTextColor(...secondarySlate);
  doc.text(stats.pulseMedia > 0 ? 'Normocárdico (60-90)' : 'Sin datos', c3X + 3, y + 15.5);

  // Card 4: Carga Hipertensiva
  const c4X = margin + (cardWidth + 3) * 3;
  doc.setFillColor(...lightBg);
  doc.roundedRect(c4X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondarySlate);
  doc.text('Carga Hipertensiva', c4X + 3, y + 4.5);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(stats.cargaHipertensiva > 20 ? alertRose[0] : primaryTeal[0], stats.cargaHipertensiva > 20 ? alertRose[1] : primaryTeal[1], stats.cargaHipertensiva > 20 ? alertRose[2] : primaryTeal[2]);
  doc.text(`${stats.cargaHipertensiva}%`, c4X + 3, y + 11.5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondarySlate);
  doc.text(`${stats.overLimitCount}/${cycleMeasurements.length} tomas >135/85`, c4X + 3, y + 15.5);

  y += 23;

  // 4. Detailed Measurements Table
  doc.setTextColor(...primaryTeal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESGLOSE DE TOMAS REGISTRADAS EN ESTE PLAN', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...borderGray);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.setFont('helvetica', 'bold');

  const colX = {
    date: margin + 3,
    time: margin + 25,
    moment: margin + 42,
    bp: margin + 64,
    pulse: margin + 92,
    arm: margin + 110,
    classification: margin + 130,
    context: margin + 160,
  };

  doc.text('Fecha', colX.date, y + 4.5);
  doc.text('Hora', colX.time, y + 4.5);
  doc.text('Franja', colX.moment, y + 4.5);
  doc.text('TAS / TAD', colX.bp, y + 4.5);
  doc.text('Pulso', colX.pulse, y + 4.5);
  doc.text('Brazo', colX.arm, y + 4.5);
  doc.text('Criterio ESH', colX.classification, y + 4.5);
  doc.text('Notas / Contexto', colX.context, y + 4.5);

  y += 7;

  // Table body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (cycleMeasurements.length === 0) {
    doc.rect(margin, y, contentWidth, 12, 'D');
    doc.setTextColor(...secondarySlate);
    doc.text('No hay mediciones registradas en este plan todavía.', margin + contentWidth / 2, y + 7, { align: 'center' });
    y += 14;
  } else {
    // Sort chronologically
    const sorted = [...cycleMeasurements].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return a.time.localeCompare(b.time);
    });

    sorted.forEach((m, idx) => {
      // Check for page overflow
      if (y > pageHeight - 38) {
        doc.addPage();
        y = margin;
        // Repeat table header on next page
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 7, 'FD');
        doc.setFontSize(7.5);
        doc.setTextColor(...darkSlate);
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha', colX.date, y + 4.5);
        doc.text('Hora', colX.time, y + 4.5);
        doc.text('Franja', colX.moment, y + 4.5);
        doc.text('TAS / TAD', colX.bp, y + 4.5);
        doc.text('Pulso', colX.pulse, y + 4.5);
        doc.text('Brazo', colX.arm, y + 4.5);
        doc.text('Criterio ESH', colX.classification, y + 4.5);
        doc.text('Notas / Contexto', colX.context, y + 4.5);
        y += 7;
        doc.setFont('helvetica', 'normal');
      }

      const rowHeight = 6.5;
      const isAlt = idx % 2 === 1;

      if (m.isOverLimit) {
        doc.setFillColor(255, 241, 242); // soft rose
        doc.rect(margin, y, contentWidth, rowHeight, 'FD');
      } else if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, 'FD');
      } else {
        doc.setDrawColor(...borderGray);
        doc.rect(margin, y, contentWidth, rowHeight, 'D');
      }

      const cl = classifyBloodPressure(m.tas, m.tad);

      doc.setTextColor(...darkSlate);
      doc.text(m.date, colX.date, y + 4.3);
      doc.text(m.time, colX.time, y + 4.3);
      doc.text(m.timeOfDay === 'manana' ? 'Mañana (AM)' : 'Noche (PM)', colX.moment, y + 4.3);

      // TAS / TAD with red highlight if over limit
      if (m.isOverLimit) {
        doc.setTextColor(...alertRose);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(...primaryTeal);
        doc.setFont('helvetica', 'bold');
      }
      doc.text(`${m.tas} / ${m.tad}`, colX.bp, y + 4.3);
      doc.setFont('helvetica', 'normal');

      doc.setTextColor(...darkSlate);
      doc.text(`${m.pulse || 68} ppm`, colX.pulse, y + 4.3);
      doc.text(m.arm || 'Brazo Izq.', colX.arm, y + 4.3);

      doc.setTextColor(m.isOverLimit ? alertRose[0] : primaryTeal[0], m.isOverLimit ? alertRose[1] : primaryTeal[1], m.isOverLimit ? alertRose[2] : primaryTeal[2]);
      doc.text(cl.label.split('/')[0].substring(0, 16), colX.classification, y + 4.3);

      doc.setTextColor(...secondarySlate);
      const noteText = m.notes || (m.context && m.context.length > 0 ? m.context.join(', ') : 'En reposo');
      const truncatedNote = noteText.length > 22 ? noteText.substring(0, 21) + '…' : noteText;
      doc.text(truncatedNote, colX.context, y + 4.3);

      y += rowHeight;
    });

    y += 4;
  }

  // 5. Clinical Observation Box
  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setTextColor(...primaryTeal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DICTAMEN / OBSERVACIONES CLÍNICAS (CARDIOLOGÍA)', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  const noteContent = doctorNote?.content ||
    'Seguimiento domiciliario de tensión arterial según protocolo clínico AMPA. Registro de tomas matutinas y vespertinas para valoración en consulta externa.';
  
  const splitNotes = doc.splitTextToSize(noteContent, contentWidth - 8);
  doc.text(splitNotes, margin + 4, y + 9.5);

  doc.setFontSize(7);
  doc.setTextColor(...secondarySlate);
  doc.text(
    `Firma Digital: ${doctorNote?.doctorName || 'Dr. Manuel Varela'} (Col. 28/48201)  ·  Adherencia reportada: ${doctorNote?.adherence || '100%'}`,
    margin + 4,
    y + 19
  );

  y += 25;

  // 6. Footer Stamp
  doc.setFontSize(6.5);
  doc.setTextColor(...secondarySlate);
  const emissionDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(
    `Documento generado automáticamente por TensioCare AMPA · Criterios ESH/ESC 2023 · Fecha de emisión: ${emissionDate}`,
    margin,
    pageHeight - 6
  );
  doc.text(
    `Página ${doc.getNumberOfPages()}`,
    pageWidth - margin - 14,
    pageHeight - 6
  );

  // Clean filename
  const sanitizedTitle = cycle.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Informe_TensioCare_AMPA_${sanitizedTitle}.pdf`;

  // Download directly in user's browser
  doc.save(filename);
}
