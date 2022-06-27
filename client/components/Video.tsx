import { FunctionComponent } from "react";
import PlayIcon from "components/PlayIcon";

interface VideoProps {}

const Video: FunctionComponent<VideoProps> = () => (
  <div className="bg-gray-200 h-40 lg:h-60 w-full flex items-center justify-center">
    <div className="opacity-60">
      <PlayIcon />
    </div>
  </div>
);

export default Video;
