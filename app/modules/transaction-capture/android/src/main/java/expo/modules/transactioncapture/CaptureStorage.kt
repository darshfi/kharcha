package expo.modules.transactioncapture

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONArray
import org.json.JSONObject

/** Single encrypted, atomic snapshot shared by the listener and Expo bridge. No auth tokens. */
internal object CaptureStorage {
  private const val KEY = "kharcha_capture_v1"
  private fun prefs(context: Context) = context.getSharedPreferences(KEY, Context.MODE_PRIVATE)
  private fun key(): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (store.getKey(KEY, null) as? SecretKey)?.let { return it }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
      init(KeyGenParameterSpec.Builder(KEY, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
    }.generateKey()
  }
  private fun read(context: Context): JSONObject {
    val encoded = prefs(context).getString("snapshot", null) ?: return JSONObject().put("users", JSONObject())
    val bytes = Base64.decode(encoded, Base64.NO_WRAP)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
    return JSONObject(String(cipher.doFinal(bytes.copyOfRange(12, bytes.size)), Charsets.UTF_8))
  }
  private fun write(context: Context, state: JSONObject) {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key())
    val encoded = Base64.encodeToString(cipher.iv + cipher.doFinal(state.toString().toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    check(prefs(context).edit().putString("snapshot", encoded).commit()) { "Capture storage is unavailable" }
  }
  private fun user(state: JSONObject, userId: String): JSONObject {
    val users = state.getJSONObject("users")
    if (!users.has(userId)) users.put(userId, JSONObject().put("enabled", false).put("sources", JSONArray()).put("queue", JSONArray()).put("seen", JSONObject()).put("skipped", JSONObject()).put("saved", 0).put("dropped", 0))
    return users.getJSONObject(userId)
  }
  @Synchronized fun setUser(context: Context, userId: String?) {
    val state=read(context)
    if(userId == null) state.remove("activeUser") else { user(state,userId); state.put("activeUser", userId) }
    write(context,state)
  }
  @Synchronized fun configure(context: Context, userId: String, enabled: Boolean, sources: List<String>) {
    val state=read(context)
    check(state.optString("activeUser") == userId) { "Sign in to this account first" }
    val settings=user(state,userId)
    if (enabled && !settings.optBoolean("enabled")) settings.put("enabledAt",System.currentTimeMillis())
    settings.put("enabled",enabled).put("sources",JSONArray(sources.distinct()))
    write(context,state)
  }
  @Synchronized fun allows(context: Context, source: String, postedAt: Long): Boolean {
    val state=read(context)
    val owner=state.optString("activeUser")
    if(owner.isEmpty()) return false
    val settings=user(state,owner)
    val sources=settings.getJSONArray("sources")
    return settings.optBoolean("enabled") && postedAt>=settings.optLong("enabledAt") &&
      (0 until sources.length()).any { sources.getString(it)==source }
  }
  @Synchronized fun capture(context: Context, source: String, postedAt: Long, eventId: String, result: AlertParser.Result) {
    val state=read(context)
    val owner=state.optString("activeUser")
    if(owner.isEmpty()) return
    val settings=user(state,owner)
    val sources=settings.getJSONArray("sources")
    if(!settings.optBoolean("enabled") || (0 until sources.length()).none { sources.getString(it)==source } || postedAt<settings.optLong("enabledAt")) return
    settings.put("lastNotificationAt",System.currentTimeMillis()).put("lastSourcePackage",source)
    val seen=settings.getJSONObject("seen")
    if(seen.has(eventId)) { write(context,state); return }
    // Keep recent event hashes, never raw notification contents. The server retains permanent import tombstones.
    val cutoff=System.currentTimeMillis()-45L*24*60*60*1000
    seen.keys().asSequence().toList().forEach { if(seen.optLong(it)<cutoff) seen.remove(it) }
    if(seen.length()>=4000) seen.remove(seen.keys().asSequence().minByOrNull { seen.optLong(it) } ?: "")
    seen.put(eventId,postedAt)
    if(!result.accepted()) {
      val skipped=settings.getJSONObject("skipped")
      skipped.put(result.reason,skipped.optInt(result.reason)+1)
    } else {
      val queue=settings.getJSONArray("queue")
      if(queue.length()>=1000) settings.put("dropped",settings.optInt("dropped")+1)
      else queue.put(JSONObject().put("userId",owner).put("eventId",eventId).put("sourcePackage",source)
        .put("postedAt",postedAt).put("type",result.type).put("amount",result.amount.toPlainString())
        .put("balanceAfter",result.balance?.toPlainString() ?: JSONObject.NULL).put("reference",result.reference)
        .put("date",result.date).put("paymentMode",result.paymentMode))
    }
    write(context,state)
  }
  @Synchronized fun status(context: Context, owner: String): JSONObject {
    val state=read(context)
    val settings=user(state,owner)
    return JSONObject().put("enabled",settings.optBoolean("enabled")).put("sources",settings.getJSONArray("sources"))
      .put("pending",settings.getJSONArray("queue").length()).put("skipped",settings.getJSONObject("skipped"))
      .put("saved",settings.optInt("saved")).put("dropped",settings.optInt("dropped"))
      .put("activeForAccount",state.optString("activeUser")==owner)
      .put("lastNotificationAt",settings.optLong("lastNotificationAt"))
      .put("lastSourcePackage",settings.optString("lastSourcePackage"))
      .put("storageError",prefs(context).getBoolean("storageError",false))
  }
  @Synchronized fun pending(context: Context, owner: String): JSONArray {
    val state=read(context)
    check(state.optString("activeUser")==owner) { "Account changed" }
    return user(state,owner).getJSONArray("queue")
  }
  @Synchronized fun acknowledge(context: Context, owner: String, eventId: String, skippedReason: String? = null) {
    val state=read(context)
    // ACK after an account switch is safe only for the original owner's entry.
    val settings=user(state,owner)
    val queue=settings.getJSONArray("queue")
    val remaining=JSONArray()
    var found=false
    for(i in 0 until queue.length()) {
      val entry=queue.getJSONObject(i)
      if(entry.optString("eventId")==eventId) found=true else remaining.put(entry)
    }
    if(found) {
      if(skippedReason == null) settings.put("saved",settings.optInt("saved")+1)
      else {
        val skipped=settings.getJSONObject("skipped")
        skipped.put(skippedReason,skipped.optInt(skippedReason)+1)
      }
    }
    settings.put("queue",remaining)
    write(context,state)
  }
  fun markError(context: Context) { prefs(context).edit().putBoolean("storageError",true).commit() }
}
