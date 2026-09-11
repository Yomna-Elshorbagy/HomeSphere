import express from 'express';
import * as homeController from '../controllers/home.controller.js';
import { 
  createHomeSchema, 
  updateHomeSchema, 
  createRoomSchema, 
  addMemberSchema 
} from '../validators/home.validator.js';
import { validate } from '@homesphere/validation';
import { authenticate } from '@homesphere/auth';

const router = express.Router();

router.use(authenticate); // All home routes require authentication

router.post('/', validate(createHomeSchema), homeController.createHome);
router.get('/', homeController.getHomes);
router.get('/:id', homeController.getHomeById);
router.patch('/:id', validate(updateHomeSchema), homeController.updateHome);
router.delete('/:id', homeController.deleteHome);

router.post('/:homeId/rooms', validate(createRoomSchema), homeController.createRoom);
router.get('/:homeId/rooms', homeController.getRooms);

router.post('/:homeId/members', validate(addMemberSchema), homeController.addMember);
router.delete('/:homeId/members/:userId', homeController.removeMember);

export default router;
