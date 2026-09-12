import express from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { validate } from '@homesphere/validation';
import { authenticate } from '@homesphere/auth';
import { registerDeviceSchema, updateDeviceSchema } from '../validators/device.validator.js';

const router = express.Router();

router.use(authenticate); // Require valid JWT for all device routes

router.post('/', validate(registerDeviceSchema), deviceController.registerDevice);
router.get('/', deviceController.getDevices);
router.get('/:id', deviceController.getDeviceById);
router.patch('/:id', validate(updateDeviceSchema), deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// IoT specific endpoints
router.post('/:id/command', deviceController.sendCommand);
router.get('/:id/state', deviceController.getDeviceState);
router.get('/:id/telemetry', deviceController.getDeviceTelemetry);

export default router;
