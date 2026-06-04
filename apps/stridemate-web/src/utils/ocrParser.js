const NUMBER = '(\\d+(?:[.,]\\d+)?)';

export function parseRunText(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const distanceMatch = normalized.match(new RegExp(`${NUMBER}\\s?(km|kilometers|mi|miles)`, 'i'));
  const duration = parseDurationMinutes(normalized);
  const paceMatch = normalized.match(/(\d{1,2}:\d{2})\s?\/?\s?(km|mi)|pace\s*:?\s*(\d{1,2}:\d{2})/i);

  const values = {};
  if (distanceMatch) {
    const raw = Number.parseFloat(distanceMatch[1].replace(',', '.'));
    values.distanceKm = distanceMatch[2].toLowerCase().startsWith('mi') ? Number((raw * 1.60934).toFixed(2)) : raw;
  }
  if (duration !== null) {
    values.durationMinutes = duration;
  }
  if (paceMatch) {
    values.pace = paceMatch[1] || paceMatch[3];
  }
  return { values, rawText: normalized };
}

function parseDurationMinutes(text) {
  const labeledClock = text.match(/(?:time|duration)\s*:?\s*(?:(\d{1,2}):(\d{2}):(\d{2})|(\d{1,3}):(\d{2}))/i);
  if (labeledClock) {
    if (labeledClock[1]) {
      return Number(labeledClock[1]) * 60 + Number(labeledClock[2]);
    }
    return Number(labeledClock[4]);
  }

  const textDuration = text.match(/(?:(\d+)\s?h(?:our)?s?\s*)?(\d{1,3})\s?m(?:in)?/i);
  if (textDuration) {
    return Number(textDuration[1] || 0) * 60 + Number(textDuration[2]);
  }

  return null;
}

export async function extractRunDetailsFromImage(file, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (event) => {
      if (event.status === 'recognizing text') {
        onProgress?.(Math.round((event.progress || 0) * 100));
      }
    },
  });
  try {
    const result = await worker.recognize(file);
    return parseRunText(result.data.text || '');
  } finally {
    await worker.terminate();
  }
}