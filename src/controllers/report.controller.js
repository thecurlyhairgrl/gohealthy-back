import mongoose from 'mongoose'
import { User, ClinicalHistory, MealPlan } from '../models/index.js'
import { getCurrentWeight, getWeightRecords } from '../services/weight.service.js'

const getDaysAgo = (days) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date
}

export const getPatientFollowUp = async (req, res, next) => {
    try {
        const nutritionistId = new mongoose.Types.ObjectId(req.user.id)
        const now = new Date()

        const report = await User.aggregate([
            { $match: { role: 'patient', nutritionist: nutritionistId, active: true } },
            {
                $lookup: {
                    from: 'consultations',
                    localField: '_id',
                    foreignField: 'patient',
                    as: 'consultations',
                },
            },
            {
                $lookup: {
                    from: 'appointments',
                    localField: '_id',
                    foreignField: 'patient',
                    as: 'appointments',
                },
            },
            {
                $lookup: {
                    from: 'clinicalHistories',
                    localField: '_id',
                    foreignField: 'patient',
                    as: 'clinicalHistory',
                },
            },
            {
                $addFields: {
                    upcomingAppointments: {
                        $filter: {
                            input: '$appointments',
                            as: 'appointment',
                            cond: {
                                $and: [
                                    { $gte: ['$$appointment.dateTime', now] },
                                    { $in: ['$$appointment.status', ['scheduled', 'rescheduled']] },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    firstName: 1,
                    paternalLastName: 1,
                    maternalLastName: 1,
                    email: 1,
                    totalConsultations: { $size: '$consultations' },
                    lastConsultation: { $max: '$consultations.date' },
                    nextAppointment: { $min: '$upcomingAppointments.dateTime' },
                    weightGoalKg: { $arrayElemAt: ['$clinicalHistory.weightGoalKg', 0] },
                },
            },
            {
                $addFields: {
                    daysSinceLastConsultation: {
                        $cond: [
                            { $eq: [{ $ifNull: ['$lastConsultation', null] }, null] },
                            null,
                            { $dateDiff: { startDate: '$lastConsultation', endDate: now, unit: 'day' } },
                        ],
                    },
                    needsFollowUp: { $eq: [{ $ifNull: ['$nextAppointment', null] }, null] },
                },
            },
            { $sort: { needsFollowUp: -1, daysSinceLastConsultation: -1 } },
        ])

        // El peso actual sale del servicio: el registro más reciente, sea medición o consulta
        for (const patient of report) {
            patient.currentWeightKg = await getCurrentWeight(patient._id)
        }

        res.json(report)
    } catch (error) {
        next(error)
    }
}

export const getWeightProgress = async (req, res, next) => {
    try {
        const days = Number(req.query.days) || 90
        const since = getDaysAgo(days)

        const patients = await User.find({ role: 'patient', nutritionist: req.user.id }).select('firstName paternalLastName')

        // Por paciente: su primer y su último peso del periodo, de mediciones y de consultas
        const report = []
        for (const patient of patients) {
            const records = await getWeightRecords(patient._id, since)

            if (records.length === 0) {
                continue
            }

            const initialWeightKg = records[0].weightKg
            const currentWeightKg = records[records.length - 1].weightKg
            const changeKg = Number((currentWeightKg - initialWeightKg).toFixed(1))

            report.push({
                _id: patient._id,
                firstName: patient.firstName,
                paternalLastName: patient.paternalLastName,
                initialWeightKg,
                currentWeightKg,
                totalMeasurements: records.length,
                changeKg,
                changePct: Number(((changeKg / initialWeightKg) * 100).toFixed(1)),
            })
        }

        // Primero los que más bajaron
        report.sort((a, b) => a.changeKg - b.changeKg)

        res.json({ days, patients: report })
    } catch (error) {
        next(error)
    }
}

export const getWellnessByCondition = async (req, res, next) => {
    try {
        const nutritionistId = new mongoose.Types.ObjectId(req.user.id)
        const days = Number(req.query.days) || 30
        const since = getDaysAgo(days)

        const report = await ClinicalHistory.aggregate([
            { $match: { nutritionist: nutritionistId } },
            {
                $project: {
                    patient: 1,
                    conditions: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ['$pathologicalHistory.diseases', []] } }, 0] },
                            '$pathologicalHistory.diseases',
                            ['Sin padecimientos'],
                        ],
                    },
                },
            },
            { $unwind: '$conditions' },
            {
                $lookup: {
                    from: 'wellnessSurveys',
                    localField: 'patient',
                    foreignField: 'patient',
                    as: 'surveys',
                },
            },
            { $unwind: '$surveys' },
            { $match: { 'surveys.date': { $gte: since } } },
            {
                $group: {
                    _id: '$conditions',
                    patients: { $addToSet: '$patient' },
                    totalSurveys: { $sum: 1 },
                    avgMood: { $avg: '$surveys.mood' },
                    avgSleepHours: { $avg: '$surveys.sleepHours' },
                    avgWaterGlasses: { $avg: '$surveys.waterGlasses' },
                    avgActivityMinutes: { $avg: '$surveys.activityMinutes' },
                    avgPlanAdherence: { $avg: '$surveys.planAdherence' },
                },
            },
            {
                $project: {
                    _id: 0,
                    condition: '$_id',
                    patientsCount: { $size: '$patients' },
                    totalSurveys: 1,
                    avgMood: { $round: ['$avgMood', 1] },
                    avgSleepHours: { $round: ['$avgSleepHours', 1] },
                    avgWaterGlasses: { $round: ['$avgWaterGlasses', 1] },
                    avgActivityMinutes: { $round: ['$avgActivityMinutes', 0] },
                    avgPlanAdherence: { $round: ['$avgPlanAdherence', 0] },
                },
            },
            { $sort: { avgPlanAdherence: 1 } },
        ])

        res.json({ days, conditions: report })
    } catch (error) {
        next(error)
    }
}

export const getTopFoods = async (req, res, next) => {
    try {
        const nutritionistId = new mongoose.Types.ObjectId(req.user.id)

        const report = await MealPlan.aggregate([
            { $match: { nutritionist: nutritionistId, active: true } },
            { $unwind: '$menu' },
            { $unwind: '$menu.meals' },
            { $unwind: '$menu.meals.foods' },
            {
                $group: {
                    _id: '$menu.meals.foods.name',
                    groupKey: { $first: '$menu.meals.foods.groupKey' },
                    timesUsed: { $sum: 1 },
                    plans: { $addToSet: '$_id' },
                },
            },
            { $sort: { timesUsed: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'smaeGroups',
                    localField: 'groupKey',
                    foreignField: 'key',
                    as: 'group',
                },
            },
            {
                $project: {
                    _id: 0,
                    food: '$_id',
                    groupKey: 1,
                    groupName: { $arrayElemAt: ['$group.name', 0] },
                    subgroup: { $arrayElemAt: ['$group.subgroup', 0] },
                    timesUsed: 1,
                    plansCount: { $size: '$plans' },
                },
            },
        ])

        res.json(report)
    } catch (error) {
        next(error)
    }
}
