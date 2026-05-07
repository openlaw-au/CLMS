import { createElement } from 'react';
import PropTypes from 'prop-types';

const BASE_CLASSES = 'rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-black/5';

export default function SectionCard({ as: Component = 'section', children, className = '' }) {
  return createElement(Component, { className: `${BASE_CLASSES} ${className}`.trim() }, children);
}

SectionCard.propTypes = {
  as: PropTypes.elementType,
  children: PropTypes.node,
  className: PropTypes.string,
};
