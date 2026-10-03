package expo.modules.transactioncapture

import android.app.Notification
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.security.MessageDigest
import java.util.TimeZone

class CaptureListenerService : NotificationListenerService() {
  companion object { @Volatile var connected = false; private set }
  override fun onListenerConnected() { connected = true }
  override fun onListenerDisconnected() { connected = false }
  override fun onDestroy() { connected = false; super.onDestroy() }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      if(!CaptureStorage.allows(applicationContext,sbn.packageName,sbn.postTime)) return
      val notification=sbn.notification
      if(notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
      val extras=notification.extras
      val title=extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
      val bundles=extras.getParcelableArray(Notification.EXTRA_MESSAGES)
      // EXTRA_MESSAGES often contains several unread bank SMS. Joining them is ambiguous,
      // but rejecting the whole notification also loses every new completed payment.
      val messages=if(!bundles.isNullOrEmpty()) {
        if(Build.VERSION.SDK_INT>=30) Notification.MessagingStyle.Message.getMessagesFromBundleArray(bundles)
          .map { AlertBatchParser.Message(it.text?.toString(),it.timestamp) }
        else bundles.filterIsInstance<Bundle>().map {
          // MessagingStyle's serialized text/time fields on API24-29; never use hidden APIs.
          AlertBatchParser.Message(it.getCharSequence("text")?.toString(),it.getLong("time"))
        }
      } else {
        val lines=extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
        // Inbox summaries have no per-alert arrival times. Reposting an old summary
        // must not convert alerts from before opt-in into new transactions.
        if(!lines.isNullOrEmpty() && lines.size>1) listOf(AlertBatchParser.Message(null,sbn.postTime))
        else listOf(AlertBatchParser.Message((extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
          ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString(),sbn.postTime))
      }
      val inputs=messages.ifEmpty { listOf(AlertBatchParser.Message(null,sbn.postTime)) }
      for((index,parsed) in AlertBatchParser.parse(sbn.packageName,title,inputs,sbn.postTime,TimeZone.getDefault()).withIndex()) {
        val result=parsed.result
        // Accepted identities are stable across notification updates that repeat unread
        // messages. References also dedupe distinct source apps atomically on the server.
        val eventTime=if(result.accepted()) "" else "${notification.`when`}|${parsed.timestamp}|$index"
        val identity="${sbn.packageName}|${sbn.key}|$eventTime|${result.type}|${result.amount}|${result.reference}|${result.reason}"
        val eventId=MessageDigest.getInstance("SHA-256").digest(identity.toByteArray()).joinToString("") { "%02x".format(it) }
        CaptureStorage.capture(applicationContext,sbn.packageName,parsed.timestamp,eventId,result)
      }
    } catch (_: Exception) {
      // No content or exception logging: notification text can contain private information.
      CaptureStorage.markError(applicationContext)
    }
  }
}
