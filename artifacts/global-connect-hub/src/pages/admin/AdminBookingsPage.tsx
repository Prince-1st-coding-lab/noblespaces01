import { AdminBookings } from "@/components/admin/AdminBookings";
import { PageHeader } from "@/components/admin/AdminUi";

const AdminBookingsPage = () => (
  <>
    <PageHeader title="Bookings" description="Appointments requested by customers." />
    <AdminBookings />
  </>
);

export default AdminBookingsPage;
