import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MovieCard from './MovieCard';
import { useAppContext } from '../context/AppContext';


const FeaturedSection = () => {
  const navigate = useNavigate();

  const {shows} = useAppContext();

  return (
    <div className="px-4 sm:px-6 md:px-12 lg:px-24 xl:px-44 relative overflow-hidden">
      <div className="relative flex items-center justify-between pt-20 pb-8">
        <h2 className="text-white text-xl font-medium">Now Showing</h2>
        <button
          onClick={() => navigate('/movies')}
          className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition cursor-pointer"
        >
          View All
          <ArrowRight className="group-hover:translate-x-1 transition-transform w-4 h-4" />
        </button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
        {shows.slice(0, 4).map((show) => (
          <MovieCard key={show._id} movie={show} />
        ))}
      </div>

      
      <div className="flex justify-center mt-16">
        <button
          onClick={() => { navigate('/movies'); scrollTo(0, 0); }}
          className="px-6 py-3 text-sm sm:text-base bg-primary hover:bg-primary-dull rounded-full font-medium text-white shadow-md cursor-pointer"
        >
          Show more
        </button>
      </div>
    </div>
  );
};


export default FeaturedSection;