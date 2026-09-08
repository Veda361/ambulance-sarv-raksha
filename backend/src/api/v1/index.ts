import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { orgRoutes } from './orgRoutes.js';
import { fleetRoutes } from './fleetRoutes.js';
import { missionRoutes } from './missionRoutes.js';
import { deviceRoutes } from './deviceRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', orgRoutes);
router.use('/fleet', fleetRoutes);
router.use('/missions', missionRoutes);
router.use('/devices', deviceRoutes);

export const apiV1Routes = router;
