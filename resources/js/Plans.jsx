import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import CreateReactScript from "./Utils/CreateReactScript";

import homeDesktop from '../img/plans/home-desktop.png'
import homeTablet from '../img/plans/home-tablet.png'
import homeMobile from '../img/plans/home-mobile.png'
import Number2Currency from "./Utils/Number2Currency";
import LaravelSession from "./Utils/LaravelSession";
import AuthRest from "./actions/AuthRest";
import Logout from "./actions/Logout";

const Plans = ({ plans, businesses }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.querySelector('.dropdown-container');
            if (dropdown && !dropdown.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const onBusinessClicked = async (uuid) => {
        const result = await AuthRest.activeService(uuid)
        if (!result) return
        location.reload()
    }

    const currentBusiness = businesses.find(({ id }) => LaravelSession.business_id == id)
    const otherBusinesses = businesses.filter(({ id }) => LaravelSession.business_id != id)

    return (
        <div className="relative min-h-screen w-full">
            {/* Background Images */}
            <div className="fixed inset-0 w-full h-full">
                <img src={homeDesktop} className="hidden w-full h-uto lg:block" alt="Background desktop" />
                <img src={homeTablet} className="hidden w-full h-uto md:block lg:hidden" alt="Background tablet" />
                <img src={homeMobile} className="block w-full h-uto md:hidden" alt="Background mobile" />
            </div>

            <div className="relative z-10 min-h-screen flex items-center backdrop-blur bg-black bg-opacity-25 justify-center p-8">
                <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 max-w-7xl w-full">
                    {/* Header with Business Selection and Logout */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex-1 max-w-xs">
                            <div className="relative dropdown-container">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg flex justify-between items-start hover:border-blue-500 transition-colors"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-gray-700 truncate text-start">
                                            {currentBusiness ? currentBusiness.name : 'Select a business'}
                                        </span>
                                        {currentBusiness && (
                                            <span className="text-xs text-gray-500">
                                                RUC: {currentBusiness.person.document_number}
                                            </span>
                                        )}
                                    </div>
                                    <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg max-h-48 overflow-y-auto z-50 w-full">
                                        {otherBusinesses.map((business) => (
                                            <div
                                                key={business.id}
                                                onClick={() => onBusinessClicked(business.uuid)}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                                <p className="font-medium text-gray-800 truncate">{business.name}</p>
                                                <p className="text-xs text-gray-500">RUC: {business.person.document_number}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => Logout()}
                            className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Cerrar Sesión
                        </button>
                    </div>

                    {/* Status Message */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">¡Tu plan ha vencido!</h2>
                        <p className="text-gray-600 text-lg">
                            Selecciona un nuevo plan para seguir disfrutando de nuestros servicios o inicia sesión con otra empresa
                        </p>
                    </div>

                    {/* Plans Display */}
                    <div className="flex flex-wrap justify-center gap-8">
                        {plans.map((plan) => (
                            <div key={plan.id} className="transform hover:scale-105 transition-transform duration-300 flex-1 min-w-[300px] max-w-[400px]">
                                <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-[#315af3] to-[#5e4dff] p-6">
                                        <h2 className="text-3xl font-bold text-white mb-2">
                                            {plan.name}
                                        </h2>
                                        <div className="text-white/90 text-lg">
                                            <span className="text-4xl font-bold ml-2">
                                                S/ {parseFloat(plan.monthly_price).toFixed(2)}
                                            </span>
                                            <span className="text-sm"> x mes</span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <p className="text-gray-600 mb-6">
                                            {plan.description}
                                        </p>

                                        <div className="space-y-4">
                                            <div className="bg-gray-100 p-4 rounded-lg">
                                                <p className="text-gray-700 font-semibold">Plan mensual</p>
                                                <p className="text-3xl font-bold text-[#315af3]">
                                                    S/ {Number2Currency(plan.monthly_price)}
                                                    <span className="text-sm text-gray-500"> x mes</span>
                                                </p>
                                            </div>

                                            <div className="bg-gray-100 p-4 rounded-lg">
                                                <p className="text-gray-700 font-semibold">Plan anual</p>
                                                <p className="text-3xl font-bold text-[#5e4dff]">
                                                    S/ {Number2Currency(plan.annual_price)}
                                                    <span className="text-sm text-gray-500"> x año</span>
                                                </p>
                                            </div>

                                            <a
                                                href={`https://wa.me/51934464915?text=Hola, quiero adquirir el plan ${plan.name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full py-3 px-6 bg-gradient-to-r from-[#315af3] to-[#5e4dff] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
                                            >
                                                Seleccionar plan
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(<Plans {...properties} />);
});
