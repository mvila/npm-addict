'use strict';

import v from './variables';

// *** Heavily inspired by Bootstrap 4 ***

export let styles = {};

let s = styles;

s.noMargins = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0
};

s.regular = {
  fontWeight: 'normal'
};

s.bold = {
  fontWeight: 'bold'
};

s.italic = {
  fontStyle: 'italic'
};

s.bordered = {
  borderWidth: v.borderWidth,
  borderStyle: 'solid',
  borderColor: v.borderColor
};

s.rounded = {
  borderRadius: v.borderRadius
};

s.unstyledList = {
  paddingLeft: 0,
  listStyle: 'none'
};

s.hiddenIfSmall = {
  [`@media (max-width: ${v.smallBreakpoint})`]: {
    display: 'none'
  }
};

s.shownIfSmall = {
  [`@media (min-width: ${v.smallBreakpointPlusOne})`]: {
    display: 'none'
  }
};

s.hiddenIfMedium = {
  [`@media (max-width: ${v.mediumBreakpoint})`]: {
    display: 'none'
  }
};

s.shownIfMedium = {
  [`@media (min-width: ${v.mediumBreakpointPlusOne})`]: {
    display: 'none'
  }
};

s.hiddenIfLarge = {
  [`@media (max-width: ${v.largeBreakpoint})`]: {
    display: 'none'
  }
};

s.shownIfLarge = {
  [`@media (min-width: ${v.largeBreakpointPlusOne})`]: {
    display: 'none'
  }
};

export { variables } from './variables';
export { mixins } from './mixins';
export { elements } from './elements';

export default styles;
