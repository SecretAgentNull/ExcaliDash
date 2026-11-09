-- Keep currently active links. Expired and revoked links remain inaccessible.
UPDATE "DrawingLinkShare"
SET "expiresAt" = NULL
WHERE "revokedAt" IS NULL
  AND "expiresAt" IS NOT NULL
  AND CASE
    WHEN typeof("expiresAt") IN ('integer', 'real')
      THEN julianday("expiresAt" / 1000.0, 'unixepoch')
    ELSE julianday("expiresAt")
  END > julianday('now');
