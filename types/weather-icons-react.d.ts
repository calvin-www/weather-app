declare module 'weather-icons-react' {
  import { ComponentType } from 'react';

  interface IconProps {
    size?: number;
    color?: string;
    className?: string;
  }

  export const WiDaySunny: ComponentType<IconProps>;
  export const WiNightClear: ComponentType<IconProps>;
  export const WiDayCloudy: ComponentType<IconProps>;
  export const WiNightAltCloudy: ComponentType<IconProps>;
  export const WiCloud: ComponentType<IconProps>;
  export const WiCloudy: ComponentType<IconProps>;
  export const WiDayShowers: ComponentType<IconProps>;
  export const WiNightAltShowers: ComponentType<IconProps>;
  export const WiDayRain: ComponentType<IconProps>;
  export const WiNightAltRain: ComponentType<IconProps>;
  export const WiDayThunderstorm: ComponentType<IconProps>;
  export const WiNightAltThunderstorm: ComponentType<IconProps>;
  export const WiDaySnow: ComponentType<IconProps>;
  export const WiNightAltSnow: ComponentType<IconProps>;
  export const WiDayFog: ComponentType<IconProps>;
  export const WiNightFog: ComponentType<IconProps>;
}
