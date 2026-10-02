package expo.modules.transactioncapture

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.security.MessageDigest
import java.util.TimeZone

class CaptureListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      if(!CaptureStorage.allows(applicationContext,sbn.packageName,sbn.postTime)) return
      val notification=sbn.notification
      if(notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
      val extras=notification.extras
      // Summaries/multiple SMS messages cannot establish a single completed event.
      val multiple=(extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.size ?: 0)>1 ||
        (extras.getParcelableArray(Notification.EXTRA_MESSAGES)?.size ?: 0)>1
      val result=if(multiple) AlertParser.parse(null,sbn.postTime,TimeZone.getDefault()) else {
        val title=extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val body=(extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()
        AlertParser.parseNotification(sbn.packageName,title,body,sbn.postTime,TimeZone.getDefault())
      }
      // Notification keys can be reused. Include completed-event semantics and notification.when;
      // repeated source updates remain safe even if postTime changes (reference dedupe on server).
      val identity="${sbn.packageName}|${sbn.key}|${notification.`when`}|${result.type}|${result.amount}|${result.reference}|${result.reason}"
      val eventId=MessageDigest.getInstance("SHA-256").digest(identity.toByteArray()).joinToString("") { "%02x".format(it) }
      CaptureStorage.capture(applicationContext,sbn.packageName,sbn.postTime,eventId,result)
    } catch (_: Exception) {
      // No content or exception logging: notification text can contain private information.
      CaptureStorage.markError(applicationContext)
    }
  }
}
