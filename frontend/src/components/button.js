'use strict';

import Radium from 'radium';
import React from 'react';
import { variables as v } from '../styles';
import Color from 'color';

@Radium
export class Button extends React.Component {
  render() {
    let xPadding, yPadding, fontSize, borderRadius;
    switch (this.props.size) {
      case 'small':
        xPadding = v.smallButtonXPadding;
        yPadding = v.smallButtonYPadding;
        fontSize = v.smallFontSize;
        borderRadius = v.smallBorderRadius;
        break;
      case 'large':
        xPadding = v.largeButtonXPadding;
        yPadding = v.largeButtonYPadding;
        fontSize = v.largeFontSize;
        borderRadius = v.largeBorderRadius;
        break;
      default:
        xPadding = v.buttonXPadding;
        yPadding = v.buttonYPadding;
        fontSize = v.baseFontSize;
        borderRadius = v.borderRadius;
    }

    let color, backgroundColor, borderColor;
    if (this.props.kind === 'primary') {
      color = v.buttonPrimaryColor;
      backgroundColor = v.buttonPrimaryBackgroundColor;
      borderColor = v.buttonPrimaryBorderColor;
    } else {
      color = v.buttonSecondaryColor;
      backgroundColor = v.buttonSecondaryBackgroundColor;
      borderColor = v.buttonSecondaryBorderColor;
    }
    let activeBackgroundColor = Color(backgroundColor).darken(0.1).hexString();
    let activeBorderColor = Color(borderColor).darken(0.12).hexString();


    let style = {
      display: 'inline-block',
      paddingTop: yPadding,
      paddingRight: xPadding,
      paddingBottom: yPadding,
      paddingLeft: xPadding,
      fontSize,
      fontWeight: v.buttonFontWeight,
      lineHeight: v.buttonLineHeight,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
      color,
      backgroundColor,
      borderWidth: v.borderWidth,
      borderStyle: 'solid',
      borderColor,
      borderRadius,
      boxShadow: v.buttonBoxShadow,
      transition: 'all .2s ease-in-out',
      cursor: 'pointer',
      userSelect: 'none'
    };

    if (!this.props.disabled) {
      Object.assign(style, {
        ':hover': {
          color,
          backgroundColor: activeBackgroundColor,
          borderColor: activeBorderColor
        },
        ':focus': {
          color,
          backgroundColor: activeBackgroundColor,
          borderColor: activeBorderColor
        },
        ':active': {
          outline: 0,
          color,
          backgroundColor: activeBackgroundColor,
          borderColor: activeBorderColor,
          backgroundImage: 'none',
          boxShadow: v.activeButtonBoxShadow
        }
      });
    } else {
      Object.assign(style, {
        cursor: v.disabledCursor,
        opacity: 0.65,
        boxShadow: 'none',
        ':hover': {},
        ':focus': {},
        ':active': {}
      });
    }

    return <button style={style} {...this.props} />;
  }
}

export default Button;
