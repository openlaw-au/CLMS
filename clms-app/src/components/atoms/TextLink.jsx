export default function TextLink({ href = '#', children, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-sm font-medium text-brand hover:text-brand-hover"
    >
      {children}
    </a>
  );
}
