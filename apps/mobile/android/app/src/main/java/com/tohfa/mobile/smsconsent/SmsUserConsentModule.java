package com.tohfa.mobile.smsconsent;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;

/**
 * Google SMS User Consent API, exposed to JS as `TohfaSmsUserConsent`
 * (spec: src/shell/otp/native/NativeTohfaSmsUserConsent.ts).
 *
 * Why this API: it needs no READ_SMS permission (Play policy forbids that
 * for OTP use) and, unlike the SMS Retriever API, no app-signature hash in
 * the message body — our OTP SMS is written by Twilio Verify. Play services
 * shows a one-tap "allow this app to read this message" sheet; only the
 * message the user approves is handed to us.
 *
 * Why Java and not Kotlin: the app's package `in.tohfa.mobile` cannot be a
 * Java package (`in` is a keyword) and codegen emits Java, so the module
 * lives under `com.tohfa.mobile.smsconsent` (see package.json codegenConfig).
 *
 * The promise never rejects: every failure resolves "" so JS falls back to
 * manual entry without an error path.
 */
public class SmsUserConsentModule extends NativeTohfaSmsUserConsentSpec implements ActivityEventListener {

  public static final String NAME = "TohfaSmsUserConsent";
  private static final int CONSENT_REQUEST_CODE = 0x5C0D;
  private static final String GMS_PACKAGE = "com.google.android.gms";

  @Nullable private Promise pending;
  @Nullable private BroadcastReceiver receiver;
  private int armingGeneration = 0;
  private int consentSheetGeneration = -1;

  public SmsUserConsentModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addActivityEventListener(this);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void listenForOneSms(Promise promise) {
    // A new arming supersedes the old one (e.g. after "Resend").
    finish("");

    Activity activity = getReactApplicationContext().getCurrentActivity();
    if (activity == null) {
      promise.resolve("");
      return;
    }

    final int generation;
    synchronized (this) {
      armingGeneration++;
      generation = armingGeneration;
      pending = promise;
    }

    BroadcastReceiver smsReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        if (!SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) {
          return;
        }
        Bundle extras = intent.getExtras();
        if (extras == null) {
          finish("");
          return;
        }
        @SuppressWarnings("deprecation")
        Object statusExtra = extras.get(SmsRetriever.EXTRA_STATUS);
        Status status = statusExtra instanceof Status ? (Status) statusExtra : null;
        if (status == null || status.getStatusCode() != CommonStatusCodes.SUCCESS) {
          // CommonStatusCodes.TIMEOUT after five minutes with no SMS.
          finish("");
          return;
        }
        @SuppressWarnings("deprecation")
        Object consentExtra = extras.get(SmsRetriever.EXTRA_CONSENT_INTENT);
        Intent consentIntent = consentExtra instanceof Intent ? (Intent) consentExtra : null;
        Activity current = getReactApplicationContext().getCurrentActivity();
        if (consentIntent == null || current == null || !isFromPlayServices(current, consentIntent)) {
          finish("");
          return;
        }
        try {
          synchronized (SmsUserConsentModule.this) {
            consentSheetGeneration = generation;
          }
          current.startActivityForResult(consentIntent, CONSENT_REQUEST_CODE);
        } catch (ActivityNotFoundException e) {
          finish("");
        }
      }
    };
    synchronized (this) {
      receiver = smsReceiver;
    }
    try {
      ContextCompat.registerReceiver(
          getReactApplicationContext(),
          smsReceiver,
          new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION),
          SmsRetriever.SEND_PERMISSION,
          null,
          ContextCompat.RECEIVER_EXPORTED);
      SmsRetriever.getClient(activity)
          .startSmsUserConsent(null)
          .addOnFailureListener(e -> finish(""));
    } catch (RuntimeException e) {
      // No / outdated Play services, or the receiver could not register.
      finish("");
    }
  }

  @Override
  public void stopListening() {
    finish("");
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
    if (requestCode != CONSENT_REQUEST_CODE) {
      return;
    }
    // Ignore results from a superseded arming (user tapped Resend while the
    // consent sheet was open — the old SMS belongs to the previous challenge).
    synchronized (this) {
      if (consentSheetGeneration != armingGeneration) {
        return;
      }
      consentSheetGeneration = -1;
    }
    String message = "";
    if (resultCode == Activity.RESULT_OK && data != null) {
      String sms = data.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE);
      message = sms == null ? "" : sms;
    }
    finish(message);
  }

  @Override
  public void onNewIntent(Intent intent) {
    // Not used.
  }

  @Override
  public void invalidate() {
    finish("");
    getReactApplicationContext().removeActivityEventListener(this);
    super.invalidate();
  }

  /**
   * The consent intent arrives in a broadcast; only launch it if it resolves
   * to Play services, so a spoofed broadcast cannot make us start an
   * arbitrary activity (Android "intent redirection").
   */
  private static boolean isFromPlayServices(Activity activity, Intent consentIntent) {
    ComponentName target = consentIntent.resolveActivity(activity.getPackageManager());
    return target != null && GMS_PACKAGE.equals(target.getPackageName());
  }

  private synchronized void finish(String message) {
    consentSheetGeneration = -1;
    BroadcastReceiver smsReceiver = receiver;
    receiver = null;
    if (smsReceiver != null) {
      try {
        getReactApplicationContext().unregisterReceiver(smsReceiver);
      } catch (IllegalArgumentException ignored) {
        // Already unregistered.
      }
    }
    Promise promise = pending;
    pending = null;
    if (promise != null) {
      promise.resolve(message);
    }
  }
}
