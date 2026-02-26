import { Icon as IconifyIcon } from '@iconify/react';

export default function Icon({ name, size = 18, className = '', ...props }) {
  return (
    <IconifyIcon
      icon={name}
      width={size}
      height={size}
      className={`icon inline-block align-middle ${className}`}
      {...props}
    />
  );
}
