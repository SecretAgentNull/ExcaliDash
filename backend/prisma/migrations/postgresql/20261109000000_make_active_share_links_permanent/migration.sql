-- Keep currently active links. Expired and revoked links remain inaccessible.
UPDATE "DrawingLinkShare"
SET "expiresAt" = NULL
WHERE "revokedAt" IS NULL
  AND "expiresAt" IS NOT NULL
  AND "expiresAt" > CURRENT_TIMESTAMP;
