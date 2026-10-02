package expo.modules.transactioncapture

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.service.notification.NotificationListenerService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TransactionCaptureModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext) { "App context unavailable" }
  override fun definition() = ModuleDefinition {
    Name("TransactionCapture")
    Function("setActiveUser") { owner: String? -> CaptureStorage.setUser(context,owner) }
    Function("configure") { owner: String, enabled: Boolean, sources: List<String> ->
      require(sources.size<=25 && sources.all { it.matches(Regex("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+")) }) { "Choose valid Android application packages" }
      CaptureStorage.configure(context,owner,enabled,sources)
      if(enabled) NotificationListenerService.requestRebind(ComponentName(context,CaptureListenerService::class.java))
    }
    Function("getStatus") { owner: String ->
      val component=ComponentName(context,CaptureListenerService::class.java).flattenToString()
      val access=Settings.Secure.getString(context.contentResolver,"enabled_notification_listeners").orEmpty().split(":").contains(component)
      CaptureStorage.status(context,owner).put("permissionGranted",access).toString()
    }
    Function("getPending") { owner: String -> CaptureStorage.pending(context,owner).toString() }
    Function("acknowledge") { owner: String, eventId: String -> CaptureStorage.acknowledge(context,owner,eventId) }
    Function("reject") { owner: String, eventId: String -> CaptureStorage.acknowledge(context,owner,eventId,"conflicting_import") }
    Function("openNotificationSettings") {
      context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
}
