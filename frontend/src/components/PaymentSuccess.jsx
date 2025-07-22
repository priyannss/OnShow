import React, { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { assets } from "../assets/assets";
import { useNavigate, useParams } from "react-router-dom";

const PaymentSuccess = () => {
    const [countdown, setCountdown] = useState(8);
    const [mounted, setMounted] = useState(false);

    const { nextUrl } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev < 1) {
                    clearInterval(timer);
                    if(nextUrl) {
                        navigate('/' + nextUrl);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [])

    return (
        <div className="flex justify-center items-center min-h-screen p-6">
            <div className={`
                w-full max-w-md transform transition-all duration-700 ease-out
                ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>

                {/* Main Card */}
                <div className="relative">
                    {/* Subtle glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-lg"></div>

                    <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 text-center">

                        {/* Success Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
                            <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
                        </div>

                        {/* Heading */}
                        <h1 className="text-2xl font-semibold text-white mb-2">
                            Payment Successful
                        </h1>

                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Your booking has been confirmed.<br />
                            <span className="text-green-400">Thank you for your purchase!</span>
                        </p>

                        {/* Countdown Card */}
                        <div className="bg-gray-800/60 border border-gray-600/50 rounded-xl p-5 mb-6">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Redirecting to your bookings</span>
                            </div>

                            <div className="text-3xl font-bold text-white mb-3">
                                {countdown}
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                                    style={{ width: `${((8 - countdown) / 8) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Brand */}
                        <div className="flex items-center justify-center text-gray-500 text-sm">
                            <span>Thank you for choosing</span>
                            <img
                                src={assets.logo}
                                alt="Logo"
                                className="h-8"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;