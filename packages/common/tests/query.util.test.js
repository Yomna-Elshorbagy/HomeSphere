import { buildPrismaQuery } from '../utils/query.util.js';

describe('query.util.js', () => {
  describe('buildPrismaQuery', () => {
    it('should set default pagination and sort parameters if query is empty', () => {
      const { prismaQuery, meta } = buildPrismaQuery({});
      
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(prismaQuery.skip).toBe(0);
      expect(prismaQuery.take).toBe(10);
      expect(prismaQuery.orderBy).toEqual({ createdAt: 'desc' });
      expect(prismaQuery.where).toEqual({});
    });

    it('should parse page and limit correctly', () => {
      const { prismaQuery, meta } = buildPrismaQuery({ page: '3', limit: '20' });
      
      expect(meta.page).toBe(3);
      expect(meta.limit).toBe(20);
      expect(prismaQuery.skip).toBe(40); // (3-1) * 20
      expect(prismaQuery.take).toBe(20);
    });

    it('should clamp limit to max 100', () => {
      const { prismaQuery, meta } = buildPrismaQuery({ limit: '500' });
      
      expect(meta.limit).toBe(100);
      expect(prismaQuery.take).toBe(100);
    });

    it('should build search query using OR condition with insensitive mode', () => {
      const { prismaQuery } = buildPrismaQuery({ search: 'test' }, ['name', 'address']);
      
      expect(prismaQuery.where.OR).toBeDefined();
      expect(prismaQuery.where.OR.length).toBe(2);
      expect(prismaQuery.where.OR[0].name.contains).toBe('test');
      expect(prismaQuery.where.OR[0].name.mode).toBe('insensitive');
    });

    it('should map exact match filters for unreserved query params', () => {
      const { prismaQuery } = buildPrismaQuery({ status: 'ACTIVE', role: 'ADMIN', page: '2' });
      
      expect(prismaQuery.where.status).toBe('ACTIVE');
      expect(prismaQuery.where.role).toBe('ADMIN');
      expect(prismaQuery.where.page).toBeUndefined(); // Reserved field
    });
  });
});
