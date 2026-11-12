import { Consultation, Measurement } from '../models/index.js'

// Registros de peso de un paciente, del más viejo al más nuevo.
// Junta lo que registra el paciente (mediciones) y lo que anota el nutriólogo (consultas).
// `source` dice de dónde viene cada uno: 'patient' o 'consultation'
export const getWeightRecords = async (patientId, since = null) => {
    const measurementFilter = { patient: patientId }
    const consultationFilter = { patient: patientId, 'measurements.weightKg': { $exists: true } }

    if (since) {
        measurementFilter.date = { $gte: since }
        consultationFilter.date = { $gte: since }
    }

    const measurements = await Measurement.find(measurementFilter).select('date weightKg bodyFatPct')
    const consultations = await Consultation.find(consultationFilter).select('date measurements')

    const records = [
        ...measurements.map((measurement) => ({
            date: measurement.date,
            weightKg: measurement.weightKg,
            bodyFatPct: measurement.bodyFatPct ?? null,
            source: 'patient',
        })),
        ...consultations.map((consultation) => ({
            date: consultation.date,
            weightKg: consultation.measurements.weightKg,
            bodyFatPct: consultation.measurements.bodyFatPct ?? null,
            source: 'consultation',
        })),
    ]

    return records.sort((a, b) => a.date - b.date)
}

// El peso más reciente, sea de una medición o de una consulta
export const getCurrentWeight = async (patientId) => {
    const records = await getWeightRecords(patientId)
    return records.length > 0 ? records[records.length - 1].weightKg : null
}
