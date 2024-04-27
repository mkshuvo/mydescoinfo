'use client'
import React, { useState } from 'react';
import Link from 'next/link';

const ProfileDropdown: React.FC = () => {
    // State to manage the visibility of the dropdown menu
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // Function to toggle the visibility of the dropdown menu
    const toggleDropdownVisibility = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    return (
        <div className="relative ml-3">
            <div>
                {/* Button to toggle the visibility of the dropdown menu */}
                <button
                    type="button"
                    className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    onClick={toggleDropdownVisibility}
                    aria-expanded={isDropdownVisible}
                    aria-haspopup="true"
                >
                    <span className="sr-only">Open user menu</span>
                    <img
                        className="h-8 w-8 rounded-full"
                        src="https://cdn-icons-png.freepik.com/512/6816/6816147.png"
                        alt="User Avatar"
                    />
                </button>
            </div>

            {/* Conditionally render the dropdown menu based on the state */}
            {isDropdownVisible && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Your Profile
                    </Link>
                    <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Settings
                    </Link>
                    <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign out
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
