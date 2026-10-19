import { MealPlan, MealPlanHistory, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

const EDITABLE_FIELDS = ['name', 'startDate', 'targetKcal', 'distribution', 'menu', 'notes']

export const getActivePlan = async (req, res, next) => {
  try {
    let patientId

    if (req.user.role === 'patient') {
      patientId = req.user.id
    } else {
      if (!req.query.patientId) {
        throw new HttpError(400, 'Falta el patientId')
      }

      const patient = await User.findOne({ _id: req.query.patientId, role: 'patient', nutritionist: req.user.id })

      if (!patient) {
        throw new HttpError(404, 'Paciente no encontrado')
      }

      patientId = patient._id
    }

    const plan = await MealPlan.findOne({ patient: patientId, active: true })

    if (!plan) {
      throw new HttpError(404, 'No hay un plan activo')
    }

    res.json(plan)
  } catch (error) {
    next(error)
  }
}

export const getPlans = async (req, res, next) => {
  try {
    if (!req.query.patientId) {
      throw new HttpError(400, 'Falta el patientId')
    }

    const patient = await User.findOne({ _id: req.query.patientId, role: 'patient', nutritionist: req.user.id })

    if (!patient) {
      throw new HttpError(404, 'Paciente no encontrado')
    }

    const plans = await MealPlan.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .select('name active version startDate targetKcal createdAt updatedAt')

    res.json(plans)
  } catch (error) {
    next(error)
  }
}

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, nutritionist: req.user.id })

    if (!plan) {
      throw new HttpError(404, 'Plan no encontrado')
    }

    res.json(plan)
  } catch (error) {
    next(error)
  }
}

export const createPlan = async (req, res, next) => {
  try {
    const { patientId, name, startDate, targetKcal, distribution, menu, notes } = req.body

    if (!patientId) {
      throw new HttpError(400, 'Falta el patientId')
    }

    const patient = await User.findOne({ _id: patientId, role: 'patient', nutritionist: req.user.id })

    if (!patient) {
      throw new HttpError(404, 'Paciente no encontrado')
    }

    const plan = new MealPlan({
      patient: patient._id,
      nutritionist: req.user.id,
      name,
      startDate,
      targetKcal,
      distribution,
      menu,
      notes,
      active: true,
      version: 1,
    })

    await plan.validate()
    await MealPlan.updateMany({ patient: patient._id, active: true }, { active: false })
    await plan.save()

    res.status(201).json(plan)
  } catch (error) {
    next(error)
  }
}

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, nutritionist: req.user.id })

    if (!plan) {
      throw new HttpError(404, 'Plan no encontrado')
    }

    if (!plan.active) {
      throw new HttpError(400, 'Solo se puede editar el plan activo')
    }

    const snapshot = plan.toObject()
    const previousVersion = plan.version

    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field]
      }
    }
    plan.version = previousVersion + 1

    await plan.validate()

    await MealPlanHistory.create({
      mealPlan: plan._id,
      patient: plan.patient,
      version: previousVersion,
      snapshot,
      modifiedBy: req.user.id,
      reason: req.body.reason,
    })

    await plan.save()
    res.json(plan)
  } catch (error) {
    next(error)
  }
}

export const getPlanHistory = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, nutritionist: req.user.id })

    if (!plan) {
      throw new HttpError(404, 'Plan no encontrado')
    }

    const history = await MealPlanHistory.find({ mealPlan: plan._id })
      .sort({ version: -1 })
      .select('-snapshot')
      .populate('modifiedBy', 'firstName paternalLastName')

    res.json({ currentVersion: plan.version, history })
  } catch (error) {
    next(error)
  }
}

export const getPlanVersion = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, nutritionist: req.user.id })

    if (!plan) {
      throw new HttpError(404, 'Plan no encontrado')
    }

    const entry = await MealPlanHistory.findOne({ mealPlan: plan._id, version: Number(req.params.version) })

    if (!entry) {
      throw new HttpError(404, 'Versión no encontrada')
    }

    res.json({
      version: entry.version,
      reason: entry.reason,
      modifiedAt: entry.createdAt,
      previous: entry.snapshot,
      current: plan,
    })
  } catch (error) {
    next(error)
  }
}