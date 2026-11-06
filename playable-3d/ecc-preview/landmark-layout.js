// Shared authored coordinates; courtyard root is translated -11 along world Z.
export const ECC_WELCOME={x:2.6,z:7.6,yaw:-Math.PI/7};
export const ECC_HOME={x:ECC_WELCOME.x+Math.sin(ECC_WELCOME.yaw)*2.8,z:ECC_WELCOME.z-11+Math.cos(ECC_WELCOME.yaw)*2.8,yaw:-ECC_WELCOME.yaw};
