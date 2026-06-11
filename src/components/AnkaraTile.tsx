import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Polygon, Polyline, Circle, Rect } from 'react-native-svg';

export default function AnkaraTile() {
  return (
    <Svg style={styles.absoluteBackground} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id="ankara-tile" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          {/* Central diamond */}
          <Polygon
            points="24,4 36,24 24,44 12,24"
            fill="none"
            stroke="#C4622D"
            strokeWidth={1.5}
            opacity={0.15}
          />
          {/* Inner diamond */}
          <Polygon
            points="24,12 32,24 24,36 16,24"
            fill="#C4622D"
            opacity={0.08}
          />
          {/* Corner triangles — top-left */}
          <Polygon points="0,0 8,0 0,8" fill="#C4622D" opacity={0.10} />
          {/* Corner triangles — top-right */}
          <Polygon points="48,0 40,0 48,8" fill="#C4622D" opacity={0.10} />
          {/* Corner triangles — bottom-left */}
          <Polygon points="0,48 8,48 0,40" fill="#C4622D" opacity={0.10} />
          {/* Corner triangles — bottom-right */}
          <Polygon points="48,48 40,48 48,40" fill="#C4622D" opacity={0.10} />
          {/* Chevron top */}
          <Polyline
            points="0,16 12,8 24,16 36,8 48,16"
            fill="none"
            stroke="#C4622D"
            strokeWidth={1}
            opacity={0.12}
          />
          {/* Chevron bottom */}
          <Polyline
            points="0,32 12,40 24,32 36,40 48,32"
            fill="none"
            stroke="#C4622D"
            strokeWidth={1}
            opacity={0.12}
          />
          {/* Horizontal mid-line dots */}
          <Circle cx={6}  cy={24} r={1.2} fill="#C4622D" opacity={0.15} />
          <Circle cx={18} cy={24} r="1.2" fill="#C4622D" opacity={0.15} />
          <Circle cx={30} cy="24" r="1.2" fill="#C4622D" opacity={0.15} />
          <Circle cx={42} cy="24" r="1.2" fill="#C4622D" opacity={0.15} />
          {/* Vertical mid-line dots */}
          <Circle cx="24" cy="6"  r="1.2" fill="#C4622D" opacity={0.15} />
          <Circle cx="24" cy="18" r="1.2" fill="#C4622D" opacity={0.15} />
          <Circle cx="24" cy="30" r="1.2" fill="#C4622D" opacity={0.15} />
          <Circle cx="24" cy="42" r="1.2" fill="#C4622D" opacity={0.15} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#ankara-tile)" opacity={0.08} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  absoluteBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});
