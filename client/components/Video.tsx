import { FunctionComponent } from "react";

interface VideoProps {
  id: string;
}

const Video: FunctionComponent<VideoProps> = ({ id }) => (
  <div
    className="bg-gray-200 overflow-hidden relative h-0"
    style={{ paddingBottom: "56.25%" }}
  >
    <iframe
      className="left-0 top-0 h-full w-full absolute"
      width="560"
      height="315"
      src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="YouTube video player"
    />
  </div>
);

export default Video;
