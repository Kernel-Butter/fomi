import MediaPreview from "../../../../components/media/MediaPreview";

export default async function InterceptedMediaPage({ params }) {
  const { id } = await params;
  return <MediaPreview id={id} modal />;
}
