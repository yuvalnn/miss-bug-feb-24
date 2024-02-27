import express from 'express'
import { addBug, getBug, getBugs, removeBug, updateBug, getPDF } from './bug.controller.js'
import { log } from '../../middlewares/log.middleware.js'
import {requireAuth} from '../../middlewares/requireAuth.middleware.js'
const router = express.Router()

router.get('/', getBugs)
router.get('/:bugId',requireAuth, getBug)
router.delete('/:bugId',log, requireAuth, removeBug)
router.post('/', requireAuth, addBug)
router.post('/generatePdf',getPDF)
router.put('/',requireAuth, updateBug)

export const bugRoutes = router