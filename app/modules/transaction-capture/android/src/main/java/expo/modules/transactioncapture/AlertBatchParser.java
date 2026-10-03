package expo.modules.transactioncapture;

import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;

/** Parse bundled notifications one message at a time. Outputs never contain raw text. */
public final class AlertBatchParser {
  public static final class Message {
    public final String text;
    public final long timestamp;
    public Message(String text, long timestamp) { this.text=text; this.timestamp=timestamp; }
  }
  public static final class Parsed {
    public final AlertParser.Result result;
    public final long timestamp;
    public Parsed(AlertParser.Result result, long timestamp) { this.result=result; this.timestamp=timestamp; }
  }
  public static List<Parsed> parse(String source, String title, List<Message> messages, long notificationTime, TimeZone zone) {
    List<Parsed> results=new ArrayList<>();
    for(Message message: messages) {
      long timestamp=message.timestamp>0 ? message.timestamp : notificationTime;
      AlertParser.Result result=message.text==null || (messages.size()>1 && message.timestamp<=0)
        ? AlertParser.parse(null,timestamp,zone)
        : AlertParser.parseNotification(source,title,message.text,timestamp,zone);
      results.add(new Parsed(result,timestamp));
    }
    return results;
  }
}
