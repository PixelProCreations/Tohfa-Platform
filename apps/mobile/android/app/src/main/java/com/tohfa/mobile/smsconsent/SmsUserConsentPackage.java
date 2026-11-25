package com.tohfa.mobile.smsconsent;

import androidx.annotation.Nullable;

import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

/** Registers SmsUserConsentModule; added by hand in MainApplication (app code is not autolinked). */
public class SmsUserConsentPackage extends BaseReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (SmsUserConsentModule.NAME.equals(name)) {
      return new SmsUserConsentModule(reactContext);
    }
    return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      Map<String, ReactModuleInfo> infos = new HashMap<>();
      infos.put(
          SmsUserConsentModule.NAME,
          new ReactModuleInfo(
              SmsUserConsentModule.NAME,
              SmsUserConsentModule.class.getName(),
              false, // canOverrideExistingModule
              false, // needsEagerInit
              false, // isCxxModule
              true // isTurboModule
          ));
      return infos;
    };
  }
}
