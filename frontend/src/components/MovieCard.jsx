import { StarIcon } from 'lucide-react';
import React from 'react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat';


const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-[#1f1f1f] rounded-2xl overflow-hidden shadow-lg transition hover:shadow-xl hover:-translate-y-1 duration-300">
      
      <img
        onClick={() => { navigate(`/movies/${movie._id}`); scrollTo(0, 0); }}
        src={movie.backdrop_path}
        alt={movie.title}
        className="aspect-video w-full object-cover cursor-pointer transition duration-300"
      />

      <div className="p-4 flex flex-col justify-between">
        <h3 className="font-semibold text-base sm:text-lg text-white truncate">
          {movie.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-tight">
          {new Date(movie.release_date).getFullYear()} • {movie.genres.slice(0, 2).map(g => g.name).join(" | ")} • {timeFormat(movie.runtime)}
        </p>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => { navigate(`/movies/${movie._id}`); scrollTo(0, 0); }}
            className="px-4 py-2 text-xs sm:text-sm bg-primary hover:bg-primary-dull rounded-full font-medium text-white cursor-pointer whitespace-normal"
          >
            Buy Tickets
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <StarIcon className="w-4 h-4 text-primary fill-primary" />
            {movie.vote_average.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};


export default MovieCard;