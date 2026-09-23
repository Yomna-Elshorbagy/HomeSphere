import prisma from '../prisma/client.js';
import logger from '@homesphere/logger';
import { getRedisClient } from '@homesphere/redis';

/**
 * Cleanup expired and revoked Refresh Tokens from the database.
 * This uses a Distributed Redis Lock to ensure it only runs once
 * across a horizontally scaled microservice cluster.
 */
export const cleanupExpiredTokens = async () => {
  try {
    const redis = getRedisClient();
    
    // Acquire a lock that expires in 10 minutes. 
    // NX = Only set if Not eXists
    const lock = await redis.set('lock:cron:cleanup_tokens', 'locked', 'NX', 'PX', 10 * 60 * 1000);
    
    if (!lock) {
      logger.debug('⏭️ Cleanup lock already acquired by another instance. Skipping.');
      return;
    }

    logger.info('🧹 Lock acquired. Starting cleanup of expired refresh tokens (14-day retention)...');
    
    // Keep tokens for 14 days after expiration/revocation for security audit purposes
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: fourteenDaysAgo } },
          { revokedAt: { lt: fourteenDaysAgo } },
        ]
      }
    });

    logger.info(`✅ Cleanup complete. Deleted ${result.count} expired/revoked tokens.`);
  } catch (error) {
    logger.error('❌ Failed to cleanup tokens:', error);
  }
};

// If run directly via CLI
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanupExpiredTokens().then(() => process.exit(0));
}
