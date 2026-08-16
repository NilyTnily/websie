interface HouseMarqueeProps {
  houses: string[];
}

/** A duplicated, seamlessly-looping strip of house names. Pause on hover and reduced-motion are both pure CSS — see .krs-marquee in globals.css. */
export function HouseMarquee({ houses }: HouseMarqueeProps) {
  if (houses.length === 0) return null;

  return (
    <div
      className={`
        krs-marquee overflow-hidden border-y border-krs-champagne/25
        bg-krs-mocha py-5
      `}
    >
      <div className="krs-marquee-track flex w-max">
        {[houses, houses].map((list, listIndex) => (
          <ul
            aria-hidden={listIndex === 1}
            className="flex shrink-0 items-center"
            key={listIndex}
          >
            {list.map((house, i) => (
              <li
                className={`
                  krs-label shrink-0 px-8 text-krs-ivory/70
                  first:pl-0
                `}
                key={`${house}-${i}`}
              >
                {house}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
