import * as homeService from '../services/home.service.js';
import { MESSAGES, sendSuccess, sendPaginatedSuccess } from '@homesphere/common';

export const createHome = async (req, res, next) => {
  try {
    const home = await homeService.createHome(req.user.id, req.body);
    sendSuccess(res, 201, MESSAGES.CREATED('Home'), home);
  } catch (err) {
    next(err);
  }
};

export const getHomes = async (req, res, next) => {
  try {
    const { homes, meta } = await homeService.getHomes(req.user.id, req.query);
    sendPaginatedSuccess(res, 200, MESSAGES.FETCHED('Homes'), homes, meta);
  } catch (err) {
    next(err);
  }
};

export const getHomeById = async (req, res, next) => {
  try {
    const home = await homeService.getHomeById(req.params.id, req.user.id);
    sendSuccess(res, 200, MESSAGES.FETCHED('Home'), home);
  } catch (err) {
    next(err);
  }
};

export const updateHome = async (req, res, next) => {
  try {
    const home = await homeService.updateHome(req.params.id, req.user.id, req.body);
    sendSuccess(res, 200, MESSAGES.UPDATED('Home'), home);
  } catch (err) {
    next(err);
  }
};

export const deleteHome = async (req, res, next) => {
  try {
    await homeService.deleteHome(req.params.id, req.user.id);
    sendSuccess(res, 200, MESSAGES.DELETED('Home'));
  } catch (err) {
    next(err);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const room = await homeService.createRoom(req.params.homeId, req.user.id, req.body);
    sendSuccess(res, 201, MESSAGES.CREATED('Room'), room);
  } catch (err) {
    next(err);
  }
};

export const getRooms = async (req, res, next) => {
  try {
    const { rooms, meta } = await homeService.getRooms(req.params.homeId, req.user.id, req.query);
    sendPaginatedSuccess(res, 200, MESSAGES.FETCHED('Rooms'), rooms, meta);
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const member = await homeService.addMember(
      req.params.homeId,
      req.user.id,
      req.body.email,
      req.body.role,
      req.body.permissions
    );
    sendSuccess(res, 201, MESSAGES.CREATED('HomeMember'), member);
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    await homeService.removeMember(req.params.homeId, req.user.id, req.params.userId);
    sendSuccess(res, 200, MESSAGES.DELETED('HomeMember'));
  } catch (err) {
    next(err);
  }
};
