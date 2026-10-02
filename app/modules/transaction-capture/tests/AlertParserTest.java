package expo.modules.transactioncapture;

import java.time.Instant;
import java.util.TimeZone;
import java.math.BigDecimal;

/** Runs the production parser without Android dependencies: javac + java. */
public class AlertParserTest {
  private static final long POSTED=Instant.parse("2026-10-02T12:00:00Z").toEpochMilli();
  private static int tests=0;
  private static AlertParser.Result parse(String s) { return AlertParser.parse(s,POSTED,TimeZone.getTimeZone("Asia/Kolkata")); }
  private static void check(boolean value,String name) { tests++; if(!value) throw new AssertionError(name); }
  private static void skip(String s,String reason) { check(reason.equals(parse(s).reason),s+" expected "+reason+" got "+parse(s).reason); }
  public static void main(String[] args) {
    AlertParser.Result debit=parse("A/c XX123 debited by Rs.250.00 on 02-10-26 UPI Ref No 426812345678. Avl Bal: Rs.5,000.50");
    check(debit.accepted(),"bank debit accepted");
    check(debit.amount.equals(new BigDecimal("250.00")),"balance is not transaction amount");
    check(debit.balance.equals(new BigDecimal("5000.50")),"reported balance separate");
    check(debit.reference.equals("426812345678"),"reference preserved");
    check(debit.date.equals("2026-10-02"),"numeric date");
    check(debit.type.equals("expense"),"debit direction");
    check(parse("You paid ₹250 to Cafe. UPI transaction id: 426812345678").accepted(),"UPI payment");
    check(parse("Rs.250 received from Friend. UPI Ref 426812345678").type.equals("income"),"credit direction");
    check(parse("INR 250 credited on 2-Oct-2026. UTR ABC123456").date.equals("2026-10-02"),"named date");
    check(parse("INR 250 debited. Ref ABC123456. Balance INR 0").balance.equals(new BigDecimal("0.00")),"zero balance");
    skip("OTP 123456 for payment Rs.250 debited. Ref 426812345678","not_completed_payment");
    skip("Rs.250 payment request received. UPI Ref 426812345678","not_completed_payment");
    skip("Rs.250 paid pending confirmation. UPI Ref 426812345678","not_completed_payment");
    skip("Rs.250 paid failed. UPI Ref 426812345678","not_completed_payment");
    skip("Cashback Rs.250 credited. UPI Ref 426812345678","not_completed_payment");
    skip("Your card bill Rs.250 is due. Ref 426812345678","not_completed_payment");
    skip("Your account will be debited Rs.250. Ref 426812345678","not_completed_payment");
    skip("Rs.250 debited and Rs.500 credited. Ref 426812345678","unclear_direction");
    skip("Rs.250 debited. Ref 426812345678. Also Rs.500 paid. Ref 426812345679","unclear_amount");
    skip("Balance Rs.250. Ref 426812345678","unclear_direction");
    skip("Rs.250 paid to Cafe","missing_or_conflicting_reference");
    skip("Rs.250 paid UPI Ref 426812345678 UTR 426812345679","missing_or_conflicting_reference");
    skip("Rs.250 debited on 30-02-2026. Ref 426812345678","invalid_date");
    skip("Rs.250 debited on 24-09-2026. Ref 426812345678","stale_or_future_alert");
    skip("Rs.250 sent to own account. Ref 426812345678","self_transfer");
    skip("Rs.250 self-transfer paid. Ref 426812345678","self_transfer");
    skip("Rs.0 paid. Ref 426812345678","unclear_amount");
    skip("USD 250 paid. Ref 426812345678","unclear_amount");
    check(parse("INR 250 received Ref ABC123456").date.equals("2026-10-02"),"fallback date local");
    skip("Rs.12,34,5 paid UPI Ref 123456789012","unclear_amount");
    skip("Rs.1,234.567 paid UPI Ref 123456789012","unclear_amount");
    check(parse("INR 1,23,456.78 paid UPI Ref 123456789012").amount.equals(new BigDecimal("123456.78")),"Indian number grouping");
    check(parse("INR 123,456.78 paid UPI Ref 123456789012").amount.equals(new BigDecimal("123456.78")),"Western number grouping");
    check(AlertParser.parseNotification("com.google.android.apps.messaging","John","I paid ₹500 UPI Ref 123456789012",POSTED,TimeZone.getDefault()).reason.equals("untrusted_sender"),"personal Messages payment text rejected");
    check(AlertParser.parseNotification("com.google.android.apps.messaging","AD-HDFCBK","Rs.500 debited UPI Ref 123456789012",POSTED,TimeZone.getDefault()).accepted(),"trusted DLT sender accepted");
    check(AlertParser.parseNotification("com.samsung.android.messaging","VM-ICICIB-S","Rs.500 credited UPI Ref 123456789012",POSTED,TimeZone.getDefault()).accepted(),"trusted service sender accepted");
    check(AlertParser.parseNotification("com.samsung.android.messaging","VM-UNKNOWN","Rs.500 debited UPI Ref 123456789012",POSTED,TimeZone.getDefault()).reason.equals("untrusted_sender"),"unknown DLT sender skipped");
    skip("You received Rs.500 voucher. Ref 123456789012","not_completed_payment");
    skip("Your account may be debited Rs.500. Ref 123456789012","not_completed_payment");
    skip("Loan Rs.500 credited. Ref 123456789012","not_completed_payment");
    System.out.println("AlertParser: "+tests+" checks passed");
  }
}
