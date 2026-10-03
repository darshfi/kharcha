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
    check(parse("Rs.250 sent to own account. Ref 426812345678").accepted(),"completed own-account debit is recorded");
    check(parse("Rs.250 self-transfer paid. Ref 426812345678").accepted(),"completed self-transfer is recorded");
    skip("Rs.0 paid. Ref 426812345678","unclear_amount");
    skip("USD 250 paid. Ref 426812345678","unclear_amount");
    check(parse("INR 250 received Ref ABC123456").date.equals("2026-10-02"),"fallback date local");
    skip("Rs.12,34,5 paid UPI Ref 123456789012","unclear_amount");
    skip("Rs.1,234.567 paid UPI Ref 123456789012","unclear_amount");
    check(parse("INR 1,23,456.78 paid UPI Ref 123456789012").amount.equals(new BigDecimal("123456.78")),"Indian number grouping");
    check(parse("INR 123,456.78 paid UPI Ref 123456789012").amount.equals(new BigDecimal("123456.78")),"Western number grouping");
    check(AlertParser.parseNotification("com.google.android.apps.messaging","John","I paid ₹500 UPI Ref 123456789012",POSTED,TimeZone.getDefault()).accepted(),"sender names do not restrict completed payment text");
    check(AlertParser.parseNotification("com.google.android.apps.messaging","AD-HDFCBK","Rs.500 debited UPI Ref 123456789012",POSTED,TimeZone.getDefault()).accepted(),"trusted DLT sender accepted");
    check(AlertParser.parseNotification("com.samsung.android.messaging","VM-ICICIB-S","Rs.500 credited UPI Ref 123456789012",POSTED,TimeZone.getDefault()).accepted(),"trusted service sender accepted");
    check(AlertParser.parseNotification("com.samsung.android.messaging","VM-UNKNOWN","Rs.500 debited UPI Ref 123456789012",POSTED,TimeZone.getDefault()).accepted(),"unknown DLT sender accepted");
    skip("You received Rs.500 voucher. Ref 123456789012","not_completed_payment");
    skip("Your account may be debited Rs.500. Ref 123456789012","not_completed_payment");
    skip("Loan Rs.500 credited. Ref 123456789012","not_completed_payment");
    // Sanitized fixtures retain the screenshot's bank grammar without personal details.
    long auPosted=Instant.parse("2026-10-02T20:06:00Z").toEpochMilli();
    TimeZone zone=TimeZone.getTimeZone("Asia/Kolkata");
    String auCredit="Credited INR 1.44 to A/c X0000 on 03-OCT-2026 Ref UPI/CR/123456789012/Sample Person. Bal INR 8,546.08.\n-AU Bank";
    String auDebit="Dr INR 1.00 - AU A/c X0000 03-OCT-2026 UPI/DR/123456789013/Sample Person\nBal INR 8,544.64\nFraud? Call 180012001200/SMS BLOCK UPI to 56767";
    AlertParser.Result credit=AlertParser.parseNotification("com.google.android.apps.messaging","AD-AUBANK-S",auCredit,auPosted,zone);
    check(credit.accepted(),"AU credit accepted from new sender");
    check("income".equals(credit.type) && new BigDecimal("1.44").equals(credit.amount),"AU credit direction and amount");
    check("123456789012".equals(credit.reference) && "2026-10-03".equals(credit.date),"AU credit reference and date");
    check(new BigDecimal("8546.08").equals(credit.balance),"AU credit balance separate");
    AlertParser.Result expense=AlertParser.parseNotification("com.google.android.apps.messaging","Unknown sender",auDebit,auPosted,zone);
    check(expense.accepted(),"AU Dr alert accepted");
    check("expense".equals(expense.type) && new BigDecimal("1.00").equals(expense.amount),"AU debit direction and amount");
    check("123456789013".equals(expense.reference) && "2026-10-03".equals(expense.date),"AU debit reference and date");
    check(new BigDecimal("8544.64").equals(expense.balance),"AU debit balance separate");
    check(AlertParser.parseNotification("com.samsung.android.messaging",null,auCredit,auPosted,zone).accepted(),"missing sender allowed");
    check(AlertParser.parseNotification("com.google.android.apps.messaging","Cashback offers",auDebit,auPosted,zone).accepted(),"sender title does not alter payment grammar");
    check(AlertParser.parse("Cr INR 1.44 UPI/CR/123456789012",auPosted,zone).accepted(),"Cr shorthand accepted");
    check("unclear_direction".equals(AlertParser.parse("Credited INR 1.44 UPI/DR/123456789012",auPosted,zone).reason),"conflicting UPI direction rejected");
    check("missing_or_conflicting_reference".equals(AlertParser.parse("Dr INR 1.44 UPI/DR/123456789012 UPI/DR/123456789013",auPosted,zone).reason),"conflicting slash references rejected");
    check("unclear_direction".equals(AlertParser.parse("Dr Smith invoice INR 1.44 Ref 123456789012",auPosted,zone).reason),"Dr name is not a debit");
    check(!AlertParser.parseNotification("com.google.android.apps.messaging","Custom app notification","Messages is doing work in the background",auPosted,zone).accepted(),"Messages service activity is not a payment");
    check(AlertParser.parse("Dr INR 250. UPI/DR/123456789012",auPosted,zone).accepted(),"amount sentence punctuation accepted");
    skip("Rs.1.2.3. paid UPI Ref 123456789012","unclear_amount");
    skip("Rs.1.. paid UPI Ref 123456789012","unclear_amount");
    AlertParser.Result paidYou=parse("Sample Person paid you ₹250 UPI Ref 123456789012");
    check(paidYou.accepted() && "income".equals(paidYou.type),"paid you is income, not expense");
    skip("Sample Person paid you ₹250 NA","missing_or_conflicting_reference");
    check("expense".equals(parse("You paid Sample Person ₹250 UPI Ref 123456789012").type),"you paid remains expense");
    check("expense".equals(parse("₹1 sent to own account UPI Ref 123456789012").type),"one-rupee own-account debit");
    check("income".equals(parse("₹1 received from own account UPI Ref 123456789012").type),"one-rupee own-account credit");
    skip("Self-transfer ₹1 pending UPI Ref 123456789012","not_completed_payment");
    java.util.List<AlertBatchParser.Parsed> batch=AlertBatchParser.parse("com.google.android.apps.messaging","2 new messages",
      java.util.Arrays.asList(new AlertBatchParser.Message("Dr INR 1.00 UPI/DR/123456789012",auPosted),
        new AlertBatchParser.Message("Credited INR 1.00 UPI/CR/123456789012",auPosted+1000)),auPosted+1000,zone);
    check(batch.size()==2 && batch.get(0).result.accepted() && batch.get(1).result.accepted(),"bundled SMS debit and credit accepted separately");
    check("expense".equals(batch.get(0).result.type) && "income".equals(batch.get(1).result.type),"bundled opposite directions remain distinct");
    check(batch.get(0).timestamp==auPosted && batch.get(1).timestamp==auPosted+1000,"individual message timestamps retained for opt-in filtering");
    java.util.List<AlertBatchParser.Parsed> mixed=AlertBatchParser.parse("com.google.android.apps.messaging","2 new messages",
      java.util.Arrays.asList(new AlertBatchParser.Message("OTP 123456 for INR 1 paid",auPosted),
        new AlertBatchParser.Message("Dr INR 1.00 UPI/DR/123456789013",auPosted+1000)),auPosted+1000,zone);
    check(!mixed.get(0).result.accepted() && mixed.get(1).result.accepted(),"unrelated OTP does not suppress separate completed payment");
    java.util.List<AlertBatchParser.Parsed> untimed=AlertBatchParser.parse("com.google.android.apps.messaging","2 new messages",
      java.util.Arrays.asList(new AlertBatchParser.Message("Dr INR 1.00 UPI/DR/123456789012",0),
        new AlertBatchParser.Message("Credited INR 1.00 UPI/CR/123456789012",0)),auPosted,zone);
    check(!untimed.get(0).result.accepted() && !untimed.get(1).result.accepted(),"untimestamped summaries cannot replay pre-opt-in alerts");
    System.out.println("AlertParser: "+tests+" checks passed");
  }
}
