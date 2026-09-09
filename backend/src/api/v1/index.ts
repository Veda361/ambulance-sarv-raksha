import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { orgRoutes } from './orgRoutes.js';
import { fleetRoutes } from './fleetRoutes.js';
import { missionRoutes } from './missionRoutes.js';
import { deviceRoutes } from './deviceRoutes.js';
import { hospitalOpsRoutes } from './hospitalOpsRoutes.js';
import { receivingRoutes } from './receivingRoutes.js';
import { alertRoutes } from './alertRoutes.js';
import { auditRoutes } from './auditRoutes.js';
import { userRoutes } from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', orgRoutes);
router.use('/fleet', fleetRoutes);
router.use('/missions', missionRoutes);
router.use('/devices', deviceRoutes);
router.use('/hospital-ops', hospitalOpsRoutes);
router.use('/receiving', receivingRoutes);
router.use('/alerts', alertRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes);

export const apiV1Routes = router;
