import prisma from '../prisma/client.js';

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const createUser = async (data) => {
  return prisma.user.create({
    data,
  });
};

export const createRefreshToken = async (userId, tokenHash, expiresAt) => {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
};

export const findRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
};

export const revokeRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.update({
    where: { tokenHash },
    data: {
      revokedAt: new Date(),
    },
  });
};
