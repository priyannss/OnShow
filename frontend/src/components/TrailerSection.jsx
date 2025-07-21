import { useState } from 'react';
import { dummyTrailers } from '../assets/assets';
import ReactPlayer from 'react-player';
import { PlayCircleIcon } from 'lucide-react';

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      {/* <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">Trailers</p> */}
      <div className="flex items-center justify-between max-w-[960px] mx-auto">
        <h2 className="text-white text-xl font-medium my-4">Trailers</h2>
      </div>

      <div className="relative mt-4">
        {/* <BlurCircle top='-100px' right='-100px' /> */}
        <div className="w-full max-w-[960px] aspect-video mx-auto">
          <ReactPlayer
            src={currentTrailer.videoUrl}
            controls={true}
            width="100%"
            height="100%"
            className="rounded-lg overflow-hidden"
          />
        </div>
      </div>

      <div className="group grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
        {dummyTrailers.map((trailer) => (
          <div
            onClick={() => setCurrentTrailer(trailer)}
            key={trailer.image}
            className="relative group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-h-60 cursor-pointer"
          >
            <img
              src={trailer.image}
              alt="trailer"
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon
              strokeWidth={1.6}
              className="absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailerSection;
