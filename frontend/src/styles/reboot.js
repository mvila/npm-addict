'use strict';

import v from './variables';
import m from './mixins';

// Credit: https://github.com/twbs/bootstrap/blob/v4-dev/scss/_reboot.scss

export let reboot = {
  html: {
    boxSizing: 'border-box',
    fontSize: v.rootFontSize,
    MsOverflowStyle: 'scrollbar',
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)'
  },

  '*, *::before, *::after': {
    boxSizing: 'inherit'
  },

  '@at-root @-ms-viewport': {
    width: 'device-width'
  },

  body: {
    fontFamily: v.baseFontFamily,
    fontSize: v.baseFontSize,
    lineHeight: v.baseLineHeight,
    color: v.bodyColor,
    backgroundColor: v.bodyBackgroundColor
  },

  '[tabindex="-1"]:focus': {
    outline: 'none !important'
  },

  'h1, h2, h3, h4, h5, h6': {
    marginTop: 0,
    marginBottom: '.5rem'
  },

  p: {
    marginTop: 0,
    marginBottom: '1rem'
  },

  address: {
    marginBottom: '1rem',
    fontStyle: 'normal',
    lineHeight: 'inherit'
  },

  'ol, ul, dl': {
    marginTop: 0,
    marginBottom: '1rem'
  },

  'ol ol, ul ul, ol ul, ul ol': {
    marginBottom: 0
  },

  dt: {
    fontWeight: 'bold'
  },

  dd: {
    marginBottom: '.5rem',
    marginLeft: 0
  },

  blockquote: {
    margin: '0 0 1rem'
  },

  a: {
    color: v.linkColor,
    textDecoration: v.linkDecoration
  },

  'a:hover, a:focus': {
    color: v.linkHoverColor,
    textDecoration: v.linkHoverDecoration
  },

  'a:focus': m.tabFocus,

  pre: {
    marginTop: 0,
    marginBottom: '1rem'
  },

  figure: {
    margin: '0 0 1rem'
  },

  img: {
    verticalAlign: 'middle'
  },

  '[role="button"]': {
    cursor: 'pointer'
  },

  'a, area, button, [role="button"], input, label, select, summary, textarea': {
    touchAction: 'manipulation'
  },

  table: {
    backgroundColor: v.tableBackgroundColor
  },

  caption: {
    paddingTop: v.tableCellPadding,
    paddingBottom: v.tableCellPadding,
    color: v.mutedTextColor,
    textAlign: 'left',
    captionSide: 'bottom'
  },

  th: {
    textAlign: 'left'
  },

  label: {
    display: 'inline-block',
    marginBottom: '.5rem'
  },

  'button:focus': {
    outline: '1px dotted',
    'outline ': '5px auto -webkit-focus-ring-color'
  },

  'input, button, select, textarea': {
    margin: 0,
    lineHeight: 'inherit',
    borderRadius: 0
  },

  textarea: {
    resize: 'vertical'
  },

  fieldset: {
    minWidth: 0,
    padding: 0,
    margin: 0,
    border: 0
  },

  legend: {
    display: 'block',
    width: '100%',
    padding: 0,
    marginBottom: '.5rem',
    fontSize: '1.5rem',
    lineHeight: 'inherit'
  },

  'input[type="search"]': {
    WebkitAppearance: 'none'
  },

  '[hidden]': {
    display: 'none !important'
  }
};

export default reboot;
