/**
 * Test support for BR-214: approval is only possible from FARM_VERIFICATION with both required
 * documents and every land location's FMB boundary VERIFIED.
 *
 * Tests whose subject is what approval WRITES (farmers, farms, zones, dob/gender, BR-69 refusals)
 * use this to put an application into the state the review endpoints would leave it in, without
 * repeating the review flow in every test. The review flow itself, and every gate, is tested in
 * src/modules/farmer-applications/application-review*.test.ts.
 */
import type { Executor } from '../db/pool.js';
import { farmerApplicationsRepo } from '../modules/farmer-applications/farmer-applications.repo.js';
import {
  applicationDocuments,
  fmbFingerprintOf,
  locationIdOf,
} from '../modules/farmer-applications/farmer-applications.review.js';

/**
 * Records a VERIFIED decision for every current step-4 document and step-3 location of the
 * application, then sets its status to FARM_VERIFICATION. `is_draft` is left as it is.
 */
export async function markApplicationReviewedForApproval(db: Executor, appId: string, reviewerId: string): Promise<void> {
  const app = await farmerApplicationsRepo.findById(db, appId);
  if (app === null) throw new Error(`markApplicationReviewedForApproval: no application ${appId}`);

  for (const doc of applicationDocuments(app.step4_documents, [])) {
    await farmerApplicationsRepo.insertReview(db, {
      applicationId: appId,
      subjectType: 'DOCUMENT',
      subjectKey: doc.documentKey,
      contentFingerprint: doc.documentKey,
      decision: 'VERIFIED',
      reason: null,
      reviewedBy: reviewerId,
    });
  }

  const listed = (app.step3_location as Record<string, unknown> | null)?.['locations'];
  const locations: unknown[] = Array.isArray(listed) ? listed : [];
  for (const [index, entry] of locations.entries()) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const location = entry as Record<string, unknown>;
    await farmerApplicationsRepo.insertReview(db, {
      applicationId: appId,
      subjectType: 'FMB',
      subjectKey: locationIdOf(location, index),
      contentFingerprint: fmbFingerprintOf(location),
      decision: 'VERIFIED',
      reason: null,
      reviewedBy: reviewerId,
    });
  }

  await db.query(`UPDATE farmer_applications SET status = 'FARM_VERIFICATION' WHERE id = $1`, [appId]);
}
