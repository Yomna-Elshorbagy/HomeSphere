/**
 * Builds Prisma query options (skip, take, orderBy, where) from Express request query parameters.
 * 
 * @param {Object} query - The req.query object from Express
 * @param {Array<string>} searchFields - Fields in the Prisma model to search against
 * @returns {Object} { prismaQuery, meta }
 */
export const buildPrismaQuery = (query = {}, searchFields = []) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10)); // Max limit 100
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const orderBy = { [sortBy]: sortOrder };

  let where = {};

  // Handle generic search across specified fields
  if (query.search && searchFields.length > 0) {
    where.OR = searchFields.map(field => ({
      [field]: {
        contains: query.search,
        mode: 'insensitive',
      },
    }));
  }

  // Allow exact match filtering for any other query params not related to pagination
  const excludeFields = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];
  Object.keys(query).forEach(key => {
    if (!excludeFields.includes(key) && query[key] !== undefined) {
      where[key] = query[key];
    }
  });

  return {
    prismaQuery: { skip, take: limit, orderBy, where },
    meta: { page, limit },
  };
};
