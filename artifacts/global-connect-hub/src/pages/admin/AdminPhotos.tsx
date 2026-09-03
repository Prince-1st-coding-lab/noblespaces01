import { ServicePhotoManager } from "@/components/admin/ServicePhotoManager";
import { PageHeader } from "@/components/admin/AdminUi";

const AdminPhotos = () => (
  <>
    <PageHeader
      title="Service photos"
      description="Upload, replace and delete the photos shown on each service page."
    />
    <ServicePhotoManager />
  </>
);

export default AdminPhotos;
