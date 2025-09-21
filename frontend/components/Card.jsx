import React from 'react';

const Card = ({
    children,
    title,
    subtitle,
    className = '',
    headerClassName = '',
    bodyClassName = '',
    ...props
}) => {
    return (
        <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`} {...props}>
            {(title || subtitle) && (
                <div className={`px-4 py-5 sm:px-6 ${headerClassName}`}>
                    {title && <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>}
                    {subtitle && <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
                </div>
            )}
            <div className={`border-t border-gray-200 ${bodyClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card;