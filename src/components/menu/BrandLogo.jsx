import React from 'react'

export const BrandLogo = ({ size = 52, logoUrl }) => (
  <img 
    src={logoUrl || "/logo.svg"} 
    alt="Logomarca do Estabelecimento" 
    width={size}
    height={size}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'contain',
      display: 'block',
    }}
  />
)

export default BrandLogo
