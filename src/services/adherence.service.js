import { WellnessSurvey } from '../models/index.js'

const WEIGHTS = {
    planAdherence: 0.35,
    mood: 0.15,
    sleep: 0.15,
    water: 0.15,
    activity: 0.2,
}

const GOALS = {
    waterGlasses: 8,
    activityMinutes: 30,
    minSleepHours: 7,
    maxSleepHours: 9,
}

const average = (values) => {
    const total = values.reduce((sum, value) => sum + value, 0)
    return total / values.length
}

const sleepScore = (hours) => {
    if (hours >= GOALS.minSleepHours && hours <= GOALS.maxSleepHours) {
        return 100
    }

    let difference
    if (hours < GOALS.minSleepHours) {
        difference = GOALS.minSleepHours - hours
    } else {
        difference = hours - GOALS.maxSleepHours
    }

    return Math.max(0, 100 - difference * 25)
}

export const calculateAdherence = async (patientId, days = 7) => {
    const since = new Date()
    since.setUTCHours(0, 0, 0, 0)
    since.setUTCDate(since.getUTCDate() - (days - 1))

    const surveys = await WellnessSurvey.find({ patient: patientId, date: { $gte: since } })

    if (surveys.length === 0) {
        return { score: null, status: 'no-data', days, surveysCount: 0, components: null }
    }

    const components = {
        planAdherence: average(surveys.map((survey) => survey.planAdherence)),
        mood: average(surveys.map((survey) => ((survey.mood - 1) / 4) * 100)),
        sleep: average(surveys.map((survey) => sleepScore(survey.sleepHours))),
        water: average(surveys.map((survey) => Math.min(survey.waterGlasses / GOALS.waterGlasses, 1) * 100)),
        activity: average(surveys.map((survey) => Math.min(survey.activityMinutes / GOALS.activityMinutes, 1) * 100)),
    }

    const score = Math.round(
        components.planAdherence * WEIGHTS.planAdherence +
        components.mood * WEIGHTS.mood +
        components.sleep * WEIGHTS.sleep +
        components.water * WEIGHTS.water +
        components.activity * WEIGHTS.activity
    )

    let status = 'red'
    if (score >= 80) {
        status = 'green'
    } else if (score >= 60) {
        status = 'yellow'
    }

    for (const key of Object.keys(components)) {
        components[key] = Math.round(components[key])
    }

    return { score, status, days, surveysCount: surveys.length, components }
}