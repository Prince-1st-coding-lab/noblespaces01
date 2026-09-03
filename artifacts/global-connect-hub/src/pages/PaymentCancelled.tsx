import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { useEffect } from "react";

const PaymentCancelled = () => {
  useEffect(() => {
    document.title = "Payment cancelled — Noble Spaces";
  }, []);
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
      <XCircle className="h-16 w-16 text-destructive" aria-hidden />
      <h1 className="mt-6 font-display text-3xl">Payment cancelled</h1>
      <p className="mt-3 text-muted-foreground">
        Your payment was not completed. You can try again or contact us on WhatsApp for help.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
      >
        Back to home
      </Link>
    </section>
  );
};

export default PaymentCancelled;
