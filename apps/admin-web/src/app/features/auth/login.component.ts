import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  inject,
  signal,
  type OnInit,
  type OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { RoleCode } from '@tohfa/shared-types';
import { NAV } from '../../app.routes';
import { AuthService } from '../../core/auth.service';
import { RbacService } from '../../core/rbac.service';
import { AUTH_BG_BASE64 } from './auth-bg.data';

export type AuthScreenStep =
  | 'login'
  | 'login_success'
  | 'role_select'
  | 'forgot_password'
  | 'verify_otp'
  | 'reset_password'
  | 'reset_success';

@Component({
  selector: 'tohfa-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        font-family: var(--font, 'Poppins', sans-serif);
        color: var(--tohfa-ink, #1D2420);
      }

      * {
        box-sizing: border-box;
      }

      /* Full-bleed background using high-definition 2560x1440 tea plantation image */
      .auth-container {
        position: relative;
        min-height: 100vh;
        width: 100%;
        background-color: #F7F5EE;
        background-size: cover;
        background-position: 25% 20%;
        background-repeat: no-repeat;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: high-quality;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 48px 84px;
        overflow: hidden;
      }

      /* Scrim for modal states (Reset success) */
      .auth-scrim {
        position: fixed;
        inset: 0;
        background: rgba(29, 36, 32, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: fadeIn 0.25s ease-out;
      }

      /* ---------- Hero Statement (Bottom-Left) ---------- */
      .hero-section {
        max-width: 520px;
        align-self: flex-end;
        margin-bottom: 24px;
        z-index: 2;
      }

      .hero-caption h1 {
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 34px;
        font-weight: 800;
        line-height: 1.24;
        color: #ffffff;
        margin: 0;
        letter-spacing: -0.015em;
        text-shadow: 0 3px 14px rgba(0, 0, 0, 0.75), 0 1px 4px rgba(0, 0, 0, 0.9);
      }

      .hero-accent-bar {
        width: 84px;
        height: 4px;
        background: var(--tohfa-amber, #E48932);
        border-radius: 2px;
        margin-top: 14px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
      }

      /* ---------- Floating Auth Card (Right Side) ---------- */
      .form-section {
        width: 100%;
        max-width: 480px;
        z-index: 2;
      }

      .auth-card {
        background: #ffffff;
        border: 1px solid rgba(228, 224, 211, 0.85);
        border-radius: 20px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.06);
        padding: 44px 44px;
        position: relative;
        animation: fadeInCard 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes fadeInCard {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Brand Header inside Card */
      .card-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 26px;
      }

      .brand-icon {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(228, 137, 50, 0.15);
      }

      .brand-title {
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
        line-height: 1.2;
      }

      .brand-sub {
        font-size: 11.5px;
        font-weight: 500;
        color: var(--tohfa-slate, #5C6B63);
        margin-top: 4px;
        letter-spacing: 0.1px;
      }

      .form-heading {
        text-align: center;
        margin-bottom: 26px;
      }

      .form-heading h2 {
        font-size: 23px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        margin: 0 0 6px;
        line-height: 1.2;
      }

      .form-heading p {
        font-size: 13px;
        font-weight: 500;
        color: var(--tohfa-slate, #5C6B63);
        margin: 0;
        line-height: 1.5;
      }

      /* Alert */
      .alert {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--err-bg, #FDECEC);
        border: 1px solid var(--err-bd, #F3C1C1);
        color: var(--err, #B3261E);
        padding: 10px 14px;
        border-radius: 10px;
        margin-bottom: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .alert svg {
        flex: none;
      }

      /* Form Fields */
      .field {
        margin-bottom: 18px;
      }

      .field label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin-bottom: 8px;
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-wrap svg.leading-icon {
        position: absolute;
        left: 15px;
        color: var(--tohfa-muted, #9AA294);
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .input-wrap input {
        width: 100%;
        height: 48px;
        padding: 0 44px 0 44px;
        border: 1.5px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 13.5px;
        color: var(--tohfa-ink, #1D2420);
        background: #ffffff;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .input-wrap input::placeholder {
        color: var(--tohfa-muted, #9AA294);
        font-size: 13px;
      }

      .input-wrap input:focus {
        border-color: var(--tohfa-amber, #E48932);
        box-shadow: 0 0 0 3px rgba(228, 137, 50, 0.22);
      }

      .toggle-visibility {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--tohfa-muted, #9AA294);
        border-radius: 6px;
      }

      .toggle-visibility:hover {
        color: var(--tohfa-ink, #1D2420);
      }

      /* Options row: Remember Me & Forgot Password */
      .options-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 6px 0 26px;
        font-size: 12px;
      }

      .remember-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
      }

      .remember-wrap input[type='checkbox'] {
        width: 16px;
        height: 16px;
        border: 1.5px solid var(--tohfa-checkbox-border, #D6D1C4);
        border-radius: 4px;
        accent-color: var(--tohfa-amber, #E48932);
        cursor: pointer;
        margin: 0;
      }

      .remember-wrap span {
        font-size: 12px;
        font-weight: 600;
        color: var(--tohfa-slate, #5C6B63);
      }

      .forgot-btn,
      .back-link-btn {
        background: none;
        border: none;
        padding: 0;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-brown, #8A4E15);
        cursor: pointer;
        text-decoration: none;
      }

      .forgot-btn:hover,
      .back-link-btn:hover {
        color: var(--tohfa-brown-deep, #5C3410);
        text-decoration: underline;
      }

      .back-link-wrap {
        text-align: center;
        margin-top: 22px;
      }

      /* Primary Sign In Button */
      .submit-btn {
        width: 100%;
        height: 48px;
        border-radius: 10px;
        background: linear-gradient(180deg, #E68E3A 0%, #E48932 100%);
        color: #ffffff;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.2px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(228, 137, 50, 0.32);
        transition: all 0.15s ease;
      }

      .submit-btn:hover:not(:disabled) {
        background: #C97420;
        box-shadow: 0 6px 18px rgba(228, 137, 50, 0.42);
        transform: translateY(-1px);
      }

      .submit-btn:active:not(:disabled) {
        background: #A8610F;
        transform: translateY(0);
      }

      .submit-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(228, 137, 50, 0.4);
      }

      .submit-btn:disabled {
        background: var(--tohfa-disabled-bg, #F0EEE4);
        color: var(--tohfa-disabled-fg, #9AA294);
        box-shadow: none;
        transform: none;
        cursor: not-allowed;
      }

      /* Spinner */
      .spinner {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #ffffff;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* ---------- Login Success View (Screen 1) ---------- */
      .success-header-icon {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-amber, #E48932);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        box-shadow: 0 4px 12px rgba(228, 137, 50, 0.18);
      }

      .role-card-highlight {
        background: var(--tohfa-amber-tint, #FBEEDE);
        border: 1px solid var(--tohfa-amber-border, #F6D9B3);
        border-radius: 10px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 24px 0;
        text-align: left;
      }

      .role-card-icon {
        color: var(--tohfa-brown, #8A4E15);
        flex: none;
      }

      .role-card-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin: 0;
      }

      .role-card-desc {
        font-size: 11.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin: 2px 0 0;
      }

      .redirect-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--tohfa-slate, #5C6B63);
        font-weight: 600;
        margin-bottom: 10px;
      }

      .redirect-spinner {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--tohfa-amber-tint, #FBEEDE);
        border-top-color: var(--tohfa-amber, #E48932);
        animation: spin 0.8s linear infinite;
      }

      .progress-bar-wrap {
        width: 100%;
        height: 4px;
        background: var(--tohfa-divider, #F0EEE4);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--tohfa-amber, #E48932);
        border-radius: 2px;
        animation: progressFill 1.8s ease-in-out forwards;
      }

      @keyframes progressFill {
        0% { width: 0%; }
        60% { width: 75%; }
        100% { width: 100%; }
      }

      /* ---------- OTP Verification View (Screen 2) ---------- */
      .otp-inputs {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin: 24px 0 20px;
      }

      .otp-box {
        width: 50px;
        height: 54px;
        text-align: center;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 20px;
        font-weight: 800;
        color: var(--tohfa-ink, #1D2420);
        background: #ffffff;
        border: 1.5px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .otp-box:focus {
        border-color: var(--tohfa-amber, #E48932);
        box-shadow: 0 0 0 3px rgba(228, 137, 50, 0.22);
      }

      .otp-resend {
        text-align: center;
        font-size: 12px;
        color: var(--tohfa-slate, #5C6B63);
        margin-bottom: 24px;
      }

      .otp-countdown {
        color: var(--tohfa-amber, #E48932);
        font-weight: 700;
      }

      /* ---------- Reset Password Requirements (Screen 4) ---------- */
      .password-requirements {
        background: var(--tohfa-page, #F7F5EE);
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 10px;
        padding: 14px 16px;
        margin: -4px 0 24px;
      }

      .req-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
        margin-bottom: 8px;
      }

      .req-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11.5px;
        color: var(--tohfa-slate, #5C6B63);
        margin-bottom: 5px;
      }

      .req-item:last-child {
        margin-bottom: 0;
      }

      .req-dot {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 1.5px solid var(--tohfa-muted, #9AA294);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        flex: none;
      }

      .req-item.met {
        color: var(--ok, #1E8E5A);
      }

      .req-item.met .req-dot {
        border-color: var(--ok, #1E8E5A);
        background: var(--ok, #1E8E5A);
        color: #ffffff;
      }

      /* ---------- Reset Success Modal (Screen 5) ---------- */
      .modal-card {
        background: #ffffff;
        border: 1px solid var(--tohfa-border, #E4E0D3);
        border-radius: 18px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
        padding: 42px 46px;
        max-width: 480px;
        width: 100%;
        text-align: center;
        animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* Role Selection Step */
      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        padding: 0;
        font-family: var(--font, 'Poppins', sans-serif);
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-slate, #5C6B63);
        cursor: pointer;
        margin-bottom: 20px;
      }

      .back-btn:hover {
        color: var(--tohfa-ink, #1D2420);
      }

      .role-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 12px;
      }

      .role-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        text-align: left;
        padding: 13px 16px;
        border: 1.5px solid var(--tohfa-border, #E4E0D3);
        border-radius: 11px;
        background: #ffffff;
        font-family: var(--font, 'Poppins', sans-serif);
        cursor: pointer;
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }

      .role-option:hover:not(:disabled) {
        border-color: var(--tohfa-amber, #E48932);
        background: var(--tohfa-amber-tint, #FBEEDE);
      }

      .role-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--tohfa-amber-tint, #FBEEDE);
        color: var(--tohfa-brown, #8A4E15);
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }

      .role-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-ink, #1D2420);
      }

      .role-chevron {
        margin-left: auto;
        color: var(--tohfa-muted, #9AA294);
      }

      /* Responsive Layout */
      @media (max-width: 1024px) {
        .auth-container {
          padding: 32px 24px;
          flex-direction: column;
          justify-content: center;
          gap: 32px;
        }

        .hero-section {
          align-self: center;
          max-width: 480px;
          margin-bottom: 0;
        }
      }

      @media (max-width: 600px) {
        .auth-container {
          padding: 16px;
        }

        .hero-section {
          display: none;
        }

        .auth-card,
        .modal-card {
          padding: 30px 22px;
        }
      }
    `,
  ],
  template: `
    <div class="auth-container" [style.background-image]="bgStyle">
      <!-- Hero Caption (Bottom-Left as in design mockup & PDF) -->
      <section class="hero-section">
        <div class="hero-caption">
          <h1>Organic from the Nilgiris,<br />Direct to People</h1>
          <div class="hero-accent-bar"></div>
        </div>
      </section>

      <!-- Main Form Section (Right side card) -->
      <section class="form-section">
        <div class="auth-card">

          <!-- Brand Logo Header (Shown on input steps) -->
          <div class="card-brand" *ngIf="currentStep() !== 'login_success'">
            <div class="brand-icon">
              <!-- Leaf / eco mark -->
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
            </div>
            <h3 class="brand-title">TOHFA</h3>
            <p class="brand-sub">A Nilgiri Sustainable Farmer Collective</p>
          </div>

          <!-- ========================================== -->
          <!-- STEP 1: LOGIN (Welcome Back)              -->
          <!-- ========================================== -->
          <ng-container *ngIf="currentStep() === 'login'">
            <div class="form-heading">
              <h2>Welcome Back!</h2>
              <p>Sign in to manage TOHFA operations</p>
            </div>

            <!-- Error Banner -->
            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <form (ngSubmit)="onSubmit()">
              <div class="field">
                <label for="mobile">Email address</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  <input
                    id="mobile"
                    type="text"
                    [(ngModel)]="mobile"
                    name="mobile"
                    placeholder="example@tohfa.com"
                    autocomplete="username"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label for="password">Password</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                  />
                  <button
                    class="toggle-visibility"
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  >
                    <svg *ngIf="!showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg *ngIf="showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="options-row">
                <label class="remember-wrap">
                  <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
                  <span>Remember me</span>
                </label>
                <button class="forgot-btn" type="button" (click)="goToStep('forgot_password')">Forgot password?</button>
              </div>

              <button class="submit-btn" type="submit" [disabled]="loading()">
                <span class="spinner" *ngIf="loading()"></span>
                {{ loading() ? 'Signing in...' : 'Sign in' }}
              </button>
            </form>
          </ng-container>

          <!-- ========================================== -->
          <!-- STEP 2: LOGIN SUCCESSFUL (Image 1)        -->
          <!-- ========================================== -->
          <ng-container *ngIf="currentStep() === 'login_success'">
            <div class="success-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </div>

            <div class="form-heading">
              <h2>Login Successful!</h2>
              <p>Welcome to TOHFA Admin Portal</p>
            </div>

            <div class="role-card-highlight">
              <div class="role-card-icon">
                <!-- Ribbon Award Badge Icon -->
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="6"></circle>
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                </svg>
              </div>
              <div>
                <h4 class="role-card-title">{{ loggedInRoleDisplay() }}</h4>
                <p class="role-card-desc">{{ loggedInRoleDescription() }}</p>
              </div>
            </div>

            <div class="redirect-status">
              <div class="redirect-spinner"></div>
              <span>Redirecting to dashboard</span>
            </div>

            <div class="progress-bar-wrap">
              <div class="progress-bar-fill"></div>
            </div>
          </ng-container>

          <!-- ========================================== -->
          <!-- STEP 3: FORGOT PASSWORD (Image 3)         -->
          <!-- ========================================== -->
          <ng-container *ngIf="currentStep() === 'forgot_password'">
            <div class="form-heading">
              <h2>Forgot Password?</h2>
              <p>Enter your registered email ID to receive an OTP to reset your password.</p>
            </div>

            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <form (ngSubmit)="onSendResetOtp()">
              <div class="field">
                <label for="resetEmail">Email address</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  <input
                    id="resetEmail"
                    type="email"
                    [(ngModel)]="resetEmail"
                    name="resetEmail"
                    placeholder="example@tohfa.com"
                    required
                  />
                </div>
              </div>

              <button class="submit-btn" type="submit" [disabled]="loading()">
                <span class="spinner" *ngIf="loading()"></span>
                {{ loading() ? 'Sending...' : 'Send Verification Code' }}
              </button>
            </form>

            <div class="back-link-wrap">
              <button class="back-link-btn" type="button" (click)="goToStep('login')">
                &#8249; Back to login
              </button>
            </div>
          </ng-container>

          <!-- ========================================== -->
          <!-- STEP 4: VERIFY OTP (Image 2)              -->
          <!-- ========================================== -->
          <ng-container *ngIf="currentStep() === 'verify_otp'">
            <div class="form-heading">
              <h2>Verify your Email ID</h2>
              <p>Enter the 6-digit OTP sent to {{ maskedEmail() }}</p>
            </div>

            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <form (ngSubmit)="onVerifyOtp()">
              <div class="otp-inputs">
                <input
                  #otpInput
                  *ngFor="let digit of otpDigits; let i = index"
                  type="text"
                  maxlength="1"
                  class="otp-box"
                  [value]="otpDigits[i]"
                  (input)="onOtpInput($event, i)"
                  (keydown)="onOtpKeydown($event, i)"
                  (paste)="onOtpPaste($event)"
                />
              </div>

              <div class="otp-resend">
                <span>Resend OTP: </span>
                <span class="otp-countdown">{{ resendTimerFormatted() }}</span>
              </div>

              <button class="submit-btn" type="submit" [disabled]="loading() || !isOtpComplete()">
                <span class="spinner" *ngIf="loading()"></span>
                {{ loading() ? 'Verifying...' : 'Verify OTP' }}
              </button>
            </form>

            <div class="back-link-wrap">
              <button class="back-link-btn" type="button" (click)="goToStep('login')">
                &#8249; Back to login
              </button>
            </div>
          </ng-container>

          <!-- ========================================== -->
          <!-- STEP 5: RESET PASSWORD (Image 4)          -->
          <!-- ========================================== -->
          <ng-container *ngIf="currentStep() === 'reset_password'">
            <div class="form-heading">
              <h2>Reset Password?</h2>
              <p>Create a new password for your account.</p>
            </div>

            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <form (ngSubmit)="onSaveNewPassword()">
              <div class="field">
                <label for="newPassword">New Password</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="newPassword"
                    [type]="showNewPassword() ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    class="toggle-visibility"
                    type="button"
                    (click)="showNewPassword.set(!showNewPassword())"
                  >
                    <svg *ngIf="!showNewPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg *ngIf="showNewPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="field">
                <label for="confirmPassword">Confirm New Password</label>
                <div class="input-wrap">
                  <svg class="leading-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="confirmPassword"
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    class="toggle-visibility"
                    type="button"
                    (click)="showConfirmPassword.set(!showConfirmPassword())"
                  >
                    <svg *ngIf="!showConfirmPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg *ngIf="showConfirmPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Password Requirements List -->
              <div class="password-requirements">
                <div class="req-title">Password requirements:</div>
                <div class="req-item" [class.met]="hasMinLength()">
                  <span class="req-dot">&#10003;</span>
                  <span>At least 8 characters long</span>
                </div>
                <div class="req-item" [class.met]="hasUpperAndLower()">
                  <span class="req-dot">&#10003;</span>
                  <span>Include uppercase and lowercase letters</span>
                </div>
                <div class="req-item" [class.met]="hasNumber()">
                  <span class="req-dot">&#10003;</span>
                  <span>Include at least one number</span>
                </div>
              </div>

              <button class="submit-btn" type="submit" [disabled]="loading() || !canSubmitReset()">
                <span class="spinner" *ngIf="loading()"></span>
                {{ loading() ? 'Updating...' : 'Send Verification Code' }}
              </button>
            </form>

            <div class="back-link-wrap">
              <button class="back-link-btn" type="button" (click)="goToStep('login')">
                &#8249; Back to login
              </button>
            </div>
          </ng-container>

          <!-- ========================================== -->
          <!-- STEP 6: ROLE SELECTION (Multi-Role Users) -->
          <!-- ========================================== -->
          <ng-container *ngIf="currentStep() === 'role_select'">
            <button class="back-btn" type="button" (click)="goToStep('login')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back
            </button>

            <div class="form-heading">
              <h2>Select active role</h2>
              <p>Choose which administrative role to access.</p>
            </div>

            <div class="alert" *ngIf="errorMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>

            <div class="role-list">
              <button
                *ngFor="let role of availableRoles()"
                class="role-option"
                type="button"
                [disabled]="loading()"
                (click)="onSelectRole(role)"
              >
                <span class="role-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span class="role-name">{{ role }}</span>
                <svg class="role-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </ng-container>

        </div>
      </section>

      <!-- ========================================== -->
      <!-- STEP 7: PASSWORD RESET SUCCESS MODAL (Img 5)-->
      <!-- ========================================== -->
      <div class="auth-scrim" *ngIf="currentStep() === 'reset_success'">
        <div class="modal-card">
          <div class="success-header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          </div>

          <div class="form-heading">
            <h2>Password Reset Successfully!</h2>
            <p>Your password has been updated successfully. You can now sign in with your new password.</p>
          </div>

          <button class="submit-btn" type="button" (click)="goToStep('login')">
            Back to login
          </button>
        </div>
      </div>

    </div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputElements!: QueryList<ElementRef<HTMLInputElement>>;

  private readonly auth = inject(AuthService);
  private readonly rbac = inject(RbacService);
  private readonly router = inject(Router);

  // Background image data
  // Background image data with targeted contrast gradient for bottom-left and soft feather for right card
  readonly bgStyle = `linear-gradient(to top right, rgba(10, 24, 14, 0.68) 0%, rgba(10, 24, 14, 0.25) 26%, transparent 52%), linear-gradient(to right, transparent 32%, rgba(255, 255, 255, 0.2) 60%, rgba(247, 245, 238, 0.82) 100%), url(${AUTH_BG_BASE64})`;

  // Current view step
  currentStep = signal<AuthScreenStep>('login');

  // Login form state
  mobile = '';
  password = '';
  rememberMe = true;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  // Forgot password & OTP state
  resetEmail = 'superadmin@gmail.com';
  otpDigits = ['', '', '', '', '', ''];
  resendSeconds = signal(56);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // New password state
  newPassword = '';
  confirmPassword = '';
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Roles state
  availableRoles = signal<RoleCode[]>([]);
  loggedInRoleDisplay = signal('Super Admin (SA)');
  loggedInRoleDescription = signal('Full system authority and configuration');

  async ngOnInit(): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await this.navigateAfterLogin();
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  goToStep(step: AuthScreenStep): void {
    this.errorMessage.set(null);
    this.currentStep.set(step);

    if (step === 'verify_otp') {
      this.startResendTimer();
      setTimeout(() => {
        const first = this.otpInputElements?.first?.nativeElement;
        if (first) first.focus();
      }, 100);
    }
  }

  // --- Password validation getters ---
  hasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }
  hasUpperAndLower(): boolean {
    return /[a-z]/.test(this.newPassword) && /[A-Z]/.test(this.newPassword);
  }
  hasNumber(): boolean {
    return /\d/.test(this.newPassword);
  }
  canSubmitReset(): boolean {
    return (
      this.hasMinLength() &&
      this.hasUpperAndLower() &&
      this.hasNumber() &&
      this.newPassword === this.confirmPassword &&
      this.confirmPassword.length > 0
    );
  }

  // --- OTP Logic ---
  maskedEmail(): string {
    const email = this.resetEmail || 'superadmin@gmail.com';
    const parts = email.split('@');
    const user = parts[0] ?? '';
    const domain = parts[1] ?? 'gmail.com';
    if (user.length > 3) {
      return `${user.slice(0, 5)}*******@${domain}`;
    }
    return 'super*******@gmail.com';
  }

  resendTimerFormatted(): string {
    const s = this.resendSeconds();
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  startResendTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.resendSeconds.set(56);
    this.timerInterval = setInterval(() => {
      if (this.resendSeconds() > 0) {
        this.resendSeconds.update((s) => s - 1);
      } else {
        if (this.timerInterval) clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    const char = val ? (val[val.length - 1] ?? '') : '';
    this.otpDigits[index] = char;
    input.value = char;

    if (val && index < 5) {
      const el = this.otpInputElements.get(index + 1)?.nativeElement;
      if (el) el.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prev = this.otpInputElements.get(index - 1)?.nativeElement;
      if (prev) {
        prev.focus();
        this.otpDigits[index - 1] = '';
        prev.value = '';
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => {
      if (i < 6) {
        this.otpDigits[i] = d;
        const el = this.otpInputElements.get(i)?.nativeElement;
        if (el) el.value = d;
      }
    });
    const nextIdx = Math.min(digits.length, 5);
    this.otpInputElements.get(nextIdx)?.nativeElement?.focus();
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every((d) => d.length === 1);
  }

  onSendResetOtp(): void {
    if (!this.resetEmail) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.goToStep('verify_otp');
    }, 600);
  }

  onVerifyOtp(): void {
    if (!this.isOtpComplete()) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.goToStep('reset_password');
    }, 600);
  }

  onSaveNewPassword(): void {
    if (!this.canSubmitReset()) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.goToStep('reset_success');
    }, 600);
  }

  // --- Login & Role Submission ---
  private async navigateAfterLogin(): Promise<void> {
    if (!this.rbac.loaded()) {
      await this.rbac.load();
    }
    const target = this.rbac.firstAllowedPath(NAV);
    await this.router.navigateByUrl(target);
  }

  async onSubmit(): Promise<void> {
    if (!this.mobile || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await this.auth.login(this.mobile, this.password);
      if (res.requiresRoleSelection && res.availableRoles) {
        const roles = res.availableRoles.map((r) => (typeof r === 'string' ? r : r.code));
        this.availableRoles.set(roles);
        this.goToStep('role_select');
      } else {
        // Show Login Successful screen with smooth transition
        this.showLoginSuccessAnimation('Super Admin (SA)', 'Full system authority and configuration');
      }
    } catch (err: unknown) {
      const e = err as { problem?: { detail?: string }; error?: { detail?: string }; message?: string };
      this.errorMessage.set(
        e.problem?.detail ?? e.error?.detail ?? e.message ?? 'Invalid credentials. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async onSelectRole(role: RoleCode): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.login(this.mobile, this.password, role);
      this.showLoginSuccessAnimation(role, 'Role-based authority and dashboard');
    } catch (err: unknown) {
      const e = err as { problem?: { detail?: string }; error?: { detail?: string }; message?: string };
      this.errorMessage.set(
        e.problem?.detail ?? e.error?.detail ?? e.message ?? 'Failed to select role. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private showLoginSuccessAnimation(roleTitle: string, roleDesc: string): void {
    this.loggedInRoleDisplay.set(roleTitle);
    this.loggedInRoleDescription.set(roleDesc);
    this.currentStep.set('login_success');

    // Wait for the progress bar animation (1.8s) then navigate
    setTimeout(async () => {
      await this.navigateAfterLogin();
    }, 1800);
  }
}
