'use strict';

import basscss from 'basscss-radium';
import { cloneDeep } from 'better-clone';
import color from 'color';

export let styles = cloneDeep(basscss);

let s = styles;

s.$blue = '#0074D9';
s.$red = '#cb3837'; // npm red
s.$orange = '#ff851b';
s.$olive = '#3d9970';
s.$oliveLighter = color(s.$olive).clearer(0.8).rgbString();
s.$grayDarker = '#444';
s.$grayDark = '#777';
s.$gray = '#999';
s.$grayLight = '#dadada';
s.$grayLighter = '#e3e3e3';
s.$grayLightest = '#f7f7f7';

s.a.color = s.$red;

s.small = { fontSize: '.875rem' };

delete s.btn.border;
s.btn.borderWidth = '1px';
s.btn.borderStyle = 'solid';
s.btn.borderColor = 'transparent';

s.hr.borderBottomWidth = '1px'; // was 1

s.caps.letterSpacing = '.1em'; // was '.2em'

s.code.color = s.$blue;
s.code.backgroundColor = s.$grayLighter;
s.code.padding = '2px 4px';

s.fs1 = { fontSize: '2rem' };
s.fs2 = { fontSize: '1.5rem' };
s.fs3 = { fontSize: '1.25rem' };
s.fs4 = { fontSize: '1rem' };
s.fs5 = { fontSize: '.875rem' };
s.fs6 = { fontSize: '.75rem' };

s.red = { color: s.$red };
s.bgRed = { backgroundColor: s.$red };

s.bgOliveLighter = { backgroundColor: s.$oliveLighter };

s.grayDarker = { color: s.$grayDarker };
s.grayDark = { color: s.$grayDark };
s.gray = { color: s.$gray };
s.grayLight = { color: s.$grayLight };
s.grayLighter = { color: s.$grayLighter };
s.grayLightest = { color: s.$grayLightest };

s.bgGrayDarker = { backgroundColor: s.$grayDarker };
s.bgGrayDark = { backgroundColor: s.$grayDark };
s.bgGray = { backgroundColor: s.$gray };
s.bgGrayLight = { backgroundColor: s.$grayLight };
s.bgGrayLighter = { backgroundColor: s.$grayLighter };
s.bgGrayLightest = { backgroundColor: s.$grayLightest };

s.mb025 = { marginBottom: '.125rem' };
s.mt05 = { marginTop: '.25rem' };
s.mr05 = { marginRight: '.25rem' };
s.mb05 = { marginBottom: '.25rem' };
s.ml05 = { marginLeft: '.25rem' };
s.mt15 = { marginTop: '.75rem' };
s.mr15 = { marginRight: '.75rem' };
s.mb15 = { marginBottom: '.75rem' };
s.ml15 = { marginLeft: '.75rem' };
s.mt225 = { marginTop: '1.125rem' };
s.mt25 = { marginTop: '1.25rem' };
s.mr25 = { marginRight: '1.25rem' };
s.mb25 = { marginBottom: '1.25rem' };
s.ml25 = { marginLeft: '1.25rem' };

s.px025 = { paddingLeft: '.125rem', paddingRight: '.125rem' };
s.py025 = { paddingTop: '.125rem', paddingBottom: '.125rem' };
s.py0375 = { paddingTop: '.1875rem', paddingBottom: '.1875rem' };
s.p05 = { padding: '.25rem' };
s.px05 = { paddingLeft: '.25rem', paddingRight: '.25rem' };
s.py05 = { paddingTop: '.25rem', paddingBottom: '.25rem' };
s.px075 = { paddingLeft: '.375rem', paddingRight: '.375rem' };
s.pt1 = { paddingTop: '.5rem' };
s.pr1 = { paddingRight: '.5rem' };
s.pb1 = { paddingBottom: '.5rem' };
s.pl1 = { paddingLeft: '.5rem' };
s.p15 = { padding: '.75rem' };
s.pl15 = { paddingLeft: '.75rem' };
s.px15 = { paddingLeft: '.75rem', paddingRight: '.75rem' };
s.py15 = { paddingTop: '.75rem', paddingBottom: '.75rem' };
s.pb15 = { paddingBottom: '.75rem' };
s.pt2 = { paddingTop: '1rem' };
s.pr2 = { paddingRight: '1rem' };
s.pb2 = { paddingBottom: '1rem' };
s.pl2 = { paddingLeft: '1rem' };

export default s;
