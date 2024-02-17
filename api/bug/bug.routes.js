import express from 'express'
import { addBug, getBug, getBugs, removeBug, updateBug, getPDF } from './bug.controller.js'
import { log } from '../../middlewares/log.middleware.js'
import {requireUser} from '../../middlewares/requireAuth.middleware.js'
const router = express.Router()

router.get('/', getBugs)
router.get('/:bugId',requireUser, getBug)
router.delete('/:bugId',log, requireUser, removeBug)
router.post('/', requireUser, addBug)
router.post('/generatePdf',getPDF)
router.put('/',requireUser, updateBug)

export const bugRoutes = router