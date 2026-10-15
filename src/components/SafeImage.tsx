import React, { useState } from 'react';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null | undefined;
  fallback?: React.ReactNode;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallback = null,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // If src is missing, null, empty string, only whitespace, or not a string, do not render img element
  if (!src || typeof src !== 'string' || !src.trim()) {
    return <>{fallback}</>;
  }

  const cleanSrc = src.trim();

  if (hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={cleanSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        setHasError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};
