import React from 'react';

const Avatar = ({
  user,
  size = 'md',
  className = '',
  showOnlineStatus = false
}) => {
  const sizeClasses = {
    xs: 'size-8 text-[10px]',
    sm: 'size-12 text-xs',
    md: 'size-16 text-sm',
    lg: 'size-20 text-base',
    xl: 'size-24 text-lg'
  };

  const ringSize = {
    xs: 'ring-2',
    sm: 'ring-2',
    md: 'ring-4',
    lg: 'ring-4',
    xl: 'ring-4'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 1);
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className={`
        ${sizeClasses[size] || 'size-16'} 
        rounded-[1.2rem]
        ${size === 'lg' || size === 'xl' ? 'rounded-[1.8rem]' : 'rounded-[1.2rem]'}
        flex 
        items-center 
        justify-center 
        font-black 
        text-white 
        bg-white/5
        ring-inset ${ringSize[size] || 'ring-2'} ring-primary/20
        shadow-inner
        overflow-hidden
        relative
      `}>
        {user?.avatar_url || user?.avatar ? (
          <img
            src={user.avatar_url || user.avatar}
            alt={user.name || 'Avatar'}
            className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        <span
          className={`
            w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20
            ${(user?.avatar_url || user?.avatar) ? 'hidden' : 'flex'}
          `}
        >
          {getInitials(user?.name)}
        </span>

        {/* Gloss Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {showOnlineStatus && (
        <div className={`
          absolute -bottom-1 -right-1 bg-green-500 rounded-full border-[3px] border-[#0a0a0a] shadow-lg
          ${size === 'xs' ? 'size-3 border-2' : 'size-4'}
        `} />
      )}
    </div>
  );
};

export default Avatar;