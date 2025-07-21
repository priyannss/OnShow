import React from "react";
import { FaInstagram, FaTwitter, FaYoutube, FaTiktok } from "react-icons/fa";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="text-gray-400 px-4 sm:px-6 md:px-12 lg:px-24 xl:px-44 py-16 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="col-span-2">
          <img src={assets.logo} alt="OnShow Logo" className="w-36 md:w-40 h-auto" />
          <p className="text-sm leading-relaxed max-w-md">
            Book your favorite movies, shows, and events in just a few clicks.
            Bringing you the best of entertainment — anytime, anywhere.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-4 text-sm">
          <h4 className="text-white font-semibold">Quick Links</h4>
          <a href="#" className="hover:text-white transition">Now Showing</a>
          <a href="#" className="hover:text-white transition">Coming Soon</a>
          <a href="#" className="hover:text-white transition">Events</a>
          <a href="#" className="hover:text-white transition">Offers</a>
        </div>

        {/* Social */}
        <div className="flex flex-col space-y-4 text-sm">
          <h4 className="text-white font-semibold">Connect</h4>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-white"><FaInstagram size={20} /></a>
            <a href="#" className="hover:text-white"><FaTwitter size={20} /></a>
            <a href="#" className="hover:text-white"><FaYoutube size={20} /></a>
            <a href="#" className="hover:text-white"><FaTiktok size={20} /></a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-12 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} OnShow — Built for movie lovers.
      </div>
    </footer>
  );
};

export default Footer;
