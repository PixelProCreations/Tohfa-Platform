import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RbacService } from '../../core/rbac.service';
import {
  AdminFarmerApplicationsService,
  type FarmerApplicationDetail,
  type StatusTimeline,
} from './farmer-applications.service';

/** One land parcel from step 3, as the detail endpoint returns it. */
type ApplicationLocation = NonNullable<
  FarmerApplicationDetail['step3Location']['locations']
>[number];

/**
 * How a parcel came to have a position: surveyed on the map, pinned by hand as the
 * documented fallback, or not positioned at all.
 */
type ParcelPositioning = 'drawn' | 'manual' | 'none';

const POSITIONING_LABEL: Record<ParcelPositioning, string> = {
  drawn: 'Boundary drawn on map',
  manual: 'Manual coordinates',
  none: 'Not positioned',
};

@Component({
  selector: 'tohfa-farmer-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Manrope', sans-serif;
      }

      .detail-container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg, 16px);
        padding-bottom: 100px;
      }

      /* ---------- Cards ---------- */
      .card {
        background: var(--tohfa-white, #ffffff);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-lg, 12px);
        padding: var(--tohfa-space-xl, 32px);
        box-shadow: 0 1px 3px rgba(17, 24, 39, 0.05);
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: var(--tohfa-font-size-h3, 20px);
        font-weight: 700;
        margin: 0 0 var(--tohfa-space-lg, 16px) 0;
        color: var(--tohfa-neutral-900, #1f2937);
        border-bottom: 1px solid var(--tohfa-neutral-200, #eceff3);
        padding-bottom: var(--tohfa-space-md, 12px);
      }
      .section-title .step-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--tohfa-primary-light, #e8f5e9);
        color: var(--tohfa-primary-dark, #1b5e20);
        font-size: 13px;
        font-weight: 800;
      }

      /* ---------- Field grid ---------- */
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: var(--tohfa-space-lg, 16px);
      }
      .field label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-bottom: 6px;
      }
      .field .val {
        font-size: var(--tohfa-font-size-body, 14px);
        font-weight: 600;
        color: var(--tohfa-neutral-900, #1f2937);
      }
      .field .val a {
        color: var(--tohfa-info, #2563eb);
        font-weight: 600;
        text-decoration: none;
      }
      .field .val a:hover {
        text-decoration: underline;
      }
      /* A secondary reading under a value. Deliberately neutral — it carries
         information the reviewer should weigh, never a failure. */
      .field .note {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        color: var(--tohfa-neutral-600, #6b7280);
      }
      .farm-block + .farm-block {
        margin-top: var(--tohfa-space-lg, 16px);
        padding-top: var(--tohfa-space-lg, 16px);
        border-top: 1px dashed var(--tohfa-neutral-200, #eceff3);
      }
      .doc-block {
        padding: var(--tohfa-space-md, 12px) 0;
        border-bottom: 1px solid var(--tohfa-neutral-100, #f3f4f6);
      }
      .doc-block:last-child {
        border-bottom: none;
      }

      /* ---------- Sticky footer ---------- */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 240px;
        right: 0;
        background: var(--tohfa-white, #ffffff);
        border-top: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-xl, 32px);
        box-shadow: 0 -8px 20px rgba(17, 24, 39, 0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10;
      }

      /* ---------- Buttons ---------- */
      .btn {
        padding: 10px 20px;
        border-radius: var(--tohfa-radius-sm, 6px);
        font-weight: 700;
        font-size: 13px;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-primary {
        background: var(--tohfa-primary, #2f7d32);
        color: #fff;
        box-shadow: 0 1px 2px rgba(27, 94, 32, 0.25);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--tohfa-primary-dark, #1b5e20);
        box-shadow: 0 4px 10px rgba(27, 94, 32, 0.3);
        transform: translateY(-1px);
      }
      .btn-danger {
        background: var(--tohfa-error, #dc2626);
        color: #fff;
        box-shadow: 0 1px 2px rgba(220, 38, 38, 0.25);
      }
      .btn-danger:hover:not(:disabled) {
        background: #b91c1c;
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
        transform: translateY(-1px);
      }
      .btn-secondary {
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-800, #374151);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        text-decoration: none;
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--tohfa-neutral-200, #eceff3);
      }
      .actions-group {
        display: flex;
        gap: 10px;
      }

      /* ---------- Modals ---------- */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
      }
      .modal-card {
        background: var(--tohfa-white, #ffffff);
        padding: var(--tohfa-space-xl, 32px);
        border-radius: var(--tohfa-radius-xl, 16px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
        width: 100%;
        max-width: 480px;
      }
      .modal-card h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
      }
      .modal-card p {
        margin: 0 0 var(--tohfa-space-md, 12px) 0;
        font-size: 13px;
        color: var(--tohfa-neutral-600, #6b7280);
      }
      .modal-card label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-neutral-700, #4b5563);
        margin-bottom: 6px;
        margin-top: var(--tohfa-space-md, 12px);
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: var(--tohfa-space-lg, 16px);
      }

      textarea,
      select {
        width: 100%;
        padding: 10px var(--tohfa-space-md, 12px);
        border-radius: var(--tohfa-radius-sm, 6px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        background: var(--tohfa-white, #ffffff);
        font-family: 'Manrope', sans-serif;
        font-size: var(--tohfa-font-size-body, 14px);
        color: var(--tohfa-neutral-900, #1f2937);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      textarea:hover,
      select:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
      }
      textarea:focus,
      select:focus {
        border-color: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
      textarea {
        min-height: 90px;
        resize: vertical;
      }

      /* ---------- Timeline ---------- */
      .timeline-step {
        padding: var(--tohfa-space-md, 12px) 0 var(--tohfa-space-md, 12px) var(--tohfa-space-lg, 16px);
        border-left: 2px solid var(--tohfa-primary-light, #e8f5e9);
        position: relative;
      }
      .timeline-step:last-child {
        border-left-color: transparent;
      }
      .timeline-step::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 20px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px var(--tohfa-primary-light, #e8f5e9);
      }
      .timeline-step strong {
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .timeline-step .timestamp {
        font-size: 12px;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-left: 6px;
      }
      .timeline-step p {
        margin: 6px 0 0 0;
        font-size: 13px;
        color: var(--tohfa-neutral-600, #6b7280);
      }
    `,
  ],
  template: `
    <div class="detail-container" *ngIf="app(); else loading">
      <!-- Step 1: Personal -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">1</span>Personal Details</h2>
        <div class="grid-2">
          <div class="field">
            <label>Full Name</label>
            <div class="val">{{ app()?.fullName }}</div>
          </div>
          <div class="field">
            <label>Mobile</label>
            <div class="val">{{ app()?.mobile }}</div>
          </div>
          <div class="field">
            <label>Date of Birth</label>
            <div class="val">{{ app()?.step1Personal?.dob ?? 'N/A' }}</div>
          </div>
          <div class="field">
            <label>Gender</label>
            <div class="val">{{ app()?.step1Personal?.gender ?? 'N/A' }}</div>
          </div>
          <div class="field">
            <label>Aadhaar (BR-33 Masked)</label>
            <div class="val">{{ maskedAadhaar() }}</div>
          </div>
          <div class="field">
            <label>Address</label>
            <div class="val">{{ app()?.step1Personal?.addressLine1 ?? 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Step 2: Farm Details -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">2</span>Farm Details</h2>
        <div class="grid-2">
          <!-- Leads the section because it identifies the operation the rest of this card
               describes. It is the name of the whole operation, NOT of a parcel — the step 3
               blocks below carry each parcel's own label, and those are what become farm
               names on approval. -->
          <div class="field">
            <label>Farm Name</label>
            <div class="val">{{ app()?.step2FarmDetails?.farmName ?? 'N/A' }}</div>
          </div>
          <div class="field">
            <label>Type of Farming</label>
            <div class="val">{{ app()?.step2FarmDetails?.typeOfFarming ?? 'N/A' }}</div>
          </div>
          <div class="field">
            <label>Farming Experience</label>
            <div class="val">{{ app()?.step2FarmDetails?.experienceYears ?? 'N/A' }} years</div>
          </div>
          <div class="field">
            <label>Total Land Area (Stated)</label>
            <div class="val">{{ statedAreaDisplay() }}</div>
          </div>
          <!-- The stated total comes off the farmer's land records; the step 3 parcels are
               measured on the ground. Shown side by side because a gap is what the
               FARM_VERIFICATION reviewer is here to notice. It is information, not an
               error: never auto-corrected, never styled as a failure, never blocking. -->
          <div class="field">
            <label>Land Marked in Step 3</label>
            <div class="val">{{ markedAreaDisplay() }}</div>
            <div class="note" *ngIf="areaComparison() as comparison">
              <span *ngIf="comparison.statedExceedsMarked">
                {{ comparison.differenceAcres }} of the stated holding are not marked in step 3.
              </span>
              <span *ngIf="!comparison.statedExceedsMarked">
                Marked land exceeds the stated holding by {{ comparison.differenceAcres }}.
              </span>
            </div>
          </div>
          <div class="field">
            <label>Number of Farms (Stated)</label>
            <div class="val">{{ statedFarmCountDisplay() }}</div>
          </div>
          <!-- Same treatment as the stated/marked acreage above: the count comes off the
               farmer's land records, the step 3 locations are what they actually marked.
               Shown side by side as information for the FARM_VERIFICATION reviewer — never
               auto-corrected, never styled as a failure, never blocking. -->
          <div class="field">
            <label>Farms Marked in Step 3</label>
            <div class="val">{{ markedFarmCountDisplay() }}</div>
            <div class="note" *ngIf="farmCountComparison() as comparison">
              <span *ngIf="comparison.statedExceedsMarked">
                {{ comparison.difference }} of the stated farms are not marked in step 3.
              </span>
              <span *ngIf="!comparison.statedExceedsMarked">
                {{ comparison.difference }} more farms are marked than the farmer stated.
              </span>
            </div>
          </div>
          <div class="field">
            <label>Water Source</label>
            <div class="val">{{ app()?.step2FarmDetails?.waterSource ?? 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Location & FMB -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">3</span>Location & Geometry</h2>
        <!-- Each block is one land location. The label and acreage lead the block so a
             reviewer can tell three parcels apart — without them the GPS/FMB rows below
             are identical and unattributable. -->
        <div
          *ngFor="let location of app()?.step3Location?.locations"
          class="farm-block grid-2"
        >
          <div class="field">
            <label>Land Location</label>
            <div class="val">{{ location.label }}</div>
          </div>
          <div class="field">
            <label>Area (Acres)</label>
            <div class="val">{{ location.areaAcres }} acres</div>
          </div>
          <!-- A drawn boundary and a typed-in point are not the same claim. A parcel the
               farmer only pinned by hand has no surveyed outline and no measured area, so
               the acreage beside it is their own figure and nothing here corroborates it.
               That is material at FARM_VERIFICATION, and it is information, not a fault:
               manual entry is the sanctioned fallback where a lock is impossible. Stated
               neutrally, in the same .note treatment as the stated/marked gaps above. -->
          <div class="field">
            <label>Positioning</label>
            <div class="val">{{ positioningLabel(location) }}</div>
            <div class="note" *ngIf="positioningOf(location) === 'manual'">
              Coordinates were typed in by the farmer. No boundary was surveyed, so the area
              beside it is the farmer's stated figure and not a measured one.
            </div>
          </div>
          <div class="field">
            <label>GPS Coordinates</label>
            <div class="val">
              Lat: {{ location.latitude ?? 'N/A' }}, Lng: {{ location.longitude ?? 'N/A' }}
            </div>
          </div>
          <div class="field">
            <label>FMB Polygon Geometry</label>
            <div class="val">
              {{ location.fmbPolygon ? 'FMB Polygon Captured (' + location.fmbPolygon.coordinates[0]?.length + ' points)' : 'Not captured' }}
            </div>
          </div>
        </div>
        <!-- Land is captured per location now; keep the pre-existing "nothing captured"
             reading rather than rendering an empty card when step 3 is blank. -->
        <div *ngIf="!app()?.step3Location?.locations?.length" class="grid-2">
          <div class="field">
            <label>GPS Coordinates</label>
            <div class="val">Lat: N/A, Lng: N/A</div>
          </div>
          <div class="field">
            <label>FMB Polygon Geometry</label>
            <div class="val">Not captured</div>
          </div>
        </div>
      </div>

      <!-- Step 4: Documents -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">4</span>Uploaded Documents</h2>
        <div *ngFor="let doc of app()?.step4Documents?.documents" class="doc-block grid-2">
          <div class="field">
            <label>Document Type</label>
            <!-- doc.docSubType is absent on documents saved before this field existed and is
                 never set on CERTIFICATE/OTHER rows (the mobile picker only offers it for
                 ID_PROOF/FARM_DOC) -- show nothing extra rather than an "undefined" suffix. -->
            <div class="val">{{ doc.docType }}{{ doc.docSubType ? ' — ' + doc.docSubType : '' }}</div>
          </div>
          <div class="field">
            <label>File URL</label>
            <div class="val">
              <a [href]="doc.fileUrl" target="_blank" rel="noopener">View Uploaded Document →</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="card" *ngIf="timeline()">
        <h2 class="section-title">Status Audit Timeline</h2>
        <div *ngFor="let step of timeline()?.steps" class="timeline-step">
          <strong>{{ step.status }}</strong><span class="timestamp">{{ step.reachedAt | date: 'medium' }}</span>
          <p *ngIf="step.note">{{ step.note }}</p>
        </div>
      </div>

      <!-- Sticky Action Footer -->
      <div class="sticky-footer">
        <a class="btn btn-secondary" routerLink="/farmer-applications">← Back to Queue</a>

        <div class="actions-group" *ngIf="canMutate()">
          <button class="btn btn-secondary" (click)="showInfoModal.set(true)">
            Request More Info
          </button>
          <button class="btn btn-danger" (click)="showRejectModal.set(true)">
            Reject
          </button>
          <button class="btn btn-primary" (click)="showApproveModal.set(true)">
            Approve Application
          </button>
        </div>
      </div>

      <!-- Approve Modal -->
      <div class="modal-backdrop" *ngIf="showApproveModal()">
        <div class="modal-card">
          <h3>Approve Application</h3>
          <p>This will allocate a TOHFA Farmer ID and activate the account.</p>
          <textarea [(ngModel)]="approveNote" placeholder="Optional approval note"></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showApproveModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="confirmApprove()">Confirm Approval</button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div class="modal-backdrop" *ngIf="showRejectModal()">
        <div class="modal-card">
          <h3>Reject Application</h3>
          <label>Reason Code</label>
          <select [(ngModel)]="rejectReasonCode">
            <option value="DOCUMENTS_INVALID">Documents Invalid</option>
            <option value="LAND_NOT_VERIFIED">Land Not Verified</option>
            <option value="DUPLICATE_APPLICANT">Duplicate Applicant</option>
            <option value="OUTSIDE_SERVICE_AREA">Outside Service Area</option>
            <option value="OTHER">Other</option>
          </select>
          <label>Explanation (Min 5 chars)</label>
          <textarea [(ngModel)]="rejectReason" placeholder="State reason clearly"></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showRejectModal.set(false)">Cancel</button>
            <button class="btn btn-danger" [disabled]="rejectReason.length < 5" (click)="confirmReject()">Reject Application</button>
          </div>
        </div>
      </div>

      <!-- Request Info Modal -->
      <div class="modal-backdrop" *ngIf="showInfoModal()">
        <div class="modal-card">
          <h3>Request More Information</h3>
          <textarea [(ngModel)]="infoMessage" placeholder="Specify required information"></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showInfoModal.set(false)">Cancel</button>
            <button class="btn btn-primary" [disabled]="infoMessage.length < 5" (click)="confirmRequestInfo()">Send Request</button>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="card"><p>Loading application...</p></div>
    </ng-template>
  `,
})
export class FarmerApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminFarmerApplicationsService);
  private readonly rbac = inject(RbacService);

  readonly app = signal<FarmerApplicationDetail | null>(null);
  readonly timeline = signal<StatusTimeline | null>(null);

  readonly canMutate = computed(() => this.rbac.canMutate('farmer.application.approve'));

  readonly maskedAadhaar = computed(() => {
    const last4 = this.app()?.step1Personal?.aadhaarLast4;
    return last4 ? `••••••••${last4}` : '••••••••••••';
  });

  /**
   * Floating-point hygiene, NOT a business tolerance. Acreages are decimals, so a sum
   * of parcels can land a hair off a total that is really identical to it. Anything
   * below this is arithmetic noise. There is deliberately no configurable "acceptable
   * variance" — every genuine gap is shown to the reviewer, however small.
   */
  private static readonly AREA_EPSILON_ACRES = 0.01;

  /** Land actually marked in step 3. Null — not zero — while no parcel is drawn. */
  readonly markedAreaAcres = computed<number | null>(() => {
    const locations = this.app()?.step3Location?.locations;
    if (!locations?.length) return null;
    return locations.reduce((total, location) => total + (location.areaAcres ?? 0), 0);
  });

  readonly statedAreaDisplay = computed(() =>
    this.formatAcres(this.app()?.step2FarmDetails?.totalAreaAcres),
  );

  readonly markedAreaDisplay = computed(() => this.formatAcres(this.markedAreaAcres()));

  /**
   * The farmer's stated total is normally copied off their land records; the step 3
   * parcels are measured on the ground. A gap between them means something specific at
   * FARM_VERIFICATION — land not yet marked, stale records, or an inflated claim — so
   * it is surfaced for the reviewer to judge rather than reconciled away. Null when
   * there is nothing to compare, or when the two agree.
   */
  readonly areaComparison = computed<{
    statedExceedsMarked: boolean;
    differenceAcres: string;
  } | null>(() => {
    const stated = this.app()?.step2FarmDetails?.totalAreaAcres;
    const marked = this.markedAreaAcres();
    if (stated === undefined || stated === null || marked === null) return null;

    const difference = stated - marked;
    if (Math.abs(difference) < FarmerApplicationDetailComponent.AREA_EPSILON_ACRES) return null;

    return {
      statedExceedsMarked: difference > 0,
      differenceAcres: this.formatAcres(Math.abs(difference)),
    };
  });

  private formatAcres(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    // Trim float artefacts (2.0999999999) without implying precision the farmer never gave.
    const acres = Number(value.toFixed(2));
    return `${acres} ${acres === 1 ? 'acre' : 'acres'}`;
  }

  /** Plots actually marked in step 3. Null — not zero — while no parcel is drawn. */
  readonly markedFarmCount = computed<number | null>(() => {
    const locations = this.app()?.step3Location?.locations;
    if (!locations?.length) return null;
    return locations.length;
  });

  readonly statedFarmCountDisplay = computed(() =>
    this.formatFarmCount(this.app()?.step2FarmDetails?.numberOfFarms),
  );

  readonly markedFarmCountDisplay = computed(() => this.formatFarmCount(this.markedFarmCount()));

  /**
   * The stated count is copied off the farmer's land records; the step 3 locations are
   * the plots they actually walked and marked. Exactly like the acreage comparison
   * above, a gap means something specific at FARM_VERIFICATION — a plot not yet marked,
   * stale records, or an inflated claim — so it is surfaced for the reviewer to judge
   * rather than reconciled away. Null when there is nothing to compare, or when the two
   * agree. Both sides are integers, so no epsilon applies here.
   */
  readonly farmCountComparison = computed<{
    statedExceedsMarked: boolean;
    difference: number;
  } | null>(() => {
    const stated = this.app()?.step2FarmDetails?.numberOfFarms;
    const marked = this.markedFarmCount();
    if (stated === undefined || stated === null || marked === null) return null;

    const difference = stated - marked;
    if (difference === 0) return null;

    return {
      statedExceedsMarked: difference > 0,
      difference: Math.abs(difference),
    };
  });

  private formatFarmCount(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return `${value} ${value === 1 ? 'farm' : 'farms'}`;
  }

  /**
   * The boundary decides; `gpsCaptured` is only read for parcels that have none.
   *
   * `gpsCaptured` is the flag the API carries for this — `docs/openapi.yaml` defines it as
   * "false when the farmer fell back to manual lat/lng entry" — but it is a flag *about* the
   * parcel, and what a reviewer is judging is the parcel itself. If a polygon is stored, that
   * polygon is real evidence sitting in this application, and reporting the parcel as merely
   * pinned because a stale `gpsCaptured: false` outlived a re-draw would understate what the
   * farmer actually supplied. So a boundary present reads as drawn, whatever the flag says.
   *
   * Without a boundary there is nothing surveyed and a coordinate pair can only have been
   * typed in, which makes `gpsCaptured` corroboration rather than the discriminator. Applies
   * equally to applications submitted before manual entry existed, where the flag may be
   * absent altogether.
   */
  positioningOf(location: ApplicationLocation): ParcelPositioning {
    const ring = location.fmbPolygon?.coordinates?.[0];
    if (ring && ring.length > 0) return 'drawn';
    if (location.latitude !== undefined && location.longitude !== undefined) return 'manual';
    return 'none';
  }

  positioningLabel(location: ApplicationLocation): string {
    return POSITIONING_LABEL[this.positioningOf(location)];
  }

  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showInfoModal = signal(false);

  approveNote = '';
  rejectReasonCode = 'DOCUMENTS_INVALID';
  rejectReason = '';
  infoMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
    }
  }

  loadApplication(id: string): void {
    this.service.getById(id).subscribe({
      next: (res) => this.app.set(res),
      error: () => this.router.navigate(['/farmer-applications']),
    });

    this.service.getStatusTimeline(id).subscribe({
      next: (res) => this.timeline.set(res),
      error: () => {
        // Timeline is non-critical; if it fails the rest of the detail page still works
        this.timeline.set(null);
      },
    });
  }

  confirmApprove(): void {
    const id = this.app()?.id;
    if (!id) return;
    this.service.approve(id, this.approveNote ? { note: this.approveNote } : {}).subscribe({
      next: (res) => {
        this.app.set(res);
        this.showApproveModal.set(false);
        this.loadApplication(id);
      },
    });
  }

  confirmReject(): void {
    const id = this.app()?.id;
    if (!id || this.rejectReason.length < 5) return;
    this.service.reject(id, { reasonCode: this.rejectReasonCode, reason: this.rejectReason }).subscribe({
      next: (res) => {
        this.app.set(res);
        this.showRejectModal.set(false);
        this.loadApplication(id);
      },
    });
  }

  confirmRequestInfo(): void {
    const id = this.app()?.id;
    if (!id || this.infoMessage.length < 5) return;
    this.service.requestInfo(id, { message: this.infoMessage }).subscribe({
      next: (res) => {
        this.app.set(res);
        this.showInfoModal.set(false);
        this.loadApplication(id);
      },
    });
  }
}