package `in`.tohfa.mobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

// Single app for every role now -- one JS entry (index.js), one
// MainApplication. Role-based routing (which screens a signed-in user sees)
// happens inside the JS bundle, not by choosing a different native entry.
//
// RN 0.88 template: the old-architecture ReactNativeHost / SoLoader.init path
// is gone. New Architecture (Fabric + TurboModules, bridgeless) is the only
// architecture, so there is no IS_NEW_ARCHITECTURE_ENABLED branch any more.
class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
