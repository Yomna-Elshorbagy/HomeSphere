import * as deviceService from '../services/device.service.js';
import { MESSAGES, sendSuccess, sendPaginatedSuccess } from '@homesphere/common';

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

export const registerDevice = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const device = await deviceService.registerDevice(req.body, token);
    sendSuccess(res, 201, MESSAGES.CREATED('Device'), device);
  } catch (err) {
    next(err);
  }
};

export const getDevices = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const { devices, meta } = await deviceService.getDevices(req.query.homeId, token, req.query);
    sendPaginatedSuccess(res, 200, MESSAGES.FETCHED('Devices'), devices, meta);
  } catch (err) {
    next(err);
  }
};

export const getDeviceById = async (req, res, next) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    sendSuccess(res, 200, MESSAGES.FETCHED('Device'), device);
  } catch (err) {
    next(err);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const device = await deviceService.updateDevice(req.params.id, req.body, token);
    sendSuccess(res, 200, MESSAGES.UPDATED('Device'), device);
  } catch (err) {
    next(err);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const token = extractToken(req);
    await deviceService.deleteDevice(req.params.id, token);
    sendSuccess(res, 200, MESSAGES.DELETED('Device'));
  } catch (err) {
    next(err);
  }
};
