import React from 'react';
import MovieCard from '../components/MovieCard';
import { useAppContext } from '../context/AppContext';

const Movies = () => {
  const { shows } = useAppContext();

  return shows.length > 0 ? (
    <div className="relative mt-32 md:mt-40 mb-20 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <h1 className="text-xl font-medium my-4">Now Showing</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {shows.map((show) => (
          <MovieCard movie={show} key={show._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-3xl font-bold text-center">No shows available.</p>
    </div>
  );
};

export default Movies;
