export function HeroStoryArtwork() {
  return (
    <svg
      className="hero-story-artwork"
      viewBox="0 0 720 420"
      role="img"
      aria-label="Illustrated fantasy scene with a knight and a prince"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#314867" />
          <stop offset="36%" stopColor="#3A4963" />
          <stop offset="72%" stopColor="#25364F" />
          <stop offset="100%" stopColor="#162538" />
        </linearGradient>
        <radialGradient id="hero-moon" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="rgba(255, 248, 230, 0.98)" />
          <stop offset="46%" stopColor="rgba(247, 233, 191, 0.7)" />
          <stop offset="100%" stopColor="rgba(240, 210, 142, 0)" />
        </radialGradient>
        <linearGradient id="hero-knight" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#7BE0B8" />
          <stop offset="45%" stopColor="#52788A" />
          <stop offset="100%" stopColor="#152235" />
        </linearGradient>
        <linearGradient id="hero-prince" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#F7E9BF" />
          <stop offset="38%" stopColor="#CFB08B" />
          <stop offset="100%" stopColor="#7A4A4F" />
        </linearGradient>
        <linearGradient id="hero-cape-rose" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#EDA1AD" />
          <stop offset="100%" stopColor="#633A48" />
        </linearGradient>
        <linearGradient id="hero-steel" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(248, 250, 252, 0.9)" />
          <stop offset="100%" stopColor="rgba(123, 224, 184, 0.28)" />
        </linearGradient>
        <filter id="hero-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="720" height="420" fill="url(#hero-sky)" />

      <g className="hero-story-artwork__mist" opacity="0.85">
        <ellipse cx="164" cy="336" rx="174" ry="72" fill="rgba(123, 224, 184, 0.16)" />
        <ellipse cx="534" cy="318" rx="196" ry="84" fill="rgba(237, 161, 173, 0.13)" />
        <ellipse cx="364" cy="88" rx="210" ry="104" fill="rgba(240, 210, 142, 0.15)" />
      </g>

      <g className="hero-story-artwork__backdrop">
        <circle cx="494" cy="82" r="88" fill="url(#hero-moon)" />
        <path
          d="M0 318C86 274 142 284 202 296C260 308 326 348 398 344C466 340 528 290 594 286C652 282 694 302 720 318V420H0Z"
          fill="rgba(28, 40, 60, 0.76)"
        />
        <path
          d="M82 266L132 196L168 238L204 168L264 242L296 214L336 286H82Z"
          fill="rgba(64, 82, 106, 0.68)"
        />
        <path
          d="M410 246L462 176L506 206L544 162L612 252L648 222L700 286H410Z"
          fill="rgba(77, 91, 118, 0.58)"
        />
        <path d="M242 74L276 40L310 74V132H242Z" fill="rgba(108, 100, 110, 0.5)" />
        <path d="M314 88L352 48L392 88V150H314Z" fill="rgba(118, 106, 118, 0.5)" />
        <path d="M386 104L428 62L474 104V176H386Z" fill="rgba(136, 118, 122, 0.44)" />
      </g>

      <g className="hero-story-artwork__figure hero-story-artwork__figure--knight">
        <path
          d="M180 308C188 278 192 250 202 214C212 178 242 154 274 154C296 154 312 164 324 182C336 202 338 228 332 258C326 288 312 332 304 366H164C168 346 174 326 180 308Z"
          fill="url(#hero-knight)"
        />
        <path
          d="M232 182C246 154 268 138 290 138C304 138 316 146 322 160C328 174 326 194 314 212C302 230 282 242 262 242C244 242 230 234 224 220C218 206 220 194 232 182Z"
          fill="#E6D0C3"
        />
        <path
          d="M216 206C228 194 246 188 260 188C278 188 290 194 300 206C290 220 276 230 262 234C244 232 228 222 216 206Z"
          fill="rgba(15, 23, 42, 0.28)"
        />
        <path
          d="M240 160L278 142L316 160L328 216L290 238H252L216 216Z"
          fill="rgba(12, 22, 36, 0.78)"
          stroke="rgba(123, 224, 184, 0.34)"
          strokeWidth="2"
        />
        <path d="M236 190L268 208L244 260L196 338L156 336L214 252Z" fill="rgba(21, 34, 53, 0.84)" />
        <path d="M318 190L286 210L300 258L344 338L384 336L330 246Z" fill="rgba(14, 25, 41, 0.84)" />
        <path d="M196 182L160 226L142 288L164 296L194 242L214 196Z" fill="rgba(83, 120, 138, 0.72)" />
        <path d="M334 184L372 228L392 302L370 308L338 246L318 198Z" fill="rgba(66, 96, 118, 0.68)" />
        <path d="M286 218L298 218L318 364H306Z" fill="url(#hero-steel)" />
        <rect x="300" y="356" width="32" height="8" rx="4" fill="rgba(240, 210, 142, 0.86)" />
        <path d="M276 262L286 366H262L248 274Z" fill="rgba(15, 23, 42, 0.88)" />
        <path d="M238 262L216 366H238L256 280Z" fill="rgba(18, 29, 45, 0.92)" />
      </g>

      <g className="hero-story-artwork__figure hero-story-artwork__figure--prince">
        <path
          d="M446 340C452 312 458 286 468 252C478 218 494 192 514 178C534 164 558 160 580 168C604 176 622 194 632 222C644 254 644 304 634 366H434C438 356 442 348 446 340Z"
          fill="url(#hero-prince)"
        />
        <path
          d="M512 172C522 146 544 132 566 132C586 132 602 144 608 164C614 184 608 208 592 224C576 240 554 248 536 242C518 236 504 220 504 200C504 190 506 182 512 172Z"
          fill="#E8D4C9"
        />
        <path
          d="M532 160C548 150 578 150 594 164C590 174 582 182 572 188C558 186 542 176 532 160Z"
          fill="rgba(15, 23, 42, 0.22)"
        />
        <path
          d="M536 130L548 116L560 126L572 112L584 130L578 144H544Z"
          fill="rgba(247, 233, 191, 0.92)"
          stroke="rgba(240, 210, 142, 0.92)"
          strokeWidth="2"
        />
        <path d="M478 196C502 182 530 178 560 182L574 248L530 290L474 256Z" fill="rgba(121, 64, 70, 0.82)" />
        <path d="M560 184C590 188 612 198 626 216L650 286L620 294L588 242L566 214Z" fill="url(#hero-cape-rose)" />
        <path d="M520 214L540 232L520 272L488 328L450 328L494 256Z" fill="rgba(23, 34, 51, 0.86)" />
        <path d="M570 214L584 234L604 320L574 328L556 266Z" fill="rgba(28, 40, 59, 0.9)" />
        <path d="M616 222L652 202L670 214L624 248Z" fill="rgba(247, 233, 191, 0.84)" />
        <path d="M528 326L520 366H548L554 326Z" fill="rgba(15, 23, 42, 0.92)" />
        <path d="M584 324L594 366H620L604 324Z" fill="rgba(18, 30, 46, 0.92)" />
      </g>

      <g className="hero-story-artwork__foreground">
        <ellipse cx="236" cy="366" rx="118" ry="24" fill="rgba(40, 52, 74, 0.46)" />
        <ellipse cx="544" cy="366" rx="132" ry="26" fill="rgba(56, 63, 86, 0.42)" />
      </g>

      <g className="hero-story-artwork__sparks" filter="url(#hero-glow)">
        <circle cx="206" cy="128" r="3" fill="rgba(123, 224, 184, 0.86)" />
        <circle cx="234" cy="102" r="2.5" fill="rgba(247, 233, 191, 0.82)" />
        <circle cx="612" cy="122" r="3" fill="rgba(237, 161, 173, 0.78)" />
        <circle cx="648" cy="162" r="2.2" fill="rgba(240, 210, 142, 0.74)" />
      </g>
    </svg>
  )
}
