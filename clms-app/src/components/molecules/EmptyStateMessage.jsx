import PropTypes from 'prop-types';

export default function EmptyStateMessage({ children, className = '' }) {
  return (
    <p className={`py-8 text-center text-sm text-text-muted ${className}`.trim()}>
      {children}
    </p>
  );
}

EmptyStateMessage.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
