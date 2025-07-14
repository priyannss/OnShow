import React from "react";
import { PlayIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen w-full bg-black text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/backgroundImage.jpg"
          alt="Featured Movie"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-20 lg:px-36 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 drop-shadow-lg">
          Book Tickets for the Latest Blockbusters
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl">
          Watch trailers, check showtimes, and reserve your seat — all in one place.
        </p>

        <button
          onClick={() => navigate("/movies")}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dull text-white text-sm font-semibold px-6 py-3 rounded-full transition cursor-pointer"
        >
          <PlayIcon className="w-5 h-5" />
          Browse Now
        </button>
      </div>
    </section>
  );
};

export default HeroSection;



