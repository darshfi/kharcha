package expo.modules.transactioncapture;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.Date;
import java.util.TimeZone;
import java.util.Locale;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Deliberately narrow INR grammar. Never returns or retains the original notification. */
public final class AlertParser {
  private static final Pattern BLOCKED = Pattern.compile("\\b(otp|one[ -]time|verification|verify|collect|request(?:ed)?|reminder|due|pending|processing|failed|failure|declined|unsuccessful|revers(?:ed|al)|cashback|reward(?:s)?|offer(?:s)?|eligible|mandate|scheduled|will be|to be|may be|might be|would be|can be|voucher|coupon|prize|winner|win|won|congratulations|pre[ -]?approved|sanctioned|loan|credit limit)\\b", Pattern.CASE_INSENSITIVE);
  private static final Pattern DEBIT = Pattern.compile("\\b(debited|spent|withdrawn|sent)\\b|\\bpaid\\b(?!\\s+you\\b)|\\bDr\\.?\\s*(?=(?:INR|Rs\\.?|₹)\\s*[0-9])", Pattern.CASE_INSENSITIVE);
  private static final Pattern CREDIT = Pattern.compile("\\b(credited|received|deposited)\\b|\\bpaid\\s+you\\b|\\bCr\\.?\\s*(?=(?:INR|Rs\\.?|₹)\\s*[0-9])", Pattern.CASE_INSENSITIVE);
  // Consume the complete numeric token before validating, so malformed commas/decimals
  // cannot backtrack into a smaller, plausible-looking amount.
  private static final Pattern MONEY = Pattern.compile("(?:₹\\s*|\\bINR\\s*|\\bRs\\.?\\s*)([0-9][0-9.,]*)(?![0-9.,])", Pattern.CASE_INSENSITIVE);
  private static final Pattern VALID_MONEY = Pattern.compile("(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3})(?:\\.[0-9]{1,2})?");
  private static final Pattern REFERENCE = Pattern.compile("\\b(?:UPI\\s*(?:ref(?:erence)?|txn|transaction)|UTR|RRN|ref(?:erence)?|transaction\\s*(?:id|no|number)|txn\\s*(?:id|no|number))\\s*(?:no\\.?|number|id)?\\s*[:#.-]?\\s*([a-z0-9]{6,40})\\b", Pattern.CASE_INSENSITIVE);
  private static final Pattern NUM_DATE = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})\\b");
  private static final Pattern NAMED_DATE = Pattern.compile("\\b(\\d{1,2}[- ](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[- ]\\d{2,4})\\b", Pattern.CASE_INSENSITIVE);
  private static final Pattern UPI_REFERENCE = Pattern.compile("\\bUPI/(CR|DR)/([0-9]{9,14})(?=/|\\b)", Pattern.CASE_INSENSITIVE);

  public static final class Result {
    public final String reason, type, reference, date, paymentMode;
    public final BigDecimal amount, balance;
    private Result(String reason, String type, BigDecimal amount, BigDecimal balance, String reference, String date, String paymentMode) {
      this.reason=reason; this.type=type; this.amount=amount; this.balance=balance; this.reference=reference; this.date=date; this.paymentMode=paymentMode;
    }
    public boolean accepted() { return reason == null; }
  }
  private static Result skip(String reason) { return new Result(reason,null,null,null,null,null,null); }

  public static Result parseNotification(String source, String title, String body, long postedAt, TimeZone zone) {
    // Sender/contact names are not a bank allow-list. Selected Messages apps may
    // supply alerts from any sender; the completed-payment grammar decides acceptance.
    if ("com.google.android.apps.messaging".equals(source) || "com.samsung.android.messaging".equals(source)) {
      return parse(body, postedAt, zone);
    }
    return parse((title==null ? "" : title)+" "+(body==null ? "" : body),postedAt,zone);
  }

  public static Result parse(String text, long postedAt, TimeZone zone) {
    if (text == null || text.length() > 8000) return skip("unsupported_format");
    text = text.replace('\u00a0',' ');
    if (BLOCKED.matcher(text).find()) return skip("not_completed_payment");
    boolean debit=DEBIT.matcher(text).find(), credit=CREDIT.matcher(text).find();
    if (debit == credit) return skip("unclear_direction");
    Set<BigDecimal> amounts = new HashSet<>();
    BigDecimal balance=null;
    Matcher money=MONEY.matcher(text);
    while (money.find()) {
      String prefix=text.substring(Math.max(0,money.start()-35),money.start()).toLowerCase(Locale.ROOT);
      String token=money.group(1);
      // A sentence-ending period follows the amount in many bank alerts.
      // Strip only that final punctuation; malformed grouping/precision still fails.
      if(token.endsWith(".")) token=token.substring(0,token.length()-1);
      if(!VALID_MONEY.matcher(token).matches()) return skip("unclear_amount");
      BigDecimal value;
      try { value=new BigDecimal(token.replace(",", "")).setScale(2); }
      catch (ArithmeticException | NumberFormatException e) { return skip("unclear_amount"); }
      if (prefix.matches("(?s).*\\b(?:balance|bal|bal\\.|avl bal|available balance)\\s*[:=.-]?\\s*$")) { balance=value; continue; }
      // A currency amount must be adjacent to a completed payment verb, not an offer/balance elsewhere.
      String near=text.substring(Math.max(0,money.start()-55),Math.min(text.length(),money.end()+55));
      if (!(debit ? DEBIT : CREDIT).matcher(near).find()) return skip("unclear_amount");
      amounts.add(value);
    }
    if (amounts.size()!=1) return skip("unclear_amount");
    BigDecimal amount=amounts.iterator().next();
    if (amount.signum()<=0 || amount.compareTo(new BigDecimal("9999999999.99"))>0) return skip("unclear_amount");
    Matcher refs=REFERENCE.matcher(text);
    Set<String> references=new HashSet<>();
    while(refs.find()) references.add(refs.group(1).toUpperCase(Locale.ROOT));
    Matcher upiRefs=UPI_REFERENCE.matcher(text);
    while(upiRefs.find()) {
      if (debit != upiRefs.group(1).equalsIgnoreCase("DR")) return skip("unclear_direction");
      references.add(upiRefs.group(2));
    }
    if(references.size()!=1) return skip("missing_or_conflicting_reference");
    SimpleDateFormat dateFormat=new SimpleDateFormat("yyyy-MM-dd",Locale.US);
    dateFormat.setTimeZone(zone);
    String date=dateFormat.format(new Date(postedAt));
    Matcher dates=NUM_DATE.matcher(text);
    Set<String> parsedDates=new HashSet<>();
    while(dates.find()) {
      String parsed=parseDate(dates.group(1));
      if(parsed==null) return skip("invalid_date");
      parsedDates.add(parsed);
    }
    dates=NAMED_DATE.matcher(text);
    while(dates.find()) {
      String parsed=parseDate(dates.group(1));
      if(parsed==null) return skip("invalid_date");
      parsedDates.add(parsed);
    }
    if(parsedDates.size()>1) return skip("invalid_date");
    if(parsedDates.size()==1) date=parsedDates.iterator().next();
    Calendar oldest=Calendar.getInstance(zone), newest=Calendar.getInstance(zone);
    oldest.setTimeInMillis(postedAt); oldest.add(Calendar.DAY_OF_MONTH,-7);
    newest.setTimeInMillis(postedAt); newest.add(Calendar.DAY_OF_MONTH,1);
    if(date.compareTo(dateFormat.format(newest.getTime()))>0 || date.compareTo(dateFormat.format(oldest.getTime()))<0) return skip("stale_or_future_alert");
    String mode=text.toUpperCase(Locale.ROOT).contains("UPI") ? "UPI" : text.toLowerCase(Locale.ROOT).matches("(?s).*\\b(card|wallet)\\b.*") ? "Card / wallet" : "Bank transfer";
    return new Result(null,debit ? "expense" : "income",amount,balance,references.iterator().next(),date,mode);
  }

  private static String parseDate(String date) {
    try {
      String[] parts=date.split("[-/ ]");
      boolean iso=date.matches("\\d{4}-\\d{2}-\\d{2}");
      int year=Integer.parseInt(parts[iso ? 0 : 2]); if(year<100) year+=2000;
      int month;
      if(parts[1].matches("\\d+")) month=Integer.parseInt(parts[1]);
      else month=("jan feb mar apr may jun jul aug sep oct nov dec".indexOf(parts[1].toLowerCase(Locale.ROOT))/4)+1;
      int day=Integer.parseInt(parts[iso ? 2 : 0]);
      Calendar calendar=new GregorianCalendar(year,month-1,day);
      calendar.setLenient(false); calendar.getTime();
      return String.format(Locale.US,"%04d-%02d-%02d",year,month,day);
    } catch(RuntimeException e) { return null; }
  }
}
