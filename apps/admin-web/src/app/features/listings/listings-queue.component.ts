import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

export type ProduceViewMode =
  | 'calendar'
  | 'breakdown'
  | 'crop_detail'
  | 'forecast_insights'
  | 'crop_data'
  | 'crop_compare'
  | 'add_activity_category'
  | 'create_event'
  | 'product_listings'
  | 'listing_farmer_detail';
export type CropDetailTab = 'Overview' | 'Schedule' | 'Growth history' | 'Nutrients' | 'Nutrition' | 'Harvest' | 'Crop history' | 'Related';
export type CropDataTab = 'crop_types' | 'diary_activity' | 'platform_events';

export interface CropTypeItem {
  id: number;
  cropId: string;
  name: string;
  localName: string;
  category: 'Vegetable' | 'Fruit' | 'Spice' | 'Other';
  status: 'Active' | 'Inactive';
  createdBy: string;
  lastUpdated: string;
  defaultDurationDays?: number;
  expectedYieldPerAcre?: string;
}

export interface DiaryActivityItem {
  id: number;
  activityCode: string;
  categoryName: string;
  subActivityCount: number;
  description: string;
  status: 'Active' | 'Retired';
  createdBy: string;
  lastUpdated: string;
}

export interface PlatformEventItem {
  id: number;
  eventId: string;
  eventTitle: string;
  eventType: string;
  start: string;
  end: string;
  targetAudience: string;
  status: 'Draft' | 'Published' | 'Upcoming';
  createdBy: string;
  lastUpdated: string;
}

export interface CropCompareItem {
  id: number;
  cropSeason: string;
  cropRecordId: string;
  farmerIdName: string;
  zone: string;
  plotId: string;
  plantingDate: string;
  harvestDate: string;
  recordedQuantity: string;
  source: string;
  status: string;
  yieldPerAcre?: string;
  cycleDays?: number;
  selected?: boolean;
}

export interface ForecastCropRecord {
  id: number;
  cropFarmer: string;
  zonePlot: string;
  plantingDate: string;
  currentStage: string;
  expectedHarvest: string;
  expectedHarvestSub?: string;
  actualHarvest: string;
  actualHarvestSub?: string;
  expectedQuantity: string;
  expectedQuantitySub?: string;
  lastUpdated: string;
  status: string;
}

export interface CalendarDayCell {
  day: number | null;
  hasGrowthStage?: boolean;
  hasPlanting?: boolean;
  hasExpectedHarvest?: boolean;
  hasPastHarvest?: boolean;
  isSelected?: boolean;
}

export interface CropRecord {
  id: number;
  farmName: string;
  crop: string;
  zone: string;
  plotNo: string;
  plantingDate: string;
  growthStage: string;
  expectedHarvest: string;
  progress: number;
  status: 'Growing' | 'Maturing' | 'Harvested';
}

export interface FarmerCropItem {
  id: number;
  crop: string;
  cropRecord: string;
  category: string;
  zonePlot: string;
  plantingDate: string;
  expectedHarvest: string;
  currentStage: string;
  status: 'Harvest' | 'Growing' | 'Planned';
}

@Component({
  selector: 'tohfa-listings-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Poppins', sans-serif;
        color: var(--tohfa-ink, #1D2420);
        padding-bottom: 40px;
      }

      /* Top Header */
      .page-header {
        margin-bottom: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .page-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .page-title {
        font-size: 18px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .page-subtitle {
        font-size: 11.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 2px 0 0 0;
      }

      .btn-back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-ink, #1D2420);
        font-size: 11.5px;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-back-link:hover {
        background: #FAF8F5;
        border-color: var(--tohfa-amber, #E48932);
      }

      /* 4 Top Stat Cards */
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 22px;
      }

      .stat-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .stat-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: #FAF2EB;
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon-wrap.danger {
        background: #FDECEC;
        color: var(--err, #B3261E);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-label {
        font-size: 11px;
        color: var(--tohfa-slate, #5C6B63);
        font-weight: 500;
        line-height: 1.25;
      }

      .stat-val {
        font-size: 22px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin-top: 2px;
        line-height: 1.1;
      }

      .stat-val-text {
        font-size: 14px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin-top: 2px;
      }

      /* White Content Box */
      .content-box {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 20px 24px;
        margin-bottom: 22px;
      }

      /* Calendar Header & Controls */
      .cal-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 16px;
      }

      .cal-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .cal-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--tohfa-slate, #5C6B63);
        padding: 4px 8px;
        font-size: 13px;
      }
      .cal-btn:hover {
        color: var(--tohfa-ink, #1D2420);
      }

      .cal-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-size: 10.5px;
        font-weight: 700;
        color: var(--tohfa-slate, #5C6B63);
        margin-bottom: 8px;
      }

      .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
      }

      .cal-cell {
        min-height: 52px;
        border: 1px solid #ECE8DD;
        border-radius: 8px;
        padding: 6px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        background: #ffffff;
        transition: all 0.15s ease;
      }

      .cal-cell:hover {
        border-color: var(--tohfa-amber, #E48932);
      }

      .cal-cell.selected {
        border: 1.5px solid var(--tohfa-amber, #E48932);
      }

      .cal-cell.empty {
        border: none;
        background: transparent;
        cursor: default;
      }

      .cal-day-num {
        font-size: 11px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .cal-dots-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        min-height: 8px;
      }

      .dot-planting {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #2563EB;
      }

      .dot-growth {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
      }

      .dot-exp-harvest {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        border: 1.5px solid var(--ok, #1E8E5A);
        background: transparent;
      }

      .dot-past-harvest {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ok, #1E8E5A);
      }

      /* Legend */
      .cal-legend {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-top: 14px;
        font-size: 11px;
        color: var(--tohfa-slate, #5C6B63);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* Search Bar */
      .search-box {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 9px 16px;
        margin: 20px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .search-input-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }

      .search-input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 12px;
        color: var(--tohfa-ink, #1D2420);
        font-family: inherit;
      }

      .search-input::placeholder {
        color: #9CA3AF;
      }

      .filter-icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        padding: 2px;
      }

      /* Tables */
      .table-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 24px;
      }

      .custom-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11.5px;
      }

      .custom-table th {
        background: #FAF4EC;
        text-align: left;
        padding: 10px 16px;
        font-size: 9.5px;
        font-weight: 700;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .custom-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #F0ECE4;
        color: var(--tohfa-ink, #1D2420);
      }

      .custom-table tr:last-child td {
        border-bottom: none;
      }

      .badge-recorded {
        background: #E8F7EE;
        color: var(--ok, #1E8E5A);
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-growing {
        background: #E8F7EE;
        color: var(--ok, #1E8E5A);
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-harvest {
        background: #FEF3C7;
        color: #B45309;
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-planned {
        background: #EFF6FF;
        color: #1D4ED8;
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-maturing {
        background: #FEF3C7;
        color: #B45309;
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-harvested-blue {
        background: #EFF6FF;
        color: #1D4ED8;
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .btn-eye {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--tohfa-slate, #5C6B63);
        display: inline-flex;
        align-items: center;
        padding: 2px;
      }
      .btn-eye:hover {
        color: var(--tohfa-amber, #E48932);
      }

      /* Quick Actions */
      .qa-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        padding: 18px 20px;
      }

      .qa-title {
        font-size: 13.5px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 14px 0;
      }

      .qa-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
      }

      .qa-item {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 18px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .qa-item:hover {
        border-color: var(--tohfa-amber, #E48932);
        box-shadow: 0 4px 12px rgba(228, 137, 50, 0.12);
        transform: translateY(-1px);
      }

      .qa-icon {
        color: var(--tohfa-amber, #E48932);
      }

      .qa-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.25;
      }

      /* HARVEST FORECAST & INSIGHTS VIEW */
      .segmented-forecast-tabs {
        display: inline-flex;
        background: #F4F1EA;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 8px;
        padding: 3px;
        gap: 3px;
      }

      .seg-forecast-btn {
        border: none;
        background: transparent;
        padding: 6px 16px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .seg-forecast-btn.active {
        background: var(--tohfa-amber, #E48932);
        color: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .forecast-filter-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .time-filter-pills {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .time-pill-btn {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        background: #ffffff;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 10.5px;
        font-weight: 600;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .time-pill-btn.active {
        background: var(--tohfa-amber, #E48932);
        border-color: var(--tohfa-amber, #E48932);
        color: #ffffff;
      }

      .forecast-table th {
        font-size: 10.5px;
        color: var(--tohfa-slate, #5C6B63);
        font-weight: 700;
        padding: 10px 12px;
      }

      .forecast-table td {
        padding: 12px;
        font-size: 11px;
        vertical-align: middle;
      }

      /* CROP DATA & CROP COMPARE STYLES */
      .crop-data-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .crop-data-metric-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .metric-card-lbl {
        font-size: 10px;
        font-weight: 700;
        color: var(--tohfa-slate, #5C6B63);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-card-val {
        font-size: 24px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
      }

      .metric-card-val.green {
        color: var(--ok, #1E8E5A);
      }

      .crop-cat-filter-pills {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .crop-cat-pill-btn {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        background: #ffffff;
        padding: 5px 14px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .crop-cat-pill-btn.active {
        background: var(--tohfa-amber, #E48932);
        border-color: var(--tohfa-amber, #E48932);
        color: #ffffff;
      }

      .action-link-btn {
        background: none;
        border: none;
        padding: 0 4px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }

      .action-link-btn.view {
        color: var(--tohfa-ink, #1D2420);
      }

      .action-link-btn.edit {
        color: var(--tohfa-amber, #E48932);
      }

      .action-link-btn.deactivate {
        color: #DC2626;
      }

      .action-link-btn.activate {
        color: var(--ok, #1E8E5A);
      }

      /* TOHFA Modal Backdrop and Card */
      .tohfa-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(29, 36, 32, 0.45);
        backdrop-filter: blur(2px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .tohfa-modal-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        width: 100%;
        max-width: 540px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }

      .tohfa-modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .tohfa-modal-body {
        padding: 20px;
        max-height: 75vh;
        overflow-y: auto;
      }

      .tohfa-modal-footer {
        padding: 14px 20px;
        border-top: 1px solid var(--tohfa-border, #E4E0D3);
        background: #FCFBF7;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
      }

      .form-group {
        margin-bottom: 14px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .form-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .form-input {
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12px;
        color: var(--tohfa-ink, #1D2420);
        background: #ffffff;
        outline: none;
      }

      .form-input:focus {
        border-color: var(--tohfa-amber, #E48932);
      }

      .compare-dialog-table th {
        background: #FDF3EB;
        font-size: 11px;
        font-weight: 700;
        padding: 10px 14px;
        color: var(--tohfa-ink, #1D2420);
      }

      .compare-dialog-table td {
        padding: 10px 14px;
        font-size: 11.5px;
        border-bottom: 1px solid var(--tohfa-border, #E4E0D3);
      }

      /* BREAKDOWN VIEW */
      .category-section {
        margin: 18px 0 20px 0;
      }

      .category-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 10px 0;
      }

      .category-pills-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }

      .cat-pill {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-ink, #1D2420);
        font-size: 11.5px;
        font-weight: 600;
        padding: 7px 18px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .cat-pill:hover {
        border-color: var(--tohfa-amber, #E48932);
      }

      .cat-pill.active {
        background: var(--tohfa-amber, #E48932);
        border-color: var(--tohfa-amber, #E48932);
        color: #ffffff;
        font-weight: 700;
      }

      /* Progress Bar in Table */
      .prog-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .prog-track {
        width: 60px;
        height: 5px;
        background: #E5E7EB;
        border-radius: 3px;
        overflow: hidden;
      }

      .prog-fill {
        height: 100%;
        background: #2E7D32;
        border-radius: 3px;
      }

      .prog-val {
        font-size: 10.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      /* CROP DETAIL VIEW (Screenshots 1 - 5) */
      .crop-detail-top-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 18px;
        margin-bottom: 22px;
      }

      .kv-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 12px;
      }

      .kv-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .kv-lbl {
        color: var(--tohfa-slate, #5C6B63);
        font-weight: 500;
      }

      .kv-val {
        color: var(--tohfa-ink, #1D2420);
        font-weight: 700;
      }

      .farmer-profile-link {
        color: var(--tohfa-amber, #E48932);
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        margin-top: 14px;
        text-decoration: none;
      }
      .farmer-profile-link:hover {
        text-decoration: underline;
      }

      /* Growth Stages List */
      .stage-step-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-size: 12px;
      }

      .stage-step-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
      }

      .stage-step-left {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--tohfa-ink, #1D2420);
        font-weight: 600;
      }

      .stage-check-icon {
        color: var(--ok, #1E8E5A);
        display: inline-flex;
        align-items: center;
      }

      .stage-step-date {
        color: var(--tohfa-ink, #1D2420);
        font-weight: 700;
        font-size: 11.5px;
      }

      .stage-step-current {
        background: #FDF3EB;
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 4px;
      }

      /* Segmented Mode Pill */
      .stepper-mode-pill {
        display: inline-flex;
        align-items: center;
        background: #F4F1EA;
        border-radius: 20px;
        padding: 2px;
        border: 1px solid var(--tohfa-border, #E4E0D3);
      }

      .stepper-mode-btn {
        border: none;
        background: transparent;
        padding: 3px 10px;
        border-radius: 16px;
        font-size: 10px;
        font-weight: 600;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .stepper-mode-btn.active {
        background: #ffffff;
        color: var(--tohfa-ink, #1D2420);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        font-weight: 700;
      }

      /* Horizontal Stepper */
      .stepper-horizontal-wrap {
        position: relative;
        padding: 10px 0 16px 0;
        margin-top: 6px;
      }

      .stepper-track-line {
        position: absolute;
        top: 23px;
        left: 32px;
        right: 32px;
        height: 2px;
        background: linear-gradient(to right, var(--ok, #1E8E5A) 0%, var(--ok, #1E8E5A) 84%, var(--tohfa-amber, #E48932) 100%);
        z-index: 1;
      }

      .stepper-nodes-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;
        z-index: 2;
      }

      .stepper-node-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        flex: 1;
      }

      .stepper-check-circle {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #ffffff;
        border: 2px solid var(--ok, #1E8E5A);
        color: var(--ok, #1E8E5A);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 0 1px 3px rgba(30, 142, 90, 0.15);
      }

      .stepper-orange-circle {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
        border: 2px solid var(--tohfa-amber, #E48932);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 4px rgba(228, 137, 50, 0.2);
      }

      .stepper-name {
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 9.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        line-height: 1.25;
        max-width: 88px;
        margin: 6px 0 4px 0;
      }

      .stepper-name-orange {
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 9.5px;
        font-weight: 700;
        color: var(--tohfa-amber, #E48932);
        line-height: 1.25;
        max-width: 88px;
        margin: 6px 0 4px 0;
      }

      .stepper-date-chip {
        font-size: 9px;
        color: var(--tohfa-slate, #5C6B63);
        padding: 3px 6px;
        border-radius: 5px;
        background: #F7F5EE;
        border: 1px solid #ECE7DC;
        font-weight: 600;
        white-space: nowrap;
      }

      .stepper-date-orange {
        font-size: 9px;
        color: var(--tohfa-amber, #E48932);
        padding: 3px 6px;
        border-radius: 5px;
        background: #FDF3EB;
        border: 1px solid var(--tohfa-amber, #E48932);
        font-weight: 700;
        white-space: nowrap;
      }

      /* Stage Summary Card below Horizontal Stepper */
      .stepper-stage-card {
        margin-top: 14px;
        background: #FCFBF7;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 12px 14px;
      }

      .stepper-stage-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .badge-stage-pill {
        background: #FDF3EB;
        color: var(--tohfa-amber, #E48932);
        font-size: 9.5px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 10px;
        border: 1px solid rgba(228, 137, 50, 0.3);
      }

      .stepper-stage-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }

      .stage-metric-box {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 6px;
        padding: 6px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .stage-metric-label {
        font-size: 9px;
        color: var(--tohfa-slate, #5C6B63);
        font-weight: 500;
      }

      .stage-metric-val {
        font-size: 11.5px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
      }

      .stepper-progress-bar-wrap {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 6px;
        padding: 8px 10px;
      }

      .progress-bar-track {
        height: 6px;
        background: #EFECE6;
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--ok, #1E8E5A);
        border-radius: 3px;
      }

      .badge-optimal {
        background: #E8F7EE;
        color: var(--ok, #1E8E5A);
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-low {
        background: #FEF3C7;
        color: #B45309;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-good {
        background: #E8F7EE;
        color: var(--ok, #1E8E5A);
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .badge-applied {
        background: #E8F7EE;
        color: var(--ok, #1E8E5A);
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      /* Tab Bar */
      .crop-tab-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .tab-btn {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        color: var(--tohfa-ink, #1D2420);
        font-size: 12px;
        font-weight: 600;
        padding: 8px 22px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .tab-btn:hover {
        border-color: var(--tohfa-amber, #E48932);
      }

      .tab-btn.active {
        background: var(--tohfa-amber, #E48932);
        border-color: var(--tohfa-amber, #E48932);
        color: #ffffff;
        font-weight: 700;
      }

      /* Vertical Timeline in Growth History Tab */
      .timeline-box {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: var(--r-card, 14px);
        padding: 24px;
      }

      .timeline-container {
        position: relative;
        padding-left: 28px;
      }

      .timeline-line {
        position: absolute;
        left: 7px;
        top: 14px;
        bottom: 20px;
        width: 2px;
        background: #E5E7EB;
      }

      .timeline-event {
        position: relative;
        margin-bottom: 20px;
      }

      .tl-dot-active {
        position: absolute;
        left: -28px;
        top: 14px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--tohfa-amber, #E48932);
        z-index: 2;
      }

      .tl-dot-check {
        position: absolute;
        left: -28px;
        top: 10px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        border: 2px solid var(--ok, #1E8E5A);
        z-index: 2;
      }

      .tl-card-highlight {
        background: #FAF2EB;
        border-radius: 8px;
        padding: 14px 18px;
      }

      .tl-card-standard {
        padding: 10px 14px;
      }

      .tl-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .tl-farmer-title {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .tl-stage-badge {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .tl-sub {
        font-size: 11px;
        color: var(--tohfa-slate, #5C6B63);
        margin-top: 3px;
      }

      /* Form Panels for Add Activity Category & Create Event */
      .form-card-panel {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 12px;
        padding: 22px 24px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      }

      .form-card-title {
        font-size: 13.5px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 18px 0;
      }

      .form-grid-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-bottom: 16px;
      }

      .form-grid-4col {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }

      .input-with-action {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .input-with-action input {
        flex: 1;
        height: 38px;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 8px;
        padding: 0 12px;
        font-size: 12px;
        outline: none;
        background: #ffffff;
        color: var(--tohfa-ink, #1D2420);
        box-sizing: border-box;
      }

      .input-with-action input:focus {
        border-color: var(--tohfa-amber, #E48932);
      }

      .btn-input-add {
        height: 38px;
        padding: 0 14px;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 8px;
        background: #FAF9F5;
        font-size: 11.5px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        cursor: pointer;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }

      .btn-input-add:hover {
        background: #F3EFE6;
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
      }

      .form-textarea {
        width: 100%;
        min-height: 85px;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 12px;
        outline: none;
        background: #ffffff;
        color: var(--tohfa-ink, #1D2420);
        resize: vertical;
        box-sizing: border-box;
        font-family: inherit;
      }

      .form-textarea:focus {
        border-color: var(--tohfa-amber, #E48932);
      }

      .btn-dashed-add {
        width: 100%;
        border: 1.5px dashed var(--tohfa-border, #E4E0D3);
        border-radius: 8px;
        padding: 12px;
        background: #FCFBF9;
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        text-align: center;
        margin-top: 14px;
        display: block;
        transition: all 0.15s ease;
      }

      .btn-dashed-add:hover {
        border-color: var(--tohfa-amber, #E48932);
        color: var(--tohfa-amber, #E48932);
        background: #FAF2EB;
      }

      .upload-banner-box {
        border: 1.5px dashed var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 24px;
        text-align: center;
        background: #FAF9F5;
        cursor: pointer;
        margin-bottom: 16px;
        transition: border-color 0.15s ease;
      }

      .upload-banner-box:hover {
        border-color: var(--tohfa-amber, #E48932);
      }

      .filter-bar-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }

      .table-badge-pending {
        background: #FEF3C7;
        color: #B45309;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 10.5px;
        font-weight: 700;
        display: inline-block;
      }

      .table-badge-approved {
        background: #DCFCE7;
        color: #15803D;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 10.5px;
        font-weight: 700;
        display: inline-block;
      }
    `,
  ],
  template: `
    <!-- ========================================================================= -->
    <!-- SCREEN 1: PRODUCE & CROPS MANAGEMENT (Calendar & Activities View)         -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'calendar'">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--tohfa-amber, #E48932);">
              <circle cx="7" cy="17" r="2"></circle>
              <circle cx="17" cy="17" r="2"></circle>
              <path d="M9 17h6"></path>
              <path d="M19 17h1a1 1 0 0 0 1-1v-3.5a1.5 1.5 0 0 0-1.5-1.5H16l-3-6H7a1 1 0 0 0-1 1v6"></path>
              <path d="M5 17H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2"></path>
            </svg>
            <span>Produce & Crops Management</span>
          </h1>
          <p class="page-subtitle">October 2026 · 43 crop records</p>
        </div>
      </div>

      <!-- 4 Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Crop records in view</span>
            <span class="stat-val">43</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Expected harvests this month (forecast)</span>
            <span class="stat-val">3</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Records missing a planting date</span>
            <span class="stat-val">3</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Records needing an update</span>
            <span class="stat-val-text">Rule not defined</span>
          </div>
        </div>
      </div>

      <!-- Calendar Container -->
      <div class="content-box">
        <div class="cal-nav">
          <button type="button" class="cal-btn">&lt;</button>
          <span class="cal-title">October 2026</span>
          <button type="button" class="cal-btn">&gt;</button>
        </div>

        <div class="cal-weekdays">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>

        <div class="cal-grid">
          <div class="cal-cell empty"></div>
          
          <div class="cal-cell selected" (click)="selectDay(1)">
            <span class="cal-day-num">1</span>
            <div class="cal-dots-wrap"><span class="dot-growth"></span></div>
          </div>
          
          <div class="cal-cell" (click)="selectDay(2)"><span class="cal-day-num">2</span><div class="cal-dots-wrap"></div></div>
          
          <div class="cal-cell" (click)="selectDay(3)">
            <span class="cal-day-num">3</span>
            <div class="cal-dots-wrap"><span class="dot-growth"></span></div>
          </div>
          
          <div class="cal-cell" (click)="selectDay(4)"><span class="cal-day-num">4</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(5)"><span class="cal-day-num">5</span><div class="cal-dots-wrap"></div></div>
          
          <div class="cal-cell" (click)="selectDay(6)">
            <span class="cal-day-num">6</span>
            <div class="cal-dots-wrap"><span class="dot-growth"></span></div>
          </div>

          <div class="cal-cell" (click)="selectDay(7)"><span class="cal-day-num">7</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(8)"><span class="cal-day-num">8</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(9)">
            <span class="cal-day-num">9</span>
            <div class="cal-dots-wrap"><span class="dot-growth"></span></div>
          </div>
          <div class="cal-cell" (click)="selectDay(10)"><span class="cal-day-num">10</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(11)"><span class="cal-day-num">11</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(12)"><span class="cal-day-num">12</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(13)"><span class="cal-day-num">13</span><div class="cal-dots-wrap"></div></div>

          <div class="cal-cell selected" (click)="selectDay(14)">
            <span class="cal-day-num">14</span>
            <div class="cal-dots-wrap"><span class="dot-planting"></span></div>
          </div>
          <div class="cal-cell" (click)="selectDay(15)"><span class="cal-day-num">15</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(16)"><span class="cal-day-num">16</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(17)"><span class="cal-day-num">17</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(18)"><span class="cal-day-num">18</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(19)"><span class="cal-day-num">19</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(20)">
            <span class="cal-day-num">20</span>
            <div class="cal-dots-wrap"><span class="dot-exp-harvest"></span></div>
          </div>

          <div class="cal-cell" (click)="selectDay(21)">
            <span class="cal-day-num">21</span>
            <div class="cal-dots-wrap"><span class="dot-exp-harvest"></span></div>
          </div>
          <div class="cal-cell" (click)="selectDay(22)"><span class="cal-day-num">22</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(23)"><span class="cal-day-num">23</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(24)"><span class="cal-day-num">24</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(25)"><span class="cal-day-num">25</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(26)"><span class="cal-day-num">26</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(27)"><span class="cal-day-num">27</span><div class="cal-dots-wrap"></div></div>

          <div class="cal-cell" (click)="selectDay(28)"><span class="cal-day-num">28</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(29)"><span class="cal-day-num">29</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(30)"><span class="cal-day-num">30</span><div class="cal-dots-wrap"></div></div>
          <div class="cal-cell" (click)="selectDay(31)">
            <span class="cal-day-num">31</span>
            <div class="cal-dots-wrap"><span class="dot-exp-harvest"></span></div>
          </div>
        </div>

        <!-- Legend -->
        <div class="cal-legend">
          <div class="legend-item"><span class="dot-planting"></span><span>Planting</span></div>
          <div class="legend-item"><span class="dot-growth"></span><span>Growth stage</span></div>
          <div class="legend-item"><span class="dot-exp-harvest"></span><span>Expected harvest</span></div>
          <div class="legend-item"><span class="dot-past-harvest"></span><span>Past harvest</span></div>
        </div>
      </div>

      <!-- Search Input -->
      <div class="search-box">
        <div class="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-input" placeholder="Search common or scientific name" [(ngModel)]="searchQuery" />
        </div>
        <button type="button" class="filter-icon-btn" title="Filter options">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
        </button>
      </div>

      <!-- 1 Oct 2026 Heading -->
      <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 12px 0;">1 Oct 2026</h3>

      <!-- Activities Table -->
      <div class="table-card">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Activity Type</th>
              <th>Crop</th>
              <th>Farmer</th>
              <th>Zone</th>
              <th>Plot ID</th>
              <th>Activity Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
                  <span class="dot-growth"></span>
                  <span>Crop development</span>
                </span>
              </td>
              <td><strong>Potato</strong></td>
              <td>Selvi</td>
              <td>Coonoor</td>
              <td>PLT-00131-1</td>
              <td>1 Oct 2026</td>
              <td><span class="badge-recorded">Recorded</span></td>
              <td>
                <button type="button" class="btn-eye" (click)="openCropDetail('Tomato · CR-2026-0017', 'Ramesh Kumar Farm')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
                  <span class="dot-planting"></span>
                  <span>Planting</span>
                </span>
              </td>
              <td><strong>Cabbage</strong></td>
              <td>Arun</td>
              <td>Ooty</td>
              <td>PLT-00215-2</td>
              <td>1 Oct 2026</td>
              <td><span class="badge-recorded">Recorded</span></td>
              <td>
                <button type="button" class="btn-eye" (click)="openCropDetail('Cabbage · CR-2026-0018', 'Arun Farm')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Quick Actions -->
      <div class="qa-card">
        <h4 class="qa-title">Quick actions</h4>
        <div class="qa-grid">
          <div class="qa-item" (click)="openBreakdown()">
            <div class="qa-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 1 10 10h-10z"></path>
              </svg>
            </div>
            <span class="qa-label">Zone & Crop Breakdown</span>
          </div>

          <div class="qa-item" (click)="openForecastInsights('forecast')">
            <div class="qa-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <span class="qa-label">Harvest Forecast & Crop Insights</span>
          </div>

          <div class="qa-item" (click)="openCropHistory()">
            <div class="qa-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 8 14"></polyline>
              </svg>
            </div>
            <span class="qa-label">Crop History & Records</span>
          </div>

          <div class="qa-item" (click)="openCropData()">
            <div class="qa-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <span class="qa-label">Crop Data</span>
          </div>

          <div class="qa-item" (click)="openCropCompare()">
            <div class="qa-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 3h5v5"></path>
                <path d="M4 20L21 3"></path>
                <path d="M21 16v5h-5"></path>
                <path d="M15 15l6 6"></path>
                <path d="M4 4l5 5"></path>
              </svg>
            </div>
            <span class="qa-label">Crop Compare</span>
          </div>

          <div class="qa-item" (click)="currentView.set('product_listings')">
            <div class="qa-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </div>
            <span class="qa-label">Produce list</span>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 2: ZONE & CROP BREAKDOWN                                           -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'breakdown'">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('calendar')">
            ← Back to Calendar
          </button>
          <h1 class="page-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--tohfa-amber, #E48932);">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span>Zone & Crop Breakdown</span>
          </h1>
        </div>
        <button type="button" class="filter-icon-btn" style="border: 1px solid var(--tohfa-border, #E4E0D3); padding: 6px 10px; border-radius: 8px; background: #ffffff;" title="Filters">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
        </button>
      </div>

      <!-- 4 Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">18</span>
            <span class="stat-label">Farms with crop records</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">4</span>
            <span class="stat-label">Zones with active plans</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22c5.523 0 10-4.477 10-10a10 10 0 0 0-10-10S7 7 7 12a5 5 0 0 0 5 10z"></path>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">27</span>
            <span class="stat-label">Crops in growth stages</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-val" style="font-size: 19px;">6 <span style="font-size: 12px; font-weight: 500; color: #6B7280;">(2 excluded)</span></span>
            <span class="stat-label">Expected harvests in 30 days</span>
          </div>
        </div>
      </div>

      <!-- Crops Category -->
      <div class="category-section">
        <h4 class="category-title">Crops category</h4>
        <div class="category-pills-row">
          <button type="button" class="cat-pill active">Horticultural</button>
          <button type="button" class="cat-pill">Cash and Commercial</button>
          <button type="button" class="cat-pill">Oilseed</button>
          <button type="button" class="cat-pill">Pulses</button>
        </div>
        <div class="category-pills-row">
          <button type="button" class="cat-pill active">Vegetables</button>
          <button type="button" class="cat-pill">Fruits</button>
          <button type="button" class="cat-pill">Spices & Condiments</button>
        </div>
      </div>

      <!-- Crop Records Section -->
      <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 24px 0 12px 0; display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
        <span>Crop records</span>
      </h3>

      <!-- 10 Rows Table -->
      <div class="table-card">
        <table class="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Farm Name</th>
              <th>Crop</th>
              <th>Zone</th>
              <th>Plot No.</th>
              <th>Planting Date</th>
              <th>Growth Stage</th>
              <th>Expected Harvest</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of cropRecords">
              <td style="color: #6B7280; font-weight: 600;">{{ row.id }}</td>
              <td><strong>{{ row.farmName }}</strong></td>
              <td>{{ row.crop }}</td>
              <td>{{ row.zone }}</td>
              <td>{{ row.plotNo }}</td>
              <td>{{ row.plantingDate }}</td>
              <td>{{ row.growthStage }}</td>
              <td>{{ row.expectedHarvest }}</td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-track">
                    <div class="prog-fill" [style.width.%]="row.progress"></div>
                  </div>
                  <span class="prog-val">{{ row.progress }}%</span>
                </div>
              </td>
              <td>
                <span [class]="row.status === 'Growing' ? 'badge-growing' : 'badge-maturing'">
                  {{ row.status }}
                </span>
              </td>
              <td>
                <button type="button" class="btn-eye" (click)="openCropDetail(row.crop + ' · CR-2026-0017', row.farmName)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 3: CROP RECORD DETAILS (Tomato · CR-2026-0017)                      -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'crop_detail'">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('calendar')">
            ← Back to Produce & Crops
          </button>
          <div>
            <h1 class="page-title">
              <span style="font-size: 19px;">🍅</span>
              <span>{{ activeCropTitle() }}</span>
            </h1>
            <p class="page-subtitle">{{ activeCropSubtitle() }}</p>
          </div>
        </div>
      </div>

      <!-- Top 2 Cards Grid -->
      <div class="crop-detail-top-grid">
        <!-- Left Card: Metadata -->
        <div class="content-box" style="margin-bottom: 0;">
          <div class="kv-list">
            <div class="kv-row">
              <span class="kv-lbl">Crop record</span>
              <span class="kv-val">CR-2025-0001</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Farmer / farm</span>
              <span class="kv-val">FMR-00124 · Ramesh Kumar</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Crops Category</span>
              <span class="kv-val">Horticultural – Vegetables</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Zone / plot</span>
              <span class="kv-val">Coonoor · PLT-00124-1</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Planting date</span>
              <span class="kv-val">5 Mar 2025</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Expected harvest</span>
              <span class="kv-val">3 Jun 2025</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Current stage</span>
              <span class="kv-val">Harvest (7 of 7)</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Last updated</span>
              <span class="kv-val">3 Jun 2025, 08:00 · Farmer entry</span>
            </div>
          </div>

          <div style="border-top: 1px solid var(--tohfa-border, #E4E0D3); margin-top: 16px; padding-top: 14px;">
            <p style="font-size: 10px; color: var(--tohfa-muted, #9AA294); margin: 0 0 8px 0;">
              Calculated: planting date plus 90 days (crop duration, rule to confirm)
            </p>
            <a class="farmer-profile-link" (click)="currentView.set('calendar')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Open farmer profile</span>
            </a>
          </div>
        </div>

        <!-- Right Card: Growth stages -->
        <div class="content-box" style="margin-bottom: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="font-size: 13.5px; font-weight: 700; color: var(--tohfa-ink, #1D2420); margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--ok, #1E8E5A);">🌱</span>
              <span>Growth stages</span>
            </h3>
            <div class="stepper-mode-pill">
              <button
                type="button"
                class="stepper-mode-btn"
                [class.active]="stepperMode() === 'horizontal'"
                (click)="stepperMode.set('horizontal')"
              >
                Horizontal
              </button>
              <button
                type="button"
                class="stepper-mode-btn"
                [class.active]="stepperMode() === 'vertical'"
                (click)="stepperMode.set('vertical')"
              >
                Vertical
              </button>
            </div>
          </div>

          <!-- Horizontal Stepper (Matching Image 3 & 5) -->
          <div *ngIf="stepperMode() === 'horizontal'" class="stepper-horizontal-wrap">
            <div class="stepper-track-line"></div>
            <div class="stepper-nodes-row">
              <div class="stepper-node-col">
                <div class="stepper-check-circle">✔</div>
                <span class="stepper-name">1. Land preparation</span>
                <span class="stepper-date-chip">26 Feb 2025</span>
              </div>

              <div class="stepper-node-col">
                <div class="stepper-check-circle">✔</div>
                <span class="stepper-name">2. Planting</span>
                <span class="stepper-date-chip">5 Mar 2025</span>
              </div>

              <div class="stepper-node-col">
                <div class="stepper-check-circle">✔</div>
                <span class="stepper-name">3. Germination</span>
                <span class="stepper-date-chip">23 Mar 2025</span>
              </div>

              <div class="stepper-node-col">
                <div class="stepper-check-circle">✔</div>
                <span class="stepper-name">4. Vegetative growth</span>
                <span class="stepper-date-chip">10 Apr 2025</span>
              </div>

              <div class="stepper-node-col">
                <div class="stepper-check-circle">✔</div>
                <span class="stepper-name">5. Flowering</span>
                <span class="stepper-date-chip">28 Apr 2025</span>
              </div>

              <div class="stepper-node-col">
                <div class="stepper-check-circle">✔</div>
                <span class="stepper-name">6. Crop development</span>
                <span class="stepper-date-chip">16 May 2025</span>
              </div>

              <div class="stepper-node-col">
                <div class="stepper-orange-circle">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></span>
                </div>
                <span class="stepper-name-orange">7. Harvest (current)</span>
                <span class="stepper-date-orange">3 Jun 2025</span>
              </div>
            </div>
          </div>

          <!-- Vertical Stepper (Matching Image 1 & 2) -->
          <div *ngIf="stepperMode() === 'vertical'" class="stage-step-list">
            <div class="stage-step-item">
              <div class="stage-step-left">
                <span class="stage-check-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 11 15 16 9"></polyline>
                  </svg>
                </span>
                <span>1 · Land preparation</span>
              </div>
              <span class="stage-step-date">26 Feb 2025</span>
            </div>

            <div class="stage-step-item">
              <div class="stage-step-left">
                <span class="stage-check-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 11 15 16 9"></polyline>
                  </svg>
                </span>
                <span>2 · Planting</span>
              </div>
              <span class="stage-step-date">5 Mar 2025</span>
            </div>

            <div class="stage-step-item">
              <div class="stage-step-left">
                <span class="stage-check-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 11 15 16 9"></polyline>
                  </svg>
                </span>
                <span>3 · Germination</span>
              </div>
              <span class="stage-step-date">23 Mar 2025</span>
            </div>

            <div class="stage-step-item">
              <div class="stage-step-left">
                <span class="stage-check-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 11 15 16 9"></polyline>
                  </svg>
                </span>
                <span>4 · Vegetative growth</span>
              </div>
              <span class="stage-step-date">10 Apr 2025</span>
            </div>

            <div class="stage-step-item">
              <div class="stage-step-left">
                <span class="stage-check-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 11 15 16 9"></polyline>
                  </svg>
                </span>
                <span>5 · Flowering</span>
              </div>
              <span class="stage-step-date">28 Apr 2025</span>
            </div>

            <div class="stage-step-item">
              <div class="stage-step-left">
                <span class="stage-check-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 11 15 16 9"></polyline>
                  </svg>
                </span>
                <span>6 · Crop development</span>
              </div>
              <span class="stage-step-date">16 May 2025</span>
            </div>

            <div class="stage-step-current">
              <div class="stage-step-left">
                <span class="stage-circle-current"></span>
                <strong>7 · Harvest (current)</strong>
              </div>
              <span class="stage-step-date">3 Jun 2025</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="crop-tab-bar">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Overview'"
          (click)="activeCropTab.set('Overview')"
        >
          Overview
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Schedule'"
          (click)="activeCropTab.set('Schedule')"
        >
          Schedule
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Growth history'"
          (click)="activeCropTab.set('Growth history')"
        >
          Growth history
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Nutrients' || activeCropTab() === 'Nutrition'"
          (click)="activeCropTab.set('Nutrients')"
        >
          Nutrients
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Harvest'"
          (click)="activeCropTab.set('Harvest')"
        >
          Harvest
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Crop history'"
          (click)="activeCropTab.set('Crop history')"
        >
          Crop history
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeCropTab() === 'Related'"
          (click)="activeCropTab.set('Related')"
        >
          Related
        </button>
      </div>

      <!-- ================= TAB 1: OVERVIEW ================= -->
      <div *ngIf="activeCropTab() === 'Overview'">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <span>Farmer Crop List (Ramesh Kumar Farm)</span>
          </h3>
          <span style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); font-weight: 500;">Total Crops: 6</span>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Crop</th>
                <th>Crop Record</th>
                <th>Category</th>
                <th>Zone / Plot</th>
                <th>Planting Date</th>
                <th>Expected Harvest</th>
                <th>Current Stage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of farmerCropList" (click)="openCropDetail(item.crop + ' · ' + item.cropRecord, 'Ramesh Kumar Farm')" style="cursor: pointer;">
                <td style="color: #6B7280; font-weight: 600;">{{ item.id }}</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E48932" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    <span>{{ item.crop }}</span>
                  </span>
                </td>
                <td style="color: var(--tohfa-amber, #E48932); font-weight: 700;">{{ item.cropRecord }}</td>
                <td style="color: #6B7280;">{{ item.category }}</td>
                <td>{{ item.zonePlot }}</td>
                <td>{{ item.plantingDate }}</td>
                <td>{{ item.expectedHarvest }}</td>
                <td>{{ item.currentStage }}</td>
                <td>
                  <span
                    [class.badge-harvest]="item.status === 'Harvest'"
                    [class.badge-growing]="item.status === 'Growing'"
                    [class.badge-planned]="item.status === 'Planned'"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="btn-eye" (click)="openCropDetail(item.crop + ' · ' + item.cropRecord, 'Ramesh Kumar Farm')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button type="button" class="btn-eye">⋮</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ================= TAB 2: SCHEDULE ================= -->
      <div *ngIf="activeCropTab() === 'Schedule'">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
          <!-- Left: Planting Date & Forecast Details -->
          <div class="content-box">
            <div class="kv-list">
              <div class="kv-row" style="padding-bottom: 12px; border-bottom: 1px solid #F0ECE4;">
                <span class="kv-lbl">Planting date (recorded)</span>
                <span class="kv-val">5 Mar 2025</span>
              </div>
              <div class="kv-row" style="padding: 12px 0; border-bottom: 1px solid #F0ECE4;">
                <span class="kv-lbl">Expected harvest (forecast)</span>
                <span class="kv-val">3 Jun 2025</span>
              </div>
              <div class="kv-row" style="padding: 12px 0; border-bottom: 1px solid #F0ECE4;">
                <span class="kv-lbl">Basis</span>
                <span class="kv-val" style="text-align: right; max-width: 250px; font-size: 11.5px; font-weight: 600;">
                  Calculated: planting date plus 90 days (crop duration, rule to confirm)
                </span>
              </div>
              <div class="kv-row" style="padding-top: 12px;">
                <span class="kv-lbl">Planting date used</span>
                <span class="kv-val">5 Mar 2025</span>
              </div>
            </div>
          </div>

          <!-- Right: Recorded Milestones -->
          <div class="content-box">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--tohfa-ink, #1D2420); margin: 0 0 16px 0;">
              Recorded milestones
            </h4>
            <div class="kv-list">
              <div class="kv-row"><span class="kv-lbl">Land preparation</span><span class="kv-val">26 Feb 2025</span></div>
              <div class="kv-row"><span class="kv-lbl">Planting</span><span class="kv-val">5 Mar 2025</span></div>
              <div class="kv-row"><span class="kv-lbl">Germination</span><span class="kv-val">23 Mar 2025</span></div>
              <div class="kv-row"><span class="kv-lbl">Vegetative growth</span><span class="kv-val">10 Apr 2025</span></div>
              <div class="kv-row"><span class="kv-lbl">Flowering</span><span class="kv-val">28 Apr 2025</span></div>
              <div class="kv-row"><span class="kv-lbl">Crop development</span><span class="kv-val">16 May 2025</span></div>
              <div class="kv-row"><span class="kv-lbl">Harvest</span><span class="kv-val">3 Jun 2025</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 3: GROWTH HISTORY ================= -->
      <div *ngIf="activeCropTab() === 'Growth history'">
        <div class="timeline-box">
          <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Growth history</span>
          </h3>

          <div class="timeline-container">
            <div class="timeline-line"></div>

            <!-- Milestone 1 (Top Active Harvest) -->
            <div class="timeline-event">
              <span class="tl-dot-active"></span>
              <div class="tl-card-highlight">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">3 Jun 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Harvest (previous: Crop development)</span>
                </div>
                <div class="tl-sub">Recorded 3 Jun 2025, 08:00</div>
              </div>
            </div>

            <!-- Milestone 2 -->
            <div class="timeline-event">
              <span class="tl-dot-check"></span>
              <div class="tl-card-standard">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">16 May 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Crop development (previous: Flowering)</span>
                </div>
                <div class="tl-sub">Recorded 16 May 2025, 08:00</div>
              </div>
            </div>

            <!-- Milestone 3 -->
            <div class="timeline-event">
              <span class="tl-dot-check"></span>
              <div class="tl-card-standard">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">28 Apr 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Flowering (previous: Vegetative growth)</span>
                </div>
                <div class="tl-sub">Recorded 28 Apr 2025, 08:00</div>
              </div>
            </div>

            <!-- Milestone 4 -->
            <div class="timeline-event">
              <span class="tl-dot-check"></span>
              <div class="tl-card-standard">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">10 Apr 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Vegetative growth (previous: Germination)</span>
                </div>
                <div class="tl-sub">Recorded 10 Apr 2025, 08:00</div>
              </div>
            </div>

            <!-- Milestone 5 -->
            <div class="timeline-event">
              <span class="tl-dot-check"></span>
              <div class="tl-card-standard">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">23 Mar 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Germination (previous: Planting)</span>
                </div>
                <div class="tl-sub">Recorded 23 Mar 2025, 08:00</div>
              </div>
            </div>

            <!-- Milestone 6 -->
            <div class="timeline-event">
              <span class="tl-dot-check"></span>
              <div class="tl-card-standard">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">5 Mar 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Planting (previous: Land preparation)</span>
                </div>
                <div class="tl-sub">Recorded 5 Mar 2025, 08:00</div>
              </div>
            </div>

            <!-- Milestone 7 -->
            <div class="timeline-event" style="margin-bottom: 0;">
              <span class="tl-dot-check"></span>
              <div class="tl-card-standard">
                <div class="tl-header-row">
                  <span class="tl-farmer-title">26 Feb 2025 · Ramesh Kumar (Farmer)</span>
                  <span class="tl-stage-badge">Land preparation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 4: NUTRIENTS ================= -->
      <div *ngIf="activeCropTab() === 'Nutrients' || activeCropTab() === 'Nutrition'">
        <!-- Top 4 Mini Metric Cards -->
        <div class="stat-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 22px;">
          <div class="stat-card" style="padding: 14px 18px;">
            <div class="stat-icon-wrap" style="width: 36px; height: 36px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 2v7.31L4.89 20.1A2 2 0 0 0 6.64 23h10.72a2 2 0 0 0 1.75-2.9L14 9.31V2"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Latest soil test date</span>
              <span class="stat-val" style="font-size: 13.5px;">12 Feb 2025</span>
            </div>
          </div>

          <div class="stat-card" style="padding: 14px 18px;">
            <div class="stat-icon-wrap" style="width: 36px; height: 36px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Soil type</span>
              <span class="stat-val" style="font-size: 13.5px;">Loamy</span>
            </div>
          </div>

          <div class="stat-card" style="padding: 14px 18px;">
            <div class="stat-icon-wrap" style="width: 36px; height: 36px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 2v7.31L4.89 20.1A2 2 0 0 0 6.64 23h10.72a2 2 0 0 0 1.75-2.9L14 9.31V2"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">pH</span>
              <span class="stat-val" style="font-size: 13.5px;">6.8</span>
            </div>
          </div>

          <div class="stat-card" style="padding: 14px 18px;">
            <div class="stat-icon-wrap" style="width: 36px; height: 36px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">Organic carbon</span>
              <span class="stat-val" style="font-size: 13.5px;">1.24%</span>
            </div>
          </div>
        </div>

        <!-- Section 1: Nutrient levels -->
        <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--tohfa-amber, #E48932);">🧪</span>
          <span>Nutrient levels (Latest soil test)</span>
        </h3>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Latest value (example)</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Recommended action (example)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Nitrogen (N)</strong></td>
                <td>284</td>
                <td>kg/ha</td>
                <td><span class="badge-optimal">Optimal</span></td>
                <td>Maintain with organic manures or balanced inputs as per plan.</td>
              </tr>
              <tr>
                <td><strong>Phosphorus (P)</strong></td>
                <td>36</td>
                <td>kg/ha</td>
                <td><span class="badge-low">Low</span></td>
                <td>Apply a phosphorus source (e.g., rock phosphate / bone meal) as per farm plan.</td>
              </tr>
              <tr>
                <td><strong>Potassium (K)</strong></td>
                <td>312</td>
                <td>kg/ha</td>
                <td><span class="badge-optimal">Optimal</span></td>
                <td>Maintain current level; include potassium-rich organic inputs if needed.</td>
              </tr>
              <tr>
                <td><strong>Organic Carbon (OC)</strong></td>
                <td>1.24</td>
                <td>%</td>
                <td><span class="badge-good">Good</span></td>
                <td>Continue adding organic matter (compost, FYM, green manure).</td>
              </tr>
              <tr>
                <td><strong>pH</strong></td>
                <td>6.8</td>
                <td>—</td>
                <td><span class="badge-optimal">Optimal</span></td>
                <td>Within suitable range for vegetable crops; no immediate action needed.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 2: Fertilizer / Input application history -->
        <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 24px 0 12px 0; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--ok, #1E8E5A);">🌱</span>
          <span>Fertilizer / Input application history (example records)</span>
        </h3>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Input / treatment</th>
                <th>Quantity</th>
                <th>Application method</th>
                <th>Recorded by</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>15 Mar 2025</td>
                <td><strong>Compost (Farmyard Manure)</strong></td>
                <td>2,000 kg/ha</td>
                <td>Broadcast and incorporated into soil</td>
                <td>Ramesh Kumar (Farmer)</td>
                <td><span class="badge-applied">Applied</span></td>
              </tr>
              <tr>
                <td>20 Apr 2025</td>
                <td><strong>Rock Phosphate</strong></td>
                <td>250 kg/ha</td>
                <td>Basal application around root zone</td>
                <td>Ramesh Kumar (Farmer)</td>
                <td><span class="badge-applied">Applied</span></td>
              </tr>
              <tr>
                <td>10 May 2025</td>
                <td><strong>Green Manure (Sunhemp)</strong></td>
                <td>25 kg/ha (seeds)</td>
                <td>Sown between rows, later incorporated</td>
                <td>Ramesh Kumar (Farmer)</td>
                <td><span class="badge-applied">Applied</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ================= TAB 5: HARVEST (Matching Image 5) ================= -->
      <div *ngIf="activeCropTab() === 'Harvest'">
        <div class="content-box">
          <div class="kv-list">
            <div class="kv-row" style="padding-bottom: 14px; border-bottom: 1px solid #F0ECE4;">
              <span class="kv-lbl" style="font-size: 13px;">Actual harvest date</span>
              <span class="kv-val" style="font-size: 13.5px;">30 May 2025</span>
            </div>
            <div class="kv-row" style="padding: 14px 0; border-bottom: 1px solid #F0ECE4;">
              <span class="kv-lbl" style="font-size: 13px;">Recorded quantity</span>
              <span class="kv-val" style="font-size: 13.5px;">4,420 KG</span>
            </div>
            <div class="kv-row" style="padding-top: 14px;">
              <span class="kv-lbl" style="font-size: 13px;">Recorded by</span>
              <span class="kv-val" style="font-size: 13.5px;">Ramesh Kumar</span>
            </div>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--tohfa-border, #E4E0D3); font-size: 11px; color: var(--tohfa-slate, #5C6B63); line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">No expected quantity was entered. None is calculated.</p>
            <p style="margin: 0;">A recorded harvest is not a purchase or a receipt; those belong to Purchase and Inventory.</p>
          </div>
        </div>
      </div>

      <!-- ================= TAB 6: CROP HISTORY (Matching Image 1 & 2) ================= -->
      <div *ngIf="activeCropTab() === 'Crop history'">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <h3 style="font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Crop history</span>
          </h3>
        </div>

        <!-- Filter Bar matching Image 1 & 2 -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <div style="position: relative; flex: 1; min-width: 260px;">
            <input
              type="text"
              placeholder="Search records (e.g., stage, harvest, planting...)"
              style="width: 100%; padding: 8px 12px 8px 34px; background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; font-size: 11.5px; outline: none;"
            />
            <svg style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9AA294;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 7px 12px; font-size: 11.5px; color: #5C6B63; display: flex; align-items: center; gap: 6px;">
              <span>📅</span>
              <span>From date - To date</span>
              <span style="font-size: 9px;">▼</span>
            </div>

            <select style="background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 7px 12px; font-size: 11.5px; color: #1D2420;">
              <option>All record types</option>
              <option>Harvest stage recorded</option>
              <option>Harvest quantity recorded</option>
              <option>Growth stage recorded</option>
              <option>Planting recorded</option>
              <option>Land preparation recorded</option>
            </select>

            <select style="background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 7px 12px; font-size: 11.5px; color: #1D2420;">
              <option>All sources</option>
              <option>Farmer entry</option>
              <option>Supervisor check</option>
            </select>

            <button type="button" style="background: #fff; border: 1px solid var(--tohfa-amber, #E48932); border-radius: 8px; padding: 7px 14px; font-size: 11.5px; font-weight: 700; color: var(--tohfa-amber, #E48932); display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>

        <!-- Table matching Image 1 & 2 -->
        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date ↓</th>
                <th>Record type</th>
                <th>Details / change</th>
                <th>Recorded by</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">1</td>
                <td>3 Jun 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>🚜</span>
                    <span>Harvest stage recorded</span>
                  </span>
                </td>
                <td>Stage updated from Crop development to Harvest</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">2</td>
                <td>30 May 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>📦</span>
                    <span>Harvest quantity recorded</span>
                  </span>
                </td>
                <td><strong>4,420 KG</strong></td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">3</td>
                <td>16 May 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>🔄</span>
                    <span>Growth stage recorded</span>
                  </span>
                </td>
                <td>Crop development</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">4</td>
                <td>28 Apr 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>🔄</span>
                    <span>Growth stage recorded</span>
                  </span>
                </td>
                <td>Flowering</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">5</td>
                <td>10 Apr 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>🔄</span>
                    <span>Growth stage recorded</span>
                  </span>
                </td>
                <td>Vegetative growth</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">6</td>
                <td>23 Mar 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>🔄</span>
                    <span>Growth stage recorded</span>
                  </span>
                </td>
                <td>Germination</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">7</td>
                <td>5 Mar 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>🌱</span>
                    <span>Planting recorded</span>
                  </span>
                </td>
                <td>Planting date 5 Mar 2025</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
              <tr>
                <td style="color: #6B7280; font-weight: 600;">8</td>
                <td>26 Feb 2025</td>
                <td>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                    <span>⛏</span>
                    <span>Land preparation recorded</span>
                  </span>
                </td>
                <td>Land preparation milestone</td>
                <td>Ramesh Kumar</td>
                <td>Farmer entry</td>
                <td><span class="badge-recorded">Recorded</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ================= TAB 7: RELATED (Matching Image 3 & 4) ================= -->
      <div *ngIf="activeCropTab() === 'Related'">
        <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 16px;">
          <!-- Left Column: Related farm records -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0; display: flex; align-items: center; gap: 8px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                <span>Related farm records</span>
              </h3>
              <div style="display: flex; gap: 6px;">
                <button type="button" style="background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #5C6B63; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                  <span>👁</span><span>View crop</span>
                </button>
                <button type="button" style="background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #5C6B63; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                  <span>👤</span><span>View farmer profile</span>
                </button>
                <button type="button" style="background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #5C6B63; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                  <span>🔗</span><span>View linked record</span>
                </button>
              </div>
            </div>

            <div class="table-card">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Crop</th>
                    <th>Crop record ID</th>
                    <th>Plot</th>
                    <th>Season</th>
                    <th>Planting date</th>
                    <th>Current stage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr (click)="openCropDetail('Tomato · CR-2026-0017', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">1</td>
                    <td style="color: var(--tohfa-amber, #E48932); font-weight: 700;">Tomato</td>
                    <td>CR-2026-0017</td>
                    <td>PLT-00124-1</td>
                    <td>Winter 2026</td>
                    <td>15 Jul 2026</td>
                    <td>Flowering (5 of 7)</td>
                    <td><span class="badge-growing">Growing</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Carrot · CR-2026-0016', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">2</td>
                    <td style="font-weight: 600;">Carrot</td>
                    <td>CR-2026-0016</td>
                    <td>PLT-00124-2</td>
                    <td>Winter 2026</td>
                    <td>2 Jul 2026</td>
                    <td>Vegetative growth (4 of 7)</td>
                    <td><span class="badge-growing">Growing</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Cabbage · CR-2026-0014', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">3</td>
                    <td style="font-weight: 600;">Cabbage</td>
                    <td>CR-2026-0014</td>
                    <td>PLT-00124-3</td>
                    <td>Winter 2026</td>
                    <td>28 Jun 2026</td>
                    <td>Flowering (5 of 7)</td>
                    <td><span class="badge-growing">Growing</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Potato · CR-2026-0013', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">4</td>
                    <td style="font-weight: 600;">Potato</td>
                    <td>CR-2026-0013</td>
                    <td>PLT-00124-4</td>
                    <td>Winter 2026</td>
                    <td>20 Jun 2026</td>
                    <td>Crop development (6 of 7)</td>
                    <td><span class="badge-growing">Growing</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Beans · CR-2026-0012', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">5</td>
                    <td style="font-weight: 600;">Beans</td>
                    <td>CR-2026-0012</td>
                    <td>PLT-00124-2</td>
                    <td>Summer 2026</td>
                    <td>10 Apr 2026</td>
                    <td>Harvest (7 of 7)</td>
                    <td><span class="badge-harvested-blue">Harvested</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Lettuce · CR-2025-0009', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">6</td>
                    <td style="font-weight: 600;">Lettuce</td>
                    <td>CR-2025-0009</td>
                    <td>PLT-00124-5</td>
                    <td>Summer 2025</td>
                    <td>18 Feb 2025</td>
                    <td>Harvest (7 of 7)</td>
                    <td><span class="badge-harvested-blue">Harvested</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Brinjal · CR-2025-0008', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">7</td>
                    <td style="font-weight: 600;">Brinjal</td>
                    <td>CR-2025-0008</td>
                    <td>PLT-00124-6</td>
                    <td>Summer 2025</td>
                    <td>12 Feb 2025</td>
                    <td>Harvest (7 of 7)</td>
                    <td><span class="badge-harvested-blue">Harvested</span></td>
                  </tr>
                  <tr (click)="openCropDetail('Tomato · CR-2025-0001', 'Ramesh Kumar Farm')" style="cursor: pointer;">
                    <td style="color: #6B7280; font-weight: 600;">8</td>
                    <td style="font-weight: 600;">Tomato</td>
                    <td>CR-2025-0001</td>
                    <td>PLT-00124-1</td>
                    <td>Winter 2025</td>
                    <td>5 Mar 2025</td>
                    <td>Harvest (7 of 7)</td>
                    <td><span class="badge-harvested-blue">Harvested</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right Column: Related activities + Linked inputs & soil records -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Top: Related activities -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>📅</span>
                  <span>Related activities</span>
                </h3>
              </div>
              <div class="table-card">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Activity</th>
                      <th>Linked record</th>
                      <th>Recorded by</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>3 Jun 2025</td>
                      <td>Harvest recorded</td>
                      <td>CR-2025-0001</td>
                      <td>Ramesh Kumar</td>
                      <td><span class="badge-applied">Completed</span></td>
                    </tr>
                    <tr>
                      <td>16 May 2025</td>
                      <td>Growth stage update</td>
                      <td>CR-2025-0001</td>
                      <td>Ramesh Kumar</td>
                      <td><span class="badge-applied">Completed</span></td>
                    </tr>
                    <tr>
                      <td>28 Apr 2025</td>
                      <td>Flowering recorded</td>
                      <td>CR-2025-0001</td>
                      <td>Ramesh Kumar</td>
                      <td><span class="badge-applied">Completed</span></td>
                    </tr>
                    <tr>
                      <td>10 Apr 2025</td>
                      <td>Vegetative growth</td>
                      <td>CR-2025-0001</td>
                      <td>Ramesh Kumar</td>
                      <td><span class="badge-applied">Completed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom: Linked inputs & soil records -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span style="color: var(--ok, #1E8E5A);">🌱</span>
                  <span>Linked inputs & soil records</span>
                </h3>
              </div>
              <div class="table-card">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Soil test ID</th>
                      <th>Latest test date</th>
                      <th>Input record</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>ST-2025-0142</td>
                      <td>12 Feb 2025</td>
                      <td>INP-2025-0067 (Compost, 2,000 kg)</td>
                      <td><a (click)="activeCropTab.set('Nutrients')" style="color: var(--tohfa-amber, #E48932); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">👁 <span>View</span></a></td>
                    </tr>
                    <tr>
                      <td>ST-2024-0098</td>
                      <td>20 Dec 2024</td>
                      <td>INP-2025-0029 (Rock Phosphate, 250 kg)</td>
                      <td><a (click)="activeCropTab.set('Nutrients')" style="color: var(--tohfa-amber, #E48932); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">👁 <span>View</span></a></td>
                    </tr>
                    <tr>
                      <td>ST-2024-0075</td>
                      <td>05 Nov 2024</td>
                      <td>INP-2024-0198 (Green Manure, 25 kg)</td>
                      <td><a (click)="activeCropTab.set('Nutrients')" style="color: var(--tohfa-amber, #E48932); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">👁 <span>View</span></a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 4: HARVEST FORECAST & INSIGHTS (Screenshots 2, 3, 4, 5)            -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'forecast_insights'">
      <!-- Header -->
      <div class="page-header" style="margin-bottom: 16px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('calendar')">
            ← Back to Produce & Crops
          </button>
          <h1 class="page-title" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Harvest Forecast & Insights</span>
          </h1>
        </div>
      </div>

      <!-- Segmented Main Tabs: Forecast vs Insights (Screenshot 2 & 4) -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
        <div class="segmented-forecast-tabs">
          <button
            type="button"
            class="seg-forecast-btn"
            [class.active]="forecastSubTab() === 'forecast'"
            (click)="forecastSubTab.set('forecast')"
          >
            Forecast
          </button>
          <button
            type="button"
            class="seg-forecast-btn"
            [class.active]="forecastSubTab() === 'insights'"
            (click)="forecastSubTab.set('insights')"
          >
            Insights
          </button>
        </div>
      </div>

      <!-- SUB-TAB 1: FORECAST TABLE (Screenshots 2 & 3) -->
      <div *ngIf="forecastSubTab() === 'forecast'">
        <!-- Filter bar: Time filter pills + Search input -->
        <div class="forecast-filter-bar">
          <div class="time-filter-pills">
            <button
              type="button"
              *ngFor="let tf of ['Next 30 days', 'Next 60 days', 'Next 90 days', 'All']"
              class="time-pill-btn"
              [class.active]="forecastTimeFilter() === tf"
              (click)="forecastTimeFilter.set(tf)"
            >
              {{ tf }}
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="search-input-wrap" style="width: 280px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search common or scientific name"
                [(ngModel)]="searchQuery"
                class="search-input"
              />
            </div>
            <button type="button" class="filter-icon-btn" style="border: 1px solid var(--tohfa-border, #E4E0D3); padding: 7px 10px; border-radius: 8px; background: #ffffff;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>

        <div style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); font-weight: 600; margin-bottom: 10px;">
          43 crop records
        </div>

        <!-- Big Forecast Table -->
        <div class="table-card">
          <table class="custom-table forecast-table">
            <thead>
              <tr style="background: #FDF3EB;">
                <th style="width: 40px;">#</th>
                <th>Crop & Farmer</th>
                <th>Zone / Plot</th>
                <th>Planting Date</th>
                <th>Current Stage</th>
                <th>Expected Harvest</th>
                <th>Actual Harvest</th>
                <th>Expected Quantity</th>
                <th>Last Updated</th>
                <th>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of forecastRecords" (click)="openCropDetail(row.cropFarmer.split(' - ')[0] + ' · CR-2025-0001', row.cropFarmer.split(' - ')[1] + ' Farm · ' + row.zonePlot)" style="cursor: pointer;">
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 500;">{{ row.id }}</td>
                <td style="font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ row.cropFarmer }}</td>
                <td style="color: var(--tohfa-slate, #5C6B63);">{{ row.zonePlot }}</td>
                <td>{{ row.plantingDate }}</td>
                <td>{{ row.currentStage }}</td>
                <td>
                  <span [style.color]="row.expectedHarvest === 'Unavailable' ? '#DC2626' : 'var(--tohfa-ink, #1D2420)'" [style.font-weight]="row.expectedHarvest === 'Unavailable' ? '700' : '500'">
                    {{ row.expectedHarvest }}
                  </span>
                  <span *ngIf="row.expectedHarvestSub" style="display: block; font-size: 9.5px; color: var(--tohfa-muted, #9AA294);">
                    {{ row.expectedHarvestSub }}
                  </span>
                </td>
                <td>
                  <span>{{ row.actualHarvest }}</span>
                  <span *ngIf="row.actualHarvestSub" style="display: block; font-size: 9.5px; color: var(--tohfa-muted, #9AA294);">
                    {{ row.actualHarvestSub }}
                  </span>
                </td>
                <td>
                  <span [style.color]="row.expectedQuantity === 'Not entered' ? 'var(--tohfa-muted, #9AA294)' : 'var(--tohfa-ink, #1D2420)'" [style.font-style]="row.expectedQuantity === 'Not entered' ? 'italic' : 'normal'">
                    {{ row.expectedQuantity }}
                  </span>
                  <span *ngIf="row.expectedQuantitySub" style="display: block; font-size: 9.5px; color: var(--tohfa-muted, #9AA294);">
                    {{ row.expectedQuantitySub }}
                  </span>
                </td>
                <td style="font-size: 11px; color: var(--tohfa-slate, #5C6B63);">{{ row.lastUpdated }}</td>
                <td>
                  <span class="badge-optimal" style="font-size: 9.5px; padding: 3px 8px; border-radius: 6px;">{{ row.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUB-TAB 2: INSIGHTS (Screenshots 4 & 5) -->
      <div *ngIf="forecastSubTab() === 'insights'">
        <!-- Top 2-Column Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <!-- Card 1: Recorded yield trend -->
          <div class="content-box" style="margin-bottom: 0;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 4px 0;">
              Recorded yield trend
            </h3>
            <p style="font-size: 10px; color: var(--tohfa-muted, #9AA294); margin: 0 0 16px 0; line-height: 1.4;">
              Date range 30 May 2025 to 28 Sep 2026 · Unit KG per acre, monthly average · 19 records · Source: recorded harvests and farm area
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div *ngFor="let item of yieldTrends" style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 48px; font-size: 11px; font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ item.period }}</span>
                <div style="flex: 1; height: 10px; background: #EFECE6; border-radius: 5px; overflow: hidden;">
                  <div [style.width.%]="item.pct" style="height: 100%; background: var(--tohfa-amber, #E48932); border-radius: 5px;"></div>
                </div>
                <span style="width: 70px; text-align: right; font-size: 11px; font-weight: 700; color: var(--tohfa-ink, #1D2420);">
                  {{ item.val }} ({{ item.count }})
                </span>
              </div>
            </div>
          </div>

          <!-- Card 2: Best-performing crops -->
          <div class="content-box" style="margin-bottom: 0;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 4px 0;">
              Best-performing crops
            </h3>
            <p style="font-size: 10px; color: var(--tohfa-muted, #9AA294); margin: 0 0 4px 0; line-height: 1.4;">
              Date range 30 May 2025 to 28 Sep 2026 · Unit KG per acre, average · 19 records · Source: recorded harvests and farm area
            </p>
            <p style="font-size: 9.5px; color: var(--tohfa-slate, #5C6B63); font-style: italic; margin: 0 0 14px 0;">
              Average recorded yield, KG per acre (proposed metric, to confirm)
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div *ngFor="let crop of bestPerformingCrops" style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 65px; font-size: 11px; font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ crop.name }}</span>
                <div style="flex: 1; height: 10px; background: #EFECE6; border-radius: 5px; overflow: hidden;">
                  <div [style.width.%]="crop.pct" style="height: 100%; background: var(--tohfa-amber, #E48932); border-radius: 5px;"></div>
                </div>
                <span style="width: 70px; text-align: right; font-size: 11px; font-weight: 700; color: var(--tohfa-ink, #1D2420);">
                  {{ crop.val }} ({{ crop.count }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle 2-Column Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <!-- Card 3: Seasonal crop patterns -->
          <div class="content-box" style="margin-bottom: 0;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 4px 0;">
              Seasonal crop patterns
            </h3>
            <p style="font-size: 10px; color: var(--tohfa-muted, #9AA294); margin: 0 0 14px 0;">
              Harvested crops by season · Unit records · 20 records · Source: recorded harvests and farm area
            </p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div
                *ngFor="let item of seasonalPatterns"
                style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed var(--tohfa-border, #E4E0D3); font-size: 11px;"
              >
                <span style="color: var(--tohfa-ink, #1D2420); font-weight: 500;">{{ item.label }}</span>
                <span style="font-weight: 800; color: var(--tohfa-ink, #1D2420);">{{ item.count }}</span>
              </div>
            </div>
          </div>

          <!-- Card 4: Planned versus actual harvest -->
          <div class="content-box" style="margin-bottom: 0;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 4px 0;">
              Planned versus actual harvest
            </h3>
            <p style="font-size: 10px; color: var(--tohfa-muted, #9AA294); margin: 0 0 14px 0;">
              Expected (calculated or farmer-entered) against the recorded harvest · 18 records · 8 also have an expected quantity
            </p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div
                *ngFor="let item of plannedVsActual"
                style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed var(--tohfa-border, #E4E0D3); font-size: 11px;"
              >
                <span style="color: var(--tohfa-ink, #1D2420); font-weight: 500;">{{ item.cropRecord }}</span>
                <span style="font-weight: 800; color: var(--tohfa-ink, #1D2420);">{{ item.diff }}</span>
              </div>
              <div style="margin-top: 6px; font-size: 10px; color: var(--tohfa-muted, #9AA294); font-style: italic;">
                Showing 8 of 18.
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Card: Revenue per zone -->
        <div class="content-box" style="margin-bottom: 20px;">
          <h3 style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 4px 0;">
            Revenue per zone
          </h3>
          <p style="font-size: 10px; color: var(--tohfa-muted, #9AA294); margin: 0 0 16px 0;">
            Recorded sales revenue by zone · October 2026
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
            <div *ngFor="let zone of revenuePerZone" style="display: flex; align-items: center; gap: 14px;">
              <span style="width: 75px; font-size: 11px; font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ zone.name }}</span>
              <div style="flex: 1; height: 10px; background: #EFECE6; border-radius: 5px; overflow: hidden;">
                <div [style.width.%]="zone.pct" style="height: 100%; background: var(--tohfa-amber, #E48932); border-radius: 5px;"></div>
              </div>
              <span style="width: 80px; text-align: right; font-size: 11.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">
                {{ zone.revenue }}
              </span>
            </div>
          </div>

          <div style="background: #FDF3EB; border-radius: 6px; padding: 10px 14px; text-align: center; font-size: 12px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">
            Total revenue ₹6,86,000
          </div>
        </div>

        <!-- Export Action Bar -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <button
            type="button"
            class="btn-primary"
            style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 12px; font-weight: 700;"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 5: CROP DATA (Images 1, 2, 3)                                      -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'crop_data'">
      <div class="page-header" style="margin-bottom: 16px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('calendar')">
            ← Back to Produce & Crops
          </button>
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 4px;">
            <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
              <span>Crop Data</span>
            </h1>
            <button
              *ngIf="cropDataTab() === 'crop_types'"
              type="button"
              class="btn-primary"
              (click)="openAddCropModal()"
              style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 11.5px; font-weight: 700;"
            >
              <span>+ Add Crop Type</span>
            </button>
            <button
              *ngIf="cropDataTab() === 'diary_activity'"
              type="button"
              class="btn-primary"
              (click)="setProduceView('add_activity_category')"
              style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 11.5px; font-weight: 700;"
            >
              <span>+ Add Activity Category</span>
            </button>
            <button
              *ngIf="cropDataTab() === 'platform_events'"
              type="button"
              class="btn-primary"
              (click)="setProduceView('create_event')"
              style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 11.5px; font-weight: 700;"
            >
              <span>+ Create Event</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Section Title based on active tab -->
      <h2 style="font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420); margin: 0 0 14px 0;">
        <span *ngIf="cropDataTab() === 'crop_types'">Crop Types</span>
        <span *ngIf="cropDataTab() === 'diary_activity'">Diary Activity Types</span>
        <span *ngIf="cropDataTab() === 'platform_events'">Platform Events</span>
      </h2>

      <!-- 4 Summary Metric Cards (Images 1, 2, 3) -->
      <div *ngIf="cropDataTab() === 'crop_types'" class="crop-data-summary-grid">
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Total</span>
          <span class="metric-card-val">{{ cropTypesList.length }}</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Active</span>
          <span class="metric-card-val green">{{ activeCropCount() }}</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Inactive</span>
          <span class="metric-card-val">{{ inactiveCropCount() }}</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Recently Added (7D)</span>
          <span class="metric-card-val">3</span>
        </div>
      </div>

      <div *ngIf="cropDataTab() === 'diary_activity'" class="crop-data-summary-grid">
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Total Activity Types</span>
          <span class="metric-card-val">12</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Active Categories</span>
          <span class="metric-card-val green">12</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Total Sub-Activities</span>
          <span class="metric-card-val">21</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Retired Activities</span>
          <span class="metric-card-val">3</span>
        </div>
      </div>

      <div *ngIf="cropDataTab() === 'platform_events'" class="crop-data-summary-grid">
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Total Events</span>
          <span class="metric-card-val">12</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Upcoming Events</span>
          <span class="metric-card-val green">12</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Published Events</span>
          <span class="metric-card-val">21</span>
        </div>
        <div class="crop-data-metric-card">
          <span class="metric-card-lbl">Draft Events</span>
          <span class="metric-card-val">3</span>
        </div>
      </div>

      <!-- Segmented Main Tabs: Crop Types | Diary Activity | Platform Events -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <div class="segmented-forecast-tabs">
          <button
            type="button"
            class="seg-forecast-btn"
            [class.active]="cropDataTab() === 'crop_types'"
            (click)="cropDataTab.set('crop_types')"
          >
            Crop Types
          </button>
          <button
            type="button"
            class="seg-forecast-btn"
            [class.active]="cropDataTab() === 'diary_activity'"
            (click)="cropDataTab.set('diary_activity')"
          >
            Diary Activity
          </button>
          <button
            type="button"
            class="seg-forecast-btn"
            [class.active]="cropDataTab() === 'platform_events'"
            (click)="cropDataTab.set('platform_events')"
          >
            Platform Events
          </button>
        </div>
      </div>

      <!-- TAB 1: CROP TYPES TABLE -->
      <div *ngIf="cropDataTab() === 'crop_types'">
        <div class="forecast-filter-bar">
          <div class="crop-cat-filter-pills">
            <button
              type="button"
              *ngFor="let cat of ['All', 'Vegetable', 'Fruit', 'Spice']"
              class="crop-cat-pill-btn"
              [class.active]="cropCategoryFilter() === cat"
              (click)="cropCategoryFilter.set(cat)"
            >
              {{ cat }}
            </button>
          </div>
          <div class="search-input-wrap" style="width: 260px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              [(ngModel)]="searchQuery"
              class="search-input"
            />
          </div>
        </div>

        <div style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); font-weight: 700; margin-bottom: 10px;">
          {{ filteredCropTypes().length }} Types
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr style="background: #FDF3EB;">
                <th style="width: 40px;">#</th>
                <th>Crop ID</th>
                <th>Crop Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let crop of filteredCropTypes()">
                <td style="color: var(--tohfa-slate, #5C6B63);">{{ crop.id }}</td>
                <td style="font-weight: 700; color: var(--tohfa-slate, #5C6B63);">{{ crop.cropId }}</td>
                <td>
                  <span style="font-weight: 800; color: var(--tohfa-ink, #1D2420); display: block;">{{ crop.name }}</span>
                  <span style="font-size: 9.5px; color: var(--tohfa-muted, #9AA294);">{{ crop.localName }} · {{ crop.category }}</span>
                </td>
                <td>{{ crop.category }}</td>
                <td>
                  <span
                    [class.badge-optimal]="crop.status === 'Active'"
                    [class.badge-applied]="crop.status === 'Inactive'"
                    style="font-size: 9.5px; padding: 3px 8px; border-radius: 6px;"
                  >
                    {{ crop.status }}
                  </span>
                </td>
                <td style="color: var(--tohfa-slate, #5C6B63); font-size: 11px;">{{ crop.createdBy }}</td>
                <td style="color: var(--tohfa-slate, #5C6B63); font-size: 11px;">{{ crop.lastUpdated }}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="action-link-btn view" (click)="openViewCropModal(crop)">View</button>
                    <button type="button" class="action-link-btn edit" (click)="openEditCropModal(crop)">Edit</button>
                    <button
                      type="button"
                      class="action-link-btn"
                      [class.deactivate]="crop.status === 'Active'"
                      [class.activate]="crop.status === 'Inactive'"
                      (click)="openToggleCropModal(crop)"
                    >
                      {{ crop.status === 'Active' ? 'Deactivate' : 'Activate' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: DIARY ACTIVITY TABLE -->
      <div *ngIf="cropDataTab() === 'diary_activity'">
        <div class="forecast-filter-bar">
          <div class="search-input-wrap" style="width: 320px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search activity code or category..."
              [(ngModel)]="searchQuery"
              class="search-input"
            />
          </div>
        </div>

        <div style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); font-weight: 700; margin-bottom: 10px;">
          8 Types
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr style="background: #FDF3EB;">
                <th style="width: 40px;">#</th>
                <th>Activity Code</th>
                <th>Category Name</th>
                <th>Sub-Activity Count</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of diaryActivities">
                <td>{{ item.id }}</td>
                <td style="font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ item.activityCode }}</td>
                <td style="font-weight: 700; color: var(--tohfa-amber, #E48932);">{{ item.categoryName }}</td>
                <td>{{ item.subActivityCount }}</td>
                <td style="color: var(--tohfa-muted, #9AA294);">{{ item.description }}</td>
                <td>
                  <span class="badge-optimal" style="font-size: 9.5px; padding: 3px 8px; border-radius: 6px;">{{ item.status }}</span>
                </td>
                <td style="font-size: 11px; color: var(--tohfa-slate, #5C6B63);">{{ item.createdBy }}</td>
                <td style="font-size: 11px; color: var(--tohfa-slate, #5C6B63);">{{ item.lastUpdated }}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="action-link-btn view">View</button>
                    <button type="button" class="action-link-btn edit">Edit</button>
                    <button type="button" class="action-link-btn deactivate">Retire</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: PLATFORM EVENTS TABLE -->
      <div *ngIf="cropDataTab() === 'platform_events'">
        <div class="forecast-filter-bar">
          <div class="search-input-wrap" style="width: 320px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search event title, event ID or type..."
              [(ngModel)]="searchQuery"
              class="search-input"
            />
          </div>
        </div>

        <div style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); font-weight: 700; margin-bottom: 10px;">
          8 Types
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr style="background: #FDF3EB;">
                <th style="width: 40px;">#</th>
                <th>Event ID</th>
                <th>Event Title</th>
                <th>Event Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Target Audience</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ev of platformEvents">
                <td>{{ ev.id }}</td>
                <td style="font-weight: 700; color: var(--tohfa-slate, #5C6B63);">{{ ev.eventId }}</td>
                <td style="font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ ev.eventTitle }}</td>
                <td>{{ ev.eventType }}</td>
                <td style="font-size: 11px;">{{ ev.start }}</td>
                <td style="font-size: 11px;">{{ ev.end }}</td>
                <td style="font-size: 11px; color: var(--tohfa-slate, #5C6B63);">{{ ev.targetAudience }}</td>
                <td>
                  <span
                    [class.badge-recorded]="ev.status === 'Draft'"
                    [class.badge-optimal]="ev.status === 'Published'"
                    [class.badge-growing]="ev.status === 'Upcoming'"
                    style="font-size: 9.5px; padding: 3px 8px; border-radius: 6px;"
                  >
                    {{ ev.status }}
                  </span>
                </td>
                <td style="font-size: 11px; color: var(--tohfa-slate, #5C6B63);">{{ ev.createdBy }}</td>
                <td style="font-size: 11px; color: var(--tohfa-slate, #5C6B63);">{{ ev.lastUpdated }}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="action-link-btn view">View</button>
                    <button type="button" class="action-link-btn edit">Edit</button>
                    <button type="button" class="action-link-btn deactivate">Remove</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 6: CROP COMPARE (Images 4 & 5)                                     -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'crop_compare'">
      <div class="page-header" style="margin-bottom: 16px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('calendar')">
            ← Back to Produce & Crops
          </button>
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 4px;">
            <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M16 3h5v5"></path>
                <path d="M4 20L21 3"></path>
                <path d="M21 16v5h-5"></path>
                <path d="M15 15l6 6"></path>
                <path d="M4 4l5 5"></path>
              </svg>
              <span>Crop Compare</span>
            </h1>

            <button
              type="button"
              class="btn-primary"
              [disabled]="selectedCompareCount() < 2"
              (click)="showCompareModal.set(true)"
              style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 11.5px; font-weight: 700;"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 3h5v5"></path>
                <path d="M4 20L21 3"></path>
                <path d="M21 16v5h-5"></path>
                <path d="M15 15l6 6"></path>
              </svg>
              <span>Compare ({{ selectedCompareCount() }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter bar: Search common or scientific name -->
      <div class="forecast-filter-bar">
        <div class="search-input-wrap" style="width: 320px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search common or scientific name"
            [(ngModel)]="searchQuery"
            class="search-input"
          />
        </div>
      </div>

      <div style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); font-weight: 700; margin-bottom: 10px;">
        16 completed 2025 cycles
      </div>

      <!-- Compare Table with Checkboxes (Image 4) -->
      <div class="table-card">
        <table class="custom-table">
          <thead>
            <tr style="background: #FDF3EB;">
              <th style="width: 35px;"></th>
              <th>Crop & Season</th>
              <th>Crop Record ID</th>
              <th>Farmer ID / Name</th>
              <th>Zone</th>
              <th>Plot ID</th>
              <th>Planting Date</th>
              <th>Harvest Date</th>
              <th>Recorded Quantity</th>
              <th>Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of cropCompareList">
              <td>
                <input
                  type="checkbox"
                  [checked]="item.selected"
                  (change)="toggleCompareItem(item)"
                  style="width: 16px; height: 16px; accent-color: var(--tohfa-amber, #E48932); cursor: pointer;"
                />
              </td>
              <td>
                <span style="font-weight: 800; color: var(--tohfa-ink, #1D2420); display: block;">{{ item.cropSeason.split(' (')[0] }}</span>
                <span style="font-size: 9.5px; color: var(--tohfa-muted, #9AA294);">{{ item.cropSeason.split(' (')[1]?.replace(')', '') }}</span>
              </td>
              <td style="font-weight: 700; color: var(--tohfa-slate, #5C6B63);">{{ item.cropRecordId }}</td>
              <td style="color: var(--tohfa-ink, #1D2420); font-weight: 600;">{{ item.farmerIdName }}</td>
              <td>{{ item.zone }}</td>
              <td style="color: var(--tohfa-slate, #5C6B63);">{{ item.plotId }}</td>
              <td>{{ item.plantingDate }}</td>
              <td>{{ item.harvestDate }}</td>
              <td style="font-weight: 700;">{{ item.recordedQuantity }}</td>
              <td style="color: var(--tohfa-slate, #5C6B63); font-size: 11px;">{{ item.source }}</td>
              <td>
                <span class="badge-optimal" style="font-size: 9.5px; padding: 3px 8px; border-radius: 6px;">{{ item.status }}</span>
              </td>
              <td>
                <a
                  (click)="openCropDetail(item.cropSeason.split(' (')[0] + ' · ' + item.cropRecordId, item.farmerIdName + ' · ' + item.zone)"
                  style="color: var(--tohfa-amber, #E48932); font-weight: 700; font-size: 11px; cursor: pointer; text-decoration: underline;"
                >
                  Open full record
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 7: ADD ACTIVITY CATEGORY (Image 10)                                -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'add_activity_category'">
      <div class="page-header" style="margin-bottom: 20px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('crop_data'); cropDataTab.set('diary_activity')">
            ← Back to Crop Data
          </button>
          <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>Add Activity Category</span>
          </h1>
        </div>
      </div>

      <div class="form-card-panel">
        <h3 class="form-card-title">Section 1 · Category details</h3>

        <div class="form-grid-2col">
          <div class="form-group">
            <label class="form-label">Activity Type *</label>
            <div class="input-with-action">
              <input type="text" [(ngModel)]="newActivity.activityType" placeholder="e.g. Sowing & Planting" />
              <button type="button" class="btn-input-add" (click)="addSubActivity()">+ Add</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Category *</label>
            <div class="input-with-action">
              <input type="text" [(ngModel)]="newActivity.category" placeholder="e.g. Horticultural - Vegetables" />
              <button type="button" class="btn-input-add" (click)="addSubActivity()">+ Add</button>
            </div>
          </div>
        </div>

        <div class="form-grid-2col">
          <div class="form-group">
            <label class="form-label">Activity crop *</label>
            <div class="input-with-action">
              <input type="text" [(ngModel)]="newActivity.activityCrop" placeholder="e.g. Tomato, Beans, Carrot" />
              <button type="button" class="btn-input-add" (click)="addSubActivity()">+ Add</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Method *</label>
            <div class="input-with-action">
              <input type="text" [(ngModel)]="newActivity.method" placeholder="e.g. Manual Organic Broadcaster" />
              <button type="button" class="btn-input-add" (click)="addSubActivity()">+ Add</button>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label">Description</label>
          <textarea
            class="form-textarea"
            [(ngModel)]="newActivity.description"
            placeholder="Provide standard instructions, requirements and parameters for this field activity..."
          ></textarea>
        </div>

        <button type="button" class="btn-dashed-add" (click)="addSubActivity()">
          + Add Sub-Activity
        </button>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
        <button
          type="button"
          class="btn-primary"
          (click)="saveActivity()"
          style="padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 8px;"
        >
          Save Activity
        </button>
        <button
          type="button"
          class="btn-secondary"
          (click)="setProduceView('crop_data', { subtab: 'diary_activity' }); cropDataTab.set('diary_activity')"
          style="padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 8px; background: #ffffff; border: 1px solid var(--tohfa-border, #E4E0D3); color: var(--tohfa-ink, #1D2420);"
        >
          Cancel
        </button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 8: CREATE EVENT                                                    -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'create_event'">
      <div class="page-header" style="margin-bottom: 20px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('crop_data'); cropDataTab.set('platform_events')">
            ← Back to Crop Data
          </button>
          <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
            <span>📅</span>
            <span>Create Event</span>
          </h1>
        </div>
      </div>

      <!-- Section 1 -->
      <div class="form-card-panel">
        <h3 class="form-card-title">Section 1 · Event information</h3>

        <div class="form-grid-2col">
          <div class="form-group">
            <label class="form-label">Event Title *</label>
            <input type="text" [(ngModel)]="newEvent.title" class="form-input" placeholder="e.g. Nilgiris Organic Farming Workshop 2026" />
          </div>

          <div class="form-group">
            <label class="form-label">Event Type *</label>
            <div class="input-with-action">
              <input type="text" [(ngModel)]="newEvent.type" placeholder="e.g. Training & Knowledge Sharing" />
              <button type="button" class="btn-input-add">+ Add</button>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label class="form-label">Event Banner</label>
          <div class="upload-banner-box">
            <div style="font-size: 24px; margin-bottom: 6px;">🖼️</div>
            <p style="font-size: 12px; font-weight: 700; color: var(--tohfa-ink, #1D2420); margin: 0 0 4px;">
              Upload event banner (1200x400 recommended)
            </p>
            <p style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); margin: 0 0 10px;">
              PNG, JPG up to 5MB
            </p>
            <button type="button" class="btn-secondary" style="padding: 6px 16px; font-size: 11px;">Browse Files</button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label class="form-label">Description</label>
          <textarea
            class="form-textarea"
            [(ngModel)]="newEvent.description"
            placeholder="Describe the objective, key takeaways, and agenda for participating farmers..."
          ></textarea>
        </div>

        <div class="form-grid-2col">
          <div class="form-group">
            <label class="form-label">Event Location *</label>
            <input type="text" [(ngModel)]="newEvent.location" class="form-input" placeholder="e.g. Coonoor Farmers Training Hall / Online" />
          </div>

          <div class="form-group">
            <label class="form-label">Event Registration Link</label>
            <input type="text" [(ngModel)]="newEvent.registrationLink" class="form-input" placeholder="https://tohfa.org/events/register/..." />
          </div>
        </div>
      </div>

      <!-- Section 2 -->
      <div class="form-card-panel">
        <h3 class="form-card-title">Section 2 · Schedule</h3>
        <div class="form-grid-4col">
          <div class="form-group">
            <label class="form-label">Start Date *</label>
            <input type="date" [(ngModel)]="newEvent.startDate" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">End Date *</label>
            <input type="date" [(ngModel)]="newEvent.endDate" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Start Time *</label>
            <input type="text" [(ngModel)]="newEvent.startTime" class="form-input" placeholder="10:00 AM" />
          </div>
          <div class="form-group">
            <label class="form-label">End Time *</label>
            <input type="text" [(ngModel)]="newEvent.endTime" class="form-input" placeholder="01:00 PM" />
          </div>
        </div>
      </div>

      <!-- Section 3 -->
      <div class="form-card-panel">
        <h3 class="form-card-title">Section 3 · Audience & visibility</h3>
        <div class="form-group" style="margin-bottom: 16px; max-width: 480px;">
          <label class="form-label">Target Audience *</label>
          <select [(ngModel)]="newEvent.targetAudience" class="form-input" style="height: 38px;">
            <option>All Farmers</option>
            <option>Organic Certified Only</option>
            <option>Coonoor Zone Only</option>
            <option>Kotagiri Zone Only</option>
            <option>Ooty Central Zone Only</option>
          </select>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
          <input type="checkbox" id="audience_confirm" [(ngModel)]="newEvent.confirmed" style="accent-color: var(--tohfa-amber, #E48932); cursor: pointer;" />
          <label for="audience_confirm" style="font-size: 11.5px; font-weight: 600; color: var(--tohfa-ink, #1D2420); cursor: pointer;">
            I have confirmed the target audience and schedule for this platform event.
          </label>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
        <button
          type="button"
          class="btn-primary"
          (click)="saveEvent()"
          style="padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 8px;"
        >
          Save & Publish
        </button>
        <button
          type="button"
          class="btn-secondary"
          (click)="currentView.set('crop_data'); cropDataTab.set('platform_events')"
          style="padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 8px;"
        >
          Cancel
        </button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 9: PRODUCT LISTINGS (24 pending · 8 farmers)                       -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'product_listings'">
      <div class="page-header" style="margin-bottom: 20px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('calendar')">
            ← Back to Produce & Crops
          </button>
          <div>
            <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
              <span>📦</span>
              <span>Product Listings</span>
            </h1>
            <p class="page-subtitle">24 pending · 8 farmers</p>
          </div>
        </div>
      </div>

      <!-- Filters matching image -->
      <div class="filter-bar-wrap">
        <div style="position: relative; flex: 1; min-width: 260px;">
          <input
            type="text"
            [(ngModel)]="listingSearchQuery"
            placeholder="Listing ID, Farmer, Product, Crop..."
            style="width: 100%; height: 38px; padding: 0 12px 0 34px; background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; font-size: 11.5px; outline: none; box-sizing: border-box;"
          />
          <svg style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9AA294;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <select [(ngModel)]="listingFarmerFilter" style="height: 38px; background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 0 12px; font-size: 11.5px; color: #1D2420;">
          <option value="All">All Farmers</option>
          <option value="Ramesh Kumar">Ramesh Kumar</option>
          <option value="Selvam M">Selvam M</option>
          <option value="Anitha Rajan">Anitha Rajan</option>
          <option value="Murugan K">Murugan K</option>
          <option value="Priya S">Priya S</option>
          <option value="Vignesh P">Vignesh P</option>
        </select>

        <select [(ngModel)]="listingProductFilter" style="height: 38px; background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 0 12px; font-size: 11.5px; color: #1D2420;">
          <option value="All">All Products</option>
          <option value="Beans">Beans</option>
          <option value="Tomato">Tomato</option>
          <option value="Carrot">Carrot</option>
          <option value="Cabbage">Cabbage</option>
          <option value="Potato">Potato</option>
          <option value="Garlic">Garlic</option>
        </select>

        <select [(ngModel)]="listingGradeFilter" style="height: 38px; background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 0 12px; font-size: 11.5px; color: #1D2420;">
          <option value="All">All Grades</option>
          <option value="Grade A+">Grade A+</option>
          <option value="Grade A">Grade A</option>
          <option value="Grade B">Grade B</option>
        </select>

        <select [(ngModel)]="listingStatusFilter" style="height: 38px; background: #fff; border: 1px solid var(--tohfa-border, #E4E0D3); border-radius: 8px; padding: 0 12px; font-size: 11.5px; color: #1D2420;">
          <option value="All">All Status</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Approved">Approved</option>
        </select>

        <button type="button" class="btn-secondary" (click)="resetListingFilters()" style="height: 38px; padding: 0 14px; font-size: 11.5px; font-weight: 600;">
          ↻ Reset
        </button>

        <button type="button" class="btn-secondary" style="height: 38px; padding: 0 14px; font-size: 11.5px; font-weight: 700; color: var(--tohfa-amber, #E48932); border-color: var(--tohfa-amber, #E48932); display: inline-flex; align-items: center; gap: 6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Export</span>
        </button>
      </div>

      <!-- Listings Table -->
      <div class="table-card">
        <table class="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>LISTING ID</th>
              <th>FARMER</th>
              <th>PRODUCT</th>
              <th>GRADE</th>
              <th>QUANTITY</th>
              <th>PRICE/KG</th>
              <th>SUBMITTED</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredProductListings()" (click)="openFarmerProduceList(item)" style="cursor: pointer;">
              <td style="color: #6B7280; font-weight: 600;">{{ item.id }}</td>
              <td style="color: var(--tohfa-amber, #E48932); font-weight: 700;">{{ item.listingId }}</td>
              <td style="font-weight: 600; color: var(--tohfa-ink, #1D2420);">{{ item.farmer }}</td>
              <td style="font-weight: 700;">{{ item.product }}</td>
              <td><span style="font-size: 10.5px; font-weight: 600; color: #5C6B63;">{{ item.grade }}</span></td>
              <td style="font-weight: 700;">{{ item.quantity }}</td>
              <td style="font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ item.pricePerKg }}</td>
              <td style="color: #6B7280; font-size: 11px;">{{ item.submitted }}</td>
              <td>
                <span [class.table-badge-pending]="item.status === 'Pending Review'" [class.table-badge-approved]="item.status === 'Approved'">
                  {{ item.status }}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  class="btn-secondary"
                  (click)="$event.stopPropagation(); openFarmerProduceList(item)"
                  style="padding: 4px 10px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>View</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- SCREEN 10: RAMESH KUMAR FARM PRODUCE LIST (Image 4 in latest upload)      -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="currentView() === 'listing_farmer_detail'">
      <div class="page-header" style="margin-bottom: 20px;">
        <div class="page-title-row">
          <button type="button" class="btn-back-link" (click)="currentView.set('product_listings')">
            ← Back to Product Listings
          </button>
          <div>
            <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
              <span>🌾</span>
              <span>Ramesh Kumar Farm</span>
            </h1>
            <p class="page-subtitle">Produce List & Verification Details</p>
          </div>
        </div>
      </div>

      <!-- Farmer Info Card -->
      <div class="form-card-panel" style="padding: 18px 24px;">
        <h3 class="form-card-title">Farmer Information</h3>
        <div class="form-grid-4col">
          <div class="kv-item">
            <span class="info-lbl" style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); display: block; margin-bottom: 3px;">Farmer</span>
            <span class="info-val" style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">Ramesh Kumar</span>
          </div>
          <div class="kv-item">
            <span class="info-lbl" style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); display: block; margin-bottom: 3px;">Farmer ID</span>
            <span class="info-val" style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-amber, #E48932);">FMR-00124</span>
          </div>
          <div class="kv-item">
            <span class="info-lbl" style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); display: block; margin-bottom: 3px;">Zone</span>
            <span class="info-val" style="font-size: 13.5px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">Coonoor</span>
          </div>
          <div class="kv-item">
            <span class="info-lbl" style="font-size: 11px; color: var(--tohfa-slate, #5C6B63); display: block; margin-bottom: 3px;">Farming Method</span>
            <span class="info-val" style="font-size: 13.5px; font-weight: 800; color: var(--ok, #1E8E5A);">Organic (Certified)</span>
          </div>
        </div>
      </div>

      <!-- Produce List Card -->
      <div class="form-card-panel" style="padding: 18px 24px;">
        <h3 class="form-card-title">Produce List</h3>
        <div class="table-card" style="margin-top: 10px;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PRODUCE</th>
                <th>GRADE</th>
                <th>QUANTITY</th>
                <th>PRICE/KG</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of farmerProduceItems">
                <td style="color: #6B7280; font-weight: 600;">{{ item.id }}</td>
                <td style="font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ item.produce }}</td>
                <td><span style="font-size: 10.5px; font-weight: 600; color: #5C6B63;">{{ item.grade }}</span></td>
                <td style="font-weight: 700;">{{ item.quantity }}</td>
                <td style="font-weight: 700; color: var(--tohfa-ink, #1D2420);">{{ item.pricePerKg }}</td>
                <td>
                  <span class="table-badge-pending">{{ item.status }}</span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button
                      type="button"
                      class="btn-secondary"
                      (click)="openCropDetail(item.produce + ' · CR-2026-0017', 'Ramesh Kumar Farm · Coonoor, plot 1')"
                      style="padding: 4px 10px; font-size: 11px; font-weight: 600;"
                    >
                      👁 View
                    </button>
                    <button
                      type="button"
                      class="btn-secondary"
                      (click)="reviewFarmerProduce(item)"
                      style="padding: 4px 10px; font-size: 11px; font-weight: 700; color: var(--tohfa-amber, #E48932); border-color: var(--tohfa-amber, #E48932);"
                    >
                      ✏ Review
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
        <button type="button" class="btn-secondary" (click)="currentView.set('product_listings')" style="padding: 10px 22px; font-size: 12.5px; font-weight: 600;">
          ← Back to Product Listings
        </button>
        <button type="button" class="btn-primary" (click)="approveAllFarmerProduce()" style="padding: 10px 28px; font-size: 13px; font-weight: 700; border-radius: 8px;">
          Approve All Produce
        </button>
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- MODALS: ADD CROP TYPE, VIEW CROP TYPE, EDIT CROP TYPE, DEACTIVATE/ACTIVATE -->
    <!-- ========================================================================= -->
    <!-- Modal 1: Add Crop Type -->
    <div *ngIf="showAddCropModal()" class="tohfa-modal-backdrop" (click)="showAddCropModal.set(false)">
      <div class="tohfa-modal-card" (click)="$event.stopPropagation()">
        <div class="tohfa-modal-header">
          <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">+ Add New Crop Type</h3>
          <button type="button" (click)="showAddCropModal.set(false)" style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
        </div>
        <div class="tohfa-modal-body">
          <div class="form-group">
            <label class="form-label">Crop Name *</label>
            <input type="text" [(ngModel)]="newCrop.name" class="form-input" placeholder="e.g. Tomato" />
          </div>
          <div class="form-group">
            <label class="form-label">Vernacular / Local Name</label>
            <input type="text" [(ngModel)]="newCrop.localName" class="form-input" placeholder="e.g. Thakkali" />
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select [(ngModel)]="newCrop.category" class="form-input">
              <option value="Vegetable">Vegetable</option>
              <option value="Fruit">Fruit</option>
              <option value="Spice">Spice</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Duration (Days)</label>
              <input type="number" [(ngModel)]="newCrop.defaultDurationDays" class="form-input" placeholder="90" />
            </div>
            <div class="form-group">
              <label class="form-label">Expected Yield / Acre</label>
              <input type="text" [(ngModel)]="newCrop.expectedYieldPerAcre" class="form-input" placeholder="e.g. 4,500 KG" />
            </div>
          </div>
        </div>
        <div class="tohfa-modal-footer">
          <button type="button" class="btn-back-link" (click)="showAddCropModal.set(false)">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveNewCropType()">Save Crop Type</button>
        </div>
      </div>
    </div>

    <!-- Modal 2: View Crop Type -->
    <div *ngIf="showViewCropModal() && viewingCrop()" class="tohfa-modal-backdrop" (click)="showViewCropModal.set(false)">
      <div class="tohfa-modal-card" (click)="$event.stopPropagation()">
        <div class="tohfa-modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🌱</span>
            <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">
              {{ viewingCrop()?.name }} · {{ viewingCrop()?.cropId }}
            </h3>
          </div>
          <button type="button" (click)="showViewCropModal.set(false)" style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
        </div>
        <div class="tohfa-modal-body">
          <div class="kv-list">
            <div class="kv-row">
              <span class="kv-lbl">Crop ID</span>
              <span class="kv-val" style="font-weight: 800;">{{ viewingCrop()?.cropId }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Common Name</span>
              <span class="kv-val">{{ viewingCrop()?.name }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Vernacular / Local</span>
              <span class="kv-val">{{ viewingCrop()?.localName }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Category</span>
              <span class="kv-val">{{ viewingCrop()?.category }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Status</span>
              <span class="kv-val">
                <span
                  [class.badge-optimal]="viewingCrop()?.status === 'Active'"
                  [class.badge-applied]="viewingCrop()?.status === 'Inactive'"
                  style="font-size: 10px; padding: 2px 8px; border-radius: 4px;"
                >
                  {{ viewingCrop()?.status }}
                </span>
              </span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Default Duration</span>
              <span class="kv-val">{{ viewingCrop()?.defaultDurationDays || 90 }} Days</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Created By</span>
              <span class="kv-val">{{ viewingCrop()?.createdBy }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-lbl">Last Updated</span>
              <span class="kv-val">{{ viewingCrop()?.lastUpdated }}</span>
            </div>
          </div>
        </div>
        <div class="tohfa-modal-footer">
          <button type="button" class="btn-primary" (click)="switchToEditFromView()">Edit Crop Type</button>
          <button type="button" class="btn-back-link" (click)="showViewCropModal.set(false)">Close</button>
        </div>
      </div>
    </div>

    <!-- Modal 3: Edit Crop Type -->
    <div *ngIf="showEditCropModal() && editingCrop()" class="tohfa-modal-backdrop" (click)="showEditCropModal.set(false)">
      <div class="tohfa-modal-card" (click)="$event.stopPropagation()">
        <div class="tohfa-modal-header">
          <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">
            Edit Crop Type · {{ editingCrop()?.cropId }}
          </h3>
          <button type="button" (click)="showEditCropModal.set(false)" style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
        </div>
        <div class="tohfa-modal-body">
          <div class="form-group">
            <label class="form-label">Crop Name *</label>
            <input type="text" [(ngModel)]="editingCrop()!.name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Vernacular / Local Name</label>
            <input type="text" [(ngModel)]="editingCrop()!.localName" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select [(ngModel)]="editingCrop()!.category" class="form-input">
              <option value="Vegetable">Vegetable</option>
              <option value="Fruit">Fruit</option>
              <option value="Spice">Spice</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select [(ngModel)]="editingCrop()!.status" class="form-input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="tohfa-modal-footer">
          <button type="button" class="btn-back-link" (click)="showEditCropModal.set(false)">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveEditedCropType()">Update Crop Type</button>
        </div>
      </div>
    </div>

    <!-- Modal 4: Deactivate / Activate Confirmation -->
    <div *ngIf="showDeactivateModal() && deactivatingCrop()" class="tohfa-modal-backdrop" (click)="showDeactivateModal.set(false)">
      <div class="tohfa-modal-card" style="max-width: 440px;" (click)="$event.stopPropagation()">
        <div class="tohfa-modal-header">
          <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">
            {{ deactivatingCrop()?.status === 'Active' ? 'Deactivate' : 'Activate' }} Crop Type?
          </h3>
          <button type="button" (click)="showDeactivateModal.set(false)" style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
        </div>
        <div class="tohfa-modal-body">
          <p style="margin: 0; font-size: 12px; color: var(--tohfa-ink, #1D2420); line-height: 1.5;">
            Are you sure you want to {{ deactivatingCrop()?.status === 'Active' ? 'deactivate' : 'activate' }}
            <strong>{{ deactivatingCrop()?.name }} ({{ deactivatingCrop()?.cropId }})</strong>?
          </p>
          <p *ngIf="deactivatingCrop()?.status === 'Active'" style="margin: 8px 0 0 0; font-size: 11px; color: #DC2626;">
            Deactivated crops will not appear in farmers' active planting options.
          </p>
        </div>
        <div class="tohfa-modal-footer">
          <button type="button" class="btn-back-link" (click)="showDeactivateModal.set(false)">Cancel</button>
          <button
            type="button"
            [style.background]="deactivatingCrop()?.status === 'Active' ? '#DC2626' : 'var(--ok, #1E8E5A)'"
            style="color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer;"
            (click)="confirmToggleStatus()"
          >
            Confirm {{ deactivatingCrop()?.status === 'Active' ? 'Deactivation' : 'Activation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 5: Compare Crop Cycles Modal (Image 5) -->
    <div *ngIf="showCompareModal()" class="tohfa-modal-backdrop" (click)="showCompareModal.set(false)">
      <div class="tohfa-modal-card" style="max-width: 620px;" (click)="$event.stopPropagation()">
        <div class="tohfa-modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tohfa-amber, #E48932)" stroke-width="2.5">
              <path d="M16 3h5v5"></path>
              <path d="M4 20L21 3"></path>
              <path d="M21 16v5h-5"></path>
              <path d="M15 15l6 6"></path>
            </svg>
            <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--tohfa-ink, #1D2420);">
              Compare Crop Cycles
            </h3>
          </div>
          <button type="button" (click)="showCompareModal.set(false)" style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
        </div>
        <div class="tohfa-modal-body" style="padding: 0;">
          <table class="custom-table compare-dialog-table" style="width: 100%;">
            <thead>
              <tr>
                <th style="width: 160px;">Field</th>
                <th>{{ getCompareItem(0)?.cropRecordId || 'CR-2026-0040' }}</th>
                <th>{{ getCompareItem(1)?.cropRecordId || 'CR-2026-0031' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 600;">🌱 Crop</td>
                <td style="font-weight: 800; color: var(--tohfa-ink, #1D2420);">{{ compareCropName(0, 'Potato') }}</td>
                <td style="font-weight: 800; color: var(--tohfa-ink, #1D2420);">{{ compareCropName(1, 'Cabbage') }}</td>
              </tr>
              <tr>
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 600;">📅 Season</td>
                <td>{{ compareCropSeason(0, 'Winter 2026') }}</td>
                <td>{{ compareCropSeason(1, 'Winter 2026') }}</td>
              </tr>
              <tr>
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 600;">📍 Zone / Plot</td>
                <td>{{ (getCompareItem(0)?.zone || 'Kotagiri') + ' · ' + (getCompareItem(0)?.plotId || 'PLT-00221-2') }}</td>
                <td>{{ (getCompareItem(1)?.zone || 'Gudalur') + ' · ' + (getCompareItem(1)?.plotId || 'PLT-00127-2') }}</td>
              </tr>
              <tr>
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 600;">⚖️ Quantity</td>
                <td style="font-weight: 700;">{{ getCompareItem(0)?.recordedQuantity || '5,225 KG' }}</td>
                <td style="font-weight: 700;">{{ getCompareItem(1)?.recordedQuantity || '5,700 KG' }}</td>
              </tr>
              <tr>
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 600;">📊 Yield</td>
                <td style="font-weight: 700;">{{ getCompareItem(0)?.yieldPerAcre || '5,225 KG/acre' }}</td>
                <td style="font-weight: 700;">{{ getCompareItem(1)?.yieldPerAcre || '5,700 KG/acre' }}</td>
              </tr>
              <tr>
                <td style="color: var(--tohfa-slate, #5C6B63); font-weight: 600;">⏱️ Planting to Harvest</td>
                <td style="font-weight: 800; color: var(--tohfa-ink, #1D2420);">{{ getCompareItem(0)?.cycleDays || 103 }} days</td>
                <td style="font-weight: 800; color: var(--tohfa-ink, #1D2420);">{{ getCompareItem(1)?.cycleDays || 88 }} days</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="tohfa-modal-footer">
          <button type="button" class="btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Details</span>
          </button>
          <button type="button" class="btn-back-link" (click)="showCompareModal.set(false)">Close</button>
        </div>
      </div>
    </div>
  `,
})
export class ListingsQueueComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentView = signal<ProduceViewMode>('calendar');
  readonly selectedDay = signal<number>(1);
  readonly activeCropTitle = signal<string>('Tomato · CR-2025-0001');
  readonly activeCropSubtitle = signal<string>('Ramesh Kumar Farm · Coonoor, plot 1');
  readonly activeCropTab = signal<CropDetailTab>('Overview');
  readonly stepperMode = signal<'horizontal' | 'vertical'>('horizontal');
  readonly forecastSubTab = signal<'forecast' | 'insights'>('forecast');
  readonly forecastTimeFilter = signal<string>('All');
  readonly cropDataTab = signal<CropDataTab>('crop_types');
  readonly cropCategoryFilter = signal<string>('All');

  readonly showAddCropModal = signal<boolean>(false);
  readonly showViewCropModal = signal<boolean>(false);
  readonly showEditCropModal = signal<boolean>(false);
  readonly showDeactivateModal = signal<boolean>(false);
  readonly viewingCrop = signal<CropTypeItem | null>(null);
  readonly editingCrop = signal<CropTypeItem | null>(null);
  readonly deactivatingCrop = signal<CropTypeItem | null>(null);
  readonly showCompareModal = signal<boolean>(false);

  newCrop = {
    name: '',
    localName: '',
    category: 'Vegetable' as 'Vegetable' | 'Fruit' | 'Spice' | 'Other',
    defaultDurationDays: 90,
    expectedYieldPerAcre: '4,500 KG',
  };

  newActivity = {
    activityType: '',
    category: '',
    activityCrop: '',
    method: '',
    description: '',
    subActivities: [] as string[],
  };

  newEvent = {
    title: '',
    type: '',
    bannerUrl: '',
    description: '',
    location: '',
    registrationLink: '',
    startDate: '2026-11-15',
    endDate: '2026-11-15',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    targetAudience: 'All Farmers',
    confirmed: true,
  };

  listingSearchQuery = '';
  listingFarmerFilter = 'All';
  listingProductFilter = 'All';
  listingGradeFilter = 'All';
  listingStatusFilter = 'All';

  readonly productListings = [
    { id: 1, listingId: 'LST-2026-0001', farmer: 'Ramesh Kumar', farmerId: 'FMR-00124', product: 'Fresh Beans', grade: 'Grade A', quantity: '1,200 KG', pricePerKg: '₹45', submitted: '12 Oct 2026', status: 'Pending Review' },
    { id: 2, listingId: 'LST-2026-0002', farmer: 'Ramesh Kumar', farmerId: 'FMR-00124', product: 'Organic Tomato', grade: 'Grade A', quantity: '2,500 KG', pricePerKg: '₹32', submitted: '12 Oct 2026', status: 'Pending Review' },
    { id: 3, listingId: 'LST-2026-0003', farmer: 'Ramesh Kumar', farmerId: 'FMR-00124', product: 'Nilgiri Carrot', grade: 'Grade A', quantity: '850 KG', pricePerKg: '₹38', submitted: '13 Oct 2026', status: 'Pending Review' },
    { id: 4, listingId: 'LST-2026-0004', farmer: 'Selvam M', farmerId: 'FMR-00189', product: 'Green Cabbage', grade: 'Grade B', quantity: '1,800 KG', pricePerKg: '₹22', submitted: '13 Oct 2026', status: 'Pending Review' },
    { id: 5, listingId: 'LST-2026-0005', farmer: 'Selvam M', farmerId: 'FMR-00189', product: 'Red Potato', grade: 'Grade A', quantity: '3,200 KG', pricePerKg: '₹28', submitted: '14 Oct 2026', status: 'Pending Review' },
    { id: 6, listingId: 'LST-2026-0006', farmer: 'Anitha Rajan', farmerId: 'FMR-00204', product: 'Green Peas', grade: 'Grade A', quantity: '650 KG', pricePerKg: '₹65', submitted: '14 Oct 2026', status: 'Approved' },
    { id: 7, listingId: 'LST-2026-0007', farmer: 'Anitha Rajan', farmerId: 'FMR-00204', product: 'Garlic (Ooty)', grade: 'Grade A+', quantity: '420 KG', pricePerKg: '₹140', submitted: '15 Oct 2026', status: 'Approved' },
    { id: 8, listingId: 'LST-2026-0008', farmer: 'Murugan K', farmerId: 'FMR-00098', product: 'Beetroot', grade: 'Grade B', quantity: '900 KG', pricePerKg: '₹26', submitted: '15 Oct 2026', status: 'Pending Review' },
    { id: 9, listingId: 'LST-2026-0009', farmer: 'Murugan K', farmerId: 'FMR-00098', product: 'Cauliflower', grade: 'Grade A', quantity: '1,100 KG', pricePerKg: '₹35', submitted: '16 Oct 2026', status: 'Pending Review' },
    { id: 10, listingId: 'LST-2026-0010', farmer: 'Priya S', farmerId: 'FMR-00312', product: 'Strawberry', grade: 'Grade A+', quantity: '350 KG', pricePerKg: '₹180', submitted: '16 Oct 2026', status: 'Pending Review' },
    { id: 11, listingId: 'LST-2026-0011', farmer: 'Priya S', farmerId: 'FMR-00312', product: 'Broccoli', grade: 'Grade A', quantity: '550 KG', pricePerKg: '₹55', submitted: '17 Oct 2026', status: 'Pending Review' },
    { id: 12, listingId: 'LST-2026-0012', farmer: 'Vignesh P', farmerId: 'FMR-00155', product: 'French Beans', grade: 'Grade A', quantity: '1,400 KG', pricePerKg: '₹48', submitted: '17 Oct 2026', status: 'Pending Review' },
  ];

  readonly farmerProduceItems = [
    { id: 1, produce: 'Beans', grade: 'Grade A', quantity: '1,200 KG', pricePerKg: '₹45', status: 'Pending Review' },
    { id: 2, produce: 'Tomato', grade: 'Grade A', quantity: '2,500 KG', pricePerKg: '₹32', status: 'Pending Review' },
    { id: 3, produce: 'Carrot', grade: 'Grade A', quantity: '850 KG', pricePerKg: '₹38', status: 'Pending Review' },
    { id: 4, produce: 'Beans (French)', grade: 'Grade B', quantity: '600 KG', pricePerKg: '₹40', status: 'Pending Review' },
  ];

  searchQuery = '';

  readonly cropTypesList: CropTypeItem[] = [
    {
      id: 1,
      cropId: 'CRP-001',
      name: 'Tomato',
      localName: 'Thakkali',
      category: 'Vegetable',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '20 Oct 2026',
      defaultDurationDays: 90,
      expectedYieldPerAcre: '4,500 KG',
    },
    {
      id: 2,
      cropId: 'CRP-005',
      name: 'Carrot',
      localName: 'Carrot',
      category: 'Vegetable',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '15 Oct 2026',
      defaultDurationDays: 75,
      expectedYieldPerAcre: '5,200 KG',
    },
    {
      id: 3,
      cropId: 'CRP-012',
      name: 'Garlic',
      localName: 'Poondu',
      category: 'Spice',
      status: 'Inactive',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '2 Sep 2026',
      defaultDurationDays: 120,
      expectedYieldPerAcre: '1,800 KG',
    },
    {
      id: 4,
      cropId: 'CRP-002',
      name: 'Cabbage',
      localName: 'Muttalkose',
      category: 'Vegetable',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '18 Oct 2026',
      defaultDurationDays: 85,
      expectedYieldPerAcre: '6,000 KG',
    },
    {
      id: 5,
      cropId: 'CRP-003',
      name: 'Beans',
      localName: 'Pachai Payaru',
      category: 'Vegetable',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '17 Oct 2026',
      defaultDurationDays: 65,
      expectedYieldPerAcre: '2,400 KG',
    },
    {
      id: 6,
      cropId: 'CRP-007',
      name: 'Potato',
      localName: 'Urulai Kizhangu',
      category: 'Vegetable',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '12 Oct 2026',
      defaultDurationDays: 100,
      expectedYieldPerAcre: '5,500 KG',
    },
    {
      id: 7,
      cropId: 'CRP-010',
      name: 'Beans (French)',
      localName: 'Avarakkai',
      category: 'Vegetable',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '10 Oct 2026',
      defaultDurationDays: 70,
      expectedYieldPerAcre: '2,800 KG',
    },
    {
      id: 8,
      cropId: 'CRP-004',
      name: 'Chilli',
      localName: 'Milagai',
      category: 'Spice',
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: '8 Oct 2026',
      defaultDurationDays: 95,
      expectedYieldPerAcre: '3,100 KG',
    },
  ];

  readonly diaryActivities: DiaryActivityItem[] = [
    {
      id: 1,
      activityCode: 'DA01',
      categoryName: 'Land Prep',
      subActivityCount: 3,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 2,
      activityCode: 'DA02',
      categoryName: 'Sowing',
      subActivityCount: 2,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 3,
      activityCode: 'DA03',
      categoryName: 'Nutrient',
      subActivityCount: 2,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 4,
      activityCode: 'DA04',
      categoryName: 'Water',
      subActivityCount: 1,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 5,
      activityCode: 'DA05',
      categoryName: 'Weed Management',
      subActivityCount: 4,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 6,
      activityCode: 'DA06',
      categoryName: 'Pest Management',
      subActivityCount: 3,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 7,
      activityCode: 'DA07',
      categoryName: 'Harvesting',
      subActivityCount: 3,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
    {
      id: 8,
      activityCode: 'DA08',
      categoryName: 'Post-Harvest Handling',
      subActivityCount: 3,
      description: '—',
      status: 'Active',
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    },
  ];

  readonly platformEvents: PlatformEventItem[] = [
    {
      id: 1,
      eventId: 'EVT-003',
      eventTitle: 'Soil health workshop',
      eventType: 'Training',
      start: '27 Nov 2026, 10:00',
      end: '27 Nov 2026, 13:00',
      targetAudience: 'Selected Zones (Coonoor, Kotagiri)',
      status: 'Draft',
      createdBy: 'Demo Super Admin',
      lastUpdated: '26 Oct 2026',
    },
    {
      id: 2,
      eventId: 'EVT-001',
      eventTitle: 'Organic certification camp',
      eventType: 'Training',
      start: '9 Nov 2026, 10:00',
      end: '9 Nov 2026, 16:00',
      targetAudience: 'All Farmers',
      status: 'Published',
      createdBy: 'Demo Super Admin',
      lastUpdated: '26 Oct 2026',
    },
    {
      id: 3,
      eventId: 'EVT-004',
      eventTitle: 'Integrated pest management',
      eventType: 'Training',
      start: '15 Nov 2026, 09:30',
      end: '15 Nov 2026, 12:30',
      targetAudience: 'Vegetable Farmers',
      status: 'Upcoming',
      createdBy: 'Demo Super Admin',
      lastUpdated: '25 Oct 2026',
    },
    {
      id: 4,
      eventId: 'EVT-005',
      eventTitle: 'Fertigation & irrigation demo',
      eventType: 'Training',
      start: '30 Nov 2026, 10:00',
      end: '30 Nov 2026, 15:00',
      targetAudience: 'Selected Zones (Ooty, Coonoor)',
      status: 'Published',
      createdBy: 'Demo Super Admin',
      lastUpdated: '24 Oct 2026',
    },
    {
      id: 5,
      eventId: 'EVT-006',
      eventTitle: 'Post-harvest handling & storage',
      eventType: 'Training',
      start: '5 Dec 2026, 10:00',
      end: '5 Dec 2026, 13:00',
      targetAudience: 'All Farmers',
      status: 'Draft',
      createdBy: 'Demo Super Admin',
      lastUpdated: '24 Oct 2026',
    },
    {
      id: 6,
      eventId: 'EVT-007',
      eventTitle: 'Market linkage & fair pricing',
      eventType: 'Training',
      start: '12 Dec 2026, 10:00',
      end: '12 Dec 2026, 14:00',
      targetAudience: 'Farmer Admins',
      status: 'Upcoming',
      createdBy: 'Demo Super Admin',
      lastUpdated: '23 Oct 2026',
    },
    {
      id: 7,
      eventId: 'EVT-008',
      eventTitle: 'Organic input orientation',
      eventType: 'Training',
      start: '18 Dec 2026, 09:30',
      end: '18 Dec 2026, 12:00',
      targetAudience: 'Selected Zones (Kotagiri, Gudalur)',
      status: 'Published',
      createdBy: 'Demo Super Admin',
      lastUpdated: '22 Oct 2026',
    },
    {
      id: 8,
      eventId: 'EVT-009',
      eventTitle: 'Rabi season crop planning',
      eventType: 'Training',
      start: '28 Dec 2026, 10:00',
      end: '28 Dec 2026, 13:00',
      targetAudience: 'All Farmers',
      status: 'Upcoming',
      createdBy: 'Demo Super Admin',
      lastUpdated: '22 Oct 2026',
    },
  ];

  readonly cropCompareList: CropCompareItem[] = [
    {
      id: 1,
      cropSeason: 'Potato (Winter 2026)',
      cropRecordId: 'CR-2026-0040',
      farmerIdName: 'FMR-0021 · Priya',
      zone: 'Kotagiri',
      plotId: 'PLT-0021-2',
      plantingDate: '17 Jun 2026',
      harvestDate: '28 Sep 2026',
      recordedQuantity: '5,225 KG',
      source: 'Farmer entry',
      status: 'Harvested',
      yieldPerAcre: '5,225 KG/acre',
      cycleDays: 103,
      selected: true,
    },
    {
      id: 2,
      cropSeason: 'Cabbage (Winter 2026)',
      cropRecordId: 'CR-2026-0031',
      farmerIdName: 'FMR-0017 · Senthil',
      zone: 'Gudalur',
      plotId: 'PLT-0017-2',
      plantingDate: '30 Jun 2026',
      harvestDate: '26 Sep 2026',
      recordedQuantity: '5,700 KG',
      source: 'Farmer entry',
      status: 'Harvested',
      yieldPerAcre: '5,700 KG/acre',
      cycleDays: 88,
      selected: true,
    },
    {
      id: 3,
      cropSeason: 'Carrot (Winter 2026)',
      cropRecordId: 'CR-2026-0024',
      farmerIdName: 'FMR-00146 · Sundar',
      zone: 'Gudalur',
      plotId: 'PLT-00146-1',
      plantingDate: '9 Jun 2026',
      harvestDate: '20 Sep 2026',
      recordedQuantity: '9,975 KG',
      source: 'Farmer entry',
      status: 'Harvested',
      yieldPerAcre: '4,980 KG/acre',
      cycleDays: 103,
      selected: false,
    },
    {
      id: 4,
      cropSeason: 'Tomato (Winter 2026)',
      cropRecordId: 'CR-2026-0019',
      farmerIdName: 'FMR-00124 · Ramesh Kumar',
      zone: 'Coonoor',
      plotId: 'PLT-00124-1',
      plantingDate: '12 Jun 2026',
      harvestDate: '22 Sep 2026',
      recordedQuantity: '6,420 KG',
      source: 'Farmer entry',
      status: 'Harvested',
      yieldPerAcre: '4,280 KG/acre',
      cycleDays: 102,
      selected: false,
    },
  ];

  readonly forecastRecords: ForecastCropRecord[] = [
    {
      id: 1,
      cropFarmer: 'Tomato - Ramesh Kumar',
      zonePlot: 'Coonoor · PLT-00124-1',
      plantingDate: '5 Mar 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '3 Jun 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '30 May 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '3 Jun 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 2,
      cropFarmer: 'Carrot - Selvi',
      zonePlot: 'Coonoor · PLT-00131-1',
      plantingDate: '21 Mar 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '29 Jun 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '2 Jul 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: '6,483 KG',
      expectedQuantitySub: '(farmer-entered)',
      lastUpdated: '29 Jun 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 3,
      cropFarmer: 'Cabbage - Meena',
      zonePlot: 'Coonoor · PLT-00177-1',
      plantingDate: '6 Apr 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '30 Jun 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '29 Jun 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '30 Jun 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 4,
      cropFarmer: 'Beans - Lakshmi',
      zonePlot: 'Coonoor · PLT-00203-1',
      plantingDate: '22 Apr 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '26 Jun 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '2 Jul 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: '5,371 KG',
      expectedQuantitySub: '(farmer-entered)',
      lastUpdated: '26 Jun 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 5,
      cropFarmer: 'Garlic - Kumar',
      zonePlot: 'Ooty · PLT-00089-1',
      plantingDate: '8 May 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: 'Unavailable',
      actualHarvest: '7 Sep 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '6 Aug 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 6,
      cropFarmer: 'Potato - Arun',
      zonePlot: 'Ooty · PLT-00215-1',
      plantingDate: '24 May 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '1 Sep 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '30 Aug 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: '7,623 KG',
      expectedQuantitySub: '(farmer-entered)',
      lastUpdated: '1 Sep 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 7,
      cropFarmer: 'Tomato - Vijay',
      zonePlot: 'Kotagiri · PLT-00152-1',
      plantingDate: '9 Jun 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '7 Sep 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '12 Sep 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '7 Sep 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 8,
      cropFarmer: 'Carrot - Priya',
      zonePlot: 'Kotagiri · PLT-00221-1',
      plantingDate: '25 Jun 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '3 Oct 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '4 Oct 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: '12,569 KG',
      expectedQuantitySub: '(farmer-entered)',
      lastUpdated: '3 Oct 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 9,
      cropFarmer: 'Cabbage - Ganesan',
      zonePlot: 'Ooty · PLT-00140-1',
      plantingDate: '11 Jul 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '4 Oct 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '1 Oct 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '4 Oct 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 10,
      cropFarmer: 'Beans - Kavitha',
      zonePlot: 'Kotagiri · PLT-00118-1',
      plantingDate: '27 Jul 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '30 Sep 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '4 Oct 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: '3,777 KG',
      expectedQuantitySub: '(farmer-entered)',
      lastUpdated: '30 Sep 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 11,
      cropFarmer: 'Garlic - Senthil',
      zonePlot: 'Gudalur · PLT-00127-1',
      plantingDate: '12 Aug 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: 'Unavailable',
      actualHarvest: '10 Dec 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '10 Nov 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 12,
      cropFarmer: 'Potato - Sundar',
      zonePlot: 'Gudalur · PLT-00146-1',
      plantingDate: '28 Aug 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '6 Dec 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '2 Dec 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: '15,015 KG',
      expectedQuantitySub: '(farmer-entered)',
      lastUpdated: '6 Dec 2025, 08:00',
      status: 'Recorded',
    },
    {
      id: 13,
      cropFarmer: 'Tomato - Ramesh Kumar',
      zonePlot: 'Coonoor · PLT-00124-1',
      plantingDate: '13 Sep 2025',
      currentStage: 'Harvest (7 of 7)',
      expectedHarvest: '12 Dec 2025',
      expectedHarvestSub: '(calculated)',
      actualHarvest: '15 Dec 2025',
      actualHarvestSub: '(recorded)',
      expectedQuantity: 'Not entered',
      lastUpdated: '12 Dec 2025, 08:00',
      status: 'Recorded',
    },
  ];

  readonly yieldTrends = [
    { period: '25-05', val: '4,420', count: 1, pct: 60 },
    { period: '25-06', val: '6,660', count: 1, pct: 90 },
    { period: '25-07', val: '3,081', count: 2, pct: 42 },
    { period: '25-09', val: '3,580', count: 2, pct: 48 },
    { period: '25-10', val: '4,315', count: 3, pct: 58 },
    { period: '25-12', val: '3,943', count: 3, pct: 53 },
    { period: '26-01', val: '4,315', count: 3, pct: 58 },
    { period: '26-08', val: '2,090', count: 1, pct: 28 },
    { period: '26-09', val: '4,972', count: 3, pct: 67 },
  ];

  readonly bestPerformingCrops = [
    { name: 'Cabbage', val: '6,210', count: 4, pct: 85 },
    { name: 'Potato', val: '5,473', count: 2, pct: 75 },
    { name: 'Tomato', val: '4,715', count: 3, pct: 65 },
    { name: 'Carrot', val: '4,263', count: 4, pct: 58 },
    { name: 'Beans', val: '2,151', count: 4, pct: 30 },
    { name: 'Garlic', val: '1,773', count: 2, pct: 24 },
  ];

  readonly seasonalPatterns = [
    { label: 'Summer 2025 · Beans', count: 2 },
    { label: 'Summer 2025 · Cabbage', count: 2 },
    { label: 'Summer 2025 · Carrot', count: 1 },
    { label: 'Summer 2025 · Garlic', count: 1 },
    { label: 'Summer 2025 · Potato', count: 1 },
    { label: 'Summer 2025 · Tomato', count: 1 },
    { label: 'Winter 2025 · Beans', count: 1 },
    { label: 'Winter 2025 · Cabbage', count: 1 },
    { label: 'Winter 2025 · Carrot', count: 2 },
    { label: 'Winter 2025 · Garlic', count: 1 },
    { label: 'Winter 2025 · Potato', count: 1 },
    { label: 'Winter 2025 · Tomato', count: 2 },
    { label: 'Winter 2026 · Beans', count: 1 },
    { label: 'Winter 2026 · Cabbage', count: 1 },
    { label: 'Winter 2026 · Carrot', count: 1 },
    { label: 'Winter 2026 · Potato', count: 1 },
  ];

  readonly plannedVsActual = [
    { cropRecord: 'Tomato · CR-2025-0001', diff: '4 days before' },
    { cropRecord: 'Carrot · CR-2025-0002', diff: '3 days after' },
    { cropRecord: 'Cabbage · CR-2025-0003', diff: '1 days before' },
    { cropRecord: 'Beans · CR-2025-0004', diff: '6 days after' },
    { cropRecord: 'Potato · CR-2025-0006', diff: '2 days after' },
    { cropRecord: 'Tomato · CR-2025-0007', diff: '5 days after' },
    { cropRecord: 'Carrot · CR-2025-0008', diff: '1 days after' },
    { cropRecord: 'Cabbage · CR-2026-0009', diff: '3 days before' },
  ];

  readonly revenuePerZone = [
    { name: 'Coonoor', revenue: '₹2,48,500', pct: 85 },
    { name: 'Ooty', revenue: '₹1,96,000', pct: 70 },
    { name: 'Kotagiri', revenue: '₹1,42,800', pct: 45 },
    { name: 'Gudalur', revenue: '₹98,700', pct: 32 },
  ];

  readonly farmerCropList: FarmerCropItem[] = [
    {
      id: 1,
      crop: 'Tomato',
      cropRecord: 'CR-2026-0017',
      category: 'Horticultural – Vegetables',
      zonePlot: 'Coonoor · PLT-00124-1',
      plantingDate: '5 Mar 2025',
      expectedHarvest: '3 Jun 2025',
      currentStage: 'Harvest (7 of 7)',
      status: 'Harvest',
    },
    {
      id: 2,
      crop: 'Cabbage',
      cropRecord: 'CR-2026-0018',
      category: 'Horticultural – Vegetables',
      zonePlot: 'Coonoor · PLT-00124-2',
      plantingDate: '10 Mar 2025',
      expectedHarvest: '20 Jun 2025',
      currentStage: 'Flowering (5 of 7)',
      status: 'Growing',
    },
    {
      id: 3,
      crop: 'Carrot',
      cropRecord: 'CR-2026-0019',
      category: 'Horticultural – Vegetables',
      zonePlot: 'Coonoor · PLT-00124-3',
      plantingDate: '12 Mar 2025',
      expectedHarvest: '25 Jun 2025',
      currentStage: 'Vegetative growth (4 of 7)',
      status: 'Growing',
    },
    {
      id: 4,
      crop: 'Capsicum',
      cropRecord: 'CR-2026-0020',
      category: 'Horticultural – Vegetables',
      zonePlot: 'Coonoor · PLT-00124-4',
      plantingDate: '15 Mar 2025',
      expectedHarvest: '28 Jun 2025',
      currentStage: 'Germination (3 of 7)',
      status: 'Growing',
    },
    {
      id: 5,
      crop: 'Broccoli',
      cropRecord: 'CR-2026-0021',
      category: 'Horticultural – Vegetables',
      zonePlot: 'Coonoor · PLT-00124-5',
      plantingDate: '18 Mar 2025',
      expectedHarvest: '1 Jul 2025',
      currentStage: 'Planting (2 of 7)',
      status: 'Planned',
    },
    {
      id: 6,
      crop: 'Beans',
      cropRecord: 'CR-2026-0022',
      category: 'Horticultural – Vegetables',
      zonePlot: 'Coonoor · PLT-00124-6',
      plantingDate: '20 Mar 2025',
      expectedHarvest: '5 Jul 2025',
      currentStage: 'Land preparation (1 of 7)',
      status: 'Planned',
    },
  ];

  readonly cropRecords: CropRecord[] = [
    {
      id: 1,
      farmName: 'Ramesh Kumar Farm',
      crop: 'Tomato',
      zone: 'Coonoor',
      plotNo: 'P-01',
      plantingDate: '15 Jul 2026',
      growthStage: 'Stage 5 of 7 (Flowering)',
      expectedHarvest: '13 Oct 2026',
      progress: 71,
      status: 'Growing',
    },
    {
      id: 2,
      farmName: 'Selvi Farm',
      crop: 'Carrot',
      zone: 'Coonoor',
      plotNo: 'P-02',
      plantingDate: '02 Jul 2026',
      growthStage: 'Stage 5 of 7 (Flowering)',
      expectedHarvest: '10 Oct 2026',
      progress: 68,
      status: 'Growing',
    },
    {
      id: 3,
      farmName: 'Kumar Organic Farm',
      crop: 'Cabbage',
      zone: 'Coonoor',
      plotNo: 'P-03',
      plantingDate: '10 Jul 2026',
      growthStage: 'Stage 4 of 7 (Vegetative)',
      expectedHarvest: '20 Oct 2026',
      progress: 57,
      status: 'Growing',
    },
    {
      id: 4,
      farmName: 'Anandhi Farm',
      crop: 'Cauliflower',
      zone: 'Ooty',
      plotNo: 'P-01',
      plantingDate: '08 Jul 2026',
      growthStage: 'Stage 5 of 7 (Flowering)',
      expectedHarvest: '21 Oct 2026',
      progress: 72,
      status: 'Growing',
    },
    {
      id: 5,
      farmName: 'Mariyappan Farm',
      crop: 'Beans',
      zone: 'Ooty',
      plotNo: 'P-04',
      plantingDate: '12 Jul 2026',
      growthStage: 'Stage 3 of 7 (Vegetative)',
      expectedHarvest: '25 Oct 2026',
      progress: 43,
      status: 'Growing',
    },
    {
      id: 6,
      farmName: 'Suresh Farm',
      crop: 'Capsicum',
      zone: 'Coonoor',
      plotNo: 'P-05',
      plantingDate: '05 Jul 2026',
      growthStage: 'Stage 5 of 7 (Flowering)',
      expectedHarvest: '18 Oct 2026',
      progress: 70,
      status: 'Growing',
    },
    {
      id: 7,
      farmName: 'Lakshmi Farm',
      crop: 'Beetroot',
      zone: 'Kotagiri',
      plotNo: 'P-02',
      plantingDate: '01 Jul 2026',
      growthStage: 'Stage 4 of 7 (Vegetative)',
      expectedHarvest: '17 Oct 2026',
      progress: 60,
      status: 'Growing',
    },
    {
      id: 8,
      farmName: 'Murugan Farm',
      crop: 'Radish',
      zone: 'Kotagiri',
      plotNo: 'P-03',
      plantingDate: '06 Jul 2026',
      growthStage: 'Stage 6 of 7 (Maturity)',
      expectedHarvest: '15 Oct 2026',
      progress: 86,
      status: 'Maturing',
    },
    {
      id: 9,
      farmName: 'Revathi Farm',
      crop: 'Broccoli',
      zone: 'Coonoor',
      plotNo: 'P-06',
      plantingDate: '04 Jul 2026',
      growthStage: 'Stage 4 of 7 (Vegetative)',
      expectedHarvest: '22 Oct 2026',
      progress: 55,
      status: 'Growing',
    },
    {
      id: 10,
      farmName: 'Vijay Farm',
      crop: 'Green Peas',
      zone: 'Ooty',
      plotNo: 'P-07',
      plantingDate: '09 Jul 2026',
      growthStage: 'Stage 3 of 7 (Vegetative)',
      expectedHarvest: '26 Oct 2026',
      progress: 42,
      status: 'Growing',
    },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['view'] === 'breakdown') {
        this.currentView.set('breakdown');
      } else if (params['view'] === 'crop_detail') {
        this.currentView.set('crop_detail');
        if (params['cropId']) {
          this.activeCropTitle.set('Tomato · ' + params['cropId']);
        }
      } else if (params['view'] === 'forecast' || params['view'] === 'forecast_insights') {
        this.currentView.set('forecast_insights');
        if (params['subtab'] === 'insights') {
          this.forecastSubTab.set('insights');
        }
      } else if (params['view'] === 'crop_data') {
        this.currentView.set('crop_data');
        if (params['subtab'] === 'diary_activity' || params['subtab'] === 'platform_events' || params['subtab'] === 'crop_types') {
          this.cropDataTab.set(params['subtab']);
        }
      } else if (params['view'] === 'crop_compare') {
        this.currentView.set('crop_compare');
      } else if (params['view'] === 'add_activity_category') {
        this.currentView.set('add_activity_category');
      } else if (params['view'] === 'create_event') {
        this.currentView.set('create_event');
      } else if (params['view'] === 'product_listings') {
        this.currentView.set('product_listings');
      } else if (params['view'] === 'listing_farmer_detail') {
        this.currentView.set('listing_farmer_detail');
      } else {
        this.currentView.set('calendar');
      }

      if (params['tab']) {
        this.activeCropTab.set(params['tab'] as CropDetailTab);
      }
    });
  }

  setProduceView(view: ProduceViewMode, extraParams?: Record<string, string>): void {
    this.currentView.set(view);
    const queryParams: Record<string, string> = { view, ...extraParams };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  selectDay(day: number): void {
    this.selectedDay.set(day);
  }

  openBreakdown(): void {
    this.setProduceView('breakdown');
  }

  openForecastInsights(tab: 'forecast' | 'insights' = 'forecast'): void {
    this.forecastSubTab.set(tab);
    this.setProduceView('forecast_insights', { subtab: tab });
  }

  openCropHistory(): void {
    this.activeCropTitle.set('Tomato · CR-2025-0001');
    this.activeCropSubtitle.set('Ramesh Kumar Farm · Coonoor, plot 1');
    this.activeCropTab.set('Crop history');
    this.setProduceView('crop_detail', { tab: 'Crop history' });
  }

  openCropData(): void {
    this.setProduceView('crop_data');
  }

  openCropCompare(): void {
    this.setProduceView('crop_compare');
  }

  openCropDetail(title: string, subtitle: string): void {
    this.activeCropTitle.set(title);
    this.activeCropSubtitle.set(subtitle);
    this.activeCropTab.set('Overview');
    this.setProduceView('crop_detail');
  }

  filteredCropTypes(): CropTypeItem[] {
    const filter = this.cropCategoryFilter();
    const query = this.searchQuery.trim().toLowerCase();
    return this.cropTypesList.filter((item) => {
      const matchCat = filter === 'All' || item.category === filter;
      const matchQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.cropId.toLowerCase().includes(query) ||
        item.localName.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }

  activeCropCount(): number {
    return this.cropTypesList.filter((c) => c.status === 'Active').length;
  }

  inactiveCropCount(): number {
    return this.cropTypesList.filter((c) => c.status === 'Inactive').length;
  }

  selectedCompareCount(): number {
    return this.cropCompareList.filter((c) => c.selected).length;
  }

  addSubActivity(): void {
    const act = prompt('Enter sub-activity name:', 'Manual Inspection & Weeding');
    if (act) {
      this.newActivity.subActivities.push(act);
    }
  }

  saveActivity(): void {
    this.cropDataTab.set('diary_activity');
    this.setProduceView('crop_data', { subtab: 'diary_activity' });
  }

  saveEvent(): void {
    this.cropDataTab.set('platform_events');
    this.setProduceView('crop_data', { subtab: 'platform_events' });
  }

  resetListingFilters(): void {
    this.listingSearchQuery = '';
    this.listingFarmerFilter = 'All';
    this.listingProductFilter = 'All';
    this.listingGradeFilter = 'All';
    this.listingStatusFilter = 'All';
  }

  filteredProductListings() {
    return this.productListings.filter((item) => {
      const matchFarmer = this.listingFarmerFilter === 'All' || item.farmer === this.listingFarmerFilter;
      const matchProduct = this.listingProductFilter === 'All' || item.product.toLowerCase().includes(this.listingProductFilter.toLowerCase());
      const matchGrade = this.listingGradeFilter === 'All' || item.grade === this.listingGradeFilter;
      const matchStatus = this.listingStatusFilter === 'All' || item.status === this.listingStatusFilter;
      const query = this.listingSearchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        item.listingId.toLowerCase().includes(query) ||
        item.farmer.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query);
      return matchFarmer && matchProduct && matchGrade && matchStatus && matchQuery;
    });
  }

  openFarmerProduceList(listing: any): void {
    this.currentView.set('listing_farmer_detail');
  }

  reviewFarmerProduce(item: any): void {
    alert(`Reviewing produce: ${item.produce} (${item.quantity}). Verified and ready for approval.`);
  }

  approveAllFarmerProduce(): void {
    alert('All produce items for Ramesh Kumar Farm have been verified and approved!');
    this.currentView.set('product_listings');
  }

  selectedCompareItems(): CropCompareItem[] {
    return this.cropCompareList.filter((c) => c.selected);
  }

  getCompareItem(index: number): CropCompareItem | undefined {
    return this.selectedCompareItems()[index];
  }

  compareCropName(index: number, fallback: string): string {
    const item = this.getCompareItem(index);
    if (!item) return fallback;
    return item.cropSeason.split(' (')[0] || fallback;
  }

  compareCropSeason(index: number, fallback: string): string {
    const item = this.getCompareItem(index);
    if (!item) return fallback;
    const parts = item.cropSeason.split(' (');
    return parts[1] ? parts[1].replace(')', '') : fallback;
  }

  toggleCompareItem(item: CropCompareItem): void {
    item.selected = !item.selected;
  }

  openAddCropModal(): void {
    this.newCrop = {
      name: '',
      localName: '',
      category: 'Vegetable',
      defaultDurationDays: 90,
      expectedYieldPerAcre: '4,500 KG',
    };
    this.showAddCropModal.set(true);
  }

  saveNewCropType(): void {
    if (!this.newCrop.name) return;
    const nextIdNum = this.cropTypesList.length + 1;
    const padId = nextIdNum < 10 ? `00${nextIdNum}` : `0${nextIdNum}`;
    const newItem: CropTypeItem = {
      id: nextIdNum,
      cropId: `CRP-${padId}`,
      name: this.newCrop.name,
      localName: this.newCrop.localName || this.newCrop.name,
      category: this.newCrop.category,
      status: 'Active',
      createdBy: 'Demo TOHFA Admin',
      lastUpdated: 'Just now',
      defaultDurationDays: this.newCrop.defaultDurationDays || 90,
      expectedYieldPerAcre: this.newCrop.expectedYieldPerAcre || '4,000 KG',
    };
    this.cropTypesList.unshift(newItem);
    this.showAddCropModal.set(false);
  }

  openViewCropModal(crop: CropTypeItem): void {
    this.viewingCrop.set(crop);
    this.showViewCropModal.set(true);
  }

  openEditCropModal(crop: CropTypeItem): void {
    this.editingCrop.set({ ...crop });
    this.showEditCropModal.set(true);
  }

  switchToEditFromView(): void {
    const crop = this.viewingCrop();
    if (crop) {
      this.showViewCropModal.set(false);
      this.openEditCropModal(crop);
    }
  }

  saveEditedCropType(): void {
    const edited = this.editingCrop();
    if (!edited) return;
    const idx = this.cropTypesList.findIndex((c) => c.cropId === edited.cropId);
    if (idx !== -1 && this.cropTypesList[idx]) {
      this.cropTypesList[idx] = {
        ...edited,
        lastUpdated: 'Just now',
      };
    }
    this.showEditCropModal.set(false);
  }

  openToggleCropModal(crop: CropTypeItem): void {
    this.deactivatingCrop.set(crop);
    this.showDeactivateModal.set(true);
  }

  confirmToggleStatus(): void {
    const crop = this.deactivatingCrop();
    if (!crop) return;
    const idx = this.cropTypesList.findIndex((c) => c.cropId === crop.cropId);
    const targetCrop = idx !== -1 ? this.cropTypesList[idx] : undefined;
    if (targetCrop) {
      targetCrop.status = crop.status === 'Active' ? 'Inactive' : 'Active';
      targetCrop.lastUpdated = 'Just now';
    }
    this.showDeactivateModal.set(false);
  }
}
