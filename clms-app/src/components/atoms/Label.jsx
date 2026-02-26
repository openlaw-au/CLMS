export default function Label({ children, required = false }) {
  return (
    <label className="mb-1 block text-sm font-medium text-text-secondary">
      {children}
      {required ? <span className="ml-1 text-brand">*</span> : null}
    </label>
  );
}
