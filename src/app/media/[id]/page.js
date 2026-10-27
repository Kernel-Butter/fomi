import MediaPreview from "../../../components/media/MediaPreview";

export const metadata = { title: "Media preview | Frame" };
export default async function MediaPage({ params }) {
  const { id } = await params;
  return <MediaPreview id={id} />;
}
