'use strict';

import s from './styles';

export let statuses = {
  ALL: {
    color: s.$grayDark
  },
  IN_PROGRESS: {
    color: s.$olive
  },
  DELAYED: {
    color: s.$orange
  },
  ARCHIVED: {
    color: s.$blue
  }
};

export default statuses;
