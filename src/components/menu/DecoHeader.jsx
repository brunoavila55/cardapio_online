import React from 'react'
import BrandLogo from './BrandLogo'
import DecoOrnament from './DecoOrnament'

export function DecoHeader() {
  const hotelName = import.meta.env.VITE_HOTEL_NAME || 'Nome do Estabelecimento'
  const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Restaurante Principal'
  const restaurantSubtitle = import.meta.env.VITE_RESTAURANT_SUBTITLE || 'Gastronomia & Tradição'

  return (
    <header
      style={{
        backgroundColor: 'var(--navy-dark)',
        borderBottom: '3px solid var(--gold)',
        padding: '28px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* 2. BrandLogo size=104 with gold border, centered, mb 10px */}
      <div style={{ marginBottom: '10px' }}>
        <BrandLogo size={104} borderColor="var(--gold)" />
      </div>

      {/* 3. HOTEL SÃO LUIZ: font-ui, 11px, letter-spacing 0.35em, gold, uppercase */}
      <h2
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '11px',
          fontWeight: '400',
          letterSpacing: '0.35em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          margin: '0 0 14px 0',
          paddingLeft: '0.35em', // offset right padding to keep perfectly centered
        }}
      >
        {hotelName}
      </h2>

      {/* 4. DecoOrnament width=150, centered */}
      <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
        <DecoOrnament width={150} />
      </div>

      {/* 5. Restaurante Don Fernando: font-display, 32px, 300 italic, ivory */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: '300',
          fontStyle: 'italic',
          color: 'var(--ivory)',
          margin: '0 0 10px 0',
        }}
      >
        {restaurantName}
      </h1>

      {/* 6. Subtítulo: font-ui, 11px, letter-spacing 0.3em, gold, uppercase */}
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '11px',
          fontWeight: '400',
          letterSpacing: '0.3em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          margin: '0 0 18px 0',
          paddingLeft: '0.3em', // offset right padding to keep perfectly centered
        }}
      >
        {restaurantSubtitle}
      </p>

      {/* 7. Geometric strip: Symmetrical 1px lines + three 45-deg rotated 5px squares (diamonds) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '4px',
        }}
      >
        <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--gold)', opacity: 0.85 }} />
        <div style={{ width: '5px', height: '5px', transform: 'rotate(45deg)', backgroundColor: 'var(--gold)' }} />
        <div style={{ width: '5px', height: '5px', transform: 'rotate(45deg)', backgroundColor: 'var(--gold)' }} />
        <div style={{ width: '5px', height: '5px', transform: 'rotate(45deg)', backgroundColor: 'var(--gold)' }} />
        <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--gold)', opacity: 0.85 }} />
      </div>
    </header>
  )
}

export default DecoHeader
