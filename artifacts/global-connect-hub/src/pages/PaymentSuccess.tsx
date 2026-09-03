import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

const PaymentSuccess = () => {
  useEffect(() => {
    document.title = "Payment successful — Noble Spaces";
  }, []);
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
      <CheckCircle2 className="h-16 w-16 text-gold" aria-hidden />
      <h1 className="mt-6 font-display text-3xl">Payment successful</h1>
      <p className="mt-3 text-muted-foreground">
        Thank you. We've received your payment and our team will be in touch shortly to confirm your booking.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-gold/90"
      >
        Back to home
      </Link>
    </section>
  );
};

export default PaymentSuccess;
