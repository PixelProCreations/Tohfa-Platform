/**
 * Farmers Management → Farmer Details (Farm & Land tab).
 *
 * Data, all from docs/openapi.yaml, each call gated by its own permission and re-checked by the API:
 * - GET /v1/admin/farmers/{id} (`farmer.profile.view_all`): header, Farm Overview, the land
 *   locations table, the FMB boundary count, Farm Location and the Plots count. Out of scope is a
 *   404, indistinguishable from a missing farmer (root CLAUDE.md §2.1).
 * - GET /v1/admin/farmers/{id}/documents (`farmer.document.view`): the FARM_DOC file behind the
 *   FMB card's View / Download / View FMB buttons.
 * - GET /v1/admin/audit-log?entityType=farmer&entityId= (`auditlog.view`): Recent Profile Activity
 *   and the Last Updated tile.
 * - POST /v1/admin/farmers/{id}/status (`farmer.profile.edit`, plus `farmer.account.reactivate`
 *   for ACTIVATE): the Deactivate / Reactivate menu items.
 *
 * "Plots" here are the land locations — the labelled parcels a farmer marks in step 3 of the
 * application, each with its own acreage and FMB boundary (AdminFarmerLandLocation). The `plots`
 * inside a location are its zones, shown as a count.
 *
 * Spec gaps (the design shows them; the profile API does not return them, so they render "—" or
 * an empty state, never invented values): the operation's farm name, farming method
 * (`typeOfFarming`), stated total area, primary crops and water source from application step 2;
 * a farm ID; plot shape and main crop; the FMB polygon itself (only `hasBoundary`) and an FMB
 * number; active crops and soil records for a farmer; an editable land location; Terminate,
 * Block/Unblock listing and Lock/Unlock actions.
 *
 * Tabs: Farm & Land is wired to the real API (above). Soil, Produce Listing and KYC render their own
 * components built against real endpoints, with empty states where the API has no data. Ratings,
 * Subscription, Verification & Compliance, Audit, Farmer Records, History and Payout are UI-only
 * components on mock data, by explicit request: they make no API calls.
 */
import { CommonModule } from '@angular/common';
import type { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RbacService } from '../../core/rbac.service';
import { DataTableCellDirective, DataTableComponent, type Column } from '../../shared/data-table/data-table.component';
import { FarmerActionsMenuComponent, type MenuItem } from './farmer-actions-menu.component';
import { FarmerAuditTabComponent } from './farmer-audit-tab.component';
import { FarmerHistoryTabComponent } from './farmer-history-tab.component';
import { FarmerKycTabComponent } from './farmer-kyc-tab.component';
import { FarmerListingsTabComponent } from './farmer-listings-tab.component';
import { FarmerPayoutTabComponent } from './farmer-payout-tab.component';
import { FarmerRatingsTabComponent } from './farmer-ratings-tab.component';
import { FarmerRecordsTabComponent } from './farmer-records-tab.component';
import { FarmerSoilTabComponent } from './farmer-soil-tab.component';
import { FarmerSubscriptionTabComponent } from './farmer-subscription-tab.component';
import { FarmerVerificationTabComponent } from './farmer-verification-tab.component';
import { FARMER_DETAIL_STRINGS as S } from './farmer-detail.strings';
import {
  FarmersService,
  type AdminFarmerAccountStatus,
  type AdminFarmerCertificationSummary,
  type AdminFarmerDetail,
  type AdminFarmerDocument,
  type AdminFarmerKycStatus,
  type AdminFarmerLandLocation,
  type AdminFarmerStatusAction,
  type AuditLogEntry,
} from './farmers.service';

type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';
type Badge = { label: string; tone: BadgeTone };
type TabId =
  | 'farm'
  | 'soil'
  | 'produce'
  | 'kyc'
  | 'ratings'
  | 'subscription'
  | 'verification'
  | 'audit'
  | 'records'
  | 'history'
  | 'payout';
type ActivityTone = 'brown' | 'success' | 'danger';

type LocationRow = {
  id: string;
  name: string;
  isPrimary: boolean;
  surveyNumber: string | null;
  areaAcres: number | null;
  zones: number;
  fmb: boolean;
  actions: null;
};

/** The dialog the two status actions backed by POST /admin/farmers/{id}/status open. */
interface StatusDialog {
  action: Extract<AdminFarmerStatusAction, 'DEACTIVATE' | 'ACTIVATE'>;
  title: string;
  body: string;
  confirm: string;
}

/** Minimum and maximum of `reason` in docs/openapi.yaml `updateAdminFarmerStatus`. */
const REASON_MIN = 3;
const REASON_MAX = 500;
const NOTE_MAX = 1000;
/** How many audit entries the Recent Profile Activity card shows. */
const ACTIVITY_LIMIT = 3;

const STATUS_BADGE: Record<AdminFarmerAccountStatus, Badge> = {
  ACTIVE: { label: S.STATUS_ACTIVE, tone: 'success' },
  PENDING: { label: S.STATUS_PENDING, tone: 'warning' },
  DISABLED: { label: S.STATUS_DISABLED, tone: 'neutral' },
};

const KYC_BADGE: Record<AdminFarmerKycStatus, Badge> = {
  VERIFIED: { label: S.KYC_VERIFIED, tone: 'success' },
  PENDING: { label: S.KYC_PENDING, tone: 'warning' },
  REJECTED: { label: S.KYC_REJECTED, tone: 'danger' },
};

/**
 * One badge for the certification summary. A qualifying certificate (VERIFIED, unexpired PGS/NPOP,
 * BR-02) wins; otherwise the most actionable state: expired, then awaiting verification, then rejected.
 */
function certificationBadge(c: AdminFarmerCertificationSummary): Badge {
  if (c.total === 0) return { label: S.CERT_NONE, tone: 'neutral' };
  if (c.qualifying > 0 || c.verifiedCurrent > 0) return { label: S.CERT_VALID, tone: 'success' };
  if (c.expired > 0) return { label: S.CERT_EXPIRED, tone: 'danger' };
  if (c.unverified > 0) return { label: S.CERT_PENDING, tone: 'warning' };
  return { label: S.CERT_REJECTED, tone: 'danger' };
}

/** "+919876543210" → "98765 43210"; anything else is shown as received. */
function formatMobile(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `${m[1]} ${m[2]}` : e164;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter((p) => p !== '');
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function primaryLocation(f: AdminFarmerDetail): AdminFarmerLandLocation | null {
  return f.landLocations.find((l) => l.isPrimary) ?? f.landLocations[0] ?? null;
}

function activityTone(action: string): ActivityTone {
  if (action === 'farmer.account.reactivate' || action === 'certification.unblock_listings') return 'success';
  if (action === 'farmer.account.deactivate' || action === 'farmer.account.disable' || action === 'certification.block_listings') {
    return 'danger';
  }
  return 'brown';
}

@Component({
  selector: 'tohfa-farmer-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DataTableComponent,
    DataTableCellDirective,
    FarmerActionsMenuComponent,
    FarmerSoilTabComponent,
    FarmerListingsTabComponent,
    FarmerKycTabComponent,
    FarmerRatingsTabComponent,
    FarmerSubscriptionTabComponent,
    FarmerVerificationTabComponent,
    FarmerAuditTabComponent,
    FarmerRecordsTabComponent,
    FarmerHistoryTabComponent,
    FarmerPayoutTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }
      [aria-disabled='true'] {
        cursor: not-allowed;
      }
      .muted {
        color: var(--tohfa-muted);
      }

      /* ---------- Header card ---------- */
      .profile {
        display: flex;
        align-items: center;
        gap: var(--space-18);
        padding: var(--space-18) var(--space-20);
      }
      .avatar {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 58px;
        height: 58px;
        border-radius: var(--r-circle);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-title-login);
        font-weight: var(--fw-bold);
      }
      .identity {
        flex: 1 1 auto;
        min-width: 0;
      }
      .name {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-title-login);
        font-weight: var(--fw-bold);
        line-height: 1.2;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-6) var(--space-14);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
      }
      .meta-item .icon {
        font-size: var(--icon-row-action);
      }
      .id-chip {
        padding: var(--space-4) var(--space-8);
        border-radius: var(--r-xs);
        background: var(--tohfa-divider);
        color: var(--tohfa-slate);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .statuses {
        display: flex;
        gap: var(--space-20);
      }
      .status {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-8);
        font-size: var(--fs-cap);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-10);
      }
      .header-actions .tohfa-btn-primary {
        min-height: 44px;
        padding: var(--space-10) var(--space-18);
      }

      /* ---------- Tabs ---------- */
      .tohfa-tab-pill {
        min-height: 38px;
      }
      .tohfa-tab-pill:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      /* ---------- Grid & cards ---------- */
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(0, 1.45fr) minmax(0, 1fr);
        gap: var(--space-14);
        align-items: start;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
      }
      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        margin-bottom: var(--space-12);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }
      .card-tools {
        display: flex;
        gap: var(--space-8);
      }
      .btn-sm {
        padding: var(--space-6) var(--space-12);
        font-size: var(--fs-dense);
      }
      .btn-sm .icon {
        font-size: var(--icon-row-action);
      }

      /* Farm Overview rows */
      .kv {
        margin: 0;
      }
      .kv-row {
        display: flex;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-10) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-cell);
      }
      .kv-row:last-child {
        border-bottom: none;
      }
      .kv-row dt {
        color: var(--tohfa-slate);
      }
      .kv-row dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
      }

      /* Land table cells */
      .strong {
        font-weight: var(--fw-bold);
      }
      .primary-mark {
        margin-left: var(--space-4);
        vertical-align: middle;
        font-size: var(--icon-row-action);
        color: var(--tohfa-amber);
      }
      .row-actions {
        display: inline-flex;
        gap: var(--space-8);
      }
      .row-actions button {
        display: inline-flex;
        padding: 0;
        border: none;
        background: none;
        color: var(--tohfa-slate);
      }
      .row-actions .icon {
        font-size: var(--icon-btn);
      }

      /* FMB sketch */
      .sketch {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        min-height: 190px;
        padding: var(--space-18);
        border: 1px solid var(--ok-bd);
        border-radius: var(--r-md);
        background: var(--ok-bg);
        color: var(--tohfa-slate);
        font-size: var(--fs-dense);
        text-align: center;
      }
      .sketch .icon {
        font-size: var(--icon-dialog-hero);
        color: var(--ok);
      }
      .sketch-title {
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
      }
      .sketch-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        margin-top: var(--space-12);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }

      /* Farm Location */
      .address {
        margin: 0 0 var(--space-12);
        font-size: var(--fs-cell);
        line-height: 1.5;
      }
      .map {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
        border-radius: var(--r-md);
        background: linear-gradient(135deg, var(--ok-bg), var(--ok-bd));
      }
      .map .pin {
        font-size: var(--fs-kpi);
        color: var(--tohfa-amber);
      }
      .coords {
        position: absolute;
        left: var(--space-10);
        bottom: var(--space-10);
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-8);
        border-radius: var(--r-xs);
        background: var(--tohfa-surface);
        font-size: var(--fs-badge);
        font-weight: var(--fw-medium);
      }
      .coords .icon {
        font-size: var(--icon-row-action);
      }

      /* Farm Summary tiles */
      .tiles {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-10);
      }
      .tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        min-height: 64px;
        padding: var(--space-12);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-stat-mini);
        background: var(--tohfa-page);
        text-align: center;
      }
      .tile-val {
        font-size: var(--fs-title-login);
        font-weight: var(--fw-bold);
        line-height: 1.1;
      }
      .tile-val.date {
        font-size: var(--fs-card);
      }
      .tile-label {
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }

      /* Activity timeline */
      .timeline {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .event {
        display: grid;
        grid-template-columns: var(--space-8) minmax(0, 1fr);
        column-gap: var(--space-10);
      }
      .dot {
        width: var(--space-7);
        height: var(--space-7);
        margin-top: var(--space-6);
        border-radius: var(--r-circle);
      }
      .dot-brown {
        background: var(--tohfa-brown);
      }
      .dot-success {
        background: var(--ok);
      }
      .dot-danger {
        background: var(--err);
      }
      .event-title {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .event-desc {
        margin-top: var(--space-4);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .event-at {
        margin-top: var(--space-4);
        font-size: var(--fs-badge);
        color: var(--tohfa-muted);
      }
      .card-empty {
        margin: 0;
        padding: var(--space-12) 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }

      /* Status dialog */
      .dialog-title {
        margin: 0 0 var(--space-8);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
      }
      .dialog-body {
        margin: 0 0 var(--space-18);
        color: var(--tohfa-slate);
        font-size: var(--fs-body);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        margin-bottom: var(--space-14);
      }
      .field textarea {
        resize: vertical;
      }
      .hint {
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-10);
      }
      .error {
        margin: 0;
      }
    `,
  ],
  template: `
    <p class="tohfa-banner tohfa-banner-info" *ngIf="state() === 'loading'" role="status">{{ S.LOADING }}</p>

    <ng-container *ngIf="state() === 'missing' || state() === 'error'">
      <p class="tohfa-banner tohfa-banner-danger error" role="alert">
        {{ state() === 'missing' ? S.NOT_FOUND : S.LOAD_ERROR }}
      </p>
      <div>
        <button *ngIf="state() === 'error'" type="button" class="tohfa-btn tohfa-btn-secondary" (click)="load()">
          {{ S.RETRY }}
        </button>
        <a class="tohfa-btn tohfa-btn-secondary" routerLink="/farmers">{{ S.BACK_TO_DIRECTORY }}</a>
      </div>
    </ng-container>

    <ng-container *ngIf="farmer() as f">
      <!-- (a) Header card -->
      <section class="tohfa-card profile" aria-labelledby="farmer-name">
        <span class="avatar" aria-hidden="true">{{ avatar() }}</span>

        <div class="identity">
          <h1 class="name" id="farmer-name">{{ f.fullName }}</h1>
          <div class="meta">
            <span class="id-chip">{{ S.FARMER_ID_PREFIX }}{{ f.tohfaFarmerId }}</span>
            <span class="meta-item" [title]="S.META_ZONE">
              <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ f.zone?.name ?? '—' }}
            </span>
            <span class="meta-item" [title]="S.NOT_IN_PROFILE_API">
              <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>
              <span class="muted">{{ S.META_FARMING_METHOD }}: —</span>
            </span>
            <span class="meta-item" [title]="S.META_MOBILE">
              <span class="material-symbols-outlined icon" aria-hidden="true">call</span>{{ mobile() }}
            </span>
          </div>
        </div>

        <div class="statuses">
          <div class="status">
            {{ S.ACCOUNT_STATUS }}
            <span class="tohfa-badge tohfa-badge-{{ accountBadge().tone }}">{{ accountBadge().label }}</span>
          </div>
          <div class="status">
            {{ S.KYC_STATUS }}
            <span class="tohfa-badge tohfa-badge-{{ kycBadge().tone }}">{{ kycBadge().label }}</span>
          </div>
          <div class="status">
            {{ S.CERTIFICATION }}
            <span class="tohfa-badge tohfa-badge-{{ certBadge().tone }}">{{ certBadge().label }}</span>
          </div>
        </div>

        <div class="header-actions">
          <!-- Edit Farmer Profile (SA-M3-S02a): PATCH /admin/farmers/{id}, farmer.profile.edit. -->
          <a *ngIf="canEdit()" class="tohfa-btn tohfa-btn-primary" [routerLink]="['/farmers', f.id, 'edit']">
            <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT_PROFILE }}
          </a>
          <tohfa-farmer-actions-menu
            [label]="S.BTN_MORE_ACTIONS"
            [items]="menuItems()"
            (selected)="onAction($event)"
          ></tohfa-farmer-actions-menu>
        </div>
      </section>

      <p class="tohfa-banner tohfa-banner-danger error" *ngIf="actionError()" role="alert">{{ actionError() }}</p>

      <!-- (b) Tabs -->
      <nav class="tohfa-tabs" role="tablist" [attr.aria-label]="S.TABS_LABEL" (keydown)="onTabKey($event)">
        <button
          *ngFor="let t of tabs"
          type="button"
          role="tab"
          class="tohfa-tab-pill"
          [id]="'tab-' + t.id"
          [class.active]="tab() === t.id"
          [attr.aria-selected]="tab() === t.id"
          [attr.aria-controls]="'panel-' + t.id"
          [tabindex]="tab() === t.id ? 0 : -1"
          (click)="tab.set(t.id)"
        >
          {{ t.label }}
        </button>
      </nav>

      <!-- (c) Farm & Land -->
      <section *ngIf="tab() === 'farm'; else tabShell" class="grid" role="tabpanel" id="panel-farm" aria-labelledby="tab-farm">
        <div class="col">
          <!-- Farm Overview -->
          <section class="tohfa-card">
            <div class="card-head">
              <h2 class="card-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">home_work</span>{{ S.FARM_OVERVIEW }}
              </h2>
            </div>
            <dl class="kv">
              <div class="kv-row">
                <dt>{{ S.FARM_NAME }}</dt>
                <dd class="muted" [title]="S.NOT_IN_PROFILE_API">—</dd>
              </div>
              <div class="kv-row">
                <dt>{{ S.FARM_ID }}</dt>
                <dd class="muted" [title]="S.NOT_IN_PROFILE_API">—</dd>
              </div>
              <div class="kv-row">
                <dt>{{ S.FARMING_METHOD }}</dt>
                <dd class="muted" [title]="S.NOT_IN_PROFILE_API">—</dd>
              </div>
              <div class="kv-row">
                <dt>{{ S.TOTAL_LAND_AREA }}</dt>
                <dd [title]="S.TOTAL_LAND_AREA_HINT">
                  <ng-container *ngIf="totalArea() !== null; else dash">
                    {{ totalArea() | number: '1.0-2' }}{{ S.UNIT_ACRES }}
                  </ng-container>
                </dd>
              </div>
              <div class="kv-row">
                <dt>{{ S.ZONE }}</dt>
                <dd>{{ f.zone?.name ?? '—' }}</dd>
              </div>
              <div class="kv-row">
                <dt>{{ S.VILLAGE }}</dt>
                <dd>{{ f.address.village ?? primary()?.village ?? '—' }}</dd>
              </div>
              <div class="kv-row">
                <dt>{{ S.REGISTRATION_DATE }}</dt>
                <dd>{{ f.createdAt | date: 'd MMM y' }}</dd>
              </div>
            </dl>
          </section>

          <!-- Land & Plot Details -->
          <section class="tohfa-card">
            <div class="card-head">
              <h2 class="card-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">landscape</span>{{ S.LAND_PLOT_DETAILS }}
              </h2>
              <div class="card-tools">
                <button type="button" class="tohfa-btn tohfa-btn-primary btn-sm" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
                  <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD_PLOT }}
                </button>
                <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-sm" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
                  <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT_PLOTS }}
                </button>
              </div>
            </div>
            <tohfa-data-table [embedded]="true" [columns]="locationColumns" [rows]="locationRows()" [emptyMessage]="S.PLOTS_EMPTY">
              <ng-template tohfaCell="name" let-row>
                <span class="strong">{{ row.name }}</span>
                <span
                  *ngIf="row.isPrimary"
                  class="material-symbols-outlined primary-mark"
                  [title]="S.PRIMARY_LOCATION"
                  [attr.aria-label]="S.PRIMARY_LOCATION"
                  >star</span
                >
              </ng-template>
              <ng-template tohfaCell="fmb" let-row>
                <span class="tohfa-badge tohfa-badge-sm" [ngClass]="row.fmb ? 'tohfa-badge-success' : 'tohfa-badge-neutral'">
                  {{ row.fmb ? S.FMB_RECORDED : S.FMB_MISSING }}
                </span>
              </ng-template>
              <ng-template tohfaCell="actions">
                <span class="row-actions">
                  <button type="button" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET" [attr.aria-label]="S.ACTION_VIEW_PLOT">
                    <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>
                  </button>
                  <button type="button" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET" [attr.aria-label]="S.ACTION_EDIT_PLOT">
                    <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>
                  </button>
                </span>
              </ng-template>
            </tohfa-data-table>
          </section>
        </div>

        <div class="col">
          <!-- FMB Sketch -->
          <section class="tohfa-card">
            <div class="card-head">
              <h2 class="card-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">map</span>{{ S.FMB_SKETCH }}
              </h2>
              <div class="card-tools">
                <ng-container *ngIf="fmbDocument()?.readUrl as url; else noDocTools">
                  <a class="tohfa-btn tohfa-btn-secondary btn-sm" [href]="url" target="_blank" rel="noopener noreferrer">
                    <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.BTN_VIEW }}
                  </a>
                  <a class="tohfa-btn tohfa-btn-secondary btn-sm" [href]="url" download target="_blank" rel="noopener noreferrer">
                    <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_DOWNLOAD }}
                  </a>
                </ng-container>
                <ng-template #noDocTools>
                  <button type="button" class="tohfa-btn tohfa-btn-secondary btn-sm" aria-disabled="true" [title]="fmbUnavailableHint()">
                    <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.BTN_VIEW }}
                  </button>
                  <button type="button" class="tohfa-btn tohfa-btn-secondary btn-sm" aria-disabled="true" [title]="fmbUnavailableHint()">
                    <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_DOWNLOAD }}
                  </button>
                </ng-template>
              </div>
            </div>
            <!-- The profile API reports only whether a boundary exists, not its polygon. -->
            <div class="sketch">
              <span class="material-symbols-outlined icon" aria-hidden="true">polyline</span>
              <span class="sketch-title">{{ S.FMB_GEOMETRY_UNAVAILABLE }}</span>
              <span>{{ S.fmbBoundaryCount(boundaryCount(), f.landLocations.length) }}</span>
            </div>
            <div class="sketch-foot">
              <span>{{ S.SURVEY_NO }}{{ primary()?.surveyNumber ?? '—' }}</span>
              <a
                *ngIf="fmbDocument()?.readUrl as url; else noDocButton"
                class="tohfa-btn tohfa-btn-primary btn-sm"
                [href]="url"
                target="_blank"
                rel="noopener noreferrer"
                >{{ S.BTN_VIEW_FMB }}</a
              >
              <ng-template #noDocButton>
                <button type="button" class="tohfa-btn tohfa-btn-primary btn-sm" aria-disabled="true" [title]="fmbUnavailableHint()">
                  {{ S.BTN_VIEW_FMB }}
                </button>
              </ng-template>
            </div>
          </section>

          <!-- Farm Location -->
          <section class="tohfa-card">
            <div class="card-head">
              <h2 class="card-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ S.FARM_LOCATION }}
              </h2>
              <button type="button" class="tohfa-btn tohfa-btn-secondary btn-sm" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
                <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT }}
              </button>
            </div>
            <p class="address" *ngIf="addressLines().length > 0; else noAddress">
              <ng-container *ngFor="let line of addressLines(); let last = last">{{ line }}<br *ngIf="!last" /></ng-container>
            </p>
            <ng-template #noAddress><p class="address muted">{{ S.LOCATION_EMPTY }}</p></ng-template>
            <div class="map" role="img" [attr.aria-label]="S.MAP_PLACEHOLDER">
              <span class="material-symbols-outlined pin" aria-hidden="true">location_on</span>
              <span class="coords">
                <span class="material-symbols-outlined icon" aria-hidden="true">my_location</span>
                {{ primary()?.centroid ? S.latLng(primary()!.centroid!.lat, primary()!.centroid!.lng) : S.NO_COORDINATES }}
              </span>
            </div>
          </section>
        </div>

        <div class="col">
          <!-- Farm Summary -->
          <section class="tohfa-card">
            <div class="card-head">
              <h2 class="card-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">bar_chart</span>{{ S.FARM_SUMMARY }}
              </h2>
            </div>
            <div class="tiles">
              <div class="tile">
                <span class="tile-val">{{ f.landLocations.length }}</span>
                <span class="tile-label">{{ S.STAT_PLOTS }}</span>
              </div>
              <div class="tile" [title]="S.NOT_AVAILABLE_YET">
                <span class="tile-val muted">—</span>
                <span class="tile-label">{{ S.STAT_ACTIVE_CROPS }}</span>
              </div>
              <div class="tile" [title]="S.NOT_AVAILABLE_YET">
                <span class="tile-val muted">—</span>
                <span class="tile-label">{{ S.STAT_SOIL_RECORDS }}</span>
              </div>
              <div class="tile">
                <span class="tile-val date" [class.muted]="!lastUpdated()">
                  {{ lastUpdated() ? (lastUpdated() | date: 'd MMM y') : '—' }}
                </span>
                <span class="tile-label">{{ S.STAT_LAST_UPDATED }}</span>
              </div>
            </div>
          </section>

          <!-- Recent Profile Activity -->
          <section class="tohfa-card">
            <div class="card-head">
              <h2 class="card-title">
                <span class="material-symbols-outlined icon" aria-hidden="true">history</span>{{ S.RECENT_ACTIVITY }}
              </h2>
            </div>
            <p class="card-empty" *ngIf="!canViewActivity()">{{ S.ACTIVITY_NO_ACCESS }}</p>
            <ng-container *ngIf="canViewActivity()">
              <ol class="timeline" *ngIf="activity().length > 0; else noActivity">
                <li class="event" *ngFor="let e of activity()">
                  <span class="dot dot-{{ toneOf(e) }}" aria-hidden="true"></span>
                  <div>
                    <div class="event-title">{{ titleOf(e) }}</div>
                    <div class="event-desc" *ngIf="describe(e) as d">{{ d }}</div>
                    <div class="event-at">{{ e.at | date: 'dd MMM y, hh:mm a' }}</div>
                  </div>
                </li>
              </ol>
              <ng-template #noActivity><p class="card-empty">{{ S.ACTIVITY_EMPTY }}</p></ng-template>
            </ng-container>
          </section>
        </div>
      </section>

      <ng-template #tabShell>
        <tohfa-farmer-soil-tab
          *ngIf="tab() === 'soil'; else tabProduce"
          role="tabpanel"
          id="panel-soil"
          aria-labelledby="tab-soil"
          [farmerId]="f.id"
          [farmer]="f"
        />
        <ng-template #tabProduce>
          <div *ngIf="tab() === 'produce'; else tabKyc" role="tabpanel" id="panel-produce" aria-labelledby="tab-produce">
            <tohfa-farmer-listings-tab [farmerId]="f.id" />
          </div>
        </ng-template>
        <ng-template #tabKyc>
          <div *ngIf="tab() === 'kyc'; else tabRatings" role="tabpanel" id="panel-kyc" aria-labelledby="tab-kyc">
            <tohfa-farmer-kyc-tab [farmerId]="f.id" [farmer]="f"></tohfa-farmer-kyc-tab>
          </div>
        </ng-template>
        <ng-template #tabRatings>
          <div *ngIf="tab() === 'ratings'; else tabSubscription" role="tabpanel" id="panel-ratings" aria-labelledby="tab-ratings">
            <tohfa-farmer-ratings-tab [farmerName]="f.fullName" />
          </div>
        </ng-template>
        <ng-template #tabSubscription>
          <div *ngIf="tab() === 'subscription'; else tabVerification" role="tabpanel" id="panel-subscription" aria-labelledby="tab-subscription">
            <tohfa-farmer-subscription-tab [farmerName]="f.fullName" />
          </div>
        </ng-template>
        <ng-template #tabVerification>
          <div *ngIf="tab() === 'verification'; else tabAudit" role="tabpanel" id="panel-verification" aria-labelledby="tab-verification">
            <tohfa-farmer-verification-tab [farmerName]="f.fullName" />
          </div>
        </ng-template>
        <ng-template #tabAudit>
          <div *ngIf="tab() === 'audit'; else tabRecords" role="tabpanel" id="panel-audit" aria-labelledby="tab-audit">
            <tohfa-farmer-audit-tab [farmerName]="f.fullName" />
          </div>
        </ng-template>
        <ng-template #tabRecords>
          <div *ngIf="tab() === 'records'; else tabHistory" role="tabpanel" id="panel-records" aria-labelledby="tab-records">
            <tohfa-farmer-records-tab [farmerName]="f.fullName" [farmerCode]="f.tohfaFarmerId" />
          </div>
        </ng-template>
        <ng-template #tabHistory>
          <div *ngIf="tab() === 'history'; else tabPayout" role="tabpanel" id="panel-history" aria-labelledby="tab-history">
            <tohfa-farmer-history-tab [farmerName]="f.fullName" />
          </div>
        </ng-template>
        <ng-template #tabPayout>
          <div *ngIf="tab() === 'payout'" role="tabpanel" id="panel-payout" aria-labelledby="tab-payout">
            <tohfa-farmer-payout-tab [farmerName]="f.fullName" />
          </div>
        </ng-template>
      </ng-template>
    </ng-container>

    <ng-template #dash><span class="muted">—</span></ng-template>

    <!-- Status change dialog: POST /admin/farmers/{id}/status requires a reason. -->
    <div class="tohfa-dialog-scrim" *ngIf="dialog() as d" (click)="closeDialog()">
      <div
        class="tohfa-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        (click)="$event.stopPropagation()"
      >
        <h2 class="dialog-title" id="status-dialog-title">{{ d.title }}</h2>
        <p class="dialog-body">{{ d.body }}</p>
        <label class="field">
          <span class="tohfa-label tohfa-label-required">{{ S.DIALOG_REASON }}</span>
          <textarea
            #reasonInput
            class="tohfa-input"
            rows="3"
            [maxLength]="reasonMax"
            [(ngModel)]="reason"
          ></textarea>
          <span class="hint">{{ S.DIALOG_REASON_HINT }}</span>
        </label>
        <label class="field">
          <span class="tohfa-label">{{ S.DIALOG_NOTE }}</span>
          <textarea class="tohfa-input" rows="2" [maxLength]="noteMax" [(ngModel)]="note"></textarea>
        </label>
        <div class="dialog-actions">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="closeDialog()">{{ S.DIALOG_CANCEL }}</button>
          <button
            type="button"
            class="tohfa-btn"
            [ngClass]="d.action === 'DEACTIVATE' ? 'tohfa-btn-danger-l' : 'tohfa-btn-primary-l'"
            [disabled]="reason.trim().length < reasonMin || saving()"
            (click)="confirmStatus(d)"
          >
            {{ d.confirm }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerDetailComponent implements OnInit {
  private readonly service = inject(FarmersService);
  private readonly rbac = inject(RbacService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('reasonInput') private reasonInput?: ElementRef<HTMLTextAreaElement>;

  readonly S = S;
  readonly reasonMin = REASON_MIN;
  readonly reasonMax = REASON_MAX;
  readonly noteMax = NOTE_MAX;

  readonly tabs: ReadonlyArray<{ id: TabId; label: string }> = [
    { id: 'farm', label: S.TAB_FARM_LAND },
    { id: 'soil', label: S.TAB_SOIL },
    { id: 'produce', label: S.TAB_PRODUCE_LISTING },
    { id: 'kyc', label: S.TAB_KYC },
    { id: 'ratings', label: S.TAB_RATINGS },
    { id: 'subscription', label: S.TAB_SUBSCRIPTION },
    { id: 'verification', label: S.TAB_VERIFICATION },
    { id: 'audit', label: S.TAB_AUDIT },
    { id: 'records', label: S.TAB_FARMER_RECORDS },
    { id: 'history', label: S.TAB_HISTORY },
    { id: 'payout', label: S.TAB_PAYOUT },
  ];

  readonly locationColumns: readonly Column[] = [
    { key: 'name', header: S.COL_PLOT },
    { key: 'surveyNumber', header: S.COL_SURVEY_NO },
    {
      key: 'areaAcres',
      header: S.COL_AREA,
      format: (v) => (typeof v === 'number' ? `${v.toFixed(2)}${S.UNIT_AC}` : '—'),
    },
    { key: 'zones', header: S.COL_ZONES },
    { key: 'fmb', header: S.COL_FMB },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  // ---------- Permissions (UI courtesy; the API re-checks each one) ----------
  readonly canEdit = computed(() => this.rbac.can('farmer.profile.edit'));
  readonly canReactivate = computed(() => this.canEdit() && this.rbac.can('farmer.account.reactivate'));
  readonly canViewDocuments = computed(() => this.rbac.can('farmer.document.view'));
  readonly canViewActivity = computed(() => this.rbac.can('auditlog.view'));

  // ---------- State ----------
  readonly state = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
  readonly farmer = signal<AdminFarmerDetail | null>(null);
  readonly documents = signal<AdminFarmerDocument[]>([]);
  readonly activity = signal<AuditLogEntry[]>([]);
  readonly tab = signal<TabId>('farm');
  readonly dialog = signal<StatusDialog | null>(null);
  readonly saving = signal(false);
  readonly actionError = signal<string | null>(null);
  reason = '';
  note = '';

  private farmerId = '';

  // ---------- Derived view data ----------
  readonly avatar = computed(() => initials(this.farmer()?.fullName ?? ''));
  readonly mobile = computed(() => formatMobile(this.farmer()?.mobile ?? ''));
  readonly accountBadge = computed(() => STATUS_BADGE[this.farmer()?.accountStatus ?? 'PENDING']);
  readonly kycBadge = computed(() => KYC_BADGE[this.farmer()?.kycStatus ?? 'PENDING']);
  readonly certBadge = computed(() => {
    const f = this.farmer();
    return f ? certificationBadge(f.certificationSummary) : { label: '—', tone: 'neutral' as BadgeTone };
  });
  readonly primary = computed(() => {
    const f = this.farmer();
    return f ? primaryLocation(f) : null;
  });

  /** Sum of the measured parcels; null when no parcel has an area. Never the application's stated total. */
  readonly totalArea = computed(() => {
    const areas = (this.farmer()?.landLocations ?? []).map((l) => l.areaAcres).filter((a): a is number => a !== null);
    return areas.length === 0 ? null : areas.reduce((sum, a) => sum + a, 0);
  });

  readonly boundaryCount = computed(() => (this.farmer()?.landLocations ?? []).filter((l) => l.hasBoundary).length);

  readonly locationRows = computed<LocationRow[]>(() =>
    (this.farmer()?.landLocations ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      isPrimary: l.isPrimary,
      surveyNumber: l.surveyNumber,
      areaAcres: l.areaAcres,
      zones: l.plots.length,
      fmb: l.hasBoundary,
      actions: null,
    })),
  );

  readonly addressLines = computed(() => {
    const l = this.primary();
    if (!l) return [];
    const place = [l.village, l.taluk, l.district].filter((p): p is string => p !== null && p.trim() !== '');
    return [l.address, place.join(', ')].filter((p): p is string => p !== null && p.trim() !== '');
  });

  /** The farm document (FARM_DOC, step 4's mandatory farm record) with a live signed URL. */
  readonly fmbDocument = computed(() => this.documents().find((d) => d.docType === 'FARM_DOC' && d.readUrl !== null) ?? null);
  readonly fmbUnavailableHint = computed(() => (this.canViewDocuments() ? S.FMB_NO_DOCUMENT : S.ACTION_NOT_PERMITTED));

  readonly lastUpdated = computed(() => this.activity()[0]?.at ?? null);

  readonly menuItems = computed<MenuItem[]>(() => {
    const status = this.farmer()?.accountStatus;
    const deactivateHint = !this.canEdit()
      ? S.ACTION_NOT_PERMITTED
      : status !== 'ACTIVE'
        ? S.ACTION_NOT_APPLICABLE
        : undefined;
    const reactivateHint = !this.canReactivate()
      ? S.ACTION_NOT_PERMITTED
      : status !== 'DISABLED'
        ? S.ACTION_NOT_APPLICABLE
        : undefined;
    return [
      { id: 'deactivate', label: S.ACTION_DEACTIVATE, icon: 'pause_circle', tone: 'default', group: 1, disabled: deactivateHint !== undefined, hint: deactivateHint },
      { id: 'reactivate', label: S.ACTION_REACTIVATE, icon: 'play_circle', tone: 'success', group: 1, disabled: reactivateHint !== undefined, hint: reactivateHint },
      { id: 'terminate', label: S.ACTION_TERMINATE, icon: 'delete', tone: 'danger', group: 1, disabled: true, hint: S.NOT_AVAILABLE_YET },
      { id: 'block-listing', label: S.ACTION_BLOCK_LISTING, icon: 'block', tone: 'default', group: 2, disabled: true, hint: S.NOT_AVAILABLE_YET },
      { id: 'unblock-listing', label: S.ACTION_UNBLOCK_LISTING, icon: 'check_circle', tone: 'success', group: 2, disabled: true, hint: S.NOT_AVAILABLE_YET },
      { id: 'lock', label: S.ACTION_LOCK, icon: 'lock', tone: 'default', group: 3, disabled: true, hint: S.NOT_AVAILABLE_YET },
      { id: 'unlock', label: S.ACTION_UNLOCK, icon: 'lock_open', tone: 'default', group: 3, disabled: true, hint: S.NOT_AVAILABLE_YET },
    ];
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.farmerId = params.get('id') ?? '';
      this.tab.set('farm');
      this.load();
    });
  }

  load(): void {
    this.state.set('loading');
    this.farmer.set(null);
    this.documents.set([]);
    this.activity.set([]);
    this.actionError.set(null);

    this.service.get(this.farmerId).subscribe({
      next: (f) => {
        this.farmer.set(f);
        this.state.set('ready');
      },
      // 404 is also how the API answers an out-of-scope farmer; 422 is a malformed id.
      error: (err: HttpErrorResponse) => this.state.set(err.status === 404 || err.status === 422 ? 'missing' : 'error'),
    });

    if (this.canViewDocuments()) {
      this.service.documents(this.farmerId).subscribe({
        next: (res) => this.documents.set(res.items),
        error: () => this.documents.set([]),
      });
    }
    this.loadActivity();
  }

  onTabKey(event: KeyboardEvent): void {
    const index = this.tabs.findIndex((t) => t.id === this.tab());
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % this.tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + this.tabs.length) % this.tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = this.tabs.length - 1;
    else return;
    event.preventDefault();
    const id = this.tabs[next]!.id;
    this.tab.set(id);
    setTimeout(() => document.getElementById(`tab-${id}`)?.focus());
  }

  onAction(id: string): void {
    this.actionError.set(null);
    if (id === 'deactivate') {
      this.openDialog({
        action: 'DEACTIVATE',
        title: S.DIALOG_DEACTIVATE_TITLE,
        body: S.DIALOG_DEACTIVATE_BODY,
        confirm: S.DIALOG_CONFIRM_DEACTIVATE,
      });
    } else if (id === 'reactivate') {
      this.openDialog({
        action: 'ACTIVATE',
        title: S.DIALOG_REACTIVATE_TITLE,
        body: S.DIALOG_REACTIVATE_BODY,
        confirm: S.DIALOG_CONFIRM_REACTIVATE,
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog() !== null && !this.saving()) this.closeDialog();
  }

  closeDialog(): void {
    this.dialog.set(null);
  }

  confirmStatus(d: StatusDialog): void {
    const reason = this.reason.trim();
    if (reason.length < REASON_MIN || this.saving()) return;
    const note = this.note.trim();
    this.saving.set(true);
    this.service
      .updateStatus(this.farmerId, { action: d.action, reason, ...(note !== '' ? { note } : {}) })
      .subscribe({
        next: (f) => {
          this.saving.set(false);
          this.farmer.set(f);
          this.dialog.set(null);
          this.loadActivity();
        },
        error: () => {
          this.saving.set(false);
          this.dialog.set(null);
          this.actionError.set(S.STATUS_CHANGE_ERROR);
        },
      });
  }

  titleOf(e: AuditLogEntry): string {
    return S.ACTIVITY_TITLES[e.action] ?? e.action;
  }

  describe(e: AuditLogEntry): string {
    if (e.changedFields !== null && e.changedFields.length > 0) return S.activityChanged(e.changedFields);
    return e.actorRole !== null ? S.activityBy(e.actorRole) : '';
  }

  toneOf(e: AuditLogEntry): ActivityTone {
    return activityTone(e.action);
  }

  private openDialog(d: StatusDialog): void {
    this.reason = '';
    this.note = '';
    this.dialog.set(d);
    setTimeout(() => this.reasonInput?.nativeElement.focus());
  }

  private loadActivity(): void {
    if (!this.canViewActivity()) return;
    this.service.activity(this.farmerId, ACTIVITY_LIMIT).subscribe({
      next: (res) => this.activity.set(res.items),
      error: () => this.activity.set([]),
    });
  }
}
