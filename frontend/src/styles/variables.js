'use strict';

import Color from 'color';

export let variables = {};

let v = variables;

// --- Colors ---

v.primaryColor = '#CB3837'; // npm red
v.secondaryColor = '#0074D9'; // blue

v.darkGray = '#373A3C';
v.gray = '#55595C';
v.lightGray = '#818A91';
v.lighterGray = '#ECEEEF';
v.lightestGray = '#F7F7F9';

// Generate a shade of grays
for (let i = 5; i <= 95; i = i + 5) {
  v['gray' + i] = Color('#FFF').darken(1 - i / 100).hexString();
}

v.bodyColor = '#373A3C';
v.bodyBackgroundColor = '#FFF';

v.mutedTextColor = v.lightGray;

// --- Links ---

v.linkColor = v.primaryColor;
v.linkDecoration = 'none';
v.linkHoverColor = Color(v.primaryColor).darken(0.4).hexString();
v.linkHoverDecoration = 'underline';

// --- Typography ---

v.sansSerifFontFamily = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', Arial, sans-serif';
v.serifFontFamily = 'Georgia, \'Times New Roman\', Times, serif';
v.monospaceFontFamily = 'Menlo, Monaco, Consolas, \'Liberation Mono\', \'Courier New\', monospace';

v.rootFontSize = '16px';
v.baseFontFamily = v.sansSerifFontFamily;
v.baseFontSize = '1rem';
v.baseLineHeight = 1.5;

v.smallFontSize = '.875rem';
v.largeFontSize = '1.25rem';

// --- Borders ---

v.borderWidth = '1px';
v.borderRadius = '.25rem';
v.borderColor = 'rgba(0,0,0,.1)';

v.smallBorderRadius = '.2rem';
v.largeBorderRadius = '.3rem';

// --- Spacing ---

v.spacer = '1rem';

// --- Headings ---

v.headingsMarginBottom = `calc(${v.spacer} / 2)`;
v.headingsFontFamily = 'inherit';
v.headingsFontWeight = 'bold';
v.headingsLineHeight = 1.25; // was 1.1 in Bootstrap 4
v.headingsColor = 'inherit';

v.h1FontSize = '2.5rem';
v.h2FontSize = '2rem';
v.h3FontSize = '1.75rem';
v.h4FontSize = '1.5rem';
v.h5FontSize = '1.25rem';
v.h6FontSize = '1rem';

// --- Tables ---

v.tableBackgroundColor = 'transparent';
v.tableCellPadding = '.75rem';

// --- Code ---

v.codeColor = v.secondaryColor;
v.codeBackgroundColor = '#F7F7F9';
v.preColor = v.darkGray;

// --- Buttons ---

v.buttonFontWeight = 'normal';
v.buttonLineHeight = 1.25;
v.buttonXPadding = '1rem';
v.buttonYPadding = '.5rem';
v.buttonBoxShadow = 'inset 0 1px 0 rgba(255,255,255,.15), 0 1px 1px rgba(0,0,0,.075)';
v.activeButtonBoxShadow = 'inset 0 3px 5px rgba(0,0,0,.125)';

v.smallButtonXPadding = '.5rem';
v.smallButtonYPadding = '.25rem';

v.largeButtonXPadding = '1.5rem';
v.largeButtonYPadding = '.75rem';

v.buttonPrimaryColor = '#FFF';
v.buttonPrimaryBackgroundColor = v.primaryColor;
v.buttonPrimaryBorderColor = v.buttonPrimaryBackgroundColor;

v.buttonSecondaryColor = v.darkGray;
v.buttonSecondaryBackgroundColor = '#FFF';
v.buttonSecondaryBorderColor = '#CCC';

// --- Other ---

v.disabledCursor = 'not-allowed';

// --- Breakpoints ---

v.smallBreakpoint = '640px';
v.mediumBreakpoint = '1024px';
v.largeBreakpoint = '1440px';

v.smallBreakpointPlusOne = '641px';
v.mediumBreakpointPlusOne = '1025px';
v.largeBreakpointPlusOne = '1441px';

export default variables;
