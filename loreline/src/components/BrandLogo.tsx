import { useId } from 'react'

type BrandLogoProps = {
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BrandLogo({ href, className = '', size = 'md' }: BrandLogoProps) {
  const uniqueId = useId().replace(/:/g, '')
  const badgeGradientId = `brand-badge-${uniqueId}`
  const badgeStrokeId = `brand-stroke-${uniqueId}`
  const sunGradientId = `brand-sun-${uniqueId}`
  const pageGradientId = `brand-page-${uniqueId}`
  const threadGradientId = `brand-thread-${uniqueId}`

  const content = (
    <>
      <span className={`brand-logo__mark brand-logo__mark--${size}`} aria-hidden="true">
        <svg className="brand-logo__svg" fill="none" viewBox="0 0 72 72">
          <defs>
            <linearGradient id={badgeGradientId} x1="12" x2="60" y1="10" y2="62" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4D3848" />
              <stop offset="0.55" stopColor="#30222F" />
              <stop offset="1" stopColor="#231A25" />
            </linearGradient>
            <linearGradient id={badgeStrokeId} x1="16" x2="58" y1="12" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F7E9BF" stopOpacity="0.78" />
              <stop offset="0.42" stopColor="#7BE0B8" stopOpacity="0.8" />
              <stop offset="1" stopColor="#EDA1AD" stopOpacity="0.7" />
            </linearGradient>
            <radialGradient id={sunGradientId} cx="0" cy="0" r="1" gradientTransform="translate(49 21) rotate(90) scale(13)">
              <stop stopColor="#FFF8E6" />
              <stop offset="0.48" stopColor="#F7E9BF" stopOpacity="0.95" />
              <stop offset="1" stopColor="#F0D28E" stopOpacity="0.14" />
            </radialGradient>
            <linearGradient id={pageGradientId} x1="22" x2="50" y1="41" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F7E9BF" stopOpacity="0.95" />
              <stop offset="0.6" stopColor="#CFB08B" stopOpacity="0.86" />
              <stop offset="1" stopColor="#EDA1AD" stopOpacity="0.74" />
            </linearGradient>
            <linearGradient id={threadGradientId} x1="24" x2="49" y1="24" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7BE0B8" />
              <stop offset="0.58" stopColor="#F7E9BF" />
              <stop offset="1" stopColor="#F0D28E" />
            </linearGradient>
          </defs>

          <rect
            x="8"
            y="8"
            width="56"
            height="56"
            rx="18"
            fill={`url(#${badgeGradientId})`}
            stroke={`url(#${badgeStrokeId})`}
            strokeWidth="1.4"
          />
          <circle cx="49" cy="21" r="11" fill={`url(#${sunGradientId})`} opacity="0.96" />
          <path
            d="M18 50.2c5.5-2.8 10.9-4.2 16.2-4.2 1.1 0 2.2.1 3.4.2v9.9c-1.2-.2-2.5-.3-3.8-.3-5 0-10 1.4-15.8 4.4V50.2Z"
            fill={`url(#${pageGradientId})`}
            fillOpacity="0.94"
          />
          <path
            d="M54 50.2c-5.5-2.8-10.9-4.2-16.2-4.2-1.1 0-2.2.1-3.4.2v9.9c1.2-.2 2.5-.3 3.8-.3 5 0 10 1.4 15.8 4.4V50.2Z"
            fill={`url(#${pageGradientId})`}
            fillOpacity="0.88"
          />
          <path
            d="M36 47.6V58"
            stroke="#FBF7F2"
            strokeLinecap="round"
            strokeOpacity="0.55"
            strokeWidth="1.15"
          />
          <path
            d="M24 42.8c4.1-7.7 8.6-13.6 13.4-17.8m-1.1.4c4.5 2.6 8.8 7.7 12.6 15.4"
            stroke={`url(#${threadGradientId})`}
            strokeLinecap="round"
            strokeWidth="2.45"
          />
          <path
            d="m24.9 24.6 1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4 1.4-3.4Z"
            fill="#F7E9BF"
          />
          <path
            d="M17 46.3c5.8-4.1 12.2-6.1 19-6.1 6.9 0 13.2 2 19 6.1"
            stroke="#FBF7F2"
            strokeLinecap="round"
            strokeOpacity="0.16"
            strokeWidth="1.8"
          />
          <circle cx="19" cy="21" r="1.5" fill="#7BE0B8" fillOpacity="0.84" />
          <circle cx="56" cy="29" r="1.3" fill="#EDA1AD" fillOpacity="0.88" />
        </svg>
      </span>
      <span className="brand-logo__wordmark">Loreline</span>
    </>
  )

  if (href) {
    return (
      <a className={`brand-logo ${className}`.trim()} href={href}>
        {content}
      </a>
    )
  }

  return <div className={`brand-logo ${className}`.trim()}>{content}</div>
}
