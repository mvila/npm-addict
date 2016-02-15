'use strict';

import merge from 'lodash/merge';
import normalize from 'radium-normalize';
import v from './variables';
import reboot from './reboot';

export let elements = {};

merge(elements, normalize);

merge(elements, reboot);

merge(elements, {
  'h1, h2, h3, h4, h5, h6': {
    marginBottom: v.headingsMarginBottom,
    fontFamily: v.headingsFontFamily,
    fontWeight: v.headingsFontWeight,
    lineHeight: v.headingsLineHeight,
    color: v.headingsColor
  },

  h1: { fontSize: v.h1FontSize },
  h2: { fontSize: v.h2FontSize },
  h3: { fontSize: v.h3FontSize },
  h4: { fontSize: v.h4FontSize },
  h5: { fontSize: v.h5FontSize },
  h6: { fontSize: v.h6FontSize },

  hr: {
    marginTop: v.spacer,
    marginBottom: v.spacer,
    border: 0,
    borderTop: `${v.borderWidth} solid ${v.borderColor}`
  },

  small: {
    fontWeight: 'normal'
  },

  'code, kbd, pre, samp': {
    fontFamily: v.monospaceFontFamily
  },

  code: {
    padding: '.2rem .4rem',
    fontSize: '90%',
    color: v.codeColor,
    backgroundColor: v.codeBackgroundColor,
    borderRadius: v.borderRadius
  },

  pre: {
    display: 'block',
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '90%',
    color: v.preColor
  },

  'pre code': {
    padding: 0,
    fontSize: 'inherit',
    color: 'inherit',
    backgroundColor: 'transparent',
    borderRadius: 0
  }
});

export default elements;
